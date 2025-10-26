export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expiresAt: string;
}

export class TokenStorage {
  private static readonly TOKEN_KEY = 'auth_token_data';

  static saveToken(tokenData: TokenData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
      sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  static getToken(): TokenData | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(this.TOKEN_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  static clearToken(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  static async fetchAndStoreToken(): Promise<TokenData | null> {
    if (typeof window === 'undefined') return null;

    try {
      const response = await fetch('/api/token');

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
        }
        return null;
      }

      const tokenData: TokenData = await response.json();
      this.saveToken(tokenData);
      return tokenData;
    } catch (error) {
      console.error('Failed to fetch token:', error);
      return null;
    }
  }
}
