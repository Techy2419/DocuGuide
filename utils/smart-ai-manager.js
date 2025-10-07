/**
 * Smart AI Manager - Advanced AI features using Chrome Built-in AI only
 * Features: Context awareness, document analysis, intelligent caching, parallel processing
 */

import apiManager from './api-manager.js';

class SmartAIManager {
  constructor() {
    this.context = {
      documentType: null,
      userPreferences: {},
      previousActions: [],
      detectedLanguage: null,
      formFields: [],
      sessionId: null
    };
    
    this.cache = new Map();
    this.semanticCache = new Map();
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Smart Document Analysis using Chrome's LanguageModel
   */
  async analyzeDocument(text) {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = `analysis_${this.hash(text)}`;
      if (this.cache.has(cacheKey)) {
        this.performanceMetrics.cacheHits++;
        return this.cache.get(cacheKey);
      }

      const session = await apiManager.createLanguageModel({
        systemPrompt: `You are an expert document analyzer. Analyze the given text and provide a structured analysis in JSON format.`,
        temperature: 0.1
      });

      const analysisPrompt = `Analyze this text and provide a JSON response with:
{
  "documentType": "government_form|legal_document|medical_form|educational|business|other",
  "complexity": "simple|moderate|complex",
  "keySections": ["section1", "section2", ...],
  "requiredActions": ["action1", "action2", ...],
  "potentialIssues": ["issue1", "issue2", ...],
  "confidence": 0.0-1.0,
  "language": "detected_language_code",
  "formFields": [
    {"name": "field_name", "type": "text|date|checkbox|select", "required": true/false, "help": "help_text"}
  ]
}

Text to analyze: ${text}`;

      const response = await session.prompt(analysisPrompt);
      const analysis = this.parseJSONResponse(response);
      
      // Update context
      this.context.documentType = analysis.documentType;
      this.context.detectedLanguage = analysis.language;
      this.context.formFields = analysis.formFields || [];
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime);
      
      return analysis;
    } catch (error) {
      console.error('Document analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Smart Summarization with Context Awareness
   */
  async smartSummarize(text, mode = 'key-points') {
    const startTime = performance.now();
    
    try {
      // Get document context
      const analysis = await this.analyzeDocument(text);
      
      // Build context-aware prompt
      const contextPrompt = this.buildContextAwarePrompt('summarize', analysis, mode);
      
      // Use existing summarizer with enhanced context
      const result = await apiManager.summarize(text, mode, {
        context: contextPrompt,
        documentType: analysis.documentType,
        complexity: analysis.complexity
      });
      
      // Add smart insights
      result.insights = this.generateInsights(analysis, result);
      result.documentType = analysis.documentType;
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime);
      
      return result;
    } catch (error) {
      console.error('Smart summarization failed:', error);
      return await apiManager.summarize(text, mode);
    }
  }

  /**
   * Smart Translation with Context Awareness
   */
  async smartTranslate(text, targetLanguage, sourceLanguage = null) {
    const startTime = performance.now();
    
    try {
      // Get document context
      const analysis = await this.analyzeDocument(text);
      
      // Use existing translator with enhanced context
      const result = await apiManager.translate(text, targetLanguage, sourceLanguage);
      
      // Add smart insights
      result.insights = this.generateTranslationInsights(analysis, result);
      result.documentType = analysis.documentType;
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime);
      
      return result;
    } catch (error) {
      console.error('Smart translation failed:', error);
      return await apiManager.translate(text, targetLanguage, sourceLanguage);
    }
  }

  /**
   * Smart Q&A with Context Awareness
   */
  async smartAskQuestion(question, context = '') {
    const startTime = performance.now();
    
    try {
      // Get document context if available
      let analysis = null;
      if (context) {
        analysis = await this.analyzeDocument(context);
      }
      
      // Build context-aware Q&A prompt
      const contextPrompt = this.buildContextAwarePrompt('qa', analysis, question);
      
      // Use existing Q&A with enhanced context
      const result = await apiManager.askQuestion(question, contextPrompt);
      
      // Add smart insights
      result.insights = this.generateQAInsights(analysis, result);
      result.documentType = analysis?.documentType;
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime);
      
      return result;
    } catch (error) {
      console.error('Smart Q&A failed:', error);
      return await apiManager.askQuestion(question, context);
    }
  }

  /**
   * Parallel Processing for Multiple Operations
   */
  async processTextSmart(text, operations = ['summarize', 'translate', 'analyze']) {
    const startTime = performance.now();
    
    try {
      // Run operations in parallel
      const promises = operations.map(async (operation) => {
        switch (operation) {
          case 'summarize':
            return await this.smartSummarize(text);
          case 'translate':
            return await this.smartTranslate(text, 'es'); // Default to Spanish
          case 'analyze':
            return await this.analyzeDocument(text);
          case 'check':
            return await apiManager.improveWriting(text, 'proofread');
          default:
            return null;
        }
      });
      
      const results = await Promise.all(promises);
      
      // Combine results intelligently
      const combined = {
        summary: results[0],
        translation: results[1],
        analysis: results[2],
        writingCheck: results[3],
        processingTime: performance.now() - startTime
      };
      
      return combined;
    } catch (error) {
      console.error('Parallel processing failed:', error);
      throw error;
    }
  }

  /**
   * Smart Caching with Semantic Similarity
   */
  async getCachedResult(text, operation) {
    const key = `${operation}_${this.hash(text)}`;
    
    // Exact match cache
    if (this.cache.has(key)) {
      this.performanceMetrics.cacheHits++;
      return this.cache.get(key);
    }
    
    // Semantic similarity cache
    const similar = await this.findSimilarCached(text, operation);
    if (similar) {
      this.performanceMetrics.cacheHits++;
      return this.adaptCachedResult(similar, text);
    }
    
    return null;
  }

  /**
   * Build Context-Aware Prompts
   */
  buildContextAwarePrompt(feature, analysis, additionalContext) {
    const basePrompts = {
      summarize: {
        government_form: `You are an expert in government forms. Summarize this form section focusing on what the applicant needs to do, required documents, and important deadlines.`,
        legal_document: `You are a legal expert. Summarize this legal text focusing on key obligations, rights, and important legal concepts.`,
        medical_form: `You are a healthcare assistant. Summarize this medical form focusing on patient requirements, health information needed, and medical procedures.`,
        educational: `You are an educational consultant. Summarize this educational content focusing on key concepts, learning objectives, and important information.`,
        business: `You are a business consultant. Summarize this business document focusing on key decisions, requirements, and business implications.`
      },
      translate: {
        government_form: `Translate this government form while maintaining official tone, legal accuracy, and preserving all formatting. Focus on clarity for non-native speakers.`,
        legal_document: `Translate this legal document preserving legal terminology, structure, and maintaining the formal legal tone.`,
        medical_form: `Translate this medical form maintaining medical terminology, patient clarity, and healthcare context.`,
        educational: `Translate this educational content maintaining academic tone, technical accuracy, and learning clarity.`,
        business: `Translate this business document maintaining professional tone, business terminology, and commercial context.`
      },
      qa: {
        government_form: `You are an expert in government forms. Answer questions about form requirements, deadlines, and procedures. Be specific about what applicants need to do.`,
        legal_document: `You are a legal expert. Answer questions about legal concepts, obligations, and rights. Always clarify that this is not official legal advice.`,
        medical_form: `You are a healthcare assistant. Answer questions about medical forms, health requirements, and procedures. Focus on patient understanding.`,
        educational: `You are an educational consultant. Answer questions about educational content, requirements, and learning objectives.`,
        business: `You are a business consultant. Answer questions about business documents, requirements, and procedures.`
      }
    };
    
    const documentType = analysis?.documentType || 'other';
    const basePrompt = basePrompts[feature]?.[documentType] || basePrompts[feature]?.other || `You are a helpful assistant.`;
    
    return `${basePrompt}\n\nAdditional Context: ${additionalContext}`;
  }

  /**
   * Generate Smart Insights
   */
  generateInsights(analysis, result) {
    const insights = [];
    
    if (analysis.complexity === 'complex') {
      insights.push('This is a complex document - consider breaking it into smaller sections');
    }
    
    if (analysis.requiredActions.length > 0) {
      insights.push(`Key actions required: ${analysis.requiredActions.join(', ')}`);
    }
    
    if (analysis.potentialIssues.length > 0) {
      insights.push(`Potential issues to watch for: ${analysis.potentialIssues.join(', ')}`);
    }
    
    if (analysis.formFields.length > 0) {
      insights.push(`Form contains ${analysis.formFields.length} fields to complete`);
    }
    
    return insights;
  }

  generateTranslationInsights(analysis, result) {
    const insights = [];
    
    if (analysis.documentType === 'government_form') {
      insights.push('This is a government form - ensure all legal terminology is accurately translated');
    }
    
    if (analysis.complexity === 'complex') {
      insights.push('Complex document - consider having a native speaker review the translation');
    }
    
    return insights;
  }

  generateQAInsights(analysis, result) {
    const insights = [];
    
    if (analysis.documentType === 'legal_document') {
      insights.push('This is a legal document - always consult a lawyer for official legal advice');
    }
    
    if (analysis.complexity === 'complex') {
      insights.push('Complex document - you may want to ask more specific questions');
    }
    
    return insights;
  }

  /**
   * Utility Methods
   */
  hash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  parseJSONResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return this.getDefaultAnalysis();
    }
  }

  getDefaultAnalysis() {
    return {
      documentType: 'other',
      complexity: 'moderate',
      keySections: [],
      requiredActions: [],
      potentialIssues: [],
      confidence: 0.5,
      language: 'en',
      formFields: []
    };
  }

  async findSimilarCached(text, operation) {
    // Simple similarity check - in production, you'd use more sophisticated methods
    for (const [cachedText, result] of this.semanticCache) {
      if (this.calculateSimilarity(text, cachedText) > 0.8) {
        return result;
      }
    }
    return null;
  }

  calculateSimilarity(text1, text2) {
    // Simple similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  adaptCachedResult(cachedResult, newText) {
    // Simple adaptation - in production, you'd use AI to adapt the result
    return {
      ...cachedResult,
      adapted: true,
      originalText: newText
    };
  }

  updatePerformanceMetrics(responseTime) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) / 
      this.performanceMetrics.totalRequests;
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests
    };
  }

  clearCache() {
    this.cache.clear();
    this.semanticCache.clear();
  }

  cleanup() {
    this.clearCache();
    this.context = {
      documentType: null,
      userPreferences: {},
      previousActions: [],
      detectedLanguage: null,
      formFields: [],
      sessionId: null
    };
  }
}

const smartAIManager = new SmartAIManager();
export default smartAIManager;
