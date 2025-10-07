/**
 * Background Service Worker
 * Handles extension lifecycle, context menu, and message passing
 */

import apiManager from '../utils/api-manager.js';
import storageManager from '../utils/storage.js';

// Global state
let languageModelSessions = {}; // Store LanguageModel sessions

// Install event - check API availability
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🚀 DocuGuide installed/updated');

  // Create context menu
  chrome.contextMenus.create({
    id: 'docuguide-simplify',
    title: 'Explain This with DocuGuide',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-translate',
    title: 'Translate with DocuGuide',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-ask',
    title: 'Answer My Question - DocuGuide',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-check',
    title: 'Fix My Writing - DocuGuide',
    contexts: ['selection']
  });


  // Check if first run
  const isFirstRun = await storageManager.isFirstRun();
  
  if (isFirstRun || details.reason === 'install') {
    // Open onboarding/setup page
    chrome.tabs.create({
      url: chrome.runtime.getURL('sidebar/sidebar.html')
    });
    await storageManager.markFirstRunComplete();
  }

  // Check API availability
  try {
    const availability = await apiManager.checkEnvironment();
    console.log('📊 API Availability:', availability);

    // Store availability info for UI
    await chrome.storage.local.set({ apiAvailability: availability });
  } catch (error) {
    console.error('❌ Failed to check API availability:', error);
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText;

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id });

  // Send message to sidebar with action and enhanced context
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: info.menuItemId.replace('docuguide-', ''),
      text: selectedText,
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    }).catch(err => {
      console.log('Sidebar not ready yet, will retry when opened');
    });
  }, 500);
});

// Enhanced context menu with more options
chrome.runtime.onInstalled.addListener(async () => {
  // Clear existing menus
  await chrome.contextMenus.removeAll();

  // Create main menu
  chrome.contextMenus.create({
    id: 'docuguide-main',
    title: 'DocuGuide AI Assistant',
    contexts: ['selection'],
    documentUrlPatterns: ['*://*/*']
  });

  // AI Features submenu
  chrome.contextMenus.create({
    id: 'docuguide-simplify',
    parentId: 'docuguide-main',
    title: '📝 Summarize Text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-translate',
    parentId: 'docuguide-main',
    title: '🌍 Translate Text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-ask',
    parentId: 'docuguide-main',
    title: '❓ Ask AI Question',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-check',
    parentId: 'docuguide-main',
    title: '✏️ Check & Improve Writing',
    contexts: ['selection']
  });

  // Separator
  chrome.contextMenus.create({
    id: 'docuguide-separator1',
    parentId: 'docuguide-main',
    type: 'separator',
    contexts: ['selection']
  });

  // Quick actions
  chrome.contextMenus.create({
    id: 'docuguide-quick-simplify',
    parentId: 'docuguide-main',
    title: '⚡ Quick Summarize',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'docuguide-quick-translate',
    parentId: 'docuguide-main',
    title: '⚡ Quick Translate',
    contexts: ['selection']
  });
});

// Message handler for communication with content scripts and sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type || message.action);

  // Handle Smart Assistant form analysis
  if (message.action === 'analyzeFormWithAI') {
    analyzeFormWithAI(message.data)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('❌ Form analysis error:', error);
        sendResponse({ error: error.message, aiTips: [] });
      });
    return true; // Async response
  }

  // Handle LanguageModel session creation for form wizard
  if (message.action === 'createLanguageModelSession') {
    createLanguageModelSession(message.options)
      .then(session => {
        sendResponse({ success: true, session: session });
      })
      .catch(error => {
        console.error('Failed to create LanguageModel session:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open
  }

  // Handle LanguageModel prompt requests
  if (message.action === 'promptLanguageModel') {
    if (!languageModelSessions[message.sessionId]) {
      sendResponse({ success: false, error: 'Session not found' });
      return true;
    }
    
    const session = languageModelSessions[message.sessionId];
    session.prompt(message.prompt)
      .then(result => {
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('LanguageModel prompt failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open
  }

  // Handle LanguageModel session destruction
  if (message.action === 'destroyLanguageModelSession') {
    if (languageModelSessions[message.sessionId]) {
      languageModelSessions[message.sessionId].destroy();
      delete languageModelSessions[message.sessionId];
    }
    sendResponse({ success: true });
    return true;
  }

  // Forward text selection to sidebar
  if (message.type === 'TEXT_SELECTED') {
    // Forward to sidebar if it's open
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: message.text,
      url: message.url,
      timestamp: Date.now()
    }).catch(err => {
      console.log('Sidebar not open yet');
    });
    sendResponse({ success: true });
    return;
  }

  // Handle async operations
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'CHECK_API_AVAILABILITY':
        const availability = await apiManager.checkEnvironment();
        sendResponse({ success: true, availability });
        break;

      case 'SUMMARIZE':
        const summary = await apiManager.summarize(message.text, message.options);
        sendResponse({ success: true, summary });
        break;

      case 'TRANSLATE':
        const translation = await apiManager.translate(
          message.text,
          message.targetLanguage,
          message.sourceLanguage
        );
        sendResponse({ success: true, translation });
        break;

      case 'DETECT_LANGUAGE':
        const detected = await apiManager.detectLanguage(message.text);
        sendResponse({ success: true, detected });
        break;

      case 'ASK_QUESTION':
        const answer = await apiManager.askQuestion(
          message.question,
          message.context
        );
        sendResponse({ success: true, answer });
        break;

      case 'IMPROVE_WRITING':
        const improved = await apiManager.improveWriting(
          message.text,
          message.mode
        );
        sendResponse({ success: true, improved });
        break;

      case 'GET_SETTINGS':
        const settings = await storageManager.getAllSettings();
        sendResponse({ success: true, settings });
        break;

      case 'SAVE_SETTING':
        if (message.key === 'preferredLanguage') {
          await storageManager.setPreferredLanguage(message.value);
        } else if (message.key === 'theme') {
          await storageManager.setTheme(message.value);
        }
        sendResponse({ success: true });
        break;

      case 'CLEAR_DATA':
        await storageManager.clearAll();
        apiManager.cleanup();
        sendResponse({ success: true });
        break;

      case 'TRANSFORM_WEBPAGE':
        // Forward to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            console.log('📤 Forwarding transformation request to tab:', tabs[0].id);
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'TRANSFORM_WEBPAGE',
              options: message.options
            }, (response) => {
              console.log('📥 Received response from content script:', response);
              if (chrome.runtime.lastError) {
                console.error('❌ Content script error:', chrome.runtime.lastError);
                sendResponse({ success: false, error: 'Content script not available: ' + chrome.runtime.lastError.message });
              } else if (response) {
                sendResponse(response);
              } else {
                sendResponse({ success: false, error: 'No response from content script' });
              }
            });
          } else {
            console.error('❌ No active tab found');
            sendResponse({ success: false, error: 'No active tab found' });
          }
        });
        return; // Don't send response immediately

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendResponse({
      success: false,
      error: error.message,
      needsDownload: error.message.includes('download')
    });
  }
}

/**
 * Analyze form using Chrome AI APIs
 */
/**
 * Create LanguageModel session for form analysis
 */
async function createLanguageModelSession(options = {}) {
  try {
    if (!('LanguageModel' in self)) {
      throw new Error('LanguageModel API not available');
    }

    const availability = await self.LanguageModel.availability();
    
    if (availability === 'no') {
      throw new Error('LanguageModel API not available');
    }

    if (availability === 'after-download') {
      throw new Error('LanguageModel needs download');
    }

    // Get model parameters for validation
    const params = await self.LanguageModel.params();
    
    const sessionOptions = {
      systemPrompt: options.systemPrompt || 'You are a helpful AI assistant.',
      temperature: options.temperature || 0.1,
      topK: options.topK || 40,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      ...options
    };
    
    // Validate parameters if they exist
    if (params && params.temperature && params.temperature.min !== undefined) {
      sessionOptions.temperature = Math.min(Math.max(sessionOptions.temperature, params.temperature.min), params.temperature.max);
    }
    if (params && params.topK && params.topK.min !== undefined) {
      sessionOptions.topK = Math.min(Math.max(sessionOptions.topK, params.topK.min), params.topK.max);
    }

    const session = await self.LanguageModel.create(sessionOptions);
    console.log('✅ LanguageModel session created for form analysis');
    
    // Store session with unique ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    languageModelSessions[sessionId] = session;
    
    return { ...session, id: sessionId };
  } catch (error) {
    console.error('Failed to create LanguageModel session:', error);
    throw error;
  }
}

async function analyzeFormWithAI(formsData) {
  console.log('🤖 Analyzing forms with AI:', formsData);
  const aiTips = [];

  try {
    for (const form of formsData.forms) {
      // Build prompt for AI
      const fieldsList = form.fields.map(f => 
        `- ${f.label} (${f.type})${f.required ? ' *required' : ''}`
      ).join('\n');

      const prompt = `Analyze this form and provide intelligent, actionable guidance:

Form: ${form.name}
Fields:
${fieldsList}

Provide ONE specific, helpful tip for completing this form successfully. Format your response as:

• **Key Point**: Brief main tip
• **Common Mistake**: What users often get wrong
• **Action Step**: Specific thing to do
• **Why Important**: Brief explanation

Keep it concise, practical, and actionable. Focus on the most critical advice for this specific form.`;

      try {
        // Use LanguageModel API with enhanced prompts for PDF forms
        let systemPrompt = 'You are an expert form completion assistant specializing in government, financial, and civic forms. Analyze form complexity, identify potential issues, and provide specific, actionable guidance. Focus on helping users avoid common mistakes, understand requirements, and complete forms efficiently and accurately.';
        
        // Enhanced prompt for PDF/tax forms
        if (formsData.isPDF || form.name.toLowerCase().includes('irs') || form.name.toLowerCase().includes('tax')) {
          systemPrompt = 'You are a tax form completion expert. Provide specific, actionable guidance for completing tax forms accurately. Focus on common mistakes, required documentation, and best practices for tax filing. Be concise and practical.';
        }

        const session = await self.LanguageModel.create({
          systemPrompt: systemPrompt,
          temperature: 0.7,
          topK: 40
        });

        const tip = await session.prompt(prompt);
        session.destroy();

        aiTips.push(tip.trim());
        console.log(`✅ Generated tip for form "${form.name}": ${tip.trim()}`);
      } catch (error) {
        console.error('❌ AI analysis failed for form:', form.name, error);
        
        // Provide fallback tips based on form type
        if (formsData.isPDF && form.name.toLowerCase().includes('1040')) {
          aiTips.push('For IRS Form 1040: Have your W-2s, 1099s, and previous year\'s return ready. Double-check all Social Security numbers and dollar amounts.');
        } else if (formsData.isPDF) {
          aiTips.push('For PDF forms: Print a copy for reference, gather all required documents first, and take your time with each section.');
        } else {
          aiTips.push('Keep all required fields filled and double-check before submitting.');
        }
      }
    }

    // Handle standalone inputs
    if (formsData.standaloneInputs && formsData.standaloneInputs.length > 0) {
      aiTips.push('Complete any highlighted standalone input fields as needed.');
    }

    console.log('🎯 AI analysis complete, tips generated:', aiTips);
    return { aiTips };
  } catch (error) {
    console.error('❌ Form analysis error:', error);
    return { 
      aiTips: ['Form analysis completed. Review all highlighted fields before submitting.'],
      error: error.message 
    };
  }
}

// Cleanup on extension unload
self.addEventListener('unload', () => {
  apiManager.cleanup();
});
