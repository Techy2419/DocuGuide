# 🚀 DocuGuide - Quick Start Guide

Get up and running in 5 minutes!

## ⚡ TL;DR

1. Have Chrome 138+ on **native** Windows/Mac/Linux (not WSL2)
2. Check `chrome://on-device-internals` - models should be available
3. Add 3 icon files to `icons/` folder (16px, 48px, 128px)
4. Load unpacked extension from `chrome://extensions/`
5. Test it!

---

## 📋 Prerequisites Checklist

Before you start, verify:

- [ ] Chrome version **138 or higher** (`chrome://version`)
- [ ] **Native OS** (Windows 10+, macOS 13+, or dual-boot Linux)
- [ ] **NOT using WSL2** (it won't work reliably)
- [ ] At least **8GB RAM** available
- [ ] At least **10GB free disk space**
- [ ] GPU with **4GB+ VRAM** (integrated or discrete)

---

## 🎯 5-Minute Setup

### Step 1: Verify Your Environment (2 min)

**Test if Chrome Built-in AI works on your machine:**

1. Open Chrome
2. Press `F12` to open DevTools Console
3. Paste this code:

```javascript
console.log('Summarizer:', 'Summarizer' in self);
console.log('Translator:', 'Translator' in self);
console.log('LanguageModel:', 'LanguageModel' in self);
```

4. Press Enter

**Expected Result:**
```
Summarizer: true
Translator: true
LanguageModel: true
```

**If you see `false` values:**
- ❌ You're on WSL2 or unsupported environment → Switch to native OS
- ❌ Chrome is too old → Update Chrome
- ❌ Models not downloaded → Continue to Step 2

### Step 2: Download AI Models (1 min)

1. Navigate to: `chrome://on-device-internals`
2. Check status of:
   - **Summarizer API**
   - **Translator API**
   - **Language Model API**
3. If any say "Download Required", click to download
4. Wait for downloads to complete (may take a few minutes)
5. Refresh the page - should now say "Ready" or "Available"

### Step 3: Prepare Extension (1 min)

**Create Icon Files:**

You need 3 icon files in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

**Quick Options:**
- **Use an emoji screenshot:** Go to https://emojipedia.org/page-facing-up/, screenshot 📄, resize
- **Use a placeholder generator:** https://via.placeholder.com/16/2563EB/FFFFFF?text=DG
- **Design your own:** Use Canva, Figma, or any image editor

**Quick Command (if you have ImageMagick):**
```bash
# Create simple placeholder icons
convert -size 16x16 xc:#2563EB -fill white -gravity center -pointsize 10 -annotate +0+0 "DG" DocuGuide/icons/icon16.png
convert -size 48x48 xc:#2563EB -fill white -gravity center -pointsize 30 -annotate +0+0 "DG" DocuGuide/icons/icon48.png
convert -size 128x128 xc:#2563EB -fill white -gravity center -pointsize 80 -annotate +0+0 "DG" DocuGuide/icons/icon128.png
```

### Step 4: Load Extension (1 min)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** (top-right corner) to ON
4. Click **"Load unpacked"**
5. Navigate to and select the `DocuGuide` folder
6. Click "Select Folder"

**Success!** You should see the DocuGuide card with:
- Icon displayed
- "DocuGuide" title
- Version 1.0.0
- No errors

### Step 5: Test It! (1 min)

**Quick Test:**

1. Go to any webpage with text (try Wikipedia)
2. Select a paragraph of text
3. Click the DocuGuide icon in toolbar
4. Click "Open DocuGuide Sidebar"
5. Look for status badge:
   - **✓ Ready** → Everything works!
   - **⚠ Limited** → Some features may not work
   - **✗ Error** → See troubleshooting below

6. Click "Summarize" button
7. Should see a summary of your selected text

**If it works:** 🎉 You're done! Start using DocuGuide!

**If it doesn't work:** 👇 Continue to troubleshooting

---

## 🔧 Troubleshooting

### Problem: Status Shows "✗ Error"

**Solution:**
1. Click "Test API Availability" in Settings
2. Check which APIs are unavailable
3. Go to `chrome://on-device-internals` and verify models are "Ready"
4. Restart Chrome completely
5. Reload extension from `chrome://extensions/`

### Problem: "Summarizer API not available"

**Solutions:**
- Check Chrome version is 138+ (`chrome://version`)
- Download models from `chrome://on-device-internals`
- Verify you're not on WSL2 (run `echo $WSL_DISTRO_NAME` in terminal - if it outputs anything, you're on WSL2)
- Check hardware: Need 8GB+ RAM, 4GB+ VRAM

### Problem: Extension Icon Not Showing

**Solution:**
- Make sure you created all 3 icon files (16px, 48px, 128px)
- Files must be named exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Files must be in the `icons/` folder inside `DocuGuide/`
- Reload extension from `chrome://extensions/`

### Problem: "Please select text first"

**Solution:**
- Highlight/select text on the webpage before clicking buttons
- Make sure you're on a regular webpage (not `chrome://` pages)
- Try refreshing the page and selecting text again

### Problem: On WSL2 - APIs Not Available

**Reality Check:**
WSL2 is a virtualized environment and Chrome Built-in AI needs direct hardware access.

**Your Options:**
1. **Switch to Windows host** - Load Chrome on Windows (not WSL2 terminal)
2. **Dual-boot Linux** - Install native Linux alongside Windows
3. **Borrow hardware** - Test on a Mac/Windows machine
4. **Accept limitations** - Document that it requires native OS

---

## 🧪 Run the API Test Page

Open the test page to verify everything works:

```bash
# Option 1: Open directly in Chrome
# Drag DocuGuide/test-api.html into Chrome window

# Option 2: Use file:// URL
# Open Chrome, press Ctrl+O, navigate to test-api.html
```

The test page will:
- Show your Chrome version and platform
- Test all 4 Chrome Built-in AI APIs
- Run sample summarization, translation, and Q&A
- Show detailed diagnostic output

**Look for:**
- ✅ Green checkmarks next to all APIs
- "readily" status for all capabilities
- Working test buttons that produce results

---

## 📚 Next Steps

Once everything is working:

1. **Read the full README:** `README.md` has detailed feature docs
2. **Check Development Guide:** `DEVELOPMENT.md` for advanced tips
3. **Try all features:**
   - Summarize complex documents
   - Translate to different languages
   - Ask questions about forms
   - Check your writing

4. **Customize settings:**
   - Set preferred translation language
   - Change theme
   - Test API availability

5. **Test on real forms:**
   - Try government websites
   - Test on PDF forms (if browser can display)
   - Try tax forms, immigration docs, etc.

---

## 🎯 Common Use Cases

### Test Case 1: Summarize a Government Form

1. Go to: https://www.ssa.gov/forms/
2. Open any form PDF
3. Select a section with dense text
4. Click "Summarize" in DocuGuide
5. Get plain-language summary

### Test Case 2: Translate Instructions

1. Go to any English webpage
2. Select a paragraph
3. Set language to Spanish in Settings
4. Click "Translate"
5. See side-by-side comparison

### Test Case 3: Ask About Requirements

1. Find a form with confusing fields
2. Select the field label/description
3. Click "Ask AI"
4. Type: "What documents do I need for this?"
5. Get helpful explanation

---

## ⚠️ Important Notes

### WSL2 Users

If you're developing on WSL2:
- Chrome in WSL2 terminal **won't work** for Built-in AI
- You must test on **Windows host Chrome**
- Access Windows filesystem from WSL2: `/mnt/c/Users/YourName/`
- Load extension from Windows path, not WSL2 path

### Privacy Reminder

DocuGuide only stores:
- Your language preference
- Your theme choice
- Whether you've opened it before

**Nothing else.** No form data, no queries, no translations.

You can verify this:
1. Open DevTools in sidebar (right-click → Inspect)
2. Go to Application tab → Storage → Local Storage
3. See exactly what's stored

---

## 🆘 Still Having Issues?

1. **Check Requirements:**
   - Chrome 138+? ✓
   - Native OS (not WSL2)? ✓
   - 8GB+ RAM? ✓
   - Models downloaded? ✓

2. **Run Diagnostics:**
   - Open `test-api.html` in Chrome
   - Check all status indicators
   - Read console output for errors

3. **Check Resources:**
   - `chrome://on-device-internals` - Model status
   - `chrome://extensions/` - Extension errors
   - DevTools Console - JavaScript errors

4. **Get Help:**
   - Read full `README.md`
   - Check `DEVELOPMENT.md` for debugging tips
   - Open GitHub issue with diagnostics

---

## ✅ You're Ready!

If you made it here and everything works, congratulations! 🎉

DocuGuide is now ready to help you understand complex forms and documents with complete privacy.

**Key Features to Try:**
- 📝 Summarize legal text into plain language
- 🌍 Translate instructions to your language
- 💬 Ask questions about confusing fields
- ✍️ Check grammar and improve your writing

**Remember:** All processing happens on your device. Your sensitive information never leaves your computer.

Happy form-filling! 📄✨
