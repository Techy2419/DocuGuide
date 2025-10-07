/**
 * Performance Optimizer - Advanced performance features using Chrome Built-in AI
 * Features: Parallel processing, streaming, smart caching, performance monitoring
 */

import apiManager from './api-manager.js';
import smartAIManager from './smart-ai-manager.js';

class PerformanceOptimizer {
  constructor() {
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      parallelOperations: 0,
      streamingOperations: 0
    };
    
    this.requestQueue = [];
    this.activeRequests = new Map();
    this.maxConcurrentRequests = 3;
  }

  /**
   * Parallel Processing for Multiple AI Operations
   */
  async processInParallel(text, operations) {
    const startTime = performance.now();
    
    try {
      // Create operation promises
      const promises = operations.map(async (operation, index) => {
        const operationId = `op_${Date.now()}_${index}`;
        this.activeRequests.set(operationId, operation);
        
        try {
          const result = await this.executeOperation(operation, text);
          this.activeRequests.delete(operationId);
          return { operation, result, success: true };
        } catch (error) {
          this.activeRequests.delete(operationId);
          return { operation, error: error.message, success: false };
        }
      });
      
      // Wait for all operations to complete
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime, 'parallel');
      
      return {
        results,
        processingTime: endTime - startTime,
        successCount: results.filter(r => r.success).length,
        totalOperations: operations.length
      };
    } catch (error) {
      console.error('Parallel processing failed:', error);
      throw error;
    }
  }

  /**
   * Streaming with Progressive Enhancement
   */
  async processWithStreaming(text, operation, options = {}) {
    const startTime = performance.now();
    
    try {
      this.performanceMetrics.streamingOperations++;
      
      // Create streaming session
      const session = await apiManager.createLanguageModel({
        systemPrompt: this.getStreamingPrompt(operation),
        temperature: options.temperature || 0.3
      });
      
      // Start streaming
      const stream = session.promptStreaming(text, options);
      
      let result = '';
      let chunkCount = 0;
      const chunks = [];
      
      for await (const chunk of stream) {
        result += chunk;
        chunks.push(chunk);
        chunkCount++;
        
        // Progressive enhancement - update UI as we go
        if (options.onProgress) {
          options.onProgress({
            chunk,
            fullResult: result,
            chunkCount,
            progress: Math.min((result.length / (text.length * 0.5)) * 100, 95)
          });
        }
        
        // Early termination for good enough results
        if (options.earlyTermination && this.isGoodEnough(result, operation)) {
          break;
        }
      }
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime, 'streaming');
      
      return {
        result,
        chunks,
        chunkCount,
        processingTime: endTime - startTime,
        streaming: true
      };
    } catch (error) {
      console.error('Streaming processing failed:', error);
      throw error;
    }
  }

  /**
   * Smart Caching with Intelligent Invalidation
   */
  async getCachedResult(key, operation, text) {
    const cacheKey = `${operation}_${this.hash(key)}`;
    
    // Check exact match cache
    if (this.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      
      // Check if cache is still valid
      if (this.isCacheValid(cached, text)) {
        this.performanceMetrics.cacheHits++;
        return cached.result;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Batch Processing for Multiple Texts
   */
  async processBatch(texts, operation, options = {}) {
    const startTime = performance.now();
    
    try {
      const results = [];
      const batchSize = options.batchSize || 3;
      
      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (text, index) => {
          const globalIndex = i + index;
          try {
            const result = await this.executeOperation(operation, text);
            return { index: globalIndex, result, success: true };
          } catch (error) {
            return { index: globalIndex, error: error.message, success: false };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < texts.length) {
          await this.delay(100);
        }
      }
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime, 'batch');
      
      return {
        results,
        processingTime: endTime - startTime,
        successCount: results.filter(r => r.success).length,
        totalTexts: texts.length
      };
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Adaptive Performance - Adjusts based on performance metrics
   */
  async adaptiveProcess(text, operation, options = {}) {
    const metrics = this.getPerformanceMetrics();
    
    // Choose processing method based on performance
    if (metrics.averageResponseTime < 1000 && options.allowStreaming) {
      // Fast system - use streaming for better UX
      return await this.processWithStreaming(text, operation, options);
    } else if (metrics.averageResponseTime < 2000) {
      // Medium system - use parallel processing
      return await this.processInParallel(text, [operation]);
    } else {
      // Slow system - use simple processing
      return await this.executeOperation(operation, text);
    }
  }

  /**
   * Execute Individual Operations
   */
  async executeOperation(operation, text, options = {}) {
    const startTime = performance.now();
    
    try {
      let result;
      
      switch (operation.type) {
        case 'summarize':
          result = await smartAIManager.smartSummarize(text, operation.mode || 'key-points');
          break;
        case 'translate':
          result = await smartAIManager.smartTranslate(text, operation.targetLanguage || 'es');
          break;
        case 'ask':
          result = await smartAIManager.smartAskQuestion(operation.question, text);
          break;
        case 'check':
          result = await apiManager.improveWriting(text, operation.mode || 'proofread');
          break;
        case 'analyze':
          result = await smartAIManager.analyzeDocument(text);
          break;
        default:
          throw new Error(`Unknown operation: ${operation.type}`);
      }
      
      const endTime = performance.now();
      this.updatePerformanceMetrics(endTime - startTime, 'single');
      
      return result;
    } catch (error) {
      console.error(`Operation ${operation.type} failed:`, error);
      throw error;
    }
  }

  /**
   * Get Streaming Prompts for Different Operations
   */
  getStreamingPrompt(operation) {
    const prompts = {
      summarize: `You are an expert summarizer. Create a clear, concise summary that captures the key points.`,
      translate: `You are a professional translator. Translate the text accurately while preserving meaning and tone.`,
      ask: `You are a helpful assistant. Answer questions clearly and provide useful information.`,
      check: `You are a professional editor. Check for errors and suggest improvements.`,
      analyze: `You are a document analyst. Analyze the text and provide insights about its content and structure.`
    };
    
    return prompts[operation.type] || prompts.summarize;
  }

  /**
   * Check if Result is Good Enough for Early Termination
   */
  isGoodEnough(result, operation) {
    if (operation.type === 'summarize') {
      return result.length > 100 && result.includes('.');
    } else if (operation.type === 'translate') {
      return result.length > 50 && result !== operation.text;
    } else if (operation.type === 'ask') {
      return result.length > 50 && result.includes('answer');
    }
    
    return result.length > 100;
  }

  /**
   * Cache Validation
   */
  isCacheValid(cached, text) {
    const age = Date.now() - cached.timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return age < maxAge && cached.textHash === this.hash(text);
  }

  /**
   * Performance Monitoring
   */
  updatePerformanceMetrics(responseTime, operationType) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) / 
      this.performanceMetrics.totalRequests;
    
    if (operationType === 'parallel') {
      this.performanceMetrics.parallelOperations++;
    } else if (operationType === 'streaming') {
      this.performanceMetrics.streamingOperations++;
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / Math.max(this.performanceMetrics.totalRequests, 1),
      activeRequests: this.activeRequests.size,
      queueLength: this.requestQueue.length
    };
  }

  /**
   * Utility Methods
   */
  hash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.activeRequests.clear();
    this.requestQueue = [];
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      parallelOperations: 0,
      streamingOperations: 0
    };
  }
}

const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;
