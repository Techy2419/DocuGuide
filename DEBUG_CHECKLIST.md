# Form Guide Debug Checklist

## 🔍 When Form Guide Fails, Check These Items:

### 1. **Is wizardInstance defined globally?**
**Check:** `console.log(window.wizardInstance)` in browser console
**Should show:** SmartFormWizard object, not undefined

**If undefined:**
- Check if SmartFormWizard constructor is being called
- Verify `window.wizardInstance = this;` is in constructor
- Ensure content script loaded properly

### 2. **Is JSON extraction working?**
**Check:** Log the raw AI response before parsing
**Look for:** Markdown code blocks (```)
**Verify:** firstBrace and lastBrace indices are correct

**Debug code to add:**
```javascript
console.log('Raw AI Response:', result);
console.log('First brace at:', firstBrace);
console.log('Last brace at:', lastBrace);
console.log('Extracted JSON:', jsonString);
```

### 3. **Is the AI prompt clear?**
**Check:** System prompt must say "no markdown" explicitly
**Check:** User prompt must end with "Return JSON only"
**Check:** Temperature should be 0.1 for consistent output

**Current prompts:**
- System: "Return ONLY valid JSON - no markdown, no code blocks, no explanations"
- User: "Return JSON only. No markdown. No explanations. Just the JSON object starting with {"
- Temperature: 0.1

### 4. **Are fields detected?**
**Check:** `formData.fields` should have array of field objects
**For PDFs:** Fields might be mock/synthetic if not interactive PDF

**Debug code:**
```javascript
console.log('Form data:', formData);
console.log('Fields detected:', formData.fields.length);
console.log('Field details:', formData.fields);
```

### 5. **Is wizard HTML correct?**
**Check:** onclick handlers use `window.wizardInstance.method()`
**OR:** Use `addEventListener` after appending to DOM

**Current implementation:**
- Uses `window.wizardInstance` for onclick handlers
- Global instance is set in constructor

### 6. **File Access for Local PDFs**
**Check:** Extension has "Allow access to file URLs" enabled
**Check:** Warning appears for local files without access

**To enable:**
1. Go to `chrome://extensions`
2. Find DocuGuide extension
3. Click "Details"
4. Enable "Allow access to file URLs"

### 7. **AI Session Creation**
**Check:** Background script creates LanguageModel session
**Check:** Session wrapper has `prompt` method

**Debug code:**
```javascript
console.log('AI session response:', response);
console.log('Session object:', response.session);
```

### 8. **Form Analysis Flow**
**Expected flow:**
1. Form detected → `formData` created
2. AI session created → `session` object
3. Prompt sent → `result` received
4. JSON extracted → `analysis` parsed
5. Wizard shown → `window.wizardInstance` available

**Debug each step:**
```javascript
console.log('Step 1 - Form data:', formData);
console.log('Step 2 - AI session:', session);
console.log('Step 3 - AI result:', result);
console.log('Step 4 - Analysis:', analysis);
console.log('Step 5 - Wizard instance:', window.wizardInstance);
```

## 🚨 Common Error Messages & Solutions

### "FormAnalyzer class not loaded"
**Solution:** Check content script loading order in manifest.json
**Fix:** Ensure form-analyzer.js loads before content-script.js

### "session.prompt is not a function"
**Solution:** Check AI session wrapper implementation
**Fix:** Verify session object has prompt method

### "Failed to parse analysis JSON"
**Solution:** Check JSON extraction logic
**Fix:** Verify markdown removal and brace detection

### "wizardInstance is undefined"
**Solution:** Check global instance assignment
**Fix:** Ensure `window.wizardInstance = this;` in constructor

### "Cannot read properties of undefined"
**Solution:** Check object initialization
**Fix:** Verify all required properties are set

## 🔧 Quick Fixes

### Reset Extension
1. Go to `chrome://extensions`
2. Click "Reload" on DocuGuide
3. Refresh the page
4. Try Form Guide again

### Clear Console
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Check Permissions
1. Go to `chrome://extensions`
2. Find DocuGuide
3. Click "Details"
4. Verify all permissions are enabled

## 📊 Success Indicators

### ✅ Working Correctly:
- Console shows "✅ Classes available!"
- Console shows "✅ Form analysis complete:"
- Wizard appears with step-by-step guidance
- No error messages in console
- `window.wizardInstance` is defined

### ❌ Needs Fixing:
- Console shows error messages
- Wizard doesn't appear
- "All Fields Completed" shows immediately
- JSON parsing errors
- Undefined object errors

## 🎯 Testing Checklist

### Test on Different Form Types:
- [ ] HTML form (regular website)
- [ ] PDF form (IRS.gov)
- [ ] Local PDF file
- [ ] Embedded PDF in webpage

### Test Form Guide Features:
- [ ] Form detection works
- [ ] AI analysis completes
- [ ] Wizard shows preparation screen
- [ ] Step-by-step guidance works
- [ ] Navigation (next/previous) works
- [ ] Validation check works

### Test Error Handling:
- [ ] AI fails gracefully
- [ ] Fallback analysis works
- [ ] File access warning shows
- [ ] Invalid JSON handled properly

---

*Use this checklist when debugging Form Guide issues*
