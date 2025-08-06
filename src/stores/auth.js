import { defineStore } from 'pinia'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'

const config = __APP_CONFIG__

// Helper to get Cognito domain (removes underscore from user pool ID)
const getCognitoDomain = () => {
  return config.AWS_COGNITO_USER_POOL_ID.replace(/_/g, '')
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    idToken: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    credentials: null,
    codeVerifier: null,
    user: null
  }),

  getters: {
    isAuthenticated: (state) => {
      return state.idToken && state.expiresAt && Date.now() < state.expiresAt
    }
  },

  actions: {
    // Generate code verifier and challenge for PKCE
    async generateCodeChallenge() {
      const generateRandomString = (length) => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
        const randomValues = crypto.getRandomValues(new Uint8Array(length))
        return Array.from(randomValues)
          .map(x => charset[x % charset.length])
          .join('')
      }

      const sha256 = async (plain) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        const hash = await crypto.subtle.digest('SHA-256', data)
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      this.codeVerifier = generateRandomString(128)
      sessionStorage.setItem('code_verifier', this.codeVerifier)
      
      const codeChallenge = await sha256(this.codeVerifier)
      return codeChallenge
    },

    async checkAuth() {
      // Check for authorization code in URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      const authData = localStorage.getItem('authData');
      if (code && !authData) {
        await this.handleAuthCallback(code)
        return
      }

      // Check localStorage for existing auth
      if (!authData) {
        this.redirectToLogin()
        return
      }

      try {
        const parsed = JSON.parse(authData)
        if (Date.now() > parsed.expiresAt) {
          // Try to refresh token
          if (parsed.refreshToken) {
            await this.refreshTokens(parsed.refreshToken)
          } else {
            localStorage.removeItem('authData')
            this.redirectToLogin()
          }
          return
        }

        this.idToken = parsed.idToken
        this.accessToken = parsed.accessToken
        this.refreshToken = parsed.refreshToken
        this.expiresAt = parsed.expiresAt
        this.user = parsed.user
        await this.initializeAWSCredentials()
      } catch (error) {
        console.error('Auth check error:', error)
        this.redirectToLogin()
      }
    },

    async handleAuthCallback(code) {
      try {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Get code verifier from session storage
        const codeVerifier = sessionStorage.getItem('code_verifier')
        if (!codeVerifier) {
          throw new Error('Code verifier not found')
        }

        // Exchange code for tokens
        const tokenEndpoint = `https://${getCognitoDomain()}.auth.${config.AWS_REGION}.amazoncognito.com/oauth2/token`

        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.AWS_COGNITO_CLIENT_ID,
          code: code,
          redirect_uri: window.location.origin,
          code_verifier: codeVerifier
        })

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Token exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            params: {
              grant_type: 'authorization_code',
              client_id: config.AWS_COGNITO_CLIENT_ID,
              code: code.substring(0, 10) + '...', // Log partial code for debugging
              redirect_uri: window.location.origin,
              code_verifier: codeVerifier.substring(0, 10) + '...' // Log partial verifier
            }
          })
          throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
        }

        const tokens = await response.json()
        
        // Parse ID token to get user info
        const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]))
        
        this.idToken = tokens.id_token
        this.accessToken = tokens.access_token
        this.refreshToken = tokens.refresh_token
        this.expiresAt = Date.now() + (tokens.expires_in * 1000)
        this.user = {
          email: idTokenPayload.email,
          username: idTokenPayload['cognito:username']
        }

        // Save to localStorage
        localStorage.setItem('authData', JSON.stringify({
          idToken: this.idToken,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          expiresAt: this.expiresAt,
          user: this.user
        }))
        
        // Clean up session storage
        sessionStorage.removeItem('code_verifier')

        // Initialize AWS credentials
        await this.initializeAWSCredentials()
      } catch (error) {
        console.error('Auth callback error:', error)
        this.redirectToLogin()
      }
    },

    async refreshTokens(refreshToken) {
      try {
        const tokenEndpoint = `https://${getCognitoDomain()}.auth.${config.AWS_REGION}.amazoncognito.com/oauth2/token`
        
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.AWS_COGNITO_CLIENT_ID,
          refresh_token: refreshToken
        })

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        })

        if (!response.ok) {
          throw new Error('Token refresh failed')
        }

        const tokens = await response.json()
        
        // Parse ID token to get user info
        const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]))
        
        this.idToken = tokens.id_token
        this.accessToken = tokens.access_token
        this.expiresAt = Date.now() + (tokens.expires_in * 1000)
        this.user = {
          email: idTokenPayload.email,
          username: idTokenPayload['cognito:username']
        }

        // Update localStorage (keep existing refresh token)
        localStorage.setItem('authData', JSON.stringify({
          idToken: this.idToken,
          accessToken: this.accessToken,
          refreshToken: refreshToken,
          expiresAt: this.expiresAt,
          user: this.user
        }))

        await this.initializeAWSCredentials()
      } catch (error) {
        console.error('Token refresh error:', error)
        localStorage.removeItem('authData')
        this.redirectToLogin()
      }
    },

    async initializeAWSCredentials() {
      this.credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: config.AWS_REGION }),
        identityPoolId: config.AWS_COGNITO_IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.AWS_COGNITO_USER_POOL_ID}`]: this.idToken
        }
      })
    },

    async redirectToLogin() {
      // Generate PKCE challenge
      const codeChallenge = await this.generateCodeChallenge()
      
      const params = new URLSearchParams({
        client_id: config.AWS_COGNITO_CLIENT_ID,
        response_type: 'code',
        scope: 'email openid',
        redirect_uri: window.location.origin,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      
      const loginUrl = `https://${getCognitoDomain()}.auth.${config.AWS_REGION}.amazoncognito.com/login?${params.toString()}`
      window.location.replace(loginUrl)
    },

    logout() {
      localStorage.removeItem('authData')
      sessionStorage.removeItem('code_verifier')
      
      const params = new URLSearchParams({
        client_id: config.AWS_COGNITO_CLIENT_ID,
        logout_uri: window.location.origin
      })
      
      const logoutUrl = `https://${getCognitoDomain()}.auth.${config.AWS_REGION}.amazoncognito.com/logout?${params.toString()}`
      window.location.replace(logoutUrl)
    }
  }
})