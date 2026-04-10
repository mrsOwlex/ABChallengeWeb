declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              error?: string
              expires_in?: number
            }) => void
          }) => TokenClient
        }
      }
    }
  }
}

interface TokenClient {
  requestAccessToken: () => void
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

export interface AuthTokens {
  accessToken: string
  expiresAt: number
}

function waitForGIS(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve()
      return
    }
    const interval = 100
    let elapsed = 0
    const poll = setInterval(() => {
      elapsed += interval
      if (window.google) {
        clearInterval(poll)
        resolve()
      } else if (elapsed >= timeout) {
        clearInterval(poll)
        reject(new Error('Google Identity Services failed to load'))
      }
    }, interval)
  })
}

class GoogleAuthService {
  private tokenClient: TokenClient | null = null
  private tokens: AuthTokens | null = null
  private callbackQueue: Array<(tokens: AuthTokens | null, error?: string) => void> = []
  private initPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    if (!CLIENT_ID) {
      console.error('CLIENT_ID missing')
      return
    }

    try {
      await waitForGIS()
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'GIS load failed')
      return
    }

    this.tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          console.error('Google Auth error:', response.error)
          this.callbackQueue.forEach(cb => cb(null, response.error))
          this.callbackQueue = []
          return
        }

        if (response.access_token && response.expires_in) {
          this.tokens = {
            accessToken: response.access_token,
            expiresAt: Date.now() + response.expires_in * 1000,
          }

          // Store in sessionStorage for page reloads
          sessionStorage.setItem('abchallenge_tokens', JSON.stringify(this.tokens))

          this.callbackQueue.forEach(cb => cb(this.tokens))
          this.callbackQueue = []
        }
      },
    })
  }

  loadTokensFromStorage(): boolean {
    const stored = sessionStorage.getItem('abchallenge_tokens')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthTokens
        // Check if token is still valid (with 5 minute buffer)
        if (parsed.expiresAt > Date.now() + 5 * 60 * 1000) {
          this.tokens = parsed
          return true
        }
      } catch {
        sessionStorage.removeItem('abchallenge_tokens')
      }
    }
    return false
  }

  signIn(): Promise<AuthTokens> {
    return new Promise(async (resolve, reject) => {
      if (!this.tokenClient && this.initPromise) {
        try {
          await this.initPromise
        } catch {
          reject(new Error('Google Auth failed to initialize'))
          return
        }
      }

      if (!this.tokenClient) {
        reject(new Error('Google Auth not initialized'))
        return
      }

      this.callbackQueue.push((tokens, error) => {
        if (error) {
          reject(new Error(error))
        } else if (tokens) {
          resolve(tokens)
        } else {
          reject(new Error('Unknown error during sign in'))
        }
      })

      this.tokenClient.requestAccessToken()
    })
  }

  signOut(): void {
    this.tokens = null
    sessionStorage.removeItem('abchallenge_tokens')
  }

  getAccessToken(): string | null {
    // Check if token is expired
    if (this.tokens && this.tokens.expiresAt <= Date.now() + 5 * 60 * 1000) {
      this.tokens = null
      sessionStorage.removeItem('abchallenge_tokens')
      return null
    }
    return this.tokens?.accessToken || null
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
  }

  async ensureAuthenticated(): Promise<string> {
    const token = this.getAccessToken()
    if (token) {
      return token
    }

    // Try to re-authenticate silently or prompt user
    const newTokens = await this.signIn()
    return newTokens.accessToken
  }
}

export const googleAuth = new GoogleAuthService()
