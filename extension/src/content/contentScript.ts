import { sendMessageToBackground, MessageType } from '@/utils/messaging';

console.log('Content script loaded on:', window.location.href);

const detectPlatform = (): 'chatgpt' | 'gemini' | 'unknown' => {
  const hostname = window.location.hostname;

  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }

  return 'unknown';
};

const platform = detectPlatform();
console.log('Detected platform:', platform);

const initialize = async () => {
  try {
    const response = await sendMessageToBackground({
      type: MessageType.PING,
      payload: {
        platform,
        url: window.location.href,
        timestamp: Date.now()
      }
    });

    if (response.success) {
      console.log('Content script connected to background:', response.data);
    } else {
      console.error('Failed to connect to background:', response.error);
    }
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
};

const observePageChanges = () => {
  const observer = new MutationObserver((mutations) => {
    console.log('Page mutations detected:', mutations.length);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    observePageChanges();
  });
} else {
  initialize();
  observePageChanges();
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type && event.data.type.startsWith('AI_CHAT_')) {
    console.log('Received message from page:', event.data);
  }
});
