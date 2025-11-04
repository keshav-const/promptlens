export interface AuthToken {
  token: string;
  expiresAt?: number;
}

const AUTH_STORAGE_KEY = 'authToken';

export const getAuthToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_STORAGE_KEY], (result) => {
      const authData = result[AUTH_STORAGE_KEY] as AuthToken | undefined;
      if (!authData || !authData.token) {
        resolve(null);
        return;
      }

      if (authData.expiresAt && Date.now() > authData.expiresAt) {
        chrome.storage.local.remove([AUTH_STORAGE_KEY]);
        resolve(null);
        return;
      }

      resolve(authData.token);
    });
  });
};

export const setAuthToken = async (token: string, expiresAt?: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const authData: AuthToken = {
      token,
      expiresAt
    };

    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: authData }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const clearAuthToken = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([AUTH_STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const isTokenExpired = (expiresAt?: number): boolean => {
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
};
