# Form Guide - New Hybrid Implementation

## Overview

The new Form Guide implementation combines Chrome's built-in AI with Claude 4.5 via OpenRouter API to provide intelligent form analysis and guidance. This hybrid approach ensures privacy while delivering powerful AI capabilities.

## Architecture

### Frontend Components

1. **FormDetector** (`content/form-detector.js`)
   - Detects HTML forms and PDF documents
   - Extracts form structure and field information
   - Uses Chrome's built-in AI for lightweight detection
   - Implements OCR for PDF text extraction

2. **FormGuide** (`content/form-guide.js`)
   - Main UI controller for form guidance
   - Shows floating "Scan & Explain Form" button
   - Displays analysis results in overlay panel
   - Handles user interactions

3. **AIManager** (`utils/ai-manager.js`)
   - Manages both Chrome built-in AI and Claude 4.5
   - Handles API calls to OpenRouter
   - Provides fallback mechanisms
   - Manages AI session lifecycle

### Backend Components

4. **Backend Server** (`backend/server.js`)
   - Node.js Express server
   - Integrates with Claude 4.5 via OpenRouter API
   - Provides RESTful endpoints for form analysis
   - Handles CORS and security

## Features

### ✅ Implemented

- **Form Detection**: Automatically detects HTML forms and PDF documents
- **Hybrid AI Analysis**: Uses Chrome built-in AI + Claude 4.5
- **Privacy-First**: Only analyzes form structure, never user data
- **PDF Support**: OCR text extraction for PDF forms
- **Modern UI**: Clean, accessible interface with floating button
- **Error Handling**: Graceful fallbacks and user feedback

### 🔄 In Progress

- **Backend Deployment**: Server needs to be deployed to production
- **Tesseract.js Integration**: OCR library for PDF text extraction
- **Advanced Field Guidance**: More specific field-by-field help

## Usage

### For Users

1. **Navigate to any page with forms**
2. **Click the floating "🧾 Scan & Explain Form" button**
3. **View form analysis and field explanations**
4. **Follow step-by-step guidance**

### For Developers

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start backend server**:
   ```bash
   npm start
   ```

3. **Load extension in Chrome**:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the extension folder

## API Endpoints

### POST /analyze-form
Analyzes HTML form structure using Claude 4.5

**Request Body**:
```json
{
  "formData": {
    "forms": [...],
    "fieldCount": 5
  },
  "context": "Form analysis request"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "summary": "Form purpose description",
    "fields": [...],
    "completionOrder": [...],
    "estimatedTime": "10-15 minutes",
    "requiredDocuments": [...]
  }
}
```

### POST /analyze-pdf
Analyzes PDF form text using Claude 4.5

**Request Body**:
```json
{
  "pdfText": "Extracted PDF text...",
  "context": "PDF form analysis"
}
```

### GET /health
Health check endpoint

## Configuration

### OpenRouter API Key
The API key is configured in `backend/server.js`:
```javascript
const OPENROUTER_API_KEY = 'your-api-key-here';
```

### Backend URL
Update the backend URL in `utils/ai-manager.js`:
```javascript
this.backendUrl = 'https://your-deployed-backend.com';
```

## Privacy & Security

- **No Data Collection**: Only form structure is analyzed
- **Local Processing**: Chrome built-in AI runs locally
- **Secure API**: Claude 4.5 calls are made securely via OpenRouter
- **No Storage**: No form data is stored or persisted

## Troubleshooting

### Common Issues

1. **"Form Guide not initialized"**
   - Check if content scripts are loaded
   - Verify manifest.json permissions

2. **"Analysis failed"**
   - Check backend server is running
   - Verify OpenRouter API key is valid
   - Check network connectivity

3. **"No forms detected"**
   - Ensure page has actual form elements
   - Check if page is fully loaded

### Debug Mode

Enable debug logging by opening Chrome DevTools and checking the console for detailed logs.

## Future Enhancements

- [ ] Real-time form validation
- [ ] Multi-language support
- [ ] Form completion progress tracking
- [ ] Integration with popular form builders
- [ ] Advanced PDF form field detection
- [ ] Custom form templates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
