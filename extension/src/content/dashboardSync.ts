/**
 * Dashboard Token Sync Content Script
 *
 * This script runs on the PromptLens dashboard domain and synchronizes
 * authentication tokens from the dashboard's localStorage to the extension's
 * chrome.storage.local, enabling seamless authentication across the extension.
 */

console.log('[PromptLens Dashboard Sync] Content script loaded');

const AUTH_STORAGE_KEY = 'authToken';
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
 * Fetch token from /api/token endpoint (most reliable method)
 */
async function fetchTokenFromAPI(): Promise<boolean> {
  try {
    console.log('[PromptLens Dashboard Sync] Fetching token from /api/token');
    const response = await fetch('/api/token', {
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const data: DashboardTokenData = await response.json();
      if (data.accessToken) {
        const extensionToken: ExtensionAuthToken = {
          token: data.accessToken,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : undefined
        };

        await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: extensionToken });
        console.log(
          '[PromptLens Dashboard Sync] ✅ Token fetched from API and synced to extension storage'
        );
        console.log(
          '[PromptLens Dashboard Sync] Token expires at:',
          extensionToken.expiresAt ? new Date(extensionToken.expiresAt).toISOString() : 'never'
        );
        return true;
      }
    } else if (response.status === 401) {
      console.log('[PromptLens Dashboard Sync] No active session, clearing extension storage');
      await chrome.storage.local.remove([AUTH_STORAGE_KEY]);
      return false; // Return false to indicate no session
    }
  } catch (error) {
    console.error('[PromptLens Dashboard Sync] Error fetching token from API:', error);
  }
  return false;
}

/**
 * Sync token from dashboard localStorage to extension storage (fallback method)
 */
function syncTokenFromLocalStorage(): void {
  try {
    const tokenDataStr = localStorage.getItem(DASHBOARD_TOKEN_KEY);

    if (!tokenDataStr) {
      console.log('[PromptLens Dashboard Sync] No token found in localStorage');
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
        console.error(
          '[PromptLens Dashboard Sync] Error saving token to extension:',
          chrome.runtime.lastError
        );
      } else {
        console.log(
          '[PromptLens Dashboard Sync] ✅ Token synced from localStorage to extension storage'
        );
        console.log(
          '[PromptLens Dashboard Sync] Token expires at:',
          extensionToken.expiresAt ? new Date(extensionToken.expiresAt).toISOString() : 'never'
        );
      }
    });
  } catch (error) {
    console.error('[PromptLens Dashboard Sync] Error syncing token from localStorage:', error);
  }
}

/**
 * Combined sync function that tries API first, then localStorage
 */
async function syncToken(): Promise<void> {
  console.log('[PromptLens Dashboard Sync] Starting token sync...');

  // Try fetching from API first (most reliable)
  const hasSession = await fetchTokenFromAPI();

  // Only check localStorage if we have an active session
  if (hasSession) {
    syncTokenFromLocalStorage();
  } else {
    console.log('[PromptLens Dashboard Sync] No token found in localStorage');
  }
}

/**
 * Listen for storage changes in the dashboard
 */
function setupStorageListener(): void {
  window.addEventListener('storage', (event) => {
    if (event.key === DASHBOARD_TOKEN_KEY) {
      console.log('[PromptLens Dashboard Sync] Storage change detected for token');
      syncToken();
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
    syncToken();
  });
}

/**
 * Listen for page visibility changes to sync when tab becomes visible
 */
function setupVisibilityListener(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[PromptLens Dashboard Sync] Page became visible, syncing token');
      syncToken();
    }
  });
}

/**
 * Periodically check for token changes
 * This handles cases where the storage event might be missed
 */
function setupPeriodicSync(): void {
  // Wait 5 seconds before initial sync to allow login/redirect to complete
  console.log('[PromptLens Dashboard Sync] Waiting 5 seconds before initial sync...');
  setTimeout(() => {
    console.log('[PromptLens Dashboard Sync] Running initial token sync');
    syncToken();
  }, 5000);

  // Sync every 60 seconds (reduced from 30s to avoid overwhelming during login)
  setInterval(() => {
    console.log('[PromptLens Dashboard Sync] Running periodic token sync');
    syncToken();
  }, 60000);
}

/**
 * Monitor DOM mutations to detect when the app becomes ready
 * DISABLED: This was causing too many sync attempts during login
 */
function setupDOMObserver(): void {
  // Commented out to prevent interference with login flow
  // const observer = new MutationObserver(() => {
  //   syncToken();
  // });
  // observer.observe(document.documentElement, {
  //   childList: true,
  //   subtree: true
  // });
  // setTimeout(() => {
  //   observer.disconnect();
  // }, 30000);
  console.log('[PromptLens Dashboard Sync] DOM observer disabled to prevent login interference');
}

// Detect if we're on the dashboard
if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
  console.log('[PromptLens Dashboard Sync] On dashboard, initializing sync mechanisms...');

  // Initialize all sync mechanisms
  setupStorageListener();
  setupCustomEventListener();
  setupVisibilityListener();
  setupPeriodicSync();
  setupDOMObserver();

  console.log('[PromptLens Dashboard Sync] All sync mechanisms initialized');
} else {
  console.log('[PromptLens Dashboard Sync] Not on dashboard domain, skipping initialization');
}
