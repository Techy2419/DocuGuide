/**
 * AI Manager - Handles both Chrome built-in AI and Claude 4.5 via OpenRouter
 * Part of the new hybrid Form Guide implementation
 */

class AIManager {
  constructor() {
    this.openRouterApiKey = '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';
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.backendUrl = 'https://docuguide-backend.onrender.com';
  }

  /**
   * Check if Chrome's built-in AI is available
   */
  async isChromeAIAvailable() {
    // Chrome AI is not available in current versions
    // We'll use Claude 4.5 for all AI operations
    return { available: false };
  }

  /**
   * Use Chrome's built-in AI for lightweight tasks
   */
  async useChromeAI(prompt, options = {}) {
    try {
      const chromeAI = await this.isChromeAIAvailable();
      if (!chromeAI.available) {
        throw new Error('Chrome AI not available');
      }

      const session = await chrome.ai.languageModel.create({
        systemPrompt: options.systemPrompt || "You are a helpful assistant.",
        temperature: options.temperature || 0.1
      });

      const result = await session.prompt(prompt);
      await session.destroy();
      
      return result;
    } catch (error) {
      console.error('Chrome AI error:', error);
      throw error;
    }
  }

  /**
   * Use Claude 4.5 via OpenRouter for complex analysis
   */
  async useClaude(prompt, context = '') {
    try {
      const response = await fetch(this.openRouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'DocuGuide Form Assistant'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful form-explainer assistant. Analyze forms and provide clear, actionable explanations for each field. Be specific about what information is needed and where to find it.'
            },
            {
              role: 'user',
              content: `${context}\n\n${prompt}`
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Analyze form using hybrid approach
   */
  async analyzeForm(formData) {
    try {
      // First, try Chrome's built-in AI for basic analysis
      const chromeAnalysis = await this.useChromeAI(
        `Analyze this form structure: ${JSON.stringify(formData, null, 2)}`,
        {
          systemPrompt: "You are a form analysis assistant. Provide a brief summary of the form's purpose and main fields.",
          temperature: 0.1
        }
      );

      // Then use Claude for detailed field explanations
      const claudeAnalysis = await this.useClaude(
        `Provide detailed explanations for each field in this form. For each field, explain:
        1. What information is needed
        2. Where to find this information
        3. Common mistakes to avoid
        4. Format requirements
        
        Form data: ${JSON.stringify(formData, null, 2)}`,
        'Form Analysis Request'
      );

      return {
        summary: chromeAnalysis,
        detailedAnalysis: claudeAnalysis,
        method: 'hybrid'
      };
    } catch (error) {
      console.error('Form analysis failed:', error);
      
      // Fallback to basic analysis
      return {
        summary: 'Form detected but detailed analysis unavailable',
        detailedAnalysis: 'Unable to provide detailed field explanations at this time.',
        method: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Analyze PDF form using OCR + Claude
   */
  async analyzePDFForm(pdfText) {
    try {
      const analysis = await this.useClaude(
        `Analyze this PDF form text and provide:
        1. Form purpose and type
        2. Required fields and their explanations
        3. Step-by-step completion guide
        4. Common mistakes to avoid
        
        PDF Text: ${pdfText.substring(0, 3000)}...`,
        'PDF Form Analysis'
      );

      return {
        analysis: analysis,
        method: 'claude_ocr'
      };
    } catch (error) {
      console.error('PDF analysis failed:', error);
      return {
        analysis: 'PDF form detected but analysis unavailable',
        method: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Get field-specific guidance
   */
  async getFieldGuidance(field, formContext) {
    try {
      const guidance = await this.useClaude(
        `Provide specific guidance for this form field:
        
        Field: ${JSON.stringify(field, null, 2)}
        Form Context: ${formContext}
        
        Explain:
        1. What to enter
        2. Where to find the information
        3. Format requirements
        4. Common mistakes to avoid`,
        'Field-Specific Guidance'
      );

      return guidance;
    } catch (error) {
      console.error('Field guidance failed:', error);
      return 'Guidance unavailable for this field';
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIManager;
} else {
  window.AIManager = AIManager;
}
