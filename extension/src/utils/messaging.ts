export enum MessageType {
  PING = 'PING',
  PONG = 'PONG',
  GET_CONFIG = 'GET_CONFIG',
  SET_CONFIG = 'SET_CONFIG',
  API_REQUEST = 'API_REQUEST',
  API_RESPONSE = 'API_RESPONSE',
  ERROR = 'ERROR',
  GET_AUTH_TOKEN = 'GET_AUTH_TOKEN',
  SET_AUTH_TOKEN = 'SET_AUTH_TOKEN',
  CLEAR_AUTH_TOKEN = 'CLEAR_AUTH_TOKEN',
  OPTIMIZE_PROMPT = 'OPTIMIZE_PROMPT',
  SAVE_PROMPT = 'SAVE_PROMPT'
}

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
  error?: string;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export const sendMessageToBackground = <T = unknown>(
  message: Message
): Promise<MessageResponse<T>> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        resolve(response || { success: false, error: 'No response' });
      }
    });
  });
};

export const sendMessageToTab = <T = unknown>(
  tabId: number,
  message: Message
): Promise<MessageResponse<T>> => {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        resolve(response || { success: false, error: 'No response' });
      }
    });
  });
};

export const onMessage = (
  callback: (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => boolean | void
): void => {
  chrome.runtime.onMessage.addListener(callback);
};
