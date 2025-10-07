// Debug script to help troubleshoot DocuGuide extension
// Run this in the browser console to check extension status

console.log('🔍 DocuGuide Extension Debug Script');
console.log('=====================================');

// Check if content script is loaded
if (window.docuGuideContentScriptLoaded) {
  console.log('✅ Content script is loaded');
} else {
  console.log('❌ Content script is NOT loaded');
}

// Check if Chrome APIs are available
console.log('🔍 Checking Chrome APIs...');
console.log('chrome.runtime:', typeof chrome.runtime);
console.log('chrome.tabs:', typeof chrome.tabs);
console.log('chrome.storage:', typeof chrome.storage);

// Check for AI APIs (if in extension context)
if (typeof self !== 'undefined') {
  console.log('🔍 Checking AI APIs in extension context...');
  console.log('Summarizer:', typeof self.Summarizer);
  console.log('Translator:', typeof self.Translator);
  console.log('LanguageDetector:', typeof self.LanguageDetector);
  console.log('LanguageModel:', typeof self.LanguageModel);
}

// Test text selection
function testTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  console.log('📝 Current text selection:', selectedText ? `"${selectedText.substring(0, 50)}..."` : 'None');
  return selectedText;
}

// Test message passing
async function testMessagePassing() {
  try {
    console.log('📨 Testing message passing...');
    const response = await chrome.runtime.sendMessage({ type: 'GET_SELECTION' });
    console.log('✅ Message passing works:', response);
  } catch (error) {
    console.log('❌ Message passing failed:', error);
  }
}

// Run tests
console.log('🧪 Running tests...');
testTextSelection();
testMessagePassing();

console.log('=====================================');
console.log('💡 If you see errors above, the extension may need to be reloaded.');
console.log('💡 Try: chrome://extensions/ -> DocuGuide -> Reload');
