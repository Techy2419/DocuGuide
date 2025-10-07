/**
 * Storage Manager - Handles user preferences (privacy-first design)
 * Only stores: theme, sidebar position
 * NEVER stores form content, queries, or translations
 */

const STORAGE_KEYS = {
  THEME: 'theme',
  SIDEBAR_POSITION: 'sidebarPosition',
  FIRST_RUN: 'firstRun'
};

class StorageManager {

  /**
   * Get theme preference (light/dark)
   */
  async getTheme() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
      return result[STORAGE_KEYS.THEME] || 'light';
    } catch (error) {
      console.error('Failed to get theme:', error);
      return 'light';
    }
  }

  /**
   * Set theme preference
   */
  async setTheme(theme) {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.THEME]: theme
      });
      console.log('✅ Theme saved:', theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  /**
   * Check if this is the first run
   */
  async isFirstRun() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.FIRST_RUN);
      return result[STORAGE_KEYS.FIRST_RUN] !== false;
    } catch (error) {
      console.error('Failed to check first run:', error);
      return true;
    }
  }

  /**
   * Mark first run as complete
   */
  async markFirstRunComplete() {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.FIRST_RUN]: false
      });
      console.log('✅ First run marked complete');
    } catch (error) {
      console.error('Failed to mark first run complete:', error);
    }
  }

  /**
   * Clear all stored data (for privacy/reset)
   */
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      console.log('✅ All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    try {
      const result = await chrome.storage.local.get(null);
      return result;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  // Session persistence methods
  async saveSession(sessionId, sessionData) {
    try {
      const sessions = await this.getSessions();
      sessions[sessionId] = {
        ...sessionData,
        timestamp: Date.now(),
        id: sessionId
      };
      await chrome.storage.local.set({ sessions });
      console.log(`💾 Session ${sessionId} saved`);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  async getSessions() {
    try {
      const result = await chrome.storage.local.get(['sessions']);
      return result.sessions || {};
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return {};
    }
  }

  async getSession(sessionId) {
    try {
      const sessions = await this.getSessions();
      return sessions[sessionId] || null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async deleteSession(sessionId) {
    try {
      const sessions = await this.getSessions();
      delete sessions[sessionId];
      await chrome.storage.local.set({ sessions });
      console.log(`🗑️ Session ${sessionId} deleted`);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  async clearOldSessions(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const sessions = await this.getSessions();
      const now = Date.now();
      let cleaned = 0;

      for (const [sessionId, session] of Object.entries(sessions)) {
        if (now - session.timestamp > maxAge) {
          delete sessions[sessionId];
          cleaned++;
        }
      }

      if (cleaned > 0) {
        await chrome.storage.local.set({ sessions });
        console.log(`🧹 Cleaned ${cleaned} old sessions`);
      }
    } catch (error) {
      console.error('Failed to clear old sessions:', error);
    }
  }

  // Conversation history persistence
  async saveConversation(sessionId, question, answer) {
    try {
      const conversations = await this.getConversations();
      if (!conversations[sessionId]) {
        conversations[sessionId] = [];
      }
      
      conversations[sessionId].push({
        question,
        answer,
        timestamp: Date.now()
      });

      // Keep only last 50 conversations per session
      if (conversations[sessionId].length > 50) {
        conversations[sessionId] = conversations[sessionId].slice(-50);
      }

      await chrome.storage.local.set({ conversations });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  async getConversations() {
    try {
      const result = await chrome.storage.local.get(['conversations']);
      return result.conversations || {};
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return {};
    }
  }

  async getSessionConversations(sessionId) {
    try {
      const conversations = await this.getConversations();
      return conversations[sessionId] || [];
    } catch (error) {
      console.error('Failed to get session conversations:', error);
      return [];
    }
  }

  async clearSessionConversations(sessionId) {
    try {
      const conversations = await this.getConversations();
      delete conversations[sessionId];
      await chrome.storage.local.set({ conversations });
    } catch (error) {
      console.error('Failed to clear session conversations:', error);
    }
  }

  // Advanced settings management
  async setSetting(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      console.log(`Setting saved: ${key} = ${value}`);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  async clearSettings() {
    try {
      const keys = [
        'defaultLanguage',
        'defaultSummarizationMode', 
        'autoSaveConversations',
        'showTokenUsage',
        'enableAnimations',
        'theme',
        'hasSeenOnboarding'
      ];
      
      await chrome.storage.local.remove(keys);
      console.log('Settings cleared');
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }

  async clearAllData() {
    try {
      await chrome.storage.local.clear();
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
}

const storageManager = new StorageManager();
export default storageManager;
