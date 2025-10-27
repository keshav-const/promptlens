import { Message, MessageType, onMessage } from '@/utils/messaging';
import { getConfig, setConfig, AppConfig } from '@/utils/config';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/utils/auth';

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

    case MessageType.GET_AUTH_TOKEN:
      getAuthToken()
        .then((token) => {
          sendResponse({ success: true, data: token });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case MessageType.SET_AUTH_TOKEN:
      setAuthToken(
        (message.payload as { token: string; expiresAt?: number }).token,
        (message.payload as { token: string; expiresAt?: number }).expiresAt
      )
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case MessageType.CLEAR_AUTH_TOKEN:
      clearAuthToken()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case MessageType.OPTIMIZE_PROMPT:
      handleOptimizePrompt(message.payload)
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message, status: error.status });
        });
      return true;

    case MessageType.SAVE_PROMPT:
      handleSavePrompt(message.payload)
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

interface ApiError extends Error {
  status?: number;
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

interface OptimizePromptPayload {
  prompt: string;
}

async function handleOptimizePrompt(payload: unknown): Promise<unknown> {
  const config = await getConfig();
  const token = await getAuthToken();
  const { prompt } = payload as OptimizePromptPayload;

  if (!token) {
    const error: ApiError = new Error('Authentication required. Please sign in via the dashboard.');
    error.status = 401;
    throw error;
  }

  const url = `${config.apiBaseUrl}/api/optimize`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ prompt })
  });

  if (response.status === 401) {
    await clearAuthToken();
    const error: ApiError = new Error('Session expired. Please sign in again via the dashboard.');
    error.status = 401;
    throw error;
  }

  if (response.status === 429) {
    const error: ApiError = new Error('Rate limit exceeded. Please try again later.');
    error.status = 429;
    throw error;
  }

  if (!response.ok) {
    let errorMessage = 'Failed to optimize prompt. Please try again.';
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    const error: ApiError = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

interface SavePromptPayload {
  originalPrompt: string;
  optimizedPrompt: string;
  explanation?: string;
}

async function handleSavePrompt(payload: unknown): Promise<unknown> {
  const config = await getConfig();
  const token = await getAuthToken();
  const { originalPrompt, optimizedPrompt, explanation } = payload as SavePromptPayload;

  if (!token) {
    const error: ApiError = new Error('Authentication required. Please sign in via the dashboard.');
    error.status = 401;
    throw error;
  }

  const url = `${config.apiBaseUrl}/api/prompts/save`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ originalPrompt, optimizedPrompt, explanation })
  });

  if (response.status === 401) {
    await clearAuthToken();
    const error: ApiError = new Error('Session expired. Please sign in again via the dashboard.');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    let errorMessage = 'Failed to save prompt. Please try again.';
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

chrome.runtime.onSuspend.addListener(() => {
  console.log('Background service worker suspending');
});
