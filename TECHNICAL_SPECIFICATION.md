# DocuGuide Chrome Extension - Technical Specification

## 🔧 **Technical Architecture Overview**

### **System Components**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                          │
├─────────────────────────────────────────────────────────────────┤
│  Web Page Context        │  Extension Context                  │
│  ┌─────────────────┐     │  ┌─────────────────────────────────┐ │
│  │ Content Script  │◄────┤  │ Service Worker                  │ │
│  │ - Form Analyzer │     │  │ - AI API Manager               │ │
│  │ - Text Selection│     │  │ - Message Router               │ │
│  │ - UI Injection  │     │  │ - Session Management           │ │
│  └─────────────────┘     │  └─────────────────────────────────┘ │
│                          │  ┌─────────────────────────────────┐ │
│                          │  │ Sidebar UI                      │ │
│                          │  │ - User Interface                │ │
│                          │  │ - Results Display               │ │
│                          │  │ - Settings Panel                │ │
│                          │  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 **File Structure & Organization**

```
DocuGuide/
├── manifest.json                 # Extension manifest (V3)
├── background/
│   └── service-worker.js         # Background service worker
├── content/
│   ├── content-script.js         # Basic text selection
│   ├── form-analyzer.js          # Smart form detection & analysis
│   └── form-highlights.css       # Visual styling for form highlights
├── sidebar/
│   ├── sidebar.html              # Main UI structure
│   └── sidebar.js                # UI logic and user interactions
├── popup/
│   ├── popup.html                # Extension popup UI
│   └── popup.js                  # Popup logic
├── utils/
│   ├── api-manager.js            # Chrome AI API integration
│   ├── storage.js                # Local storage management
│   └── performance-optimizer.js  # Performance utilities
├── icons/                        # Extension icons (16, 48, 128px)
└── test-extension-simple.html    # Testing page
```

---

## 🔌 **Chrome AI API Integration**

### **API Manager Implementation**

```javascript
class ApiManager {
  constructor() {
    this.summarizerSession = null;
    this.translatorSession = null;
    this.languageModelSession = null;
    this.languageDetectorSession = null;
  }

  // Summarizer API Integration
  async summarize(text, options = {}) {
    if (!this.summarizerSession) {
      this.summarizerSession = await self.Summarizer.create({
        systemPrompt: 'You are a helpful assistant that simplifies complex text...',
        temperature: 0.7,
        topK: 40
      });
    }
    
    const result = await this.summarizerSession.summarize(text);
    return { summary: result, needsDownload: false };
  }

  // Translator API Integration
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    if (!this.translatorSession) {
      this.translatorSession = await self.Translator.create({
        systemPrompt: 'You are a professional translator...',
        temperature: 0.3
      });
    }
    
    const result = await this.translatorSession.translate(text, {
      targetLanguage,
      sourceLanguage
    });
    
    return { translation: result, needsDownload: false };
  }

  // Language Model API Integration
  async askQuestion(question, context = '') {
    if (!this.languageModelSession) {
      this.languageModelSession = await self.LanguageModel.create({
        systemPrompt: 'You are an expert assistant for document analysis...',
        temperature: 0.7,
        topK: 40
      });
    }
    
    const prompt = context ? 
      `Context: ${context}\n\nQuestion: ${question}` : 
      question;
    
    const result = await this.languageModelSession.prompt(prompt);
    return { answer: result, needsDownload: false };
  }
}
```

### **API Session Management**

```javascript
// Session lifecycle management
async initQASession() {
  try {
    this.qaSession = await self.LanguageModel.create({
      systemPrompt: 'You are a helpful assistant for form completion...',
      temperature: 0.7,
      topK: 40
    });
    return { success: true };
  } catch (error) {
    if (error.message.includes('download')) {
      return { needsDownload: true, error: error.message };
    }
    throw error;
  }
}

// Cleanup method
cleanup() {
  if (this.summarizerSession) {
    this.summarizerSession.destroy();
    this.summarizerSession = null;
  }
  // ... cleanup other sessions
}
```

---

## 🎯 **Smart Form Assistant Architecture**

### **Form Detection Engine**

```javascript
class FormAnalyzer {
  constructor() {
    this.highlightedElements = [];
    this.overlayElement = null;
  }

  // Main form detection method
  detectForms() {
    // Check for PDF documents
    if (this.isPDFPage()) {
      return this.analyzePDFForm();
    }

    // Detect HTML forms
    const forms = document.querySelectorAll('form');
    const formData = [];

    forms.forEach((form, index) => {
      const fields = this.getFormFields(form);
      formData.push({
        id: form.id || `form-${index}`,
        name: form.name || `Unnamed Form ${index + 1}`,
        action: form.action || 'No action specified',
        method: form.method || 'GET',
        fieldCount: fields.length,
        fields: fields
      });
    });

    return {
      forms: formData,
      standaloneInputs: this.detectStandaloneInputs(),
      pageTitle: document.title,
      url: window.location.href
    };
  }

  // PDF form analysis
  analyzePDFForm() {
    const filename = window.location.href.split('/').pop() || 'document.pdf';
    
    // Detect form type by filename
    let formType = 'Unknown Form';
    let estimatedFields = 20;
    
    if (filename.toLowerCase().includes('1040')) {
      formType = 'IRS Form 1040 - Individual Income Tax Return';
      estimatedFields = 50;
    }
    // ... other form types
    
    return {
      forms: [{
        id: 'pdf-form',
        name: formType,
        action: 'PDF Document',
        method: 'N/A',
        fieldCount: estimatedFields,
        fields: this.createMockFields(estimatedFields),
        isPDF: true
      }],
      isPDF: true,
      formType: formType,
      estimatedFields: estimatedFields
    };
  }
}
```

### **Visual Highlighting System**

```javascript
// Form field highlighting
highlightForms(formsData) {
  this.clearHighlights();
  
  formsData.forms.forEach(formData => {
    const form = document.getElementById(formData.id);
    if (!form) return;

    // Highlight form container
    form.style.outline = '3px solid #2563EB';
    form.style.outlineOffset = '4px';
    this.highlightedElements.push(form);

    // Highlight each field
    formData.fields.forEach(fieldData => {
      const field = form.querySelector(`[name="${fieldData.name}"]`);
      if (!field) return;

      field.style.border = '2px solid #F59E0B';
      field.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.3)';
      this.highlightedElements.push(field);
      
      this.addTooltip(field, fieldData);
    });
  });
}

// Interactive tooltips
addTooltip(field, fieldData) {
  let tooltip = null;
  
  field.addEventListener('mouseenter', () => {
    tooltip = document.createElement('div');
    tooltip.className = 'docuguide-tooltip';
    tooltip.innerHTML = `
      <strong>${fieldData.label}</strong><br>
      Type: ${fieldData.type}<br>
      ${fieldData.required ? '⚠️ Required' : '✓ Optional'}
    `;
    document.body.appendChild(tooltip);
  });
  
  field.addEventListener('mouseleave', () => {
    if (tooltip) tooltip.remove();
  });
}
```

---

## 📡 **Message Passing Architecture**

### **Content Script ↔ Service Worker Communication**

```javascript
// Content Script (form-analyzer.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeForm') {
    try {
      const formsData = formAnalyzer.detectForms();
      
      // Send to background for AI analysis
      chrome.runtime.sendMessage({
        action: 'analyzeFormWithAI',
        data: formsData
      }, (response) => {
        formAnalyzer.highlightForms(formsData);
        formAnalyzer.showOverlay({
          ...formsData,
          aiTips: response?.aiTips || []
        });
        sendResponse({ success: true, formsCount: formsData.forms.length });
      });
      
      return true; // Keep channel open for async response
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
});

// Service Worker (service-worker.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeFormWithAI') {
    analyzeFormWithAI(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Async response
  }
});
```

### **Sidebar ↔ Content Script Communication**

```javascript
// Sidebar (sidebar.js)
async function handleSmartAssistant() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'analyzeForm' }, (response) => {
    if (response.success) {
      showToast(`Smart Assistant found ${response.formsCount} form(s)!`);
    } else {
      showError('Form analysis failed');
    }
  });
}
```

---

## 🎨 **UI Component Architecture**

### **Sidebar Interface Structure**

```javascript
// Main UI initialization
function initializeUI() {
  createActionButtons();
  createSettingsPanel();
  createResultsArea();
  attachEventListeners();
}

// Action button creation
function createActionButtons() {
  const actionGrid = document.getElementById('actionGrid');
  
  const actions = [
    { id: 'summarizeBtn', icon: '📄', label: 'Summarize', action: 'summarize' },
    { id: 'translateBtn', icon: '🌍', label: 'Translate', action: 'translate' },
    { id: 'askBtn', icon: '❓', label: 'Ask AI', action: 'ask' },
    { id: 'checkBtn', icon: '✅', label: 'Check', action: 'check' },
    { id: 'smartAssistantBtn', icon: '🤖', label: 'Smart Assistant', action: 'smartAssistant' }
  ];
  
  actions.forEach(action => {
    const button = createActionButton(action);
    actionGrid.appendChild(button);
  });
}

// Results display system
function showResult(title, icon, content) {
  const resultsArea = document.getElementById('resultsArea');
  resultsArea.innerHTML = `
    <div class="result-header">
      <div class="result-icon">${icon}</div>
      <h3 class="result-title">${title}</h3>
    </div>
    <div class="result-content">${content}</div>
  `;
  resultsArea.style.display = 'block';
}
```

---

## 🔒 **Security Implementation**

### **Content Security Policy**

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### **Input Validation & Sanitization**

```javascript
// Text input validation
function validateTextInput(text, minLength = 10, maxLength = 10000) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  const trimmed = text.trim();
  if (trimmed.length < minLength) {
    throw new Error(`Text too short (minimum ${minLength} characters)`);
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`Text too long (maximum ${maxLength} characters)`);
  }
  
  // Sanitize HTML
  return escapeHtml(trimmed);
}

// HTML escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### **Error Handling**

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Log error but don't expose sensitive information
});

// API error handling
async function safeApiCall(apiFunction, ...args) {
  try {
    return await apiFunction(...args);
  } catch (error) {
    console.error('API call failed:', error);
    
    if (error.message.includes('download')) {
      return { needsDownload: true, error: 'Model download required' };
    }
    
    if (error.message.includes('quota')) {
      return { error: 'API quota exceeded' };
    }
    
    return { error: 'An error occurred while processing your request' };
  }
}
```

---

## ⚡ **Performance Optimization**

### **Lazy Loading & Session Management**

```javascript
class PerformanceOptimizer {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeouts = new Map();
    this.CLEANUP_INTERVAL = 300000; // 5 minutes
  }

  // Session reuse
  async getOrCreateSession(type, config) {
    const key = `${type}-${JSON.stringify(config)}`;
    
    if (this.sessions.has(key)) {
      this.resetSessionTimeout(key);
      return this.sessions.get(key);
    }
    
    const session = await this.createSession(type, config);
    this.sessions.set(key, session);
    this.setSessionTimeout(key);
    
    return session;
  }

  // Automatic cleanup
  setSessionTimeout(key) {
    if (this.sessionTimeouts.has(key)) {
      clearTimeout(this.sessionTimeouts.get(key));
    }
    
    const timeout = setTimeout(() => {
      this.cleanupSession(key);
    }, this.CLEANUP_INTERVAL);
    
    this.sessionTimeouts.set(key, timeout);
  }

  // Memory management
  cleanupSession(key) {
    const session = this.sessions.get(key);
    if (session && session.destroy) {
      session.destroy();
    }
    
    this.sessions.delete(key);
    this.sessionTimeouts.delete(key);
  }
}
```

### **Text Chunking for Large Inputs**

```javascript
// Handle large text inputs
function chunkText(text, maxChunkSize = 4000) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '.';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Process large text in chunks
async function processLargeText(text, processor) {
  const chunks = chunkText(text);
  const results = [];
  
  for (const chunk of chunks) {
    const result = await processor(chunk);
    results.push(result);
  }
  
  return results.join('\n\n');
}
```

---

## 🧪 **Testing Architecture**

### **Unit Testing Structure**

```javascript
// Test utilities
class TestUtils {
  static createMockForm(fieldCount = 5) {
    const form = document.createElement('form');
    form.id = 'test-form';
    
    for (let i = 0; i < fieldCount; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = `field_${i}`;
      input.id = `field_${i}`;
      form.appendChild(input);
    }
    
    return form;
  }

  static createMockText(length = 100) {
    return 'Lorem ipsum '.repeat(Math.ceil(length / 12)).substring(0, length);
  }
}

// Test cases
describe('FormAnalyzer', () => {
  test('should detect forms correctly', () => {
    const form = TestUtils.createMockForm(3);
    document.body.appendChild(form);
    
    const analyzer = new FormAnalyzer();
    const result = analyzer.detectForms();
    
    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].fieldCount).toBe(3);
    
    document.body.removeChild(form);
  });
});
```

### **Integration Testing**

```javascript
// End-to-end test scenarios
const testScenarios = [
  {
    name: 'Basic Text Summarization',
    steps: [
      'Navigate to test page',
      'Select text content',
      'Click summarize button',
      'Verify AI response'
    ]
  },
  {
    name: 'Form Analysis',
    steps: [
      'Navigate to form page',
      'Click Smart Assistant',
      'Verify form detection',
      'Check highlighting',
      'Verify AI tips'
    ]
  }
];
```

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**

```javascript
// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(operation) {
    this.metrics.set(operation, { start: Date.now() });
  }

  endTimer(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      metric.duration = Date.now() - metric.start;
      this.logMetric(operation, metric.duration);
    }
  }

  logMetric(operation, duration) {
    console.log(`Performance: ${operation} took ${duration}ms`);
    
    // Log slow operations
    if (duration > 5000) {
      console.warn(`Slow operation detected: ${operation} (${duration}ms)`);
    }
  }
}
```

### **Error Tracking**

```javascript
// Error reporting system
class ErrorTracker {
  static reportError(error, context = {}) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('Error reported:', errorReport);
    
    // In production, this would send to error tracking service
    // For now, just log locally
    this.logErrorLocally(errorReport);
  }

  static logErrorLocally(errorReport) {
    // Store in local storage for debugging
    const errors = JSON.parse(localStorage.getItem('docuguide-errors') || '[]');
    errors.push(errorReport);
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    localStorage.setItem('docuguide-errors', JSON.stringify(errors));
  }
}
```

---

## 🚀 **Deployment & Build Process**

### **Build Configuration**

```json
{
  "scripts": {
    "build": "npm run lint && npm run test && npm run bundle",
    "lint": "eslint . --ext .js",
    "test": "jest",
    "bundle": "webpack --mode=production",
    "dev": "webpack --mode=development --watch"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "webpack": "^5.0.0"
  }
}
```

### **Release Process**

1. **Development:** Feature development in feature branches
2. **Testing:** Automated tests and manual QA
3. **Build:** Production build with optimization
4. **Packaging:** Chrome extension package creation
5. **Submission:** Chrome Web Store submission
6. **Monitoring:** Post-release monitoring and feedback

---

## 📚 **Documentation Standards**

### **Code Documentation**

```javascript
/**
 * Analyzes forms on web pages and provides AI-powered insights
 * @class FormAnalyzer
 * @description Main class for detecting and analyzing HTML forms and PDF documents
 * @example
 * const analyzer = new FormAnalyzer();
 * const forms = analyzer.detectForms();
 */
class FormAnalyzer {
  /**
   * Detects all forms on the current page
   * @returns {Object} Object containing detected forms and metadata
   * @returns {Array} returns.forms - Array of form objects
   * @returns {Array} returns.standaloneInputs - Array of inputs not in forms
   * @returns {string} returns.pageTitle - Title of current page
   * @returns {string} returns.url - URL of current page
   */
  detectForms() {
    // Implementation
  }
}
```

### **API Documentation**

- **Function signatures** with parameter types
- **Return value descriptions** with examples
- **Error handling** documentation
- **Usage examples** for common scenarios
- **Performance considerations** and limitations

---

This technical specification provides the implementation details needed for developers to understand, maintain, and extend the DocuGuide Chrome Extension. It complements the product specification with concrete technical requirements and architectural decisions.
