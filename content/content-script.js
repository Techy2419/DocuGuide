/**
 * Content Script - DocuGuide Extension
 * Handles text selection and communication with sidebar/popup
 */

// Prevent duplicate injection
if (window.docuGuideContentScriptLoaded) {
  console.log('DocuGuide content script already loaded');
} else {
  window.docuGuideContentScriptLoaded = true;

  console.log('✅ DocuGuide content script loaded successfully');

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
}
