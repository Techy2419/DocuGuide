# 🛠️ DocuGuide - Development Guide

## Environment Setup for Chrome Built-in AI

### Critical Environment Issues (From Your Experience)

#### The WSL2 Problem
You've discovered a critical issue: **Chrome Built-in AI APIs may not work properly in WSL2** (Windows Subsystem for Linux).

**Why WSL2 Doesn't Work Well:**
1. WSL2 is a virtualized Linux environment
2. GPU/VRAM requirements (4GB+) may not be properly exposed to Chrome
3. Hardware detection fails in virtualized environments
4. The AI models require direct hardware access

**Recommended Development Environments:**
- ✅ **Native Windows 10/11** (Best compatibility)
- ✅ **macOS 13+** (Ventura or later)
- ✅ **Native Linux** (Dual-boot, not VM)
- ❌ **WSL2** (May not work reliably)
- ❌ **Virtual Machines** (Usually won't work)

### API Entry Points (Updated April 2025)

**IMPORTANT:** The APIs have changed from the old documentation!

❌ **OLD (Deprecated):**
```javascript
if ('ai' in self) {
  const summarizer = await self.ai.summarizer.create();
}
```

✅ **NEW (Current - Chrome 138+):**
```javascript
if ('Summarizer' in self) {
  const summarizer = await self.Summarizer.create();
}
```

**All Available APIs:**
```javascript
// Check availability
console.log('Summarizer:', 'Summarizer' in self);
console.log('Translator:', 'Translator' in self);
console.log('LanguageDetector:', 'LanguageDetector' in self);
console.log('LanguageModel:', 'LanguageModel' in self);
```

### Setting Up Your Dev Environment

#### 1. Hardware Requirements Check

```bash
# Check your system specs

# Windows (PowerShell):
Get-ComputerInfo | Select-Object CsName, OsName, WindowsVersion, OsTotalVisibleMemorySize
Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM

# macOS:
system_profiler SPHardwareDataType
system_profiler SPDisplaysDataType

# Linux:
free -h
lspci | grep -i vga
```

**Minimum Requirements:**
- RAM: 8GB (16GB recommended)
- VRAM: 4GB GPU memory
- Storage: 10-20GB free
- CPU: Recent multi-core processor

#### 2. Chrome Setup

1. **Install Chrome 138+ Stable**
   - Download from: https://www.google.com/chrome/
   - Check version: `chrome://version`
   - Must be 138 or higher (currently 143 works)

2. **No Origin Trial Tokens Needed for Extensions!**
   - Extensions get built-in AI access automatically
   - No need to register for origin trials
   - Just need the right Chrome version

3. **Enable Developer Mode**
   - Go to `chrome://extensions/`
   - Toggle "Developer mode" in top-right
   - Keep this enabled for development

#### 3. Check API Availability

**Method 1: Chrome Internals**
```
Navigate to: chrome://on-device-internals
```
You should see:
- Summarizer API: Ready/Available
- Translator API: Language models listed
- Language Model API: Ready/Available

If you see "Download Required", click to download (one-time, several GB).

**Method 2: Console Test**

Open DevTools Console on any webpage:
```javascript
// Test API availability
async function testAPIs() {
  console.log('=== Chrome Built-in AI Test ===');
  
  // 1. Check if APIs exist
  console.log('Summarizer exists:', 'Summarizer' in self);
  console.log('Translator exists:', 'Translator' in self);
  console.log('LanguageDetector exists:', 'LanguageDetector' in self);
  console.log('LanguageModel exists:', 'LanguageModel' in self);
  
  // 2. Check capabilities
  if ('Summarizer' in self) {
    const caps = await self.Summarizer.capabilities();
    console.log('Summarizer capabilities:', caps);
  }
  
  if ('Translator' in self) {
    const caps = await self.Translator.capabilities();
    console.log('Translator capabilities:', caps);
  }
  
  if ('LanguageModel' in self) {
    const caps = await self.LanguageModel.capabilities();
    console.log('LanguageModel capabilities:', caps);
  }
}

testAPIs();
```

**Expected Output:**
```
=== Chrome Built-in AI Test ===
Summarizer exists: true
Translator exists: true
LanguageDetector exists: true
LanguageModel exists: true
Summarizer capabilities: { available: "readily", defaultType: "key-points", ... }
```

**If you see `false` values:**
- You're in an unsupported environment (WSL2, old Chrome, etc.)
- Hardware requirements not met
- Need to download models

### Development Workflow

#### 1. Load Extension

```bash
# 1. Clone/download the repo
cd DocuGuide

# 2. Add placeholder icons (required)
# Create 3 icon files in icons/ directory:
# - icon16.png (16x16px)
# - icon48.png (48x48px)
# - icon128.png (128x128px)
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Click "Load unpacked"
3. Select the `DocuGuide` directory
4. Extension loads and runs initial API check

#### 2. Test Each Component

**Service Worker (Background Script):**
```
1. Go to chrome://extensions/
2. Find DocuGuide card
3. Click "Inspect views: service worker"
4. Check console for "🚀 DocuGuide installed/updated"
5. Check for "📊 API Availability: { ... }"
```

**Content Script:**
```
1. Open any webpage
2. Open DevTools (F12)
3. Check console for "✅ DocuGuide content script loaded"
4. Select text on page
5. Should see selection being captured
```

**Sidebar:**
```
1. Click extension icon → "Open DocuGuide Sidebar"
2. Right-click in sidebar → "Inspect"
3. Check console for "🚀 DocuGuide sidebar loaded"
4. Check status badge (should be "✓ Ready" if APIs available)
```

#### 3. Debug Common Issues

**Issue: "APIs Not Available"**
```javascript
// Add detailed logging to api-manager.js
async checkEnvironment() {
  console.log('🔍 Checking self:', Object.keys(self).filter(k => k.includes('AI') || k.includes('Language') || k.includes('Summ')));
  
  // Check with try-catch
  try {
    if ('Summarizer' in self) {
      const caps = await self.Summarizer.capabilities();
      console.log('✅ Summarizer caps:', caps);
    } else {
      console.error('❌ Summarizer not in self');
    }
  } catch (e) {
    console.error('❌ Summarizer error:', e);
  }
}
```

**Issue: "Content Script Not Loading"**
```javascript
// Check manifest.json matches patterns
"content_scripts": [
  {
    "matches": ["<all_urls>"],  // Should match your test page
    "js": ["content/content-script.js"],
    "run_at": "document_idle"  // Try "document_end" if issues
  }
]
```

**Issue: "Side Panel Not Opening"**
```javascript
// In popup.js, add error handling
try {
  await chrome.sidePanel.open({ tabId: tab.id });
} catch (error) {
  console.error('Failed to open side panel:', error);
  // Fallback: open in new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
}
```

### Testing Features End-to-End

#### Test 1: Summarization

1. Go to any webpage with text (e.g., Wikipedia article)
2. Select a long paragraph (200+ words)
3. Open sidebar → Click "Summarize"
4. Should see:
   - Loading spinner
   - Result appears with key points
   - Copy and Read Aloud buttons work

**Debug if fails:**
```javascript
// In sidebar.js
async function processSummarize() {
  console.log('📝 Starting summarization...');
  console.log('Selected text length:', selectedText.length);
  
  try {
    const result = await apiManager.summarize(selectedText);
    console.log('✅ Summary result:', result);
  } catch (error) {
    console.error('❌ Summarization error:', error);
    console.error('Error stack:', error.stack);
  }
}
```

#### Test 2: Translation

1. Select English text
2. Set preferred language to Spanish (Settings)
3. Click "Translate"
4. Should see:
   - Auto-detection of English
   - Translation to Spanish
   - Side-by-side comparison

**Debug if fails:**
```javascript
// Check available language pairs
if ('Translator' in self) {
  const caps = await self.Translator.capabilities();
  console.log('Available language pairs:', caps.languagePairAvailable);
  
  // Test specific pair
  const canTranslate = await caps.languagePairAvailable('en', 'es');
  console.log('Can translate EN->ES:', canTranslate);
}
```

#### Test 3: Q&A

1. Select form text
2. Click "Ask AI"
3. Type: "What does this mean?"
4. Submit
5. Should get contextual answer

**Debug if fails:**
```javascript
// Check LanguageModel session
async function debugQA() {
  if (!('LanguageModel' in self)) {
    console.error('❌ LanguageModel not available');
    return;
  }
  
  const caps = await self.LanguageModel.capabilities();
  console.log('LanguageModel caps:', caps);
  
  if (caps.available !== 'readily') {
    console.warn('⚠️ Model not ready:', caps.available);
  }
  
  const session = await self.LanguageModel.create({
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.3,
    topK: 40
  });
  
  const response = await session.prompt('Hello, can you help me?');
  console.log('Test response:', response);
}
```

### Performance Optimization Tips

#### 1. Session Reuse
```javascript
// Good: Reuse session
let session = await LanguageModel.create();
const r1 = await session.prompt('Question 1');
const r2 = await session.prompt('Question 2');  // Reuses context

// Bad: Create new session each time
const r1 = await (await LanguageModel.create()).prompt('Q1');
const r2 = await (await LanguageModel.create()).prompt('Q2');  // Wastes resources
```

#### 2. Monitor Token Usage
```javascript
console.log(`Tokens: ${session.tokensSoFar}/${session.maxTokens}`);

if (session.tokensSoFar > session.maxTokens * 0.8) {
  // Clone before hitting limit
  session = await session.clone();
}
```

#### 3. Chunk Long Text
```javascript
// Don't send 10,000 words at once
// Chunk into manageable pieces
function chunkText(text, maxSize = 4000) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  // ... chunk logic
}
```

### Manifest V3 Best Practices

#### Service Worker Lifecycle
```javascript
// Service workers can sleep/wake
// Don't rely on global state persisting

// Bad:
let myData = [];  // Will be lost when worker sleeps

// Good:
async function getData() {
  const result = await chrome.storage.local.get('myData');
  return result.myData || [];
}
```

#### Message Passing
```javascript
// Always return true to keep channel open for async
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleAsync(msg, sendResponse);
  return true;  // CRITICAL for async responses
});

async function handleAsync(msg, sendResponse) {
  const result = await doSomething();
  sendResponse({ success: true, result });
}
```

### Publishing Checklist

Before submitting to Chrome Web Store:

- [ ] All placeholder icons replaced with professional designs
- [ ] Tested on multiple websites (gov sites, docs, forms)
- [ ] Tested all 4 main features work correctly
- [ ] Error messages are user-friendly
- [ ] Privacy policy clearly stated
- [ ] README includes clear usage instructions
- [ ] No console errors or warnings
- [ ] Manifest description is compelling
- [ ] Screenshots prepared showing key features
- [ ] Tested on Chrome 138+ Stable
- [ ] Verified on native OS (not WSL2)

### Useful Resources

**Chrome Built-in AI:**
- API Docs: https://developer.chrome.com/docs/ai/built-in
- Origin Trials: https://developer.chrome.com/origintrials/
- Samples: https://github.com/GoogleChromeLabs/chrome-extensions-samples

**Extension Development:**
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- Service Workers: https://developer.chrome.com/docs/extensions/mv3/service_workers/
- Side Panel: https://developer.chrome.com/docs/extensions/reference/sidePanel/

**Debugging:**
- chrome://extensions/ (extension management)
- chrome://on-device-internals (AI status)
- chrome://serviceworker-internals/ (service worker debug)

---

## Quick Reference: Testing on Your Machine

Since you're on WSL2, here's your reality check:

### Option 1: Test on Native Windows (Recommended)
1. Open Chrome on your Windows host (not WSL2)
2. Load extension from Windows file path
3. Test there - should work properly

### Option 2: Dual-Boot or VM
1. Set up native Linux install (dual-boot)
2. Test on real hardware
3. WSL2 won't cut it for this project

### Option 3: Borrow Hardware
1. Find Windows/Mac machine to test on
2. Deploy extension there
3. Document that WSL2 isn't supported

### To Check if WSL2 is Your Problem:

Run this in Chrome console (on WSL2):
```javascript
'Summarizer' in self  // If false, WSL2 is blocking you
```

Then run same test on Windows host Chrome:
```javascript
'Summarizer' in self  // Should be true on real OS
```

If true on Windows but false on WSL2, that confirms the virtualization issue.

---

**Good luck with your hackathon! 🚀**
