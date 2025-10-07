/**
 * Form Detector - Detects and extracts form structure using Chrome's built-in AI
 * Part of the new hybrid Form Guide implementation
 */

class FormDetector {
  constructor() {
    this.isPDF = this.detectPDF();
  }

  /**
   * Detect if current page is a PDF
   */
  detectPDF() {
    return window.location.pathname.endsWith('.pdf') || 
           document.querySelector('embed[type="application/pdf"]') ||
           document.querySelector('iframe[src*=".pdf"]');
  }

  /**
   * Extract form structure from HTML forms
   */
  extractHTMLFormStructure() {
    const forms = document.querySelectorAll('form');
    const formData = [];

    forms.forEach((form, formIndex) => {
      const fields = [...form.querySelectorAll('input, select, textarea')].map(el => ({
        id: el.id || el.name || `field_${formIndex}_${Math.random().toString(36).substr(2, 9)}`,
        name: el.name || '',
        type: el.type || el.tagName.toLowerCase(),
        label: this.getFieldLabel(el),
        placeholder: el.placeholder || '',
        required: el.required || el.hasAttribute('required'),
        value: '', // Never extract user-entered values for privacy
        options: this.getSelectOptions(el)
      }));

      if (fields.length > 0) {
        formData.push({
          id: `form_${formIndex}`,
          name: form.name || `Form ${formIndex + 1}`,
          action: form.action || '',
          method: form.method || 'get',
          fields: fields
        });
      }
    });

    return formData;
  }

  /**
   * Get field label from various sources
   */
  getFieldLabel(element) {
    // Try to get label from associated <label> element
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try to get label from parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.replace(element.value, '').trim();
    }

    // Try to get label from nearby text
    const nearbyText = this.findNearbyText(element);
    if (nearbyText) return nearbyText;

    // Fallback to placeholder or type
    return element.placeholder || element.type || 'Unlabeled field';
  }

  /**
   * Find nearby text that might be a label
   */
  findNearbyText(element) {
    const parent = element.parentElement;
    if (!parent) return null;

    // Look for text in the same parent
    const textNodes = Array.from(parent.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .filter(text => text.length > 0);

    if (textNodes.length > 0) {
      return textNodes[0];
    }

    // Look in previous sibling
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.textContent.trim()) {
        return sibling.textContent.trim();
      }
      sibling = sibling.previousElementSibling;
    }

    return null;
  }

  /**
   * Get options for select elements
   */
  getSelectOptions(element) {
    if (element.tagName.toLowerCase() !== 'select') return [];
    
    return Array.from(element.options).map(option => ({
      value: option.value,
      text: option.textContent.trim(),
      selected: option.selected
    }));
  }

  /**
   * Extract text from PDF using Tesseract.js (OCR)
   */
  async extractPDFText() {
    if (!this.isPDF) return null;

    try {
      // Check if Tesseract is available
      if (typeof Tesseract === 'undefined') {
        console.log('Tesseract.js not loaded, using basic text extraction');
        return this.extractBasicPDFText();
      }

      // Find PDF canvas or embed element
      const pdfCanvas = document.querySelector('canvas') || 
                       document.querySelector('embed[type="application/pdf"]');
      
      if (!pdfCanvas) {
        return this.extractBasicPDFText();
      }

      // Use Tesseract for OCR
      const { data: { text } } = await Tesseract.recognize(pdfCanvas, 'eng');
      return text;
    } catch (error) {
      console.error('PDF OCR failed:', error);
      return this.extractBasicPDFText();
    }
  }

  /**
   * Basic PDF text extraction (fallback)
   */
  extractBasicPDFText() {
    // Try to extract text from PDF viewer
    const textElements = document.querySelectorAll('span, div, p');
    const text = Array.from(textElements)
      .map(el => el.textContent)
      .join('\n')
      .trim();
    
    return text || 'PDF text could not be extracted';
  }

  /**
   * Use Chrome's built-in AI for lightweight form detection
   */
  async detectFormContext() {
    try {
      // Check if Chrome's AI is available
      if (typeof chrome !== 'undefined' && chrome.ai && chrome.ai.languageModel) {
        const capabilities = await chrome.ai.languageModel.capabilities();
        
        if (capabilities.summarization) {
          const pageText = document.body.textContent.substring(0, 1000);
          const session = await chrome.ai.languageModel.create({
            systemPrompt: "You are a form detection assistant. Analyze the text and determine if this page contains forms.",
            temperature: 0.1
          });
          
          const result = await session.prompt(`Does this page contain forms? Text: ${pageText}`);
          return result.includes('yes') || result.includes('form');
        }
      }
    } catch (error) {
      console.log('Chrome AI not available, using fallback detection');
    }

    // Fallback: simple DOM detection
    return document.querySelectorAll('form, input, select, textarea').length > 0;
  }

  /**
   * Main method to extract form data
   */
  async extractFormData() {
    const hasForms = await this.detectFormContext();
    
    if (!hasForms) {
      return {
        hasForms: false,
        context: this.isPDF ? 'PDF document' : 'Web page',
        message: 'No forms detected on this page'
      };
    }

    if (this.isPDF) {
      const pdfText = await this.extractPDFText();
      return {
        hasForms: true,
        context: 'PDF document',
        type: 'PDF',
        text: pdfText,
        fields: this.extractPDFFields(pdfText)
      };
    } else {
      const forms = this.extractHTMLFormStructure();
      return {
        hasForms: true,
        context: 'Web page',
        type: 'HTML',
        forms: forms,
        fieldCount: forms.reduce((total, form) => total + form.fields.length, 0)
      };
    }
  }

  /**
   * Extract field information from PDF text
   */
  extractPDFFields(text) {
    // Simple field detection from PDF text
    const fieldPatterns = [
      /(?:Name|Full Name|First Name|Last Name)/gi,
      /(?:Email|E-mail|Email Address)/gi,
      /(?:Phone|Telephone|Phone Number)/gi,
      /(?:Address|Street Address|Home Address)/gi,
      /(?:City|Town)/gi,
      /(?:State|Province)/gi,
      /(?:Zip|Postal Code|ZIP Code)/gi,
      /(?:Country)/gi,
      /(?:Date|Birth Date|Date of Birth)/gi,
      /(?:SSN|Social Security|Social Security Number)/gi
    ];

    const fields = [];
    fieldPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        fields.push({
          id: `pdf_field_${index + 1}`,
          name: `Field ${index + 1}`,
          type: 'text',
          label: pattern.source.replace(/[()]/g, '').replace(/\|/g, ' or '),
          required: true,
          source: 'PDF text analysis'
        });
      }
    });

    return fields;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDetector;
} else {
  window.FormDetector = FormDetector;
}
