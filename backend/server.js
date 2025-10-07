/**
 * Backend Server for DocuGuide Form Guide
 * Handles Claude 4.5 integration via OpenRouter API
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenRouter API configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call Claude 4.5 via OpenRouter
 */
async function callClaude(messages, options = {}) {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://docuguide-extension.com',
        'X-Title': 'DocuGuide Form Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 2000
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
 * Analyze form structure
 */
app.post('/analyze-form', async (req, res) => {
  try {
    const { formData, context } = req.body;
    
    const messages = [
      {
        role: 'system',
        content: `You are a helpful form-explainer assistant. Analyze forms and provide clear, actionable explanations for each field. Be specific about what information is needed and where to find it.

        Return your response in JSON format with this structure:
        {
          "summary": "Brief description of the form's purpose",
          "fields": [
            {
              "id": "field_id",
              "label": "Field Label",
              "explanation": "What this field is for",
              "required": true/false,
              "format": "Expected format (e.g., XXX-XX-XXXX for SSN)",
              "source": "Where to find this information",
              "commonMistakes": "Common mistakes to avoid"
            }
          ],
          "completionOrder": ["field_id_1", "field_id_2"],
          "estimatedTime": "Estimated completion time",
          "requiredDocuments": ["Document 1", "Document 2"]
        }`
      },
      {
        role: 'user',
        content: `Analyze this form: ${JSON.stringify(formData, null, 2)}

        Context: ${context || 'General form analysis'}

        Provide detailed explanations for each field, including what information is needed, where to find it, and common mistakes to avoid.`
      }
    ];

    const analysis = await callClaude(messages);
    
    // Try to parse as JSON, fallback to text if parsing fails
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError) {
      parsedAnalysis = {
        summary: analysis,
        fields: [],
        completionOrder: [],
        estimatedTime: "Unknown",
        requiredDocuments: [],
        rawResponse: analysis
      };
    }

    res.json({
      success: true,
      analysis: parsedAnalysis,
      method: 'claude-4.5'
    });

  } catch (error) {
    console.error('Form analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      analysis: {
        summary: 'Analysis failed',
        fields: [],
        completionOrder: [],
        estimatedTime: "Unknown",
        requiredDocuments: []
      }
    });
  }
});

/**
 * Analyze PDF form
 */
app.post('/analyze-pdf', async (req, res) => {
  try {
    const { pdfText, context } = req.body;
    
    const messages = [
      {
        role: 'system',
        content: `You are a PDF form analysis expert. Analyze PDF forms and provide step-by-step completion guidance.

        Return your response in JSON format with this structure:
        {
          "formType": "Type of form (e.g., Tax Return, Application, etc.)",
          "summary": "Brief description of the form's purpose",
          "fields": [
            {
              "id": "field_id",
              "label": "Field Label",
              "explanation": "What this field is for",
              "required": true/false,
              "format": "Expected format",
              "source": "Where to find this information",
              "commonMistakes": "Common mistakes to avoid",
              "lineNumber": "Line number on form (if applicable)"
            }
          ],
          "completionOrder": ["field_id_1", "field_id_2"],
          "estimatedTime": "Estimated completion time",
          "requiredDocuments": ["Document 1", "Document 2"],
          "tips": ["Helpful tip 1", "Helpful tip 2"]
        }`
      },
      {
        role: 'user',
        content: `Analyze this PDF form text: ${pdfText.substring(0, 5000)}

        Context: ${context || 'PDF form analysis'}

        Provide detailed field-by-field guidance for completing this form.`
      }
    ];

    const analysis = await callClaude(messages);
    
    // Try to parse as JSON, fallback to text if parsing fails
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError) {
      parsedAnalysis = {
        formType: 'PDF Form',
        summary: analysis,
        fields: [],
        completionOrder: [],
        estimatedTime: "Unknown",
        requiredDocuments: [],
        tips: [],
        rawResponse: analysis
      };
    }

    res.json({
      success: true,
      analysis: parsedAnalysis,
      method: 'claude-4.5-pdf'
    });

  } catch (error) {
    console.error('PDF analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      analysis: {
        formType: 'PDF Form',
        summary: 'Analysis failed',
        fields: [],
        completionOrder: [],
        estimatedTime: "Unknown",
        requiredDocuments: [],
        tips: []
      }
    });
  }
});

/**
 * Get field-specific guidance
 */
app.post('/field-guidance', async (req, res) => {
  try {
    const { field, formContext } = req.body;
    
    const messages = [
      {
        role: 'system',
        content: `You are a form field guidance expert. Provide specific, actionable guidance for individual form fields.`
      },
      {
        role: 'user',
        content: `Provide guidance for this form field:

        Field: ${JSON.stringify(field, null, 2)}
        Form Context: ${formContext}

        Explain:
        1. What to enter
        2. Where to find the information
        3. Format requirements
        4. Common mistakes to avoid
        5. Tips for success`
      }
    ];

    const guidance = await callClaude(messages);

    res.json({
      success: true,
      guidance: guidance,
      method: 'claude-4.5'
    });

  } catch (error) {
    console.error('Field guidance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      guidance: 'Guidance unavailable for this field'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DocuGuide Form Guide Backend'
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 DocuGuide Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
