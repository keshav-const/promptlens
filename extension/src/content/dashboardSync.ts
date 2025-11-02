/**
 * Dashboard Token Sync Content Script
 * 
 * This script runs on the PromptLens dashboard domain and synchronizes
 * authentication tokens from the dashboard's localStorage to the extension's
 * chrome.storage.local, enabling seamless authentication across the extension.
 */

console.log('[PromptLens Dashboard Sync] Content script loaded');

const AUTH_STORAGE_KEY = 'promptlens_auth_token';
const DASHBOARD_TOKEN_KEY = 'auth_token_data';

interface DashboardTokenData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expiresAt?: string;
}

interface ExtensionAuthToken {
  token: string;
  expiresAt?: number;
}

/**
 * Sync token from dashboard localStorage to extension storage
 */
function syncTokenToExtension(): void {
  try {
    const tokenDataStr = localStorage.getItem(DASHBOARD_TOKEN_KEY);
    
    if (!tokenDataStr) {
      console.log('[PromptLens Dashboard Sync] No token found in localStorage, clearing extension storage');
      chrome.storage.local.remove([AUTH_STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          console.error('[PromptLens Dashboard Sync] Error clearing token:', chrome.runtime.lastError);
        } else {
          console.log('[PromptLens Dashboard Sync] Token cleared from extension storage');
        }
      });
      return;
    }

    const dashboardToken: DashboardTokenData = JSON.parse(tokenDataStr);
    
    if (!dashboardToken.accessToken) {
      console.warn('[PromptLens Dashboard Sync] No accessToken in dashboard token data');
      return;
    }

    // Convert dashboard token format to extension token format
    const extensionToken: ExtensionAuthToken = {
      token: dashboardToken.accessToken,
      expiresAt: dashboardToken.expiresAt ? new Date(dashboardToken.expiresAt).getTime() : undefined
    };

    // Store in extension storage
    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: extensionToken }, () => {
      if (chrome.runtime.lastError) {
        console.error('[PromptLens Dashboard Sync] Error saving token to extension:', chrome.runtime.lastError);
      } else {
        console.log('[PromptLens Dashboard Sync] ✅ Token synced to extension storage');
        console.log('[PromptLens Dashboard Sync] Token expires at:', extensionToken.expiresAt ? new Date(extensionToken.expiresAt).toISOString() : 'never');
      }
    });
  } catch (error) {
    console.error('[PromptLens Dashboard Sync] Error syncing token:', error);
  }
}

/**
 * Listen for storage changes in the dashboard
 */
function setupStorageListener(): void {
  window.addEventListener('storage', (event) => {
    if (event.key === DASHBOARD_TOKEN_KEY) {
      console.log('[PromptLens Dashboard Sync] Storage change detected for token');
      syncTokenToExtension();
    }
  });
}

/**
 * Custom event listener for same-tab token changes
 * (storage event doesn't fire in the same tab that makes the change)
 */
function setupCustomEventListener(): void {
  window.addEventListener('promptlens-token-updated', () => {
    console.log('[PromptLens Dashboard Sync] Custom token update event received');
    syncTokenToExtension();
  });
}

/**
 * Periodically check for token changes
 * This handles cases where the storage event might be missed
 */
function setupPeriodicSync(): void {
  // Initial sync
  syncTokenToExtension();
  
  // Sync every 5 seconds to catch any changes
  setInterval(() => {
    syncTokenToExtension();
  }, 5000);
}

/**
 * Monitor DOM mutations to detect when the app becomes ready
 */
function setupDOMObserver(): void {
  const observer = new MutationObserver(() => {
    // Trigger a sync when significant DOM changes occur
    // This helps catch token changes after login redirects
    syncTokenToExtension();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Stop observing after 30 seconds to avoid unnecessary work
  setTimeout(() => {
    observer.disconnect();
  }, 30000);
}

// Initialize all sync mechanisms
setupStorageListener();
setupCustomEventListener();
setupPeriodicSync();
setupDOMObserver();

console.log('[PromptLens Dashboard Sync] All sync mechanisms initialized');
