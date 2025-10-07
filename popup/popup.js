/**
 * DocuGuide Popup UI Logic
 * Simple 3-step guide interface
 */

// DOM Elements
const elements = {
  // Header actions
  closeBtn: document.getElementById('closeBtn'),
  
  // Main actions
  openSidebarBtn: document.getElementById('openSidebarBtn'),
  scanFormBtn: document.getElementById('scanFormBtn'),
  
  // Privacy modal
  privacyBadge: document.getElementById('privacyBadge'),
  privacyModal: document.getElementById('privacyModal'),
  closePrivacyModal: document.getElementById('closePrivacyModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  learnMoreBtn: document.getElementById('learnMoreBtn'),
  gotItBtn: document.getElementById('gotItBtn')
};

// Modal state management
let isModalOpen = false;

// Utility functions
function showModal(modalElement) {
  if (isModalOpen) return;
  
  console.log('Showing privacy modal');
  isModalOpen = true;
  modalElement.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Focus management
  const focusableElements = modalElement.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

function hideModal(modalElement) {
  if (!isModalOpen) return;
  
  console.log('Hiding privacy modal');
  isModalOpen = false;
  modalElement.classList.remove('show');
  document.body.style.overflow = '';
  
  // Return focus to trigger element
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

function addButtonPulse(button) {
  button.style.animation = 'pulse 0.6s ease-in-out';
  setTimeout(() => {
    button.style.animation = '';
  }, 600);
}

// Event Listeners

// Header actions
elements.closeBtn?.addEventListener('click', () => {
  window.close();
});

// Main sidebar action
elements.openSidebarBtn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  } catch (error) {
    console.error('Failed to open sidebar:', error);
  }
});

// Form Guide functionality
elements.scanFormBtn?.addEventListener('click', async () => {
  console.log('Scanning form...');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Send message to content script to scan form
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanForm' });
    
    if (response.success) {
      console.log('Form scan completed successfully');
      // The form guide will show results on the page
      window.close();
    } else {
      throw new Error(response.error || 'Form scan failed');
    }
    
  } catch (error) {
    console.error('Form scan error:', error);
    alert('Failed to scan form. Please make sure you are on a page with forms.');
  }
});

// Privacy modal handling
elements.privacyBadge?.addEventListener('click', () => {
  showModal(elements.privacyModal);
});

elements.privacyBadge?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    showModal(elements.privacyModal);
  }
});

elements.closePrivacyModal?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Close button (X) clicked');
  hideModal(elements.privacyModal);
});

elements.closeModalBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Close button (text) clicked');
  hideModal(elements.privacyModal);
});

elements.gotItBtn?.addEventListener('click', () => {
  console.log('Got it button clicked');
  hideModal(elements.privacyModal);
});

elements.learnMoreBtn?.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://github.com/yourusername/formbridge#privacy'
  });
  hideModal(elements.privacyModal);
});

// Close modal on overlay click
elements.privacyModal?.addEventListener('click', (e) => {
  if (e.target === elements.privacyModal) {
    hideModal(elements.privacyModal);
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen) {
    hideModal(elements.privacyModal);
  }
});

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Add entrance animation
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    document.body.style.transition = 'all 0.3s ease-out';
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  });
  
  console.log('✅ DocuGuide popup loaded with step guide');
});
