export interface AppConfig {
  apiBaseUrl: string;
  extensionId: string;
}

const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  extensionId: import.meta.env.VITE_EXTENSION_ID || ''
};

export const getConfig = async (): Promise<AppConfig> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['config'], (result) => {
      const storedConfig = result.config || {};
      resolve({ ...DEFAULT_CONFIG, ...storedConfig });
    });
  });
};

export const setConfig = async (config: Partial<AppConfig>): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['config'], (result) => {
      const currentConfig = result.config || {};
      const newConfig = { ...currentConfig, ...config };

      chrome.storage.local.set({ config: newConfig }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
};

export const getApiBaseUrl = async (): Promise<string> => {
  const config = await getConfig();
  return config.apiBaseUrl;
};
