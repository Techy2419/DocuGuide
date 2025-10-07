/**
 * FormBridge - Sidebar UI
 * Design Philosophy: Trust through simplicity
 */


// State
let selectedText = '';
let currentMode = null;

// DOM Cache
const UI = {
  // Buttons
  simplifyBtn: document.getElementById('simplifyBtn'),
  translateBtn: document.getElementById('translateBtn'),
  askBtn: document.getElementById('askBtn'),
  checkBtn: document.getElementById('checkBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  clearDataBtn: document.getElementById('clearDataBtn'),
  testApiBtn: document.getElementById('testApiBtn'),
  
  // Containers
  mainContent: document.getElementById('mainContent'),
  contentArea: document.getElementById('contentArea'),
  emptyState: document.getElementById('emptyState'),
  actionGrid: document.getElementById('actionGrid'),
  settingsPanel: document.getElementById('settingsPanel'),
  privacyBadge: document.getElementById('privacyBadge'),
  
  // Language selector  
  languageSelect: document.getElementById('languageSelect'),
  
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('🌉 DocuGuide initialized');
  
  // Load settings
  await loadSettings();
        
        // Initialize theme
        initializeTheme();
        
        // Check for first-time user
        await checkFirstTimeUser();
        
        // Restore sessions and clean up old ones
        await restoreSessions();
        await storageManager.clearOldSessions();
  
  // Setup event listeners
  setupEventListeners();
  
  // Listen for messages
  chrome.runtime.onMessage.addListener(handleMessage);
        
        // Listen for context menu actions
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.action && message.text) {
            handleContextMenuAction(message.action, message.text, {
              url: message.url,
              title: message.title,
              timestamp: message.timestamp
            });
          }
        });

        // Listen for model download progress
        window.addEventListener('modelDownloadProgress', (event) => {
          const { model, progress, loaded, total } = event.detail;
          console.log(`📥 ${model} download progress: ${progress}%`);
          
          // Update progress indicator if visible
          const progressBar = document.getElementById('progressBar');
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
          
          const progressText = document.querySelector('.progress-text');
          if (progressText) {
            progressText.textContent = `Downloading ${model}... ${progress}%`;
          }
          
          // Show completion
          if (progress >= 100) {
            setTimeout(() => {
              hideProgressIndicator();
              showToast(`${model} download complete!`, 'success');
            }, 500);
          }
        });
  
  // Check for text selection
  await checkTextSelection();
  
  // Set up periodic text selection checking
  setupTextSelectionMonitoring();
  
  // Debug: Check if all UI elements are properly loaded
  console.log('🔍 UI Elements Check:');
  console.log('- Simplify Button:', UI.simplifyBtn ? '✅' : '❌');
  console.log('- Translate Button:', UI.translateBtn ? '✅' : '❌');
  console.log('- Ask Button:', UI.askBtn ? '✅' : '❌');
  console.log('- Check Button:', UI.checkBtn ? '✅' : '❌');
  console.log('- Language Select:', UI.languageSelect ? '✅' : '❌');
  
  console.log('✅ DocuGuide ready');
}

function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');
  
  // Action buttons with error handling
  UI.simplifyBtn.addEventListener('click', withErrorHandling(() => {
    console.log('📝 Simplify button clicked');
    handleAction('simplify');
  }, 'Failed to simplify text'));
  
  UI.translateBtn.addEventListener('click', withErrorHandling(() => {
    console.log('🌍 Translate button clicked');
    handleAction('translate');
  }, 'Failed to translate text'));
  
  UI.askBtn.addEventListener('click', withErrorHandling(() => {
    console.log('❓ Ask button clicked');
    handleAction('ask');
  }, 'Failed to process question'));
  
  UI.checkBtn.addEventListener('click', withErrorHandling(() => {
    console.log('✏️ Check button clicked');
    handleAction('check');
  }, 'Failed to check text'));
  
  
  
  // Header actions
  UI.refreshBtn.addEventListener('click', () => {
    console.log('🔄 Refresh button clicked');
    refresh();
  });
  
  UI.settingsBtn.addEventListener('click', () => {
    console.log('⚙️ Settings button clicked');
    openSettings();
  });
  
  UI.closeSettingsBtn.addEventListener('click', () => {
    console.log('❌ Close settings button clicked');
    closeSettings();
  });
  
  // Settings
  UI.clearDataBtn.addEventListener('click', () => {
    console.log('🗑️ Clear data button clicked');
    clearData();
  });
  
  UI.testApiBtn.addEventListener('click', () => {
    console.log('🧪 Test API button clicked');
    testAPI();
  });
  
  // Other
  UI.privacyBadge.addEventListener('click', () => {
    console.log('🔒 Privacy badge clicked');
    showPrivacyInfo();
  });
  
}

        // ============================================================================
        // CONTEXT MENU HANDLING
        // ============================================================================

        async function handleContextMenuAction(action, text, context = {}) {
          console.log(`🎯 Context menu action: ${action}`, text.substring(0, 100) + '...');
          
          // Set the selected text
          selectedText = text;
          enableActionButtons();
          
          // Wait a moment for UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Execute the action
          switch (action) {
            case 'simplify':
              await handleAction('simplify');
              break;
            case 'translate':
              await handleAction('translate');
              break;
            case 'ask':
              await handleAction('ask');
              break;
            case 'check':
              await handleAction('check');
              break;
            case 'quick-simplify':
              // Quick summarize with default mode
              const defaultMode = await storageManager.getSetting('defaultSummarizationMode', 'key-points');
              performSummarization(text, defaultMode);
              break;
            case 'quick-translate':
              // Quick translate with default language
              const defaultLanguage = await storageManager.getSetting('defaultLanguage', 'es');
              doQuickTranslate(text, defaultLanguage);
              break;
            default:
              console.log('Unknown context menu action:', action);
          }
          
          // Save context for analytics (privacy-safe)
          if (context.url && context.title) {
            console.log('📊 Context:', {
              url: context.url,
              title: context.title,
              action: action,
              textLength: text.length
            });
          }
        }

        async function doQuickTranslate(text, targetLanguage) {
          showLoading('Quick translating...');
          
          try {
            // Auto-detect language
            const detection = await apiManager.detectLanguage(text);
            const sourceLanguage = detection.detectedLanguage;
            
            // Translate directly
            const translation = await apiManager.translate(text, sourceLanguage, targetLanguage);
            
            if (translation.needsDownload) {
              showModelDownloadRequired('Translator');
              return;
            }

            const html = `
              <div class="info-box">
                <div class="info-title">ORIGINAL TEXT</div>
                <div class="info-text">${escapeHtml(text)}</div>
              </div>
              
              <div class="info-box highlight" style="margin-top: var(--space-md);">
                <div class="info-title" style="color: var(--color-primary);">TRANSLATION (${sourceLanguage} → ${targetLanguage})</div>
                <div class="info-text">${formatAIResponse(translation.translated)}</div>
              </div>
              
              <div class="mode-actions">
                <button class="btn-secondary copy-translation" data-text="${escapeHtml(translation.translated)}">
                  <i class="fas fa-copy"></i>
                  Copy Translation
                </button>
                <button class="btn-primary full-translate" data-text="${escapeHtml(text)}">
                  <i class="fas fa-language"></i>
                  Full Translation Options
                </button>
              </div>
            `;
            
            showResult('Quick Translation', '<i class="fas fa-bolt" style="color: #F59E0B;"></i>', html);
            
            // Attach event listeners
            setTimeout(() => {
              document.querySelector('.copy-translation')?.addEventListener('click', () => {
                copyText(document.querySelector('.copy-translation').dataset.text);
              });
              
              document.querySelector('.full-translate')?.addEventListener('click', () => {
                doTranslate();
              });
            }, 100);
            
            showToast('Quick translation complete', 'success');
            
          } catch (error) {
            console.error('Quick translation failed:', error);
            showError('Failed to translate text', error.message);
          }
}

// ============================================================================
// TEXT SELECTION
// ============================================================================

async function checkTextSelection() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.log('No active tab found');
      return;
    }
    
    // Check if content script is ready
    let response;
    try {
      response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTION' });
    } catch (error) {
      // Content script might not be ready, try to inject it
      console.log('Content script not ready, attempting to inject...');
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content/content-script.js']
        });
        // Wait a bit for injection to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTION' });
      } catch (injectError) {
        console.log('Could not inject content script:', injectError.message);
        return;
      }
    }
    
    if (response?.selection?.text && response.selection.text.trim().length > 0) {
      const newText = response.selection.text.trim();
      if (newText !== selectedText) {
        selectedText = newText;
        enableActionButtons();
        console.log('✅ Text selected:', selectedText.length, 'chars');
      }
    } else {
      if (selectedText) {
        selectedText = '';
        disableActionButtons();
        console.log('🧹 Text selection cleared');
      }
    }
  } catch (error) {
    console.log('Text selection check failed:', error.message);
    // Don't disable buttons on error, just log it
  }
}

function enableActionButtons() {
          [UI.simplifyBtn, UI.translateBtn, UI.askBtn, UI.checkBtn].forEach((btn, index) => {
    btn.disabled = false;
    btn.classList.remove('disabled');
            
            // Staggered animation on enable
            setTimeout(() => {
              btn.style.animation = 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
              setTimeout(() => btn.style.animation = '', 500);
            }, index * 100);
          });
          
          // Enable language selector with animation
          setTimeout(() => {
  UI.languageSelect.disabled = false;
            UI.languageSelect.style.animation = 'fadeIn 0.3s ease-out';
          }, 400);
  
          // Hide empty state with animation
          UI.emptyState.style.animation = 'fadeOut 0.3s ease-out';
          setTimeout(() => {
  UI.emptyState.classList.add('hidden');
            UI.emptyState.style.animation = '';
          }, 300);
  
  // Show text selection indicator
  showTextSelectionIndicator();
}

function showTextSelectionIndicator() {
  // Remove existing indicator
  const existingIndicator = document.querySelector('.text-selection-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'text-selection-indicator';
  indicator.style.cssText = `
    background: #F0FDF4;
    border: 1px solid #86EFAC;
    color: #059669;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 16px;
    animation: slideDown 0.3s ease-out;
  `;
  indicator.innerHTML = `✅ Text selected (${selectedText.length} characters)`;
  
  // Insert after action grid
  const actionGrid = document.querySelector('.action-grid');
  if (actionGrid) {
    actionGrid.parentNode.insertBefore(indicator, actionGrid.nextSibling);
  }
}

function disableActionButtons() {
  [UI.simplifyBtn, UI.translateBtn, UI.askBtn, UI.checkBtn].forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
    btn.classList.remove('active');
  });
  
  // Disable language selector
  UI.languageSelect.disabled = true;
  
  // Remove text selection indicator
  const indicator = document.querySelector('.text-selection-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  // Show empty state
  UI.emptyState.classList.remove('hidden');
}

async function refresh() {
  // Animate refresh icon
  UI.refreshBtn.style.animation = 'spin 0.6s ease-in-out';
  setTimeout(() => UI.refreshBtn.style.animation = '', 600);
  
  // Force immediate text selection check
  await checkTextSelection();
  
  // If still no text selected, try to get current selection from page
  if (!selectedText) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        // Send a message to get current selection
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CURRENT_SELECTION' }, (response) => {
          if (response?.selection?.text) {
            selectedText = response.selection.text.trim();
            if (selectedText) {
              enableActionButtons();
              showToast('Text selection detected!', 'success');
            }
          }
        });
      }
    } catch (error) {
      console.log('Could not get current selection:', error);
    }
  }
  
  showToast('Refreshed', 'success');
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleAction(action) {
  console.log(`🎯 Action: ${action}`);
  
  // Refresh selection for all actions
    await checkTextSelection();
    
    if (!selectedText) {
      showToast('Please select text on the page first', 'warning');
      return;
  }

  // Set active state
  [UI.simplifyBtn, UI.translateBtn, UI.askBtn, UI.checkBtn].forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    simplify: UI.simplifyBtn,
    translate: UI.translateBtn,
    ask: UI.askBtn,
    check: UI.checkBtn,
  };
  buttonMap[action]?.classList.add('active');

  currentMode = action;
  
  // Handle action
  switch (action) {
    case 'simplify':
      await doSimplify();
      break;
    case 'translate':
      await doTranslate();
      break;
    case 'ask':
      showAskInput();
      break;
    case 'check':
      showCheckInput();
      break;
  }
}

// ============================================================================
// FEATURES
// ============================================================================

async function doSimplify() {
          // Check if text is too short for good summarization
          if (selectedText.length < 50) {
            showToast('Select more text for better summary (minimum 50 characters)', 'warning');
            return;
          }
          
          // Directly perform summarization with key-points mode only
          await performSummarization(selectedText, 'key-points');
        }


        async function performSummarization(text, mode) {
          showLoading(`Smart summarizing (${mode})...`);
          
          try {
            // Check if streaming is enabled
            const enableStreaming = await storageManager.getSetting('enableStreaming', true);
            
            if (enableStreaming && text.length > 100) {
              // Use streaming for longer text
              await performStreamingSummarization(text, mode);
              return;
            }
            
            // Use smart AI for better results
            const result = await apiManager.summarize(text, { mode: mode });
    
    if (result.needsDownload) {
      showModelDownloadRequired('Summarizer');
      return;
    }

            const modeNames = {
              'key-points': 'Key Points'
            };

            const html = `
              ${text.length > 200 ? `
      <div class="info-box">
                  <div class="info-title">ORIGINAL TEXT (${text.length} chars)</div>
                  <div class="info-text">${escapeHtml(text.substring(0, 200))}${text.length > 200 ? '...' : ''}</div>
      </div>
              ` : ''}
              
              <div class="info-box highlight" style="margin-top: var(--space-md);">
                <div class="info-title" style="color: var(--color-primary);">${modeNames[mode] || mode.toUpperCase()}</div>
                <div class="info-text">${formatAIResponse(result.summary)}</div>
              </div>
              
              ${result.insights && result.insights.length > 0 ? `
                <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
                  <div class="info-title" style="color: #0369A1;">💡 SMART INSIGHTS</div>
                  <div class="info-text">
                    <ul style="margin: 0; padding-left: 20px;">
                      ${result.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              ` : ''}
              
              ${result.documentType ? `
                <div class="info-box" style="margin-top: var(--space-sm); background: #F0FDF4; border-color: #BBF7D0;">
                  <div class="info-title" style="color: #059669; font-size: var(--font-xs);">📄 DOCUMENT TYPE</div>
                  <div class="info-text" style="font-size: var(--font-xs); text-transform: capitalize;">${result.documentType.replace('_', ' ')}</div>
                </div>
              ` : ''}
              
              <div class="mode-actions">
                <button class="btn-secondary try-another-mode" data-text="${escapeHtml(text)}">
                  <i class="fas fa-redo"></i>
                  Try Another Mode
                </button>
                <button class="btn-primary copy-summary" data-text="${escapeHtml(result.summary)}">
                  <i class="fas fa-copy"></i>
                  Copy Summary
                </button>
              </div>
            `;
            
            showResult('Text Summarized', '<i class="fas fa-compress-alt" style="color: #10B981;"></i>', html);
            
            // Attach event listeners for action buttons
            setTimeout(() => {
              document.querySelector('.try-another-mode')?.addEventListener('click', () => {
                showSummarizeModes(document.querySelector('.try-another-mode').dataset.text);
              });
              
              document.querySelector('.copy-summary')?.addEventListener('click', () => {
                copyText(document.querySelector('.copy-summary').dataset.text);
              });
            }, 100);
            
            showToast('Text summarized', 'success');
    
  } catch (error) {
            console.error('Summarization failed:', error);
            showError('Failed to summarize text', error.message);
          }
        }

        async function performStreamingSummarization(text, mode) {
          showLoading(`Streaming summary (${mode})...`);
          
          try {
            // Create streaming session using LanguageModel
            const session = await apiManager.createLanguageModelSession({
              systemPrompt: `You are a helpful assistant that summarizes government forms and legal documents. 
                           Create a ${mode} summary that is clear and easy to understand.`,
              temperature: 0.3
            });
            
            if (session.needsDownload) {
              showModelDownloadRequired('Language Model');
              return;
            }

            const modeNames = {
              'key-points': 'Key Points'
            };

            // Create streaming result container
            const html = `
              ${text.length > 200 ? `
                <div class="info-box">
                  <div class="info-title">ORIGINAL TEXT (${text.length} chars)</div>
                  <div class="info-text">${escapeHtml(text.substring(0, 200))}${text.length > 200 ? '...' : ''}</div>
                </div>
              ` : ''}
              
              <div class="info-box highlight" style="margin-top: var(--space-md);">
                <div class="info-title" style="color: var(--color-primary);">${modeNames[mode] || mode.toUpperCase()} SUMMARY</div>
                <div class="info-text" id="streamingResult" style="min-height: 100px;">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
              
              <div class="mode-actions">
                <button class="btn-secondary try-another-mode" data-text="${escapeHtml(text)}">
                  <i class="fas fa-redo"></i>
                  Try Another Mode
                </button>
                <button class="btn-primary copy-summary" data-text="" style="display: none;">
                  <i class="fas fa-copy"></i>
                  Copy Summary
                </button>
              </div>
            `;
            
            showResult('Streaming Summary', '<i class="fas fa-stream" style="color: #10B981;"></i>', html);
            
            // Stream the response
            const resultContainer = document.getElementById('streamingResult');
            let fullResult = '';
            
            const stream = apiManager.promptStreaming(
              session,
              `Please provide a ${mode} summary of this text: ${text}

FORMATTING REQUIREMENTS:
- Use clean, simple formatting
- Single bullet points (-) or numbered lists (1.)
- Avoid duplicate formatting like "1. 1. text"
- Keep formatting minimal and readable
- Focus on clarity and simplicity`,
              { context: 'This is from a government form or legal document' }
            );
            
            for await (const chunk of stream) {
              fullResult += chunk;
              resultContainer.innerHTML = formatMarkdown(fullResult) + '<span class="cursor">|</span>';
              
              // Scroll to bottom
              resultContainer.scrollTop = resultContainer.scrollHeight;
            }
            
            // Remove typing indicator and cursor
            resultContainer.innerHTML = escapeHtml(fullResult).replace(/\n/g, '<br>');
            
            // Update copy button
            const copyBtn = document.querySelector('.copy-summary');
            if (copyBtn) {
              copyBtn.dataset.text = fullResult;
              copyBtn.style.display = 'inline-flex';
            }
            
            // Attach event listeners
            setTimeout(() => {
              const tryAnotherBtn = document.querySelector('.try-another-mode');
              if (tryAnotherBtn) {
                tryAnotherBtn.addEventListener('click', () => {
                  const text = tryAnotherBtn.dataset?.text || '';
                  showSummarizeModes(text);
                });
              }
              
              if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                  copyText(fullResult);
                });
              }
            }, 100);
            
            showToast('Streaming summary complete', 'success');
            
          } catch (error) {
            console.error('Streaming summarization failed:', error);
            showError('Failed to create streaming summary', error.message);
  }
}

async function doTranslate() {
  showLoading('Smart translating...');
  
  try {
    const targetLang = UI.languageSelect.value;
            console.log('🌍 Smart translating to:', targetLang);
            console.log('📝 Text to translate:', selectedText.substring(0, 100) + '...');
            
            // Use smart AI for better translation
    const result = await apiManager.translate(selectedText, targetLang);
            
            console.log('🔍 Raw translation result:', result);
    
    if (result.needsDownload) {
      showModelDownloadRequired('Translator');
      return;
    }

            if (result.fallback) {
              showToast('Translation not available (fallback mode)', 'warning');
              return;
            }

            // Handle different result formats
            let translatedText = '';
            let sourceLang = 'en';
            
            if (typeof result === 'string') {
              // Direct string result
              translatedText = result;
            } else if (result.translation) {
              // Object with translation property
              translatedText = result.translation;
              sourceLang = result.sourceLanguage || 'en';
            } else {
              // Fallback - just use the result as is
              translatedText = result;
            }

            console.log('✅ Final translated text:', translatedText);

            if (!translatedText || translatedText.trim() === '') {
              throw new Error('No translation received from API');
            }

            const html = `
      <div class="comparison-grid">
        <div class="comparison-box">
          <div class="info-title">ORIGINAL (${getLanguageName(sourceLang)})</div>
          <div class="info-text">${escapeHtml(selectedText).replace(/\n/g, '<br>')}</div>
        </div>
        <div class="comparison-box highlight">
          <div class="info-title">TRANSLATION (${getLanguageName(targetLang)})</div>
          <div class="info-text">${escapeHtml(translatedText).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
      
      ${result.insights && result.insights.length > 0 ? `
        <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
          <div class="info-title" style="color: #0369A1;">💡 TRANSLATION INSIGHTS</div>
          <div class="info-text">
            <ul style="margin: 0; padding-left: 20px;">
              ${result.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${result.documentType ? `
        <div class="info-box" style="margin-top: var(--space-sm); background: #F0FDF4; border-color: #BBF7D0;">
          <div class="info-title" style="color: #059669; font-size: var(--font-xs);">📄 DOCUMENT TYPE</div>
          <div class="info-text" style="font-size: var(--font-xs); text-transform: capitalize;">${result.documentType.replace('_', ' ')}</div>
        </div>
      ` : ''}
      
      <div class="translation-actions">
        <button class="btn-secondary" id="setDefaultLang" onclick="setDefaultLanguage('${targetLang}')">
          <i class="fas fa-check"></i>
          Set as Default
        </button>
      </div>
    `;
    
            showResult('Translation', '<i class="fas fa-language" style="color: #3B82F6;"></i>', html);
            showToast('Translation complete', 'success');
    
  } catch (error) {
    console.error('Translation failed:', error);
    showError('Failed to translate', error.message);
  }
}

function showAskInput() {
  const html = `
    <div class="input-section">
      <label class="input-label">What do you want to know about this text?</label>
      <textarea class="input-field" id="questionInput" rows="4" placeholder="What does this mean? What should I do? How do I fill this out?"></textarea>
      
      
      <div class="input-actions">
        <button class="btn-primary" id="submitQuestion">Get Answer</button>
        <button class="btn-secondary" id="cancelQuestion">Cancel</button>
      </div>
      <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
        <div class="info-title" style="color: #0369A1;">📄 CONTEXT (Selected Text)</div>
        <div class="info-text">${escapeHtml(selectedText.substring(0, 150))}${selectedText.length > 150 ? '...' : ''}</div>
      </div>
      <div class="info-box" style="margin-top: var(--space-sm); background: #F0FDF4; border-color: #BBF7D0;">
        <div class="info-title" style="color: #059669; font-size: var(--font-xs);">💡 TIP</div>
          <div class="info-text" style="font-size: var(--font-xs);">Ask questions like "What does this mean?", "What should I do?", or "Is this required?"</div>
      </div>
    </div>
  `;
  
  UI.contentArea.innerHTML = html;
  document.getElementById('questionInput').focus();
  
  // Add event listeners for the buttons
  document.getElementById('submitQuestion').addEventListener('click', async () => {
    const question = document.getElementById('questionInput').value.trim();
    if (question) {
      await doAsk(question);
    } else {
      showToast('Please enter a question', 'warning');
    }
  });
  
  document.getElementById('cancelQuestion').addEventListener('click', () => {
    UI.contentArea.innerHTML = '';
  });
  
  // Enter key to submit (Ctrl+Enter)
  document.getElementById('questionInput').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      const question = e.target.value.trim();
      if (question) await doAsk(question);
    }
  });
  
  
  async function startVoiceRecording() {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      console.log('Requesting microphone access...');
      
      // Try to request permission through the active tab first (better success rate)
      let stream;
      try {
        // First try to get permission through the content script
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
              action: 'requestMicrophonePermission'
            });
            
            if (response && response.success) {
              console.log('Microphone permission granted via content script');
            } else {
              console.log('Content script permission failed, trying direct approach');
            }
          } catch (contentScriptError) {
            console.log('Content script not available, trying direct approach');
          }
        }
        
        // Now try direct access
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('Microphone access granted directly');
        
      } catch (permissionError) {
        console.error('Permission error:', permissionError);
        
        if (permissionError.name === 'NotAllowedError') {
          showToast('Microphone access denied. Please allow microphone permission for this extension.', 'error');
          
          // Provide step-by-step instructions
          setTimeout(() => {
            showToast('1. Click the lock icon in address bar', 'info');
          }, 2000);
          
          setTimeout(() => {
            showToast('2. Allow microphone for this site', 'info');
          }, 4000);
          
          setTimeout(() => {
            showToast('3. Or go to chrome://settings/content/microphone', 'info');
          }, 6000);
          
        } else if (permissionError.name === 'NotFoundError') {
          showToast('No microphone found. Please connect a microphone.', 'error');
        } else if (permissionError.name === 'NotReadableError') {
          showToast('Microphone is being used by another application.', 'error');
        } else {
          showToast('Could not access microphone. Please check your device and permissions.', 'error');
        }
        return;
      }
      
      // Show recording interface
      voiceRecording.style.display = 'block';
      voiceRecordBtn.style.display = 'none';
      
      // Set up MediaRecorder
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Create audio blob and process
          if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processVoiceRecording(audioBlob);
          } else {
            showToast('No audio recorded. Please try again.', 'warning');
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          showToast('Error processing voice recording', 'error');
        } finally {
          // Hide recording interface
          voiceRecording.style.display = 'none';
          voiceRecordBtn.style.display = 'flex';
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        showToast('Recording error occurred', 'error');
        voiceRecording.style.display = 'none';
        voiceRecordBtn.style.display = 'flex';
      };
      
      // Start recording
      mediaRecorder.start();
      showToast('Recording started. Speak your question.', 'success');
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      showToast('Could not start recording. Please check microphone permissions.', 'error');
    }
  }
  
  function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      showToast('Processing voice input...', 'info');
    }
  }
  
  async function processVoiceRecording(audioBlob) {
    try {
      console.log('Processing voice recording:', audioBlob.size, 'bytes');
      
      // Use Speech Recognition API for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        return new Promise((resolve, reject) => {
          let resolved = false;
          
          recognition.onresult = (event) => {
            if (resolved) return;
            resolved = true;
            
            const transcript = event.results[0][0].transcript;
            document.getElementById('questionInput').value = transcript;
            showToast('Voice input converted to text!', 'success');
            console.log('Speech recognition result:', transcript);
            resolve(transcript);
          };
          
          recognition.onerror = (event) => {
            if (resolved) return;
            resolved = true;
            
            console.error('Speech recognition error:', event.error);
            showToast('Could not process voice input. Please try again.', 'error');
            reject(event.error);
          };
          
          recognition.onend = () => {
            if (!resolved) {
              resolved = true;
              showToast('No speech detected. Please try again.', 'warning');
              reject(new Error('No speech detected'));
            }
          };
          
          recognition.start();
          showToast('Converting speech to text...', 'info');
        });
      } else {
        // Fallback: Use AI to process the audio
        try {
          showToast('Processing voice with AI...', 'info');
          const result = await apiManager.processVoiceInput(audioBlob, selectedText || '');
          if (result.success) {
            document.getElementById('questionInput').value = result.response;
            showToast('Voice input processed by AI!', 'success');
          }
        } catch (aiError) {
          console.error('AI voice processing failed:', aiError);
          // Final fallback: just add the audio file
          const audioFile = new File([audioBlob], 'voice-input.webm', { type: 'audio/webm' });
          selectedFiles.push({ ...audioFile, type: 'audio' });
          updateFilePreview();
          showToast('Voice recorded. You can ask your question with the audio.', 'info');
        }
      }
      
    } catch (error) {
      console.error('Error processing voice recording:', error);
      showToast('Error processing voice input', 'error');
    }
  }
  
  function updateFilePreview() {
    if (selectedFiles.length > 0) {
      filePreview.style.display = 'block';
      fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
          <i class="fas fa-${file.type === 'image' ? 'image' : 'microphone'}"></i>
          <span>${file.name}</span>
          <button class="remove-file" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `).join('');
      
      // Add remove file listeners
      document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.closest('.remove-file').dataset.index);
          selectedFiles.splice(index, 1);
          updateFilePreview();
        });
      });
    } else {
      filePreview.style.display = 'none';
    }
  }

  
  // Ctrl+Enter to submit
  document.getElementById('questionInput').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      const question = e.target.value.trim();
      if (question) await doAsk(question);
    }
  });
}

async function doAsk(question, files = []) {
  showLoading('Smart thinking...');
  
  try {
    // Check if we have selected text or files
    if ((!selectedText || selectedText.trim().length === 0) && files.length === 0) {
      showToast('Please select text on the page or add files to provide context for your question', 'warning');
      return;
    }
    
    console.log('🤖 Asking question:', question);
    if (selectedText) {
      console.log('📝 With context text:', selectedText.substring(0, 100) + '...');
    }
    if (files.length > 0) {
      console.log('📎 With files:', files.map(f => f.name).join(', '));
    }
    
    let result;
    if (files.length > 0) {
      // Use multimodal processing
      result = await apiManager.processMultimodalInput(question, files);
    } else {
      // Use regular Q&A
      result = await apiManager.askQuestion(question, selectedText);
    }
    
    if (result.needsDownload) {
      showModelDownloadRequired('Language Model');
      return;
    }
    
    const answer = result.answer;

            // Store conversation history
            addToConversationHistory(question, answer);

    const html = `
      <div class="info-box">
        <div class="info-title">YOUR QUESTION</div>
        <div class="info-text">${escapeHtml(question)}</div>
      </div>
      ${selectedText ? `
        <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
          <div class="info-title" style="color: #0369A1;">📄 CONTEXT (Selected Text)</div>
          <div class="info-text">${escapeHtml(selectedText.substring(0, 200))}${selectedText.length > 200 ? '...' : ''}</div>
        </div>
      ` : ''}
      
      ${result.insights && result.insights.length > 0 ? `
        <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
          <div class="info-title" style="color: #0369A1;">💡 SMART INSIGHTS</div>
          <div class="info-text">
            <ul style="margin: 0; padding-left: 20px;">
              ${result.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${result.documentType ? `
        <div class="info-box" style="margin-top: var(--space-sm); background: #F0FDF4; border-color: #BBF7D0;">
          <div class="info-title" style="color: #059669; font-size: var(--font-xs);">📄 DOCUMENT TYPE</div>
          <div class="info-text" style="font-size: var(--font-xs); text-transform: capitalize;">${result.documentType.replace('_', ' ')}</div>
        </div>
      ` : ''}
      
              <div class="result-content" style="margin-top: var(--space-md); padding: 16px; background: #F8FAFC; border-radius: 8px; border-left: 4px solid #3B82F6;">
                ${formatAIResponse(answer)}
              </div>
              <div class="qa-actions">
                <button class="btn-primary ask-follow-up">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  Ask Follow-up
                </button>
                <button class="btn-secondary clear-session">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  New Session
                </button>
                <span class="session-info">Session: ${apiManager.qaSession ? (apiManager.qaSession.tokensSoFar || 0) + '/' + (apiManager.qaSession.maxTokens || 4096) : '0/4096'} tokens</span>
              </div>
      <div class="info-box" style="margin-top: var(--space-md); background: #FEF2F2; border-color: #FCA5A5;">
        <div class="info-title" style="color: #DC2626;">⚠️ DISCLAIMER</div>
        <div class="info-text">This is AI assistance, not official legal advice.</div>
      </div>
    `;
    
            showResult('AI Answer', '<i class="fas fa-comments" style="color: #8B5CF6;"></i>', html);
            
            // Attach event listeners for session management buttons
            setTimeout(() => {
              document.querySelector('.ask-follow-up')?.addEventListener('click', showFollowUpInput);
              document.querySelector('.clear-session')?.addEventListener('click', clearAISession);
            }, 100);
            
    showToast('Answer generated', 'success');
    
  } catch (error) {
    console.error('Ask failed:', error);
    showError('Failed to answer question', error.message);
  }
}

function showCheckInput() {
  const html = `
    <div class="input-section">
      <label class="input-label">Enter text to fix (or leave empty to check selected text):</label>
      <textarea class="input-field" id="textInput" rows="6" placeholder="Type or paste text here...">${escapeHtml(selectedText)}</textarea>
      <div class="input-actions">
        <button class="btn-primary" id="submitText">Fix Writing</button>
        <button class="btn-secondary" id="cancelText">Cancel</button>
      </div>
    </div>
  `;
  
  UI.contentArea.innerHTML = html;
  document.getElementById('textInput').focus();
  
  document.getElementById('submitText').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
      showToast('Please enter some text', 'warning');
      return;
    }
    await doCheck(text);
  });
  
  document.getElementById('cancelText').addEventListener('click', () => {
    UI.contentArea.innerHTML = '';
    UI.emptyState.classList.remove('hidden');
    UI.checkBtn.classList.remove('active');
  });
}

function showWriteInput() {
  const html = `
    <div class="input-section">
      <label class="input-label">What would you like to write?</label>
      <div class="write-options">
        <button class="btn-secondary write-option" data-type="email">
          <i class="fas fa-envelope"></i>
          Professional Email
        </button>
        <button class="btn-secondary write-option" data-type="letter">
          <i class="fas fa-file-alt"></i>
          Formal Letter
        </button>
        <button class="btn-secondary write-option" data-type="complaint">
          <i class="fas fa-exclamation-triangle"></i>
          Complaint Letter
        </button>
        <button class="btn-secondary write-option" data-type="request">
          <i class="fas fa-hand-paper"></i>
          Request Letter
        </button>
        <button class="btn-secondary write-option" data-type="explanation">
          <i class="fas fa-info-circle"></i>
          Explanation Letter
        </button>
        <button class="btn-secondary write-option" data-type="custom">
          <i class="fas fa-edit"></i>
          Custom Content
        </button>
      </div>
      <div class="write-details" id="writeDetails" style="display: none;">
        <label class="input-label">Provide details for your content:</label>
        <textarea class="input-field" id="writePrompt" rows="4" placeholder="Describe what you want to write about..."></textarea>
        <div class="input-actions">
          <button class="btn-primary" id="submitWrite">Generate</button>
          <button class="btn-secondary" id="cancelWrite">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  UI.contentArea.innerHTML = html;
  
  // Handle write option selection
  document.querySelectorAll('.write-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const details = document.getElementById('writeDetails');
      const prompt = document.getElementById('writePrompt');
      
      // Set up prompts for different types
      const prompts = {
        email: 'Write a professional email about: ',
        letter: 'Write a formal letter about: ',
        complaint: 'Write a complaint letter about: ',
        request: 'Write a request letter about: ',
        explanation: 'Write an explanation letter about: ',
        custom: 'Write content about: '
      };
      
      prompt.placeholder = prompts[type] + '...';
      details.style.display = 'block';
      prompt.focus();
    });
  });
  
  document.getElementById('submitWrite').addEventListener('click', async () => {
    const prompt = document.getElementById('writePrompt').value.trim();
    if (!prompt) {
      showToast('Please provide details for your content', 'warning');
      return;
    }
    await doWrite(prompt);
  });
  
  document.getElementById('cancelWrite').addEventListener('click', () => {
    UI.contentArea.innerHTML = '';
    UI.emptyState.classList.remove('hidden');
  });
}

async function doCheck(text) {
  showLoading('Fixing writing...');
  
  try {
    // Use only proofread mode (simplified)
    const result = await apiManager.improveWriting(text, 'proofread');

    if (result.needsDownload) {
      showModelDownloadRequired('Language Model');
      return;
    }

    if (result.fallback) {
      showToast('⚠️ Using LanguageModel fallback - Proofreader API requires Chrome 141+ with origin trial', 'warning');
    }

    const html = `
      <div class="info-box">
        <div class="info-title">ORIGINAL TEXT</div>
        <div class="info-text">${escapeHtml(text)}</div>
      </div>
      
      <div class="info-box highlight" style="margin-top: var(--space-md);">
        <div class="info-title" style="color: var(--color-primary);">✏️ IMPROVED TEXT</div>
        <div class="info-text">${formatMarkdown(result.improved)}</div>
      </div>
      
      <div class="write-actions" style="margin-top: var(--space-lg);">
        <button class="btn-primary copy-improved" data-text="${escapeHtml(result.improved)}">
          <i class="fas fa-copy"></i>
          Copy Improved Text
        </button>
      </div>
      
    `;
    
            showResult('Writing Fixed', '<i class="fas fa-spell-check" style="color: #F59E0B;"></i>', html);
            
            // Attach event listeners for copy button
            setTimeout(() => {
              document.querySelectorAll('.copy-improved').forEach(btn => {
                btn.addEventListener('click', () => copyText(btn.dataset.text));
              });
            }, 100);
            
            showToast('Text analysis complete', 'success');
    
  } catch (error) {
            console.error('Writing assistant failed:', error);
    showError('Failed to check text', error.message);
  }
}

async function doWrite(prompt) {
  showLoading('Generating content...');
  
  try {
    console.log('✍️ Writing content for prompt:', prompt);
    
    // Use Writer API for content generation
    const result = await apiManager.generateContent(prompt, selectedText || '');
    
    if (result.needsDownload) {
      showModelDownloadRequired('Writer');
      return;
    }

    const html = `
      <div class="info-box">
        <div class="info-title">YOUR REQUEST</div>
        <div class="info-text">${escapeHtml(prompt)}</div>
      </div>
      
      ${selectedText ? `
        <div class="info-box" style="margin-top: var(--space-md); background: #F0F9FF; border-color: #BAE6FD;">
          <div class="info-title" style="color: #0369A1;">📄 CONTEXT (Selected Text)</div>
          <div class="info-text">${escapeHtml(selectedText.substring(0, 200))}${selectedText.length > 200 ? '...' : ''}</div>
        </div>
      ` : ''}
      
      <div class="result-content" style="margin-top: var(--space-md); padding: 16px; background: #F8FAFC; border-radius: 8px; border-left: 4px solid #10B981;">
        <div class="info-title" style="color: #10B981; margin-bottom: 12px;">✍️ GENERATED CONTENT</div>
        <div class="info-text">${formatAIResponse(result.content)}</div>
      </div>
      
      <div class="write-actions">
        <button class="btn-primary copy-generated" data-text="${escapeHtml(result.content)}">
          <i class="fas fa-copy"></i>
          Copy Content
        </button>
        <button class="btn-secondary refine-content" data-prompt="${escapeHtml(prompt)}" data-content="${escapeHtml(result.content)}">
          <i class="fas fa-edit"></i>
          Refine Content
        </button>
        <button class="btn-secondary write-another">
          <i class="fas fa-plus"></i>
          Write Something Else
        </button>
      </div>
      
      <div class="info-box" style="margin-top: var(--space-md); background: #FEF2F2; border-color: #FCA5A5;">
        <div class="info-title" style="color: #DC2626;">⚠️ DISCLAIMER</div>
        <div class="info-text">This is AI-generated content. Please review and edit as needed before using.</div>
      </div>
    `;
    
    showResult('Content Generated', '<i class="fas fa-pen-fancy" style="color: #10B981;"></i>', html);
    
    // Attach event listeners for action buttons
    setTimeout(() => {
      document.querySelector('.copy-generated')?.addEventListener('click', () => {
        copyText(document.querySelector('.copy-generated').dataset.text);
      });
      
      document.querySelector('.refine-content')?.addEventListener('click', () => {
        showRefineInput(
          document.querySelector('.refine-content').dataset.prompt,
          document.querySelector('.refine-content').dataset.content
        );
      });
      
      document.querySelector('.write-another')?.addEventListener('click', () => {
        showWriteInput();
      });
    }, 100);
    
    showToast('Content generated successfully', 'success');
    
  } catch (error) {
    console.error('Content generation failed:', error);
    showError('Failed to generate content', error.message);
  }
}

function showRefineInput(originalPrompt, currentContent) {
  const html = `
    <div class="input-section">
      <label class="input-label">How would you like to refine this content?</label>
      <div class="refine-options">
        <button class="btn-secondary refine-option" data-type="formal">
          <i class="fas fa-gavel"></i>
          Make More Formal
        </button>
        <button class="btn-secondary refine-option" data-type="casual">
          <i class="fas fa-smile"></i>
          Make More Casual
        </button>
        <button class="btn-secondary refine-option" data-type="shorter">
          <i class="fas fa-compress"></i>
          Make Shorter
        </button>
        <button class="btn-secondary refine-option" data-type="longer">
          <i class="fas fa-expand"></i>
          Make Longer
        </button>
        <button class="btn-secondary refine-option" data-type="custom">
          <i class="fas fa-edit"></i>
          Custom Refinement
        </button>
      </div>
      <div class="refine-details" id="refineDetails" style="display: none;">
        <label class="input-label">Describe your refinement:</label>
        <textarea class="input-field" id="refinePrompt" rows="3" placeholder="Describe how to improve the content..."></textarea>
        <div class="input-actions">
          <button class="btn-primary" id="submitRefine">Refine</button>
          <button class="btn-secondary" id="cancelRefine">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  UI.contentArea.innerHTML = html;
  
  // Handle refine option selection
  document.querySelectorAll('.refine-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const details = document.getElementById('refineDetails');
      const prompt = document.getElementById('refinePrompt');
      
      const prompts = {
        formal: 'Make this content more formal and professional',
        casual: 'Make this content more casual and friendly',
        shorter: 'Make this content more concise and to the point',
        longer: 'Add more detail and expand on the key points',
        custom: ''
      };
      
      prompt.value = prompts[type];
      prompt.placeholder = type === 'custom' ? 'Describe how to improve the content...' : '';
      details.style.display = 'block';
      prompt.focus();
    });
  });
  
  document.getElementById('submitRefine').addEventListener('click', async () => {
    const refinePrompt = document.getElementById('refinePrompt').value.trim();
    if (!refinePrompt) {
      showToast('Please describe how to refine the content', 'warning');
      return;
    }
    
    const newPrompt = `${originalPrompt}\n\nRefinement request: ${refinePrompt}`;
    await doWrite(newPrompt);
  });
  
  document.getElementById('cancelRefine').addEventListener('click', () => {
    showWriteInput();
  });
}

// ============================================================================
// UI STATES
// ============================================================================

function showLoading(message) {
  UI.contentArea.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">${message}</div>
    </div>
  `;
          
          // Show progress indicator
          showProgressIndicator(message);
        }

        function showProgressIndicator(message = 'Processing...') {
          // Remove existing progress indicator
          const existing = document.querySelector('.progress-indicator');
          if (existing) existing.remove();
          
          // Create progress indicator
          const progress = document.createElement('div');
          progress.className = 'progress-indicator';
          progress.innerHTML = `
            <div class="progress-bar" id="progressBar"></div>
            <div class="progress-text">${message}</div>
          `;
          
          document.body.appendChild(progress);
          
          // Animate progress bar
          const bar = document.getElementById('progressBar');
          let progressValue = 0;
          const interval = setInterval(() => {
            progressValue += Math.random() * 15;
            if (progressValue > 90) progressValue = 90;
            bar.style.width = progressValue + '%';
          }, 200);
          
          // Store interval for cleanup
          progress._interval = interval;
        }

        function hideProgressIndicator() {
          const progress = document.querySelector('.progress-indicator');
          if (progress) {
            const bar = document.getElementById('progressBar');
            if (bar) {
              bar.style.width = '100%';
              setTimeout(() => {
                if (progress._interval) clearInterval(progress._interval);
                progress.remove();
              }, 300);
            }
          }
}

function showResult(title, icon, contentHtml) {
  // Hide progress indicator
  hideProgressIndicator();
  
  UI.contentArea.innerHTML = `
    <div class="result-card" style="opacity: 0; transform: translateY(20px);">
      <div class="result-header">
        <div class="result-title">
          <span>${icon}</span>
          <span>${title}</span>
        </div>
        <button class="icon-btn" id="closeResult" style="color: white;" aria-label="Close result">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="result-body">${contentHtml}</div>
      <div class="result-actions">
        <button class="btn-secondary" id="copyResult">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy
        </button>
        <button class="btn-secondary" id="readAloud">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
          </svg>
          Read
        </button>
      </div>
    </div>
  `;
  
  // Animate result card in
  const resultCard = document.querySelector('.result-card');
  requestAnimationFrame(() => {
    resultCard.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    resultCard.style.opacity = '1';
    resultCard.style.transform = 'translateY(0)';
  });
  
  // Attach handlers
  document.getElementById('closeResult').addEventListener('click', closeResult);
  document.getElementById('copyResult').addEventListener('click', copyResult);
  document.getElementById('readAloud').addEventListener('click', readAloud);
}

function showError(title, message) {
          // Hide progress indicator
          hideProgressIndicator();
          
  UI.contentArea.innerHTML = `
            <div class="error-state">
              <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
              <div class="error-title">${title}</div>
              <div class="error-description">${escapeHtml(message)}</div>
              <div class="error-actions">
                <button class="btn-primary" id="tryAgainBtn">Try Again</button>
                <button class="btn-secondary" id="closeResultBtn">Close</button>
      </div>
    </div>
  `;
  
  // Add event listeners for error buttons
  setTimeout(() => {
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const closeResultBtn = document.getElementById('closeResultBtn');
    
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        location.reload();
      });
    }
    
    if (closeResultBtn) {
      closeResultBtn.addEventListener('click', () => {
        closeResult();
      });
    }
  }, 100);
}

function showModelDownloadRequired(modelName) {
          // Hide progress indicator
          hideProgressIndicator();
          
  UI.contentArea.innerHTML = `
    <div class="result-card">
      <div class="result-header" style="background: var(--color-warning);">
        <div class="result-title">
                  <span><i class="fas fa-download"></i></span>
          <span>Model Download Required</span>
        </div>
      </div>
      <div class="result-body">
        <div class="info-box" style="background: #FEF3C7; border-color: #FCD34D;">
                  <div class="info-text">The ${modelName} model needs to be downloaded first. This may take a few minutes.</div>
        </div>
                
                <div class="download-actions">
                  <button class="btn-primary start-download" data-model="${modelName}" style="width: 100%; margin-bottom: var(--space-sm);">
                    <i class="fas fa-download"></i>
                    Start Download
                  </button>
        <a href="chrome://on-device-internals" target="_blank">
                    <button class="btn-secondary" style="width: 100%;">
                      <i class="fas fa-cog"></i>
                      Open Chrome AI Settings
                    </button>
                  </a>
                </div>
                
                <div class="info-box" style="margin-top: var(--space-md); background: #EFF6FF; border-color: #93C5FD;">
                  <div class="info-title" style="color: #0369A1;">💡 TIP</div>
                  <div class="info-text" style="font-size: var(--font-xs);">Download progress will be shown automatically. You can continue using other features while downloading.</div>
                </div>
      </div>
    </div>
  `;
          
          // Attach event listener for download button
          setTimeout(() => {
            document.querySelector('.start-download')?.addEventListener('click', () => {
              startModelDownload(document.querySelector('.start-download').dataset.model);
            });
          }, 50);
        }

        async function startModelDownload(modelName) {
          showLoading(`Starting ${modelName} download...`);
          
          try {
            // Trigger the download by attempting to use the API
            let result;
            switch (modelName.toLowerCase()) {
              case 'summarizer':
                result = await apiManager.initSummarizer();
                break;
              case 'translator':
                result = await apiManager.initTranslator('en', 'es');
                break;
              case 'language model':
              case 'language detector':
                result = await apiManager.initLanguageDetector();
                break;
              default:
                throw new Error(`Unknown model: ${modelName}`);
            }
            
            if (result.downloading) {
              showToast(`${modelName} download started!`, 'success');
              // Progress will be handled by the event listener
            } else if (result.needsDownload) {
              showToast('Download not yet started. Please try again.', 'warning');
            } else {
              showToast(`${modelName} is ready!`, 'success');
              // Retry the original action
              setTimeout(() => {
                closeResult();
                // Re-enable buttons
                enableActionButtons();
              }, 1000);
            }
            
          } catch (error) {
            console.error('Download start failed:', error);
            showError('Failed to start download', error.message);
          }
}

function closeResult() {
  UI.contentArea.innerHTML = '';
  UI.emptyState.classList.remove('hidden');
  [UI.simplifyBtn, UI.translateBtn, UI.askBtn, UI.checkBtn].forEach(btn => {
    btn.classList.remove('active');
  });
}

// ============================================================================
// SETTINGS
// ============================================================================

function openSettings() {
  UI.settingsPanel.classList.remove('hidden');
}

function closeSettings() {
  UI.settingsPanel.classList.add('hidden');
}

async function loadSettings() {
  // No settings to load anymore - language is selected per translation
}

        async function restoreSessions() {
          try {
            const sessions = await storageManager.getSessions();
            const sessionCount = Object.keys(sessions).length;
            
            if (sessionCount > 0) {
              console.log(`🔄 Found ${sessionCount} saved sessions`);
              showToast(`${sessionCount} conversation${sessionCount > 1 ? 's' : ''} restored`, 'info');
            }
          } catch (error) {
            console.error('Failed to restore sessions:', error);
          }
}

async function clearData() {
  if (confirm('Clear all settings and data? This cannot be undone.')) {
    await storageManager.clearAll();
    apiManager.cleanup();
    showToast('All data cleared', 'success');
    setTimeout(() => location.reload(), 1000);
  }
}

async function testAPI() {
  showToast('Testing APIs...', 'info');
  const availability = await apiManager.checkEnvironment();
  console.log('API Status:', availability);
  
  const allGood = availability.summarizer && availability.translator && availability.languageModel;
  if (allGood) {
    showToast('All APIs available!', 'success');
  } else {
    showToast('Some APIs unavailable - check console', 'warning');
  }
}

        // ============================================================================
        // ERROR HANDLING & GRACEFUL DEGRADATION
        // ============================================================================

        function withErrorHandling(fn, fallbackMessage = 'Operation failed') {
          return async function(...args) {
            try {
              return await fn.apply(this, args);
            } catch (error) {
              console.error(`❌ ${fn.name} failed:`, error);
              
              // Check if it's a known error type
              if (error.message.includes('needsDownload')) {
                showModelDownloadRequired('AI Model');
                return;
              }
              
              if (error.message.includes('not available')) {
                showToast('AI features not available. Please check Chrome AI settings.', 'warning');
                return;
              }
              
              if (error.message.includes('timeout')) {
                showToast('Request timed out. Please try again.', 'warning');
                return;
              }
              
              // Generic error fallback
              showError('Something went wrong', `${fallbackMessage}: ${error.message}`);
            }
          };
}

// ============================================================================
// UTILITIES
// ============================================================================

        function chunkTextForSummarization(text, maxChunkSize = 4000) {
          // Split on sentence boundaries for better summarization
          const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
          const chunks = [];
          let currentChunk = '';
          
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
          
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          return chunks;
        }

        async function combineSummaries(summaries) {
          if (summaries.length === 1) return summaries[0];
          
          try {
            const combinedText = summaries.join('\n\n');
            const result = await apiManager.summarize(combinedText, {
              context: 'These are multiple summaries that need to be combined into one coherent summary'
            });
            return result.summary || result;
          } catch (error) {
            console.error('Failed to combine summaries:', error);
            return summaries.join('\n\n');
          }
        }





        function setDefaultLanguage(langCode) {
          UI.languageSelect.value = langCode;
          localStorage.setItem('docuguide-default-language', langCode);
          showToast(`Default language set to ${getLanguageName(langCode)}`, 'success');
        }

        // AI Session Management
        let currentAISession = null;
        let conversationHistory = [];

        async function createAISession() {
          const session = await apiManager.createLanguageModel({
            systemPrompt: `You are a helpful assistant explaining government forms and civic documents. 
                         Be clear, concise, and empathetic. 
                         If you don't know something, say so - never guess about legal requirements.
                         Always remind users this is AI assistance, not official legal advice.`,
            temperature: 0.3,
            topK: 40
          });
          
          console.log('✅ AI session created');
          return session;
        }

        function getCurrentSession() {
          return currentAISession;
        }

        function setCurrentSession(session) {
          currentAISession = session;
        }

        function addToConversationHistory(question, answer) {
          conversationHistory.push({
            question,
            answer,
            timestamp: Date.now()
          });
          
          // Keep only last 10 conversations
          if (conversationHistory.length > 10) {
            conversationHistory.shift();
          }

          // Save to persistent storage
          if (currentAISession && currentAISession.id) {
            storageManager.saveConversation(currentAISession.id, question, answer);
          }
        }

        function clearAISession() {
          if (currentAISession) {
            currentAISession.destroy();
            currentAISession = null;
          }
          conversationHistory = [];
          showToast('AI session cleared', 'success');
        }

        function showFollowUpInput() {
          const html = `
            <div class="input-section">
              <label class="input-label">Ask a follow-up question:</label>
              <textarea class="input-field" id="followUpInput" rows="3" placeholder="What else would you like to know?"></textarea>
              <div class="input-actions">
                <button class="btn-primary" id="submitFollowUp">Ask</button>
                <button class="btn-secondary" id="cancelFollowUp">Cancel</button>
              </div>
            </div>
          `;
          
          UI.contentArea.innerHTML = html;
          document.getElementById('followUpInput').focus();
          
          document.getElementById('submitFollowUp').addEventListener('click', async () => {
            const question = document.getElementById('followUpInput').value.trim();
            if (!question) {
              showToast('Please enter a question', 'warning');
              return;
            }
            await doAsk(question);
          });
          
          document.getElementById('cancelFollowUp').addEventListener('click', () => {
            UI.contentArea.innerHTML = '';
            UI.emptyState.classList.remove('hidden');
            UI.askBtn.classList.remove('active');
          });
        }


        function copyImprovedText() {
          // Copy the proofread version (first highlight box)
          const proofreadBox = document.querySelector('.info-box.highlight');
          if (proofreadBox) {
            const text = proofreadBox.innerText.replace('PROOFREAD VERSION', '').trim();
            navigator.clipboard.writeText(text).then(() => {
              showToast('Improved text copied to clipboard', 'success');
            }).catch(() => {
              showToast('Failed to copy text', 'error');
            });
          }
        }

        function useOriginalText() {
          // Copy the original text (first info box)
          const originalBox = document.querySelector('.info-box:not(.highlight)');
          if (originalBox) {
            const text = originalBox.innerText.replace('YOUR TEXT', '').trim();
            navigator.clipboard.writeText(text).then(() => {
              showToast('Original text copied to clipboard', 'success');
            }).catch(() => {
              showToast('Failed to copy text', 'error');
            });
          }
        }

        function copyText(text) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('Text copied to clipboard', 'success');
          }).catch(() => {
            showToast('Failed to copy text', 'error');
          });
        }

        function showAdvancedWriting(text) {
          const html = `
            <div class="input-section">
              <label class="input-label">Choose writing enhancement:</label>
              <div class="writing-options">
                <button class="btn-secondary enhance-expand" data-text="${escapeHtml(text)}" data-mode="expand">
                  <i class="fas fa-expand-arrows-alt"></i>
                  Expand
                </button>
                <button class="btn-secondary enhance-concise" data-text="${escapeHtml(text)}" data-mode="concise">
                  <i class="fas fa-compress-arrows-alt"></i>
                  Concise
                </button>
                <button class="btn-secondary enhance-polite" data-text="${escapeHtml(text)}" data-mode="polite">
                  <i class="fas fa-handshake"></i>
                  Polite
                </button>
              </div>
              <button class="btn-secondary cancel-advanced">Cancel</button>
            </div>
          `;
          
          UI.contentArea.innerHTML = html;
          
          // Attach event listeners
          setTimeout(() => {
            document.querySelectorAll('.enhance-expand, .enhance-concise, .enhance-polite').forEach(btn => {
              btn.addEventListener('click', () => enhanceText(btn.dataset.text, btn.dataset.mode));
            });
            
            document.querySelector('.cancel-advanced')?.addEventListener('click', closeResult);
          }, 50);
        }

        async function enhanceText(text, mode) {
          showLoading(`Enhancing text (${mode})...`);
          
          try {
            const result = await apiManager.improveWriting(text, mode);
            
            if (result.needsDownload) {
              showModelDownloadRequired('Language Model');
              return;
            }

            const html = `
              <div class="info-box">
                <div class="info-title">ORIGINAL TEXT</div>
                <div class="info-text">${escapeHtml(text)}</div>
              </div>
              
              <div class="info-box highlight" style="margin-top: var(--space-md);">
                <div class="info-title" style="color: var(--color-primary);">${mode.toUpperCase()} VERSION</div>
                <div class="info-text">${formatAIResponse(result.improved)}</div>
              </div>
              
              <div class="writing-actions">
                <button class="btn-primary copy-enhanced" data-text="${escapeHtml(result.improved)}">
                  <i class="fas fa-copy"></i>
                  Copy Enhanced Text
                </button>
                <button class="btn-secondary back-to-options" data-text="${escapeHtml(text)}">
                  <i class="fas fa-arrow-left"></i>
                  Back to Options
                </button>
              </div>
            `;
            
            showResult(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Enhancement`, '<i class="fas fa-magic" style="color: #8B5CF6;"></i>', html);
            
            // Attach event listeners for enhancement buttons
            setTimeout(() => {
              document.querySelector('.copy-enhanced')?.addEventListener('click', () => {
                copyText(document.querySelector('.copy-enhanced').dataset.text);
              });
              
              document.querySelector('.back-to-options')?.addEventListener('click', () => {
                showAdvancedWriting(document.querySelector('.back-to-options').dataset.text);
              });
            }, 100);
            
            showToast('Text enhanced', 'success');
            
          } catch (error) {
            console.error('Text enhancement failed:', error);
            showError('Failed to enhance text', error.message);
          }
        }

async function copyResult() {
  try {
    const resultBody = document.querySelector('.result-body');
    const text = resultBody.innerText;
    await navigator.clipboard.writeText(text);
    
    // Micro-interaction: Button feedback
    const btn = document.getElementById('copyResult');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Copied!
    `;
    btn.style.background = 'var(--color-success)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--color-success)';
    
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
    
    showToast('Copied to clipboard', 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

function readAloud() {
  const resultBody = document.querySelector('.result-body');
  const text = resultBody.innerText;
  
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
  showToast('Reading aloud...', 'info');
}

// Help functionality removed

function showPrivacyInfo() {
  UI.contentArea.innerHTML = `
    <div class="result-card">
      <div class="result-header" style="background: var(--color-privacy);">
        <div class="result-title">
                  <span><i class="fas fa-lock"></i></span>
          <span>Privacy Guarantee</span>
        </div>
      </div>
      <div class="result-body">
        <div class="info-box" style="background: #F0FDF4; border-color: #D1FAE5; margin-bottom: var(--space-md);">
          <div class="info-title" style="color: var(--color-privacy);">100% LOCAL PROCESSING</div>
          <div class="info-text">All AI processing happens on your device using Chrome's built-in Gemini Nano.</div>
        </div>
        <div class="info-box" style="margin-bottom: var(--space-md);">
          <div class="info-title">WHAT WE STORE</div>
          <div class="info-text">Only your language preference and theme choice. No form content, queries, or translations are ever stored.</div>
        </div>
        <div class="info-box">
          <div class="info-title">WHY THIS MATTERS</div>
          <div class="info-text">When dealing with medical forms, legal documents, financial papers, educational materials, and any sensitive information, your privacy is paramount. DocuGuide ensures your personal information never leaves your device.</div>
        </div>
      </div>
    </div>
  `;
}

function showToast(message, type = 'info') {
  const colors = {
    success: { bg: '#F0FDF4', border: '#86EFAC', text: '#059669' },
    error: { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626' },
    warning: { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' },
    info: { bg: '#EFF6FF', border: '#93C5FD', text: '#2563EB' }
  };
  
  const color = colors[type] || colors.info;
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${color.bg};
    border: 1px solid ${color.border};
    color: ${color.text};
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: var(--font-sm);
    font-weight: var(--font-medium);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function announceToScreenReader(message) {
  // Create or update live region for screen reader announcements
  let liveRegion = document.getElementById('live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  }
  
  liveRegion.textContent = message;
  
  // Also use speech synthesis if available
  if ('speechSynthesis' in window && window.speechSynthesis.speaking === false) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = 0.5;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

// ============================================================================
// TEXT SELECTION MONITORING
// ============================================================================

function setupTextSelectionMonitoring() {
  // Check for text selection every 500ms when sidebar is visible
  const checkInterval = setInterval(async () => {
    try {
      await checkTextSelection();
    } catch (error) {
      // Silently handle errors to avoid console spam
    }
  }, 500);

  // Stop checking when sidebar is hidden
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const sidebar = document.querySelector('#sidebar') || document.body;
        if (sidebar.style.display === 'none' || sidebar.style.visibility === 'hidden') {
          clearInterval(checkInterval);
        }
      }
    });
  });

  observer.observe(document.body, { attributes: true, subtree: true });

  // Also check when window gains focus
  window.addEventListener('focus', checkTextSelection);
  
  // Check when user clicks in the sidebar (might have selected text)
  document.addEventListener('click', () => {
    setTimeout(checkTextSelection, 100);
  });
}

function handleMessage(message) {
  console.log('📨 Message received:', message.type);
  
  if (message.type === 'TEXT_SELECTED') {
    selectedText = message.text;
    enableActionButtons();
    console.log('✅ Text selection updated via message:', selectedText.length, 'chars');
    console.log('✅ Selected text preview:', selectedText.substring(0, 100) + '...');
  } else if (message.type === 'CLEAR_SELECTION') {
    selectedText = '';
    disableActionButtons();
    console.log('🧹 Text selection cleared');
  } else if (message.action) {
    // Handle action messages from popup
    selectedText = message.text || '';
    if (selectedText) {
      enableActionButtons();
      handleAction(message.action);
    }
  }
  
  return true;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMarkdown(text) {
  if (!text) return '';
  
  // Convert markdown to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/gim, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<li>.*<\/li>)<\/p>/g, '<ul>$1</ul>')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1');
}

// formatTranslationText function removed - AI handles formatting directly

// formatMarkdown function removed - AI handles all formatting directly


// Add keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeOut {
    to { opacity: 0; transform: translateX(20px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .action-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// ============================================================================
// ONBOARDING SYSTEM
// ============================================================================

        async function checkFirstTimeUser() {
          const hasSeenOnboarding = await storageManager.getSetting('hasSeenOnboarding', false);
          
          if (!hasSeenOnboarding) {
            setTimeout(() => {
              showOnboarding();
            }, 1000);
          }
        }

        function showOnboarding() {
          const overlay = document.createElement('div');
          overlay.className = 'onboarding-overlay';
          
          const steps = [
            {
              icon: '🎯',
              title: 'Welcome to DocuGuide!',
              description: 'Your private AI assistant for understanding government forms and legal documents.',
              demo: 'All processing happens locally on your device - your data never leaves your computer.'
            },
            {
              icon: '📝',
              title: 'Select Text Anywhere',
              description: 'Simply highlight any text on any webpage to get started.',
              demo: 'Try selecting this text: "The applicant must provide..."'
            },
            {
              icon: '🤖',
              title: 'Choose Your AI Assistant',
              description: 'Use our 4 powerful AI features to understand and improve your text.',
              demo: '• Simplify: Break down complex language\n• Translate: Change language\n• Ask: Get answers about the text\n• Check: Improve your writing'
            },
            {
              icon: '🔒',
              title: '100% Private & Secure',
              description: 'Everything happens locally using Chrome\'s built-in AI. No data is sent anywhere.',
              demo: 'Your sensitive information stays on your device.'
            }
          ];
          
          let currentStep = 0;
          
          function renderStep() {
            const step = steps[currentStep];
            return `
              <div class="onboarding-card">
                <div class="onboarding-header">
                  <div class="step-icon">${step.icon}</div>
                  <h2 class="onboarding-title">${step.title}</h2>
                  <p class="onboarding-subtitle">${step.description}</p>
                </div>
                
                <div class="onboarding-step">
                  <div class="step-demo">${step.demo}</div>
                </div>
                
                <div class="onboarding-navigation">
                  <div class="step-indicator">
                    ${steps.map((_, index) => 
                      `<div class="step-dot ${index === currentStep ? 'active' : ''}"></div>`
                    ).join('')}
                  </div>
                  
                  <div class="onboarding-buttons">
                    ${currentStep > 0 ? 
                      `<button class="btn-secondary" id="prevStep">Previous</button>` : ''
                    }
                    <button class="btn-primary" id="nextStep">
                      ${currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }
          
          overlay.innerHTML = renderStep();
          document.body.appendChild(overlay);
          
          // Event listeners
          overlay.querySelector('#nextStep').addEventListener('click', () => {
            if (currentStep === steps.length - 1) {
              // Complete onboarding
              storageManager.setSetting('hasSeenOnboarding', true);
              overlay.remove();
              showToast('Welcome to DocuGuide! 🎉', 'success');
            } else {
              currentStep++;
              overlay.innerHTML = renderStep();
              setupOnboardingEvents();
            }
          });
          
          if (overlay.querySelector('#prevStep')) {
            overlay.querySelector('#prevStep').addEventListener('click', () => {
              currentStep--;
              overlay.innerHTML = renderStep();
              setupOnboardingEvents();
            });
          }
          
          // Close on overlay click
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              storageManager.setSetting('hasSeenOnboarding', true);
              overlay.remove();
            }
          });
          
          function setupOnboardingEvents() {
            overlay.querySelector('#nextStep').addEventListener('click', () => {
              if (currentStep === steps.length - 1) {
                storageManager.setSetting('hasSeenOnboarding', true);
                overlay.remove();
                showToast('Welcome to DocuGuide! 🎉', 'success');
              } else {
                currentStep++;
                overlay.innerHTML = renderStep();
                setupOnboardingEvents();
              }
            });
            
            if (overlay.querySelector('#prevStep')) {
              overlay.querySelector('#prevStep').addEventListener('click', () => {
                currentStep--;
                overlay.innerHTML = renderStep();
                setupOnboardingEvents();
              });
            }
          }
        }

// ============================================================================
// THEME SYSTEM
// ============================================================================

        function initializeTheme() {
          const savedTheme = storageManager.getSetting('theme', 'light');
          document.documentElement.setAttribute('data-theme', savedTheme);
          
          const themeToggle = document.getElementById('themeToggle');
          if (themeToggle) {
            themeToggle.classList.toggle('active', savedTheme === 'dark');
            
            themeToggle.addEventListener('click', () => {
              const currentTheme = document.documentElement.getAttribute('data-theme');
              const newTheme = currentTheme === 'light' ? 'dark' : 'light';
              
              document.documentElement.setAttribute('data-theme', newTheme);
              themeToggle.classList.toggle('active', newTheme === 'dark');
              storageManager.setSetting('theme', newTheme);
              
              showToast(`Switched to ${newTheme} theme`, 'info');
            });
          }
        }

// Help system removed to simplify extension

// ============================================================================
// ENHANCED EVENT LISTENERS
// ============================================================================

        function setupEnhancedEventListeners() {
          // Settings button - show advanced settings
          const settingsBtn = document.getElementById('settingsBtn');
          if (settingsBtn) {
            settingsBtn.addEventListener('click', showAdvancedSettings);
          }
        }

        function showAdvancedSettings() {
          const html = `
            <div class="input-section">
              <label class="input-label">Advanced Settings</label>
              
              <div class="setting-group" style="margin: var(--space-lg) 0;">
                <div class="setting-item" style="margin-bottom: var(--space-md);">
                  <label class="setting-label" style="display: block; margin-bottom: var(--space-xs); font-weight: var(--font-weight-medium);">Default Translation Language</label>
                  <select class="input-field" id="defaultLanguage">
                    <option value="es">Spanish</option>
                    <option value="zh">Chinese</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                    <option value="vi">Vietnamese</option>
                    <option value="tl">Tagalog</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                
                <div class="setting-item" style="margin-bottom: var(--space-md);">
                  <label class="setting-label" style="display: block; margin-bottom: var(--space-xs); font-weight: var(--font-weight-medium);">Default Summarization Mode</label>
                  <select class="input-field" id="defaultSummarizationMode">
                    <option value="key-points">Key Points</option>
                  </select>
                </div>
                
                <div class="setting-item" style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;">
                  <label class="setting-label" style="font-weight: var(--font-weight-medium);">Auto-save Conversations</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="autoSaveConversations" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                
                <div class="setting-item" style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;">
                  <label class="setting-label" style="font-weight: var(--font-weight-medium);">Show Token Usage</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="showTokenUsage" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                
                <div class="setting-item" style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;">
                  <label class="setting-label" style="font-weight: var(--font-weight-medium);">Enable Animations</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="enableAnimations" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-actions" style="display: flex; gap: var(--space-sm); margin-top: var(--space-lg);">
                <button class="btn-primary" id="saveSettings">Save Settings</button>
                <button class="btn-secondary" id="resetSettings">Reset to Defaults</button>
                <button class="btn-secondary" id="clearAllData">Clear All Data</button>
              </div>
            </div>
          `;
          
          UI.contentArea.innerHTML = html;
          
          // Load current settings
          loadAdvancedSettings();
          
          // Attach event listeners
          document.getElementById('saveSettings').addEventListener('click', saveAdvancedSettings);
          document.getElementById('resetSettings').addEventListener('click', resetAdvancedSettings);
          document.getElementById('clearAllData').addEventListener('click', clearAllData);
        }

        async function loadAdvancedSettings() {
          const defaultLanguage = await storageManager.getSetting('defaultLanguage', 'es');
          const defaultSummarizationMode = await storageManager.getSetting('defaultSummarizationMode', 'key-points');
          const autoSaveConversations = await storageManager.getSetting('autoSaveConversations', true);
          const showTokenUsage = await storageManager.getSetting('showTokenUsage', true);
          const enableAnimations = await storageManager.getSetting('enableAnimations', true);
          
          document.getElementById('defaultLanguage').value = defaultLanguage;
          document.getElementById('defaultSummarizationMode').value = defaultSummarizationMode;
          document.getElementById('autoSaveConversations').checked = autoSaveConversations;
          document.getElementById('showTokenUsage').checked = showTokenUsage;
          document.getElementById('enableAnimations').checked = enableAnimations;
        }

        async function saveAdvancedSettings() {
          const settings = {
            defaultLanguage: document.getElementById('defaultLanguage').value,
            defaultSummarizationMode: document.getElementById('defaultSummarizationMode').value,
            autoSaveConversations: document.getElementById('autoSaveConversations').checked,
            showTokenUsage: document.getElementById('showTokenUsage').checked,
            enableAnimations: document.getElementById('enableAnimations').checked
          };
          
          for (const [key, value] of Object.entries(settings)) {
            await storageManager.setSetting(key, value);
          }
          
          showToast('Settings saved successfully', 'success');
          
          // Apply settings immediately
          if (settings.enableAnimations) {
            document.body.classList.add('animations-enabled');
          } else {
            document.body.classList.remove('animations-enabled');
          }
        }

        async function resetAdvancedSettings() {
          if (confirm('Are you sure you want to reset all settings to defaults?')) {
            await storageManager.clearSettings();
            loadAdvancedSettings();
            showToast('Settings reset to defaults', 'info');
          }
        }

        async function clearAllData() {
          if (confirm('Are you sure you want to clear all data? This will delete all conversations and settings.')) {
            await storageManager.clearAllData();
            showToast('All data cleared', 'info');
            location.reload();
          }
        }

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish', 
    'zh': 'Chinese',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'it': 'Italian',
    'nl': 'Dutch',
    'vi': 'Vietnamese'
  };
  return languages[code] || code;
}
// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ============================================================================
// IMPORTS AND INITIALIZATION
// ============================================================================

import apiManager from '../utils/api-manager.js';
import storageManager from '../utils/storage.js';

// ============================================================================
// AI RESPONSE FORMATTING
// ============================================================================

/**
 * Format AI response text with proper HTML formatting
 */
function formatAIResponse(text) {
  if (!text) return '';
  
  let formatted = text
    // Remove markdown headers
    .replace(/^#{1,6}\s*/gm, '')
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #3B82F6; font-weight: 600;">$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em style="color: #6B7280;">$1</em>')
    // Convert bullet points
    .replace(/^•\s*/gm, '<span style="color: #3B82F6; margin-right: 8px; font-weight: bold;">•</span>')
    .replace(/^-\s*/gm, '<span style="color: #3B82F6; margin-right: 8px; font-weight: bold;">•</span>')
    // Convert numbered lists
    .replace(/^(\d+)\.\s*/gm, '<span style="color: #3B82F6; margin-right: 8px; font-weight: bold;">$1.</span>')
    // Convert line breaks
    .replace(/\n/g, '<br>')
    // Clean up multiple line breaks
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    // Format common patterns
    .replace(/Common Mistakes?:\s*/gi, '<strong style="color: #DC2626;">Common Mistakes:</strong> ')
    .replace(/Action Steps?:\s*/gi, '<strong style="color: #059669;">Action Steps:</strong> ')
    .replace(/Important:\s*/gi, '<strong style="color: #D97706;">Important:</strong> ')
    .replace(/Security Considerations?:\s*/gi, '<strong style="color: #7C3AED;">Security Considerations:</strong> ');

  // Wrap in paragraphs for better spacing
  const paragraphs = formatted.split('<br><br>');
  return paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    return `<div style="margin-bottom: 12px; line-height: 1.6;">${trimmed}</div>`;
  }).join('');
}

// ============================================================================
// SMART ASSISTANT INTEGRATION
// ============================================================================

async function initializeSmartFeatures() {
  try {
    console.log('🚀 Initializing Form Guide...');
    
    // Add smart features to UI
    addSmartFeaturesToUI();
    
    console.log('✅ Form Guide ready!');
    
  } catch (error) {
    console.error('❌ Smart features initialization failed:', error);
  }
}

function addSmartFeaturesToUI() {
  // The smart assistant button is already in HTML, just add event listener
  const smartAssistantBtn = document.getElementById('smartAssistantBtn');
  if (smartAssistantBtn) {
    smartAssistantBtn.addEventListener('click', () => {
      handleSmartAssistant();
    });
  }
  
  // Add smart features to settings
  const settingsPanel = document.getElementById('settingsPanel');
  if (settingsPanel) {
    const smartSettings = document.createElement('div');
    smartSettings.className = 'settings-section';
    smartSettings.innerHTML = `
      <h3>🤖 Smart Features</h3>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="enableSmartAssistant" checked>
          Enable Form Guide
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="enableFormAnalysis" checked>
          Enable Form Analysis
        </label>
      </div>
    `;
    
    settingsPanel.appendChild(smartSettings);
  }
}

async function handleSmartAssistant() {
  try {
    console.log('🚀 Form Guide triggered');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    console.log('📄 Analyzing tab:', tab.title);

    // Show loading state
    const smartAssistantBtn = document.getElementById('smartAssistantBtn');
    if (smartAssistantBtn) {
      smartAssistantBtn.disabled = true;
      smartAssistantBtn.innerHTML = `
        <div class="action-icon">⏳</div>
        <div class="action-label">Analyzing...</div>
      `;
    }

    // Send message to content script to scan form
    chrome.tabs.sendMessage(tab.id, { action: 'scanForm' }, (response) => {
      console.log('📥 Form Guide response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('❌ Content script error:', chrome.runtime.lastError);
        showError('Could not start form guide. Please refresh and try again.');
      } else if (response && response.success) {
        if (response.noForms) {
          showToast(`Form Guide: ${response.siteType} site detected. Check the page for guidance.`, 'info');
        } else {
          showToast('Form Guide started! Check the page for form analysis.', 'success');
        }
      } else {
        showError('Form guide failed to start. Please try again.');
      }

      // Reset button state
      if (smartAssistantBtn) {
        smartAssistantBtn.disabled = false;
        smartAssistantBtn.innerHTML = `
          <div class="action-icon">🤖</div>
          <div class="action-label">Form Guide</div>
        `;
      }
    });
    
  } catch (error) {
    console.error('❌ Form Guide error:', error);
    showError('Form Guide failed to start', error.message);
    
    // Reset button state
    const smartAssistantBtn = document.getElementById('smartAssistantBtn');
    if (smartAssistantBtn) {
      smartAssistantBtn.disabled = false;
      smartAssistantBtn.innerHTML = `
        <div class="action-icon">🤖</div>
        <div class="action-label">Form Guide</div>
      `;
    }
  }
}

// Initialize smart features after main initialization
setTimeout(() => {
  initializeSmartFeatures();
}, 2000);

console.log('✅ DocuGuide sidebar ready');
