import { Message, MessageType, onMessage } from '@/utils/messaging';
import { getConfig, setConfig, AppConfig } from '@/utils/config';

console.log('Background service worker initialized');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    console.log('First time installation');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

onMessage((message: Message, sender, sendResponse) => {
  console.log('Background received message:', message.type, 'from:', sender.tab?.id);

  switch (message.type) {
    case MessageType.PING:
      sendResponse({
        success: true,
        data: { message: 'pong', timestamp: Date.now() }
      });
      return false;

    case MessageType.GET_CONFIG:
      getConfig()
        .then((config) => {
          sendResponse({ success: true, data: config });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case MessageType.SET_CONFIG:
      setConfig(message.payload as Partial<AppConfig>)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case MessageType.API_REQUEST:
      handleApiRequest(message.payload)
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    default:
      sendResponse({
        success: false,
        error: `Unknown message type: ${message.type}`
      });
      return false;
  }
});

interface ApiRequestPayload {
  endpoint: string;
  method?: string;
  body?: unknown;
}

async function handleApiRequest(payload: unknown): Promise<unknown> {
  const config = await getConfig();
  const { endpoint, method = 'GET', body } = payload as ApiRequestPayload;

  const url = `${config.apiBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

chrome.runtime.onSuspend.addListener(() => {
  console.log('Background service worker suspending');
});
