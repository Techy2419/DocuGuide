# 📄 DocuGuide

**Your Private Form Assistant for Government Documents**

DocuGuide is a Chrome Extension that helps immigrants, seniors, and non-native speakers understand and complete complex government forms and civic documents. Using Chrome's built-in AI APIs (Gemini Nano), all processing happens locally on your device - ensuring complete privacy for sensitive personal information.

🔒 **Privacy First:** No data ever leaves your device  
🌍 **Multilingual:** Translate to 10+ languages  
💬 **AI-Powered:** Ask questions about confusing forms  
✍️ **Writing Help:** Check grammar and improve your text  

---

## ✨ Features

### 1. 📝 Smart Summarization
Break down complex legal/governmental text into plain language:
- Extract key points from dense paragraphs
- Get bullet-point summaries
- Understand requirements quickly

### 2. 🌍 Real-Time Translation
Translate form instructions into your preferred language:
- Auto-detect source language
- Support for Spanish, Chinese, Vietnamese, Arabic, Tagalog, and more
- Side-by-side comparison view

### 3. 💬 AI Q&A Assistant
Ask questions about form fields and requirements:
- Get contextual answers based on the form content
- Natural language questions
- Clear explanations without legal jargon

### 4. ✍️ Writing Assistant
Improve your form responses:
- Check grammar and spelling
- Make text more formal for official documents
- Simplify or expand your writing

---

## 🚀 Installation

### Prerequisites

**CRITICAL: Chrome Built-in AI Requirements**

1. **Chrome Version:** 138 Stable or higher (Currently supports Chrome 143)
   - Check your version: `chrome://version`
   
2. **Hardware Requirements:**
   - **RAM:** Minimum 8GB (16GB recommended)
   - **Storage:** 10-20GB free space for AI models
   - **GPU:** Integrated GPU with 4GB+ VRAM (or discrete GPU)
   - **OS:** Windows 10+, macOS 13+, or **native Linux** (NOT WSL2)

3. **⚠️ WSL2 Users: IMPORTANT**
   - WSL2 (Windows Subsystem for Linux) is **NOT fully supported** for Chrome Built-in AI
   - The virtualized environment may not properly expose GPU/VRAM to Chrome
   - **Recommendation:** Test on native Windows, macOS, or dual-boot Linux

### Environment Check

Before installing DocuGuide, verify your environment supports Chrome Built-in AI:

1. Open Chrome and navigate to: `chrome://on-device-internals`

2. Check the status:
   - **Summarizer API:** Should show "Ready" or "Available"
   - **Translator API:** Should show language models available
   - **Language Model API:** Should show "Ready" or "Available"

3. If you see "Download Required":
   - Click to download the required models
   - This is a one-time download (several GB)
   - Models are shared across all extensions using Built-in AI

4. If you see "Not Supported":
   - Your device may not meet hardware requirements
   - Try updating to the latest Chrome version
   - Check GPU/VRAM availability in your system settings

### API Availability Test

Open Chrome DevTools Console on any webpage and run:

```javascript
console.log('Summarizer:', 'Summarizer' in self);
console.log('Translator:', 'Translator' in self);
console.log('LanguageDetector:', 'LanguageDetector' in self);
console.log('LanguageModel:', 'LanguageModel' in self);
```

All should return `true`. If they return `false`, the APIs are not available in your environment.

### Install DocuGuide

1. **Download or Clone this Repository**
   ```bash
   git clone https://github.com/yourusername/docuguide.git
   cd docuguide
   ```

2. **Add Icons** (Required)
   - Place icon files in the `icons/` directory
   - Required sizes: 16x16, 48x48, 128x128 pixels
   - See `icons/README.md` for design guidelines

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `DocuGuide` directory
   - The extension should now appear in your toolbar

4. **Test the Extension**
   - Click the DocuGuide icon in your toolbar
   - Click "Open DocuGuide Sidebar"
   - Look for the status badge showing "✓ Ready"
   - If it shows "⚠ Limited" or "✗ Error", click "Test API Availability" in settings

---

## 📖 Usage Guide

### Quick Start

1. **Select Text:** Highlight any text on a webpage (government form, document, etc.)

2. **Choose Action:**
   - **Right-click** → Select "Summarize/Translate/Ask with DocuGuide"
   - **Or** open the sidebar and click an action button

3. **View Results:** Results appear in the sidebar with smooth animations

### Feature Walkthroughs

#### 📝 Summarize Complex Text

1. Highlight a confusing paragraph or section
2. Click "Summarize" in the sidebar (or right-click → Summarize)
3. View the key points in plain language
4. Use "Copy" to save the summary
5. Use "Read Aloud" to hear it spoken

#### 🌍 Translate Documents

1. Set your preferred language in Settings
2. Select text to translate
3. Click "Translate"
4. View original and translation side-by-side
5. Language is auto-detected

#### 💬 Ask Questions

1. Select the form section you're confused about
2. Click "Ask AI"
3. Type your question (e.g., "What documents do I need?")
4. Press Ctrl+Enter or click Submit
5. Get a contextual answer based on the selected text

#### ✍️ Check Your Writing

1. Click "Check Text" in the sidebar
2. Paste or type your draft response
3. Get suggestions for grammar, spelling, and clarity
4. Choose to make it more formal, simplified, or expanded

---

## 🔒 Privacy & Security

### What Makes DocuGuide Private?

- ✅ **All AI processing happens locally** using Chrome's Gemini Nano
- ✅ **No external API calls** - no data sent to servers
- ✅ **No user tracking or analytics**
- ✅ **No cloud storage** - nothing uploaded
- ✅ **Minimal data storage** - only language preference and theme

### What We Store (Chrome Local Storage Only)

```javascript
{
  "preferredLanguage": "es",  // Your translation language choice
  "theme": "light",            // UI theme preference
  "firstRun": false            // Whether you've opened the extension before
}
```

**That's it.** No form content, no queries, no translations are ever stored.

### Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` | Access selected text on the current page |
| `storage` | Save your language and theme preferences |
| `contextMenus` | Add right-click menu options |
| `sidePanel` | Display the sidebar interface |
| `<all_urls>` | Work on any website (government sites vary) |

### Clear Your Data Anytime

Open the sidebar → Settings → "🗑️ Clear All Data"

This removes all stored preferences and resets the extension.

---

## 🛠️ Technical Architecture

### APIs Used

- **Summarizer API** (Chrome 138+): Extract key points from text
- **Translator API** (Chrome 138+): Translate between languages
- **Language Detector API** (Chrome 138+): Auto-detect source language
- **Prompt API** (Chrome 138+): Power Q&A and writing assistance

All APIs use Chrome's built-in **Gemini Nano** model for on-device inference.

### File Structure

```
DocuGuide/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   └── content-script.js      # Page interaction handler
├── sidebar/
│   ├── sidebar.html           # Main UI
│   ├── sidebar.js             # UI logic and interactions
│   └── sidebar.css            # Styling (inline with Tailwind)
├── popup/
│   ├── popup.html             # Extension popup
│   └── popup.js               # Popup logic
├── utils/
│   ├── api-manager.js         # AI API wrapper and session management
│   └── storage.js             # Chrome storage abstraction
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Design Decisions

1. **No External Dependencies:** Uses CDN-hosted Tailwind CSS for styling
2. **ES6 Modules:** Modern JavaScript with import/export
3. **Session Management:** AI sessions reused during activity, cleaned up after 5min idle
4. **Text Chunking:** Long documents split into chunks for processing
5. **Graceful Degradation:** Clear error messages when APIs unavailable

---

## 🐛 Troubleshooting

### "APIs Not Available" Error

**Problem:** Status shows "✗ Error" or features don't work

**Solutions:**

1. **Check Chrome Version:**
   - Go to `chrome://version`
   - Must be Chrome 138+ (Stable)
   - Update if needed: `chrome://settings/help`

2. **Check API Status:**
   - Navigate to `chrome://on-device-internals`
   - All required APIs should show "Ready" or "Available"
   - If "Download Required", click to download models

3. **Check Hardware:**
   - Need 8GB+ RAM
   - Need 4GB+ VRAM (GPU memory)
   - Need 10-20GB free storage
   - Check in Task Manager (Windows) or Activity Monitor (Mac)

4. **WSL2 Users:**
   - Chrome Built-in AI may not work in WSL2
   - Test on native Windows/Mac/Linux instead

5. **Restart Chrome:**
   - Close all Chrome windows
   - Reopen and test again

### "Model Download Required" Message

**Problem:** Feature shows "⬇️ Model needs to be downloaded"

**Solution:**
1. Click the link to `chrome://on-device-internals`
2. Find the relevant model (Summarizer/Translator/Language Model)
3. Click "Download" if available
4. Wait for download to complete (may take several minutes)
5. Refresh the DocuGuide sidebar

### Selected Text Not Detected

**Problem:** "Please select text first" message

**Solution:**
1. Make sure you've highlighted text on the page
2. Try clicking the sidebar button instead of right-click menu
3. Check that the content script loaded (check console for "✅ DocuGuide content script loaded")
4. Refresh the page and try again

### Translation Language Not Supported

**Problem:** "Translation not available for this language pair"

**Solution:**
1. Check available languages at `chrome://on-device-internals`
2. Not all language pairs are supported
3. Try a different target language
4. Some language models may need to be downloaded first

### Performance Issues

**Problem:** Extension is slow or unresponsive

**Solution:**
1. Close unused Chrome tabs to free memory
2. For very long documents, select smaller sections
3. Check RAM usage - need sufficient free memory
4. Clear Chrome cache: `chrome://settings/clearBrowserData`

---

## 🎯 Use Cases

### For Immigrants
- Understand visa application requirements
- Translate immigration forms to native language
- Get help writing personal statements
- Clarify confusing legal terminology

### For Seniors
- Simplify Medicare and Social Security forms
- Understand tax form instructions
- Get step-by-step guidance on requirements
- Check that responses are clear and complete

### For Students
- Understand FAFSA and financial aid forms
- Translate scholarship applications
- Improve application essays
- Verify all required fields are complete

### For Anyone
- Understand legal notices and documents
- Translate official correspondence
- Get help with complex government websites
- Ensure form responses are professional

---

## 🏗️ Development

### Local Development

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the DocuGuide card
4. Test your changes

### Debugging

- **Service Worker:** `chrome://extensions/` → DocuGuide → "Inspect views: service worker"
- **Sidebar:** Right-click in sidebar → "Inspect"
- **Content Script:** Open page DevTools → Console (look for DocuGuide logs)
- **API Internals:** `chrome://on-device-internals`

### Testing Checklist

- [ ] All 4 main features work (Summarize, Translate, Ask, Check)
- [ ] Settings save and persist
- [ ] API availability check shows correct status
- [ ] Error messages are helpful and clear
- [ ] Privacy indicators are visible
- [ ] Works on different websites
- [ ] Right-click context menu works
- [ ] Popup opens sidebar correctly

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

### Areas for Improvement

1. **UI/UX:**
   - Add dark mode styling (currently only theme toggle)
   - Improve animations and transitions
   - Add more language flag icons
   - Create custom icons instead of emoji

2. **Features:**
   - Form field auto-fill suggestions
   - Save frequently used translations
   - Export summary/translation as PDF
   - Voice input for questions
   - Multi-document comparison

3. **Performance:**
   - Optimize session management
   - Implement better caching
   - Add progressive loading for large documents
   - Background processing for translations

4. **Accessibility:**
   - Add WCAG 2.1 AA compliance
   - Improve keyboard navigation
   - Add screen reader support
   - High contrast mode

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with clear description

---

## 📜 License

MIT License - feel free to use and modify for your own projects!

---

## 🙏 Acknowledgments

- Built for the Chrome Built-in AI Challenge
- Inspired by the needs of immigrant communities, seniors, and digital literacy advocates
- Thanks to the Chrome team for making privacy-first AI accessible

---

## 📞 Support

### Having Issues?

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify your environment meets [Prerequisites](#prerequisites)
3. Test API availability at `chrome://on-device-internals`
4. Open an issue on GitHub with:
   - Chrome version
   - OS and hardware specs
   - Error messages from console
   - Steps to reproduce

### Resources

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Extension Development Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Gemini Nano Overview](https://developers.googleblog.com/en/introducing-gemini-nano/)

---

## 🎉 Final Notes

DocuGuide was built to make government forms and civic documents accessible to everyone, regardless of language, age, or technical skills. By processing everything locally, we ensure that your sensitive personal information remains private and secure.

**Your data never leaves your device. Your privacy is paramount.**

If DocuGuide helps you or someone you know navigate complex paperwork, we've succeeded in our mission.

---

**Made with ❤️ for immigrants, seniors, and anyone who's ever been confused by a government form.**
