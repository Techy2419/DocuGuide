/**
 * Form Guide - Main implementation of the new hybrid form guide
 * Combines Chrome built-in AI with Claude 4.5 via OpenRouter
 */

class FormGuide {
  constructor() {
    this.detector = new FormDetector();
    this.aiManager = new AIManager();
    this.isActive = false;
    this.currentAnalysis = null;
  }

  /**
   * Initialize the form guide
   */
  async init() {
    console.log('🚀 Initializing Form Guide...');
    
    try {
      // Check if we're on a form page
      const formData = await this.detector.extractFormData();
      
      if (!formData.hasForms) {
        this.showNoFormsMessage(formData.message);
        return;
      }

      // Show form guide button
      this.showFormGuideButton();
      
    } catch (error) {
      console.error('Form Guide initialization failed:', error);
      this.showErrorMessage('Failed to initialize form guide');
    }
  }

  /**
   * Show form guide button
   */
  showFormGuideButton() {
    // Remove existing button if any
    const existingBtn = document.querySelector('#form-guide-btn');
    if (existingBtn) existingBtn.remove();

    // Create button
    const button = document.createElement('button');
    button.id = 'form-guide-btn';
    button.innerHTML = '🧾 Scan & Explain Form';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #3B82F6;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      transition: all 0.2s ease;
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = '#2563EB';
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#3B82F6';
      button.style.transform = 'translateY(0)';
    });

    // Add click handler
    button.addEventListener('click', () => this.scanAndExplain());

    document.body.appendChild(button);
  }

  /**
   * Main method to scan and explain forms
   */
  async scanAndExplain() {
    const button = document.querySelector('#form-guide-btn');
    if (button) {
      button.disabled = true;
      button.innerHTML = '⏳ Analyzing...';
    }

    try {
      // Extract form data
      const formData = await this.detector.extractFormData();
      
      if (!formData.hasForms) {
        this.showNoFormsMessage('No forms found on this page');
        return;
      }

      // Analyze with AI
      let analysis;
      if (formData.type === 'PDF') {
        analysis = await this.aiManager.analyzePDFForm(formData.text);
      } else {
        analysis = await this.aiManager.analyzeForm(formData);
      }

      this.currentAnalysis = analysis;
      this.showResults(analysis, formData);

    } catch (error) {
      console.error('Form analysis failed:', error);
      this.showErrorMessage('Analysis failed. Please try again.');
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = '🧾 Scan & Explain Form';
      }
    }
  }

  /**
   * Show analysis results
   */
  showResults(analysis, formData) {
    // Remove existing results
    const existingResults = document.querySelector('#form-guide-results');
    if (existingResults) existingResults.remove();

    // Create results panel
    const resultsPanel = document.createElement('div');
    resultsPanel.id = 'form-guide-results';
    resultsPanel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    resultsPanel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #1F2937; font-size: 18px;">FormGuide 🧾</h3>
          <button id="close-results" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6B7280;">×</button>
        </div>
        
        <div style="background: #F3F4F6; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Form Summary</div>
          <div style="font-size: 16px; color: #1F2937; line-height: 1.5;">${analysis.summary || 'Form detected and analyzed'}</div>
        </div>

        <div style="background: #EFF6FF; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 14px; color: #3B82F6; margin-bottom: 4px;">Privacy Notice</div>
          <div style="font-size: 14px; color: #1F2937;">Only form structure is analyzed — your data never leaves your device.</div>
        </div>
      </div>

      <div style="padding: 20px;">
        <h4 style="margin: 0 0 16px 0; color: #1F2937; font-size: 16px;">Field Explanations</h4>
        <div id="field-explanations" style="space-y: 12px;">
          ${this.renderFieldExplanations(formData)}
        </div>
      </div>
    `;

    // Add close button handler
    resultsPanel.querySelector('#close-results').addEventListener('click', () => {
      resultsPanel.remove();
    });

    document.body.appendChild(resultsPanel);
  }

  /**
   * Render field explanations
   */
  renderFieldExplanations(formData) {
    if (formData.type === 'PDF') {
      return `
        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
          <div style="font-size: 14px; color: #1F2937; line-height: 1.6;">
            ${this.formatAnalysisText(analysis.detailedAnalysis || analysis.analysis)}
          </div>
        </div>
      `;
    } else {
      // For HTML forms, show each field
      const fields = formData.forms.flatMap(form => form.fields);
      return fields.map(field => `
        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #10B981;">
          <div style="font-weight: 600; color: #1F2937; margin-bottom: 8px;">${field.label}</div>
          <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Type: ${field.type}</div>
          ${field.required ? '<div style="font-size: 12px; color: #EF4444; background: #FEF2F2; padding: 4px 8px; border-radius: 4px; display: inline-block;">Required</div>' : ''}
        </div>
      `).join('');
    }
  }

  /**
   * Format analysis text for display
   */
  formatAnalysisText(text) {
    if (!text) return 'No analysis available';
    
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/g, '<p>$1</p>');
  }

  /**
   * Show no forms message
   */
  showNoFormsMessage(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10002;
      background: ${type === 'error' ? '#FEF2F2' : '#EFF6FF'};
      color: ${type === 'error' ? '#DC2626' : '#2563EB'};
      border: 1px solid ${type === 'error' ? '#FECACA' : '#BFDBFE'};
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const formGuide = new FormGuide();
  formGuide.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormGuide;
} else {
  window.FormGuide = FormGuide;
}
