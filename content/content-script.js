/**
 * Content Script
 * Handles text selection and communication between page and extension
 */

// Prevent duplicate injection
if (window.docuGuideContentScriptLoaded) {
  console.log('DocuGuide content script already loaded');
} else {
  window.docuGuideContentScriptLoaded = true;

  // Check file access for local PDFs
  checkFileAccess();

  /**
   * Check if extension has access to local files
   */
  async function checkFileAccess() {
    if (window.location.protocol === 'file:') {
      try {
        // Try to access chrome.extension API
        if (typeof chrome !== 'undefined' && chrome.extension) {
          const hasAccess = await chrome.extension.isAllowedFileSchemeAccess();
          
          if (!hasAccess) {
            showFileAccessWarning();
          }
        }
      } catch (error) {
        console.log('Could not check file access:', error);
      }
    }
  }

  /**
   * Show warning for file access
   */
  function showFileAccessWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      color: #D97706;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 300px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    `;
    
    warning.innerHTML = `
      <strong>📁 File Access Required</strong><br>
      Please enable "Allow access to file URLs" in extension settings to use Form Guide on local PDF files.
    `;
    
    document.body.appendChild(warning);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 10000);
  }

let lastSelection = {
  text: '',
  timestamp: null
};

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    lastSelection = {
      text: selectedText,
      timestamp: Date.now()
    };

    console.log('✅ Text selected:', selectedText.substring(0, 50) + '...');

    // Send to sidebar if open
    try {
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTED',
        text: selectedText,
        url: window.location.href
      }).catch((error) => {
        // Sidebar might not be open or extension context invalidated
        if (error.message.includes('Extension context invalidated')) {
          console.log('Extension context invalidated - extension may have been reloaded');
        } else {
          console.log('Sidebar not open yet:', error.message);
        }
      });
    } catch (error) {
      console.log('Failed to send message:', error.message);
    }
  }
}

// Listen for messages from sidebar/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message.type || message.action);
  
  if (message.type === 'GET_SELECTION' || message.type === 'GET_CURRENT_SELECTION') {
    // Always get fresh selection
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      lastSelection = {
        text: selectedText,
        timestamp: Date.now()
      };
    }
    
    console.log('Returning selection:', lastSelection.text ? 'yes' : 'no');
    sendResponse({
      success: true,
      selection: lastSelection
    });
  } else if (message.type === 'HIGHLIGHT_TEXT') {
    highlightText(message.text, message.color);
    sendResponse({ success: true });
  } else if (message.action === 'analyzeForm') {
    // Handle form analysis request
    (async () => {
      try {
        // Wait for FormAnalyzer to be available
        let retries = 0;
        while (typeof FormAnalyzer === 'undefined' && retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (typeof FormAnalyzer === 'undefined') {
          throw new Error('FormAnalyzer class not loaded - extension may need reloading');
        }
        
        const formAnalyzer = new FormAnalyzer();
        const result = formAnalyzer.detectForms();
        
        // Apply visual highlights
        if (result.forms && result.forms.length > 0) {
          formAnalyzer.applyHighlights(result.forms[0]);
        }
        
        sendResponse({ 
          success: true, 
          formsCount: result.forms.length,
          result: result 
        });
      } catch (error) {
        console.error('Form analysis failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  } else if (message.action === 'startFormWizard') {
    // Handle form wizard request - works on ALL sites
    (async () => {
      try {
        console.log('🔍 Starting form wizard...');
        
        // Wait for classes to be available with retries
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
          console.log(`🔍 Checking for classes (attempt ${retries + 1}/${maxRetries})...`);
          console.log('FormAnalyzer available:', typeof FormAnalyzer);
          console.log('SmartFormWizard available:', typeof SmartFormWizard);
          
          if (typeof FormAnalyzer !== 'undefined' && typeof SmartFormWizard !== 'undefined') {
            console.log('✅ Classes available!');
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }
        
        if (typeof FormAnalyzer === 'undefined') {
          console.error('FormAnalyzer class not available after retries. Available globals:', Object.keys(window));
          throw new Error('FormAnalyzer class not loaded - extension may need reloading');
        }
        if (typeof SmartFormWizard === 'undefined') {
          console.error('SmartFormWizard class not available after retries. Available globals:', Object.keys(window));
          throw new Error('SmartFormWizard class not loaded - extension may need reloading');
        }
        
        console.log('✅ Classes available, detecting forms...');
        const formAnalyzer = new FormAnalyzer();
        const formResult = formAnalyzer.detectForms();
        
        console.log('📋 Form detection result:', formResult);
        
        if (formResult.forms && formResult.forms.length > 0) {
          console.log('🚀 Starting wizard for form:', formResult.forms[0].name);
          const wizard = new SmartFormWizard();
          const analysis = await wizard.analyzeFormIntelligently(formResult.forms[0]);
          wizard.showCompletionWizard(analysis);
          
          sendResponse({ success: true, analysis: analysis });
        } else {
          // No forms found - use AI to detect site type and show helpful message
          const siteType = await detectSiteType();
          const message = getNoFormsMessage(siteType);
          
          console.log('📄 No forms found, AI detected site type:', siteType);
          showSiteGuidance(message);
          
          sendResponse({ 
            success: true, 
            noForms: true, 
            siteType: siteType,
            message: message 
          });
        }
      } catch (error) {
        console.error('❌ Form wizard failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
  }
  
  return true;
});

// Highlight feature - add visual indicator when text is processed
function highlightText(text, color = '#fef3c7') {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.style.transition = 'background-color 2s ease';
    
    try {
      range.surroundContents(span);
      
      // Fade out highlight after 2 seconds
      setTimeout(() => {
        span.style.backgroundColor = 'transparent';
      }, 2000);
    } catch (e) {
      // Selection might span multiple elements, that's okay
      console.log('Could not highlight selection');
    }
  }
}




/**
 * Detect the type of site using AI for better Form Guide messaging
 */
async function detectSiteType() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'createLanguageModelSession',
      options: {
        systemPrompt: `You are a website analyzer. Analyze the given URL and page content to determine the site type.

Return ONLY one of these exact categories:
- pdf: PDF documents
- government: Official government websites (IRS, USCIS, SSA, etc.)
- social: Social media platforms (Facebook, Twitter, Instagram, etc.)
- auth: Login/signup/authentication pages
- ecommerce: Online shopping/checkout pages
- forms: Pages with interactive forms
- general: All other websites

Be precise and only use these exact categories.`,
        temperature: 0.1
      }
    });

    if (!response.success || !response.session) {
      return 'general'; // Fallback
    }

    const session = response.session;
    const url = window.location.href;
    const title = document.title;
    const domain = window.location.hostname;
    
    // Get page content (first 500 chars)
    const pageContent = document.body.innerText.substring(0, 500);
    
    const prompt = `Analyze this website:
URL: ${url}
Domain: ${domain}
Title: ${title}
Content: ${pageContent}

Determine the site type. Return only the category name.`;

    const result = await session.prompt(prompt);
    const siteType = result.trim().toLowerCase();
    
    // Validate result
    const validTypes = ['pdf', 'government', 'social', 'auth', 'ecommerce', 'forms', 'general'];
    return validTypes.includes(siteType) ? siteType : 'general';
    
  } catch (error) {
    console.warn('AI site detection failed, using fallback:', error);
    return 'general';
  }
}

/**
 * Get appropriate message for different site types
 */
function getNoFormsMessage(siteType) {
  const messages = {
    pdf: {
      title: '📄 PDF Document Detected',
      message: 'This is a PDF document. Form Guide works best on interactive web forms. Try using other DocuGuide features like "Explain This" or "Answer My Question" on selected text.',
      suggestions: [
        'Select text and use "Explain This" for document understanding',
        'Use "Answer My Question" for specific questions about the content',
        'Try "Translate" if the document is in another language'
      ]
    },
    government: {
      title: '🏛️ Government Site - No Forms Found',
      message: 'No interactive forms detected on this government page. Form Guide is designed for web forms.',
      suggestions: [
        'Look for "Apply Online" or "Fill Out Form" links',
        'Navigate to the actual form page to use Form Guide',
        'Use other DocuGuide features on this page content'
      ]
    },
    social: {
      title: '📱 Social Media Platform',
      message: 'Form Guide is designed for official forms and documents, not social media platforms.',
      suggestions: [
        'Use "Explain This" to understand posts or comments',
        'Try "Translate" for posts in other languages',
        'Use "Answer My Question" for content clarification'
      ]
    },
    auth: {
      title: '🔐 Login/Authentication Page',
      message: 'This appears to be a login or signup page. Form Guide works on official forms.',
      suggestions: [
        'Complete the authentication process first',
        'Navigate to the main application or form page',
        'Use other DocuGuide features if needed'
      ]
    },
    ecommerce: {
      title: '🛒 E-commerce Checkout',
      message: 'Form Guide is designed for official government and legal forms.',
      suggestions: [
        'Complete your purchase using the site\'s standard process',
        'Use "Explain This" if you need help understanding terms',
        'Navigate to official forms for Form Guide assistance'
      ]
    },
    forms: {
      title: '📋 Form Page Detected',
      message: 'This appears to be a form page, but no interactive form elements were detected.',
      suggestions: [
        'Check if the form is fully loaded',
        'Try refreshing the page',
        'Look for "Start Application" or "Begin Form" buttons',
        'Use other DocuGuide features on the page content'
      ]
    },
    general: {
      title: '🌐 No Forms Detected',
      message: 'No interactive forms found on this page. Form Guide works best on official forms.',
      suggestions: [
        'Look for "Forms", "Applications", or "Fill Out" sections',
        'Navigate to pages with official forms',
        'Use other DocuGuide features for page content'
      ]
    }
  };
  
  return messages[siteType] || messages.general;
}

/**
 * Show site-specific guidance when no forms are found
 */
function showSiteGuidance(guidance) {
  // Remove any existing guidance
  const existingGuidance = document.querySelector('.docuguide-site-guidance');
  if (existingGuidance) {
    existingGuidance.remove();
  }
  
  const guidanceDiv = document.createElement('div');
  guidanceDiv.className = 'docuguide-site-guidance';
  guidanceDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 999998;
      overflow-y: auto;
      font-family: system-ui, -apple-system, sans-serif;
      border: 1px solid #E5E7EB;
    ">
      <div style="padding: 20px; border-bottom: 1px solid #E5E7EB; background: #F9FAFB; border-top-left-radius: 12px; border-top-right-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 18px; color: #1F2937;">${guidance.title}</h3>
          <button class="close-guidance-btn" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6B7280;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
      </div>
      
      <div style="padding: 20px;">
        <p style="margin: 0 0 16px 0; color: #374151; line-height: 1.5;">
          ${guidance.message}
        </p>
        
        <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <div style="font-weight: 600; color: #0369A1; margin-bottom: 8px;">💡 Suggestions:</div>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${guidance.suggestions.map(suggestion => `<li style="margin-bottom: 8px;">${suggestion}</li>`).join('')}
          </ul>
        </div>
        
        <button class="dismiss-guidance-btn" style="
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Got it!</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(guidanceDiv);
  
  // Add event listeners for buttons
  guidanceDiv.querySelector('.close-guidance-btn').addEventListener('click', () => {
    guidanceDiv.remove();
  });
  
  guidanceDiv.querySelector('.dismiss-guidance-btn').addEventListener('click', () => {
    guidanceDiv.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (guidanceDiv.parentElement) {
      guidanceDiv.remove();
    }
  }, 10000);
}

console.log('✅ DocuGuide content script loaded');
} // End of duplicate injection guard
