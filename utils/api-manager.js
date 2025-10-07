/**
 * API Manager for Chrome Built-in AI APIs (Chrome 138+)
 */

class AIAPIManager {
  constructor() {
    this.summarizer = null;
    this.translators = new Map();
    this.languageDetector = null;
    this.qaSession = null;
    this.writingSession = null;
    this.sessionTimeouts = new Map();
  }

  _getChromeVersion() {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async checkEnvironment() {
    const results = {
      summarizer: false,
      translator: false,
      languageDetector: false,
      languageModel: false,
      writer: false,
      proofreader: false,
      chromeVersion: this._getChromeVersion(),
      errors: []
    };

    if (results.chromeVersion < 138) {
      results.errors.push('Chrome 138+ required');
      return results;
    }

    try {
      if ('Summarizer' in self) {
        const avail = await self.Summarizer.availability();
        results.summarizer = avail === 'readily';
        results.summarizerStatus = avail;
      }

      if ('Translator' in self) {
        const avail = await self.Translator.availability();
        results.translator = avail === 'readily';
        results.translatorStatus = avail;
      }

      if ('LanguageDetector' in self) {
        const avail = await self.LanguageDetector.availability();
        results.languageDetector = avail === 'readily';
        results.detectorStatus = avail;
      }

      if ('LanguageModel' in self) {
        const avail = await self.LanguageModel.availability();
        results.languageModel = avail === 'readily';
        results.languageModelStatus = avail;
      }

      if ('Writer' in self) {
        const avail = await self.Writer.availability();
        results.writer = avail === 'readily';
        results.writerStatus = avail;
      }

      if ('Proofreader' in self) {
        const avail = await self.Proofreader.availability();
        results.proofreader = avail === 'readily';
        results.proofreaderStatus = avail;
      }
    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }

  async initSummarizer() {
    if (!('Summarizer' in self)) {
      throw new Error('Summarizer API not available');
    }

    const availability = await self.Summarizer.availability();
    
    if (availability === 'no') {
      throw new Error('Summarizer not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    if (availability === 'downloading') {
      return { downloading: true, message: 'Summarizer model is downloading...' };
    }

    this.summarizer = await self.Summarizer.create({
      type: 'key-points',
      format: 'markdown',
      length: 'short',
      sharedContext: 'Government forms and legal documents',
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputLanguages: ['en'],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const progress = Math.round(e.loaded * 100);
          console.log(`Summarizer: ${progress}%`);
          
          // Dispatch progress event
          window.dispatchEvent(new CustomEvent('modelDownloadProgress', {
            detail: { model: 'Summarizer', progress, loaded: e.loaded, total: e.total }
          }));
        });
      }
    });

    console.log('✅ Summarizer ready');
    return { ready: true };
  }

  async summarize(text, mode = 'key-points', options = {}) {
    if (!this.summarizer) {
      const init = await this.initSummarizer();
      if (init.needsDownload) return init;
    }

    const maxChunk = 4000;

    // Update summarizer options based on mode
    const modeOptions = {
      type: mode,
      format: 'markdown',
      length: 'short',
      context: options.context || 'Form text'
    };

    if (text.length <= maxChunk) {
      const result = await this.summarizer.summarize(text, modeOptions);
      return { summary: result, chunks: 1, success: true, mode };
    }

    const chunks = this._chunkText(text, maxChunk);
    const summaries = [];

    for (const chunk of chunks) {
      const result = await this.summarizer.summarize(chunk, {
        ...modeOptions,
        context: 'Document section'
      });
      summaries.push(result);
    }

    return {
      summary: summaries.join('\n\n'),
      chunks: chunks.length,
      success: true,
      mode
    };
  }

  async initLanguageDetector() {
    if (!('LanguageDetector' in self)) {
      throw new Error('LanguageDetector API not available');
    }

    const availability = await self.LanguageDetector.availability();
    
    if (availability === 'no') {
      throw new Error('Language Detector not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    if (availability === 'downloading') {
      return { downloading: true, message: 'Language Detector model is downloading...' };
    }

    this.languageDetector = await self.LanguageDetector.create({
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Language Detector: ${Math.round(e.loaded * 100)}%`);
          
          // Dispatch progress event
          window.dispatchEvent(new CustomEvent('modelDownloadProgress', {
            detail: { model: 'Language Detector', progress: Math.round(e.loaded * 100), loaded: e.loaded, total: e.total }
          }));
        });
      }
    });

    console.log('✅ Language Detector ready');
    return { ready: true };
  }

  async detectLanguage(text) {
    if (!this.languageDetector) {
      const init = await this.initLanguageDetector();
      if (init.needsDownload) return init;
    }

    const results = await this.languageDetector.detect(text);
    
    if (!results || results.length === 0) {
      throw new Error('No language detected');
    }

    const topResult = results[0];
    
    return {
      detectedLanguage: topResult.detectedLanguage,
      confidence: topResult.confidence,
      allResults: results.slice(0, 3),
      success: true,
      isReliable: topResult.confidence > 0.7,
      languageName: this._getLanguageName(topResult.detectedLanguage)
    };
  }

  _getLanguageName(code) {
    const languages = {
      'en': 'English', 'es': 'Spanish', 'zh': 'Chinese', 'fr': 'French',
      'de': 'German', 'ja': 'Japanese', 'ko': 'Korean', 'pt': 'Portuguese',
      'ru': 'Russian', 'ar': 'Arabic', 'hi': 'Hindi', 'it': 'Italian',
      'nl': 'Dutch', 'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian',
      'fi': 'Finnish', 'pl': 'Polish', 'tr': 'Turkish', 'th': 'Thai',
      'vi': 'Vietnamese'
    };
    return languages[code] || code.toUpperCase();
  }

  /**
   * Get supported translation languages
   */
  getSupportedLanguages() {
    // Based on Chrome's Translator API documentation
    // These are BCP 47 language codes
    return {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'pa': 'Punjabi',
      'te': 'Telugu',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'ur': 'Urdu',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pl': 'Polish',
      'uk': 'Ukrainian',
      'ro': 'Romanian',
      'nl': 'Dutch',
      'tr': 'Turkish',
      'vi': 'Vietnamese',
      'th': 'Thai',
      'id': 'Indonesian',
      'ms': 'Malay',
      'fil': 'Filipino',
      'sw': 'Swahili'
    };
  }

  async getTranslator(sourceLanguage, targetLanguage) {
    if (!('Translator' in self)) {
      throw new Error('Translator API not available');
    }

    const key = `${sourceLanguage}-${targetLanguage}`;

    if (this.translators.has(key)) {
      return this.translators.get(key);
    }

    const availability = await self.Translator.availability({
      sourceLanguage,
      targetLanguage
    });

    if (availability === 'no') {
      throw new Error(`Translation ${sourceLanguage}→${targetLanguage} not supported`);
    }

    if (availability === 'after-download') {
      return {
        needsDownload: true,
        sourceLanguage,
        targetLanguage,
        message: `Language pack needed for ${sourceLanguage}→${targetLanguage}`
      };
    }

    const translator = await self.Translator.create({
      sourceLanguage,
      targetLanguage,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Translator ${key}: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });

    this.translators.set(key, translator);
    console.log(`✅ Translator ready: ${key}`);
    return translator;
  }

  async translate(text, targetLanguage, sourceLanguage = null) {
    // Auto-detect if not provided
    if (!sourceLanguage) {
      const detection = await this.detectLanguage(text);
      if (detection.needsDownload) return detection;
      
      sourceLanguage = detection.detectedLanguage;
      console.log(`Detected: ${sourceLanguage} (${detection.confidence})`);
      
      if (detection.confidence < 0.5) {
        sourceLanguage = 'en';
      }
    }

    // Skip if same language
    if (sourceLanguage === targetLanguage) {
      return {
        translation: text,
        sourceLanguage,
        targetLanguage,
        unchanged: true,
        message: `Text is already in ${targetLanguage}`,
        success: true
      };
    }

    const translator = await this.getTranslator(sourceLanguage, targetLanguage);
    
    if (translator.needsDownload) {
      return translator;
    }

    // Translator API handles formatting automatically - no need for complex prompts
    const translation = await translator.translate(text);
    
    return {
      translation: translation,
      sourceLanguage,
      targetLanguage,
      success: true
    };
  }

  async initQASession() {
    if (!('LanguageModel' in self)) {
      throw new Error('LanguageModel API not available');
    }

    const availability = await self.LanguageModel.availability();
    
    if (availability === 'no') {
      throw new Error('Language Model not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    // Use params() to get valid ranges
    const params = await self.LanguageModel.params();
    console.log('LanguageModel params:', params);
    
    // Ensure parameters are within valid ranges
    const temperature = Math.min(Math.max(params.defaultTemperature, 0), params.maxTemperature);
    const topK = Math.min(Math.max(params.defaultTopK, 1), params.maxTopK);
    
    console.log(`Using temperature: ${temperature}, topK: ${topK}`);
    
    this.qaSession = await self.LanguageModel.create({
      systemPrompt: `You are a government form advisor helping immigrants and seniors complete official documents.

CRITICAL: Every answer must include:
1. WHAT to do (specific action)
2. WHY it matters (real consequences)
3. WHERE to find information (exact document/field)
4. WHEN to act (deadlines if applicable)

Response format:
ACTION: [What they should do right now]
WHY: [Why this matters - consequences of errors]
WHERE: [Which form/field/document - be specific]
DEADLINE: [If time-sensitive]

Example:
User asks: "What does this mean?"
Bad: "This describes your taxpayer rights when dealing with the IRS..."
Good: 
ACTION: When audited, you can formally dispute any amount the IRS claims you owe.
WHY: Without this, many people pay incorrect amounts. One user saved $3,400 by filing objection.
WHERE: Cite "Right to Challenge IRS Position" - reference Form 12203 and IRS Publication 1
DEADLINE: File written objection within 30 days of IRS notice.

Never give generic explanations. Always give specific, actionable steps.`,
      temperature: temperature,
      topK: topK,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Gemini Nano: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });

    this._setSessionTimeout('qa');
    console.log('✅ Q&A session ready');
    return { ready: true };
  }

  async askQuestion(question, context = '') {
    if (!this.qaSession) {
      const init = await this.initQASession();
      if (init.needsDownload) return init;
    }

    const usage = this.qaSession.tokensSoFar || 0;
    const max = this.qaSession.maxTokens || 4096;
    
    if (usage > max * 0.8) {
      console.log('⚠️ Cloning session...');
      const newSession = await this.qaSession.clone();
      this.qaSession.destroy();
      this.qaSession = newSession;
    }

    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nFORMAT YOUR RESPONSE AS:\n• **Answer**: Direct response to the question\n• **Key Points**: Important details from the context\n• **Additional Info**: Relevant supplementary information\n\nUse bullet points for clarity and **bold** for emphasis.`
      : `${question}\n\nFORMAT YOUR RESPONSE AS:\n• **Answer**: Direct response to the question\n• **Key Points**: Important details\n• **Additional Info**: Relevant supplementary information\n\nUse bullet points for clarity and **bold** for emphasis.`;

    try {
      console.log('Asking question with prompt:', prompt.substring(0, 100) + '...');
      const response = await this.qaSession.prompt(prompt);
      this._setSessionTimeout('qa');
      return { answer: response, success: true };
    } catch (error) {
      console.error('❌ Q&A failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Enhanced session management
  async createLanguageModel(options = {}) {
    if (!('LanguageModel' in self)) {
      throw new Error('LanguageModel API not available');
    }

    const availability = await self.LanguageModel.availability();
    
    if (availability === 'no') {
      throw new Error('Language Model not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    const params = await self.LanguageModel.params();
    const temperature = Math.min(Math.max(options.temperature || params.defaultTemperature, 0), params.maxTemperature);
    const topK = Math.min(Math.max(options.topK || params.defaultTopK, 1), params.maxTopK);
    
    const session = await self.LanguageModel.create({
      systemPrompt: (options.systemPrompt || 'You are a helpful assistant.') + `

FORMATTING RULES:
- Generate clean, properly formatted output
- Use single bullet points (-) or numbered lists (1.) - NEVER duplicate them
- NEVER create "1. 1. text" or "- - text" patterns
- Use **bold** only when necessary and appropriate
- Maintain proper line breaks and paragraph spacing
- Keep formatting minimal, clean, and professional`,
      temperature: temperature,
      topK: topK,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Language Model: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });

    console.log('✅ Language Model session created');
    return session;
  }

  // Alias for compatibility with sidebar.js
  async createLanguageModelSession(options = {}) {
    return await this.createLanguageModel(options);
  }

  async createTranslator(sourceLanguage, targetLanguage) {
    return await this.getTranslator(sourceLanguage, targetLanguage);
  }

  async checkTranslationSupport(sourceLanguage, targetLanguage) {
    if (!('Translator' in self)) {
      return 'unavailable';
    }

    try {
      const availability = await self.Translator.availability({
        sourceLanguage,
        targetLanguage
      });
      return availability;
    } catch (error) {
      console.error('Translation support check failed:', error);
      return 'unavailable';
    }
  }

  async *askQuestionStreaming(question, context = '') {
    if (!this.qaSession) {
      await this.initQASession();
    }

    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

    const stream = this.qaSession.promptStreaming(prompt);
    
    for await (const chunk of stream) {
      yield chunk;
    }

    this._setSessionTimeout('qa');
  }

  async initWritingSession(mode = 'proofread') {
    if (!('LanguageModel' in self)) {
      throw new Error('LanguageModel API not available');
    }

    const prompts = {
      proofread: `Check for spelling, grammar, and clarity. Suggest improvements.`,
      formal: `Rewrite text to be formal and professional for official documents.`,
      simplify: `Simplify complex text into clear, simple language.`,
      expand: `Expand brief text with relevant detail and context.`
    };

    const availability = await self.LanguageModel.availability();
    
    if (availability === 'no') {
      throw new Error('Language Model not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    const params = await self.LanguageModel.params();
    console.log('LanguageModel params for writing:', params);

    // Ensure parameters are within valid ranges
    const temperature = Math.min(Math.max(params.defaultTemperature, 0), params.maxTemperature);
    const topK = Math.min(Math.max(params.defaultTopK, 1), params.maxTopK);
    
    console.log(`Using temperature: ${temperature}, topK: ${topK} for writing`);

    this.writingSession = await self.LanguageModel.create({
      systemPrompt: prompts[mode] || prompts.proofread,
      temperature: temperature,
      topK: topK,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    this._setSessionTimeout('writing');
    console.log(`✅ Writing session ready (${mode})`);
    return { ready: true };
  }

  async initWriterAPI() {
    if (!('Writer' in self)) {
      throw new Error('Writer API not available');
    }

    const availability = await self.Writer.availability();
    
    if (availability === 'no') {
      throw new Error('Writer API not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    if (availability === 'downloading') {
      return { downloading: true, message: 'Writer model is downloading...' };
    }

    this.writer = await self.Writer.create({
      tone: 'neutral',
      format: 'plain-text',
      length: 'medium',
      sharedContext: 'Government forms and legal documents',
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Writer: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });

    console.log('✅ Writer API ready');
    return { ready: true };
  }

  async generateContent(prompt, context = '', options = {}) {
    if (!this.writer) {
      const init = await this.initWriterAPI();
      if (init.needsDownload) return init;
    }

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    
    try {
      const result = await this.writer.write(fullPrompt, options);
      return { 
        content: result, 
        success: true, 
        generated: true,
        prompt: prompt,
        context: context
      };
    } catch (error) {
      console.error('Writer API failed:', error);
      throw error;
    }
  }

  async initProofreaderAPI() {
    if (!('Proofreader' in self)) {
      console.warn('Proofreader API not supported in this Chrome version');
      throw new Error('Proofreader API not available - requires Chrome 141+ with origin trial');
    }

    const availability = await self.Proofreader.availability();
    
    if (availability === 'unavailable') {
      throw new Error('Proofreader API not available');
    }

    if (availability === 'after-download') {
      return { needsDownload: true };
    }

    this.proofreader = await self.Proofreader.create({
      expectedInputLanguages: ['en'],
      expectedOutputLanguages: ['en'],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Proofreader: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });

    console.log('✅ Proofreader API ready');
    return { ready: true };
  }

  async proofreadText(text) {
    if (!this.proofreader) {
      const init = await this.initProofreaderAPI();
      if (init.needsDownload) return init;
    }

    try {
      const result = await this.proofreader.proofread(text);
      
      return {
        corrected: result.correction,
        corrections: result.corrections,
        success: true,
        original: text,
        hasErrors: result.corrections.length > 0
      };
    } catch (error) {
      console.error('Proofreader API failed:', error);
      throw error;
    }
  }

  async improveWriting(text, mode = 'proofread') {
    // Try Proofreader API first
    try {
      const result = await this.proofreadText(text);
      if (result.needsDownload) return result;
      
      return {
        improved: result.corrected,
        mode: 'proofread',
        success: true,
        original: text,
        corrections: result.corrections,
        hasErrors: result.hasErrors
      };
    } catch (error) {
      console.warn('Proofreader API failed, using LanguageModel fallback:', error.message);
      
      // Fallback to LanguageModel for grammar checking
      const session = await this.createLanguageModelSession({
        systemPrompt: `You are a professional proofreader. Fix grammar, spelling, and punctuation errors in the given text. 
        
        Return ONLY the corrected text without any explanations or formatting. 
        Preserve the original meaning and tone.`,
        temperature: 0.1
      });

      const improved = await session.prompt(`Fix this text:\n\n${text}`);
      
      return {
        improved: improved,
        mode: 'proofread',
        success: true,
        original: text,
        corrections: [{ type: 'proofreading', original: text, corrected: improved }],
        hasErrors: text !== improved,
        fallback: true
      };
    }
  }

  async *improveWritingStreaming(text, mode = 'proofread') {
    await this.initWritingSession(mode);

    const prompts = {
      proofread: `Check this for errors:\n\n${text}`,
      formal: `Make this more formal:\n\n${text}`,
      simplify: `Simplify this:\n\n${text}`,
      expand: `Expand this:\n\n${text}`
    };

    const stream = this.writingSession.promptStreaming(prompts[mode]);
    
    for await (const chunk of stream) {
      yield chunk;
    }

    this._setSessionTimeout('writing');
  }

  // Enhanced streaming support for any language model session
  async *promptStreaming(session, prompt, options = {}) {
    if (!session || typeof session.promptStreaming !== 'function') {
      throw new Error('Invalid session or session does not support streaming');
    }

    try {
      const stream = session.promptStreaming(prompt, options);
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      throw error;
    }
  }

  async processMultimodalInput(prompt, files = [], options = {}) {
    if (!this.qaSession) {
      const init = await this.initQASession();
      if (init.needsDownload) return init;
    }

    try {
      // Process files and create multimodal prompt
      const processedFiles = await this._processFiles(files);
      
      const fullPrompt = this._buildMultimodalPrompt(prompt, processedFiles);
      
      const result = await this.qaSession.prompt(fullPrompt, options);
      
      return {
        response: result,
        success: true,
        prompt: prompt,
        files: processedFiles,
        multimodal: true
      };
    } catch (error) {
      console.error('Multimodal processing failed:', error);
      throw error;
    }
  }

  async processVoiceInput(audioBlob, context = '') {
    if (!this.qaSession) {
      const init = await this.initQASession();
      if (init.needsDownload) return init;
    }

    try {
      // Convert audio to base64 for processing
      const audioData = await this._blobToBase64(audioBlob);
      
      const prompt = `Please analyze this audio input and respond to the user's question. 
      
Context: ${context}

Audio data: [Voice input provided]

Please transcribe the audio and provide a helpful response based on the context provided.`;
      
      const result = await this.qaSession.prompt(prompt, {
        audio: audioData
      });
      
      return {
        response: result,
        success: true,
        prompt: prompt,
        audio: true,
        context: context
      };
    } catch (error) {
      console.error('Voice processing failed:', error);
      throw error;
    }
  }

  async _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async _processFiles(files) {
    const processedFiles = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const imageData = await this._processImageFile(file);
        processedFiles.push({
          type: 'image',
          data: imageData,
          name: file.name
        });
      } else if (file.type.startsWith('audio/')) {
        const audioData = await this._processAudioFile(file);
        processedFiles.push({
          type: 'audio',
          data: audioData,
          name: file.name
        });
      }
    }
    
    return processedFiles;
  }

  async _processImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async _processAudioFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  _buildMultimodalPrompt(textPrompt, files) {
    let prompt = textPrompt;
    
    if (files.length > 0) {
      prompt += '\n\nPlease analyze the following files and respond to my question:';
      
      files.forEach((file, index) => {
        if (file.type === 'image') {
          prompt += `\n\n[Image ${index + 1}: ${file.name}]`;
        } else if (file.type === 'audio') {
          prompt += `\n\n[Audio ${index + 1}: ${file.name}]`;
        }
      });
    }
    
    return prompt;
  }

  _chunkText(text, maxSize = 4000) {
    // Intelligent chunking for better AI processing
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      const potentialChunk = current + sentence;
      
      // Check if adding this sentence would exceed max size
      if (potentialChunk.length > maxSize) {
        if (current.trim()) {
          chunks.push(current.trim());
        }
        
        // If single sentence is too long, split it further
        if (sentence.length > maxSize) {
          const subChunks = this._splitLongSentence(sentence, maxSize);
          chunks.push(...subChunks.slice(0, -1)); // Add all but last
          current = subChunks[subChunks.length - 1]; // Last becomes current
        } else {
          current = sentence;
        }
      } else {
        current = potentialChunk;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  _splitLongSentence(sentence, maxSize) {
    // Split very long sentences by commas, then by clauses
    const parts = sentence.split(/[,;]/);
    const chunks = [];
    let current = '';

    for (const part of parts) {
      if ((current + part).length > maxSize) {
        if (current.trim()) {
          chunks.push(current.trim());
        }
        
        // If part is still too long, split by spaces
        if (part.length > maxSize) {
          const words = part.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if ((wordChunk + ' ' + word).length > maxSize) {
              if (wordChunk.trim()) {
                chunks.push(wordChunk.trim());
              }
              wordChunk = word;
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word;
            }
          }
          
          if (wordChunk.trim()) {
            current = wordChunk;
          }
        } else {
          current = part;
        }
      } else {
        current += (current ? ',' : '') + part;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }
    
    return chunks;
  }

  _setSessionTimeout(type) {
    if (this.sessionTimeouts.has(type)) {
      clearTimeout(this.sessionTimeouts.get(type));
    }

    const timeout = setTimeout(() => {
      if (type === 'qa' && this.qaSession) {
        this.qaSession.destroy();
        this.qaSession = null;
      } else if (type === 'writing' && this.writingSession) {
        this.writingSession.destroy();
        this.writingSession = null;
      }
    }, 5 * 60 * 1000);

    this.sessionTimeouts.set(type, timeout);
  }

  cleanup() {
    if (this.summarizer) {
      this.summarizer.destroy?.();
      this.summarizer = null;
    }

    for (const translator of this.translators.values()) {
      translator.destroy?.();
    }
    this.translators.clear();

    if (this.languageDetector) {
      this.languageDetector.destroy?.();
      this.languageDetector = null;
    }

    if (this.qaSession) {
      this.qaSession.destroy();
      this.qaSession = null;
    }

    if (this.writingSession) {
      this.writingSession.destroy();
      this.writingSession = null;
    }

    if (this.writer) {
      this.writer.destroy?.();
      this.writer = null;
    }

    if (this.proofreader) {
      this.proofreader.destroy?.();
      this.proofreader = null;
    }

    for (const timeout of this.sessionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.sessionTimeouts.clear();
  }
}

const apiManager = new AIAPIManager();

if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => apiManager.cleanup());
  }

export default apiManager;