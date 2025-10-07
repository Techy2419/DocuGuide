/**
 * Content Script - New Form Guide Implementation
 * Handles form detection and AI-powered form explanation
 */

// Prevent duplicate injection
if (window.docuGuideContentScriptLoaded) {
  console.log('DocuGuide content script already loaded');
} else {
  window.docuGuideContentScriptLoaded = true;

  // Initialize form guide when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initializeFormGuide();
  });

  // Also initialize if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormGuide);
  } else {
    initializeFormGuide();
  }

  /**
   * Initialize the new form guide
   */
  function initializeFormGuide() {
    try {
      console.log('🚀 Initializing new Form Guide...');
      
      // Wait for classes to be available
      if (typeof FormGuide === 'undefined' || typeof FormDetector === 'undefined' || typeof AIManager === 'undefined') {
        console.log('⏳ Waiting for classes to load...');
        setTimeout(initializeFormGuide, 100);
        return;
      }
      
      // Create form guide instance
      const formGuide = new FormGuide();
      
      // Make it globally available for debugging
      window.formGuide = formGuide;
      
      console.log('✅ Form Guide initialized successfully');
      
    } catch (error) {
      console.error('❌ Form Guide initialization failed:', error);
    }
  }

  /**
   * Handle messages from popup/sidebar
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message);
    console.log('🔍 Available classes:', {
      FormGuide: typeof FormGuide,
      FormDetector: typeof FormDetector,
      AIManager: typeof AIManager,
      windowFormGuide: !!window.formGuide
    });
    
    switch (message.action) {
      case 'scanForm':
        handleScanForm(sendResponse);
        return true; // Keep message channel open for async response
        
      case 'getFormData':
        handleGetFormData(sendResponse);
        return true;
        
      default:
        console.log('Unknown message action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }
  });

  /**
   * Handle form scanning request
   */
  async function handleScanForm(sendResponse) {
    try {
      console.log('🔍 Starting form scan...');
      
      // Check if form guide is available
      if (!window.formGuide) {
        console.log('⏳ Form Guide not ready, initializing...');
        
        // Try to initialize if not available
        if (typeof FormGuide !== 'undefined' && typeof FormDetector !== 'undefined' && typeof AIManager !== 'undefined') {
          window.formGuide = new FormGuide();
        } else {
          throw new Error('Form Guide classes not loaded. Please refresh the page.');
        }
      }
      
      // Perform the scan
      await window.formGuide.scanAndExplain();
      sendResponse({ success: true, message: 'Form scan completed' });
      
    } catch (error) {
      console.error('Form scan failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle get form data request
   */
  async function handleGetFormData(sendResponse) {
    try {
      if (!window.formGuide) {
        throw new Error('Form Guide not initialized');
      }
      
      const formData = await window.formGuide.detector.extractFormData();
      sendResponse({ success: true, data: formData });
      
    } catch (error) {
      console.error('Get form data failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle text selection for other features
   */
  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      console.log('📝 Text selected:', selectedText.substring(0, 100) + '...');
      
      // Send selection to sidebar/popup
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTED',
        text: selectedText
      });
    } else {
      // Clear selection
      chrome.runtime.sendMessage({
        type: 'CLEAR_SELECTION'
      });
    }
  }

  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);

  console.log('✅ DocuGuide content script loaded successfully');
}
