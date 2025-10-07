# 🚨 Quick Fix Guide for DocuGuide Extension

## ❌ Issue: "Uncaught SyntaxError: Illegal return statement"

**FIXED!** ✅ The syntax error has been resolved in `content/content-script.js`.

## 🔧 Steps to Fix Your Extension:

### 1. Reload the Extension
1. Go to `chrome://extensions/`
2. Find "DocuGuide" in the list
3. Click the **🔄 Reload** button
4. The extension should now work without syntax errors

### 2. Test the Extension
1. Open the test page: `test-extension.html` (included in the project)
2. Select some text on the page
3. Click the DocuGuide extension icon in the toolbar
4. The AI buttons should now be enabled when text is selected

### 3. If Buttons Still Don't Work:

#### Check Browser Console:
1. Press `F12` to open Developer Tools
2. Go to the **Console** tab
3. Look for any error messages
4. If you see errors, reload the extension again

#### Debug Steps:
1. Copy the contents of `debug-extension.js` (included in project)
2. Paste it into the browser console
3. Run it to check extension status
4. Look for any ❌ errors in the output

### 4. Common Issues & Solutions:

#### Issue: "AI buttons are disabled"
- **Solution**: Select text on the page first, then the buttons will enable

#### Issue: "Settings button not working"
- **Solution**: Make sure the extension is properly loaded (check chrome://extensions/)

#### Issue: "Learn How button not working"
- **Solution**: Reload the extension and try again

### 5. Verify Extension is Working:
1. ✅ No syntax errors in console
2. ✅ Content script loads (check console for "✅ DocuGuide content script loaded")
3. ✅ Text selection enables AI buttons
4. ✅ Right-click context menu shows DocuGuide options
5. ✅ Sidebar opens when clicking extension icon

## 🆘 Still Having Issues?

If the extension still doesn't work after reloading:

1. **Check Chrome Version**: Make sure you have Chrome 138 or later
2. **Check AI Availability**: Go to `chrome://on-device-internals` to see if AI models are available
3. **Restart Chrome**: Sometimes a full browser restart is needed
4. **Reinstall Extension**: Remove and re-add the extension

## 📞 Debug Information to Provide:

If you need help, please provide:
1. Chrome version (`chrome://version/`)
2. Console error messages (F12 -> Console)
3. Output from the debug script
4. Whether AI models show as available in `chrome://on-device-internals`

---

**🎉 The syntax error has been fixed! Just reload the extension and it should work perfectly.**
