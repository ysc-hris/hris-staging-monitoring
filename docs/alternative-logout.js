// Alternative logout implementation that bypasses Cognito logout endpoint
// Copy this to replace the logout() method in auth.js if the Cognito logout continues to fail

logout() {
  // Clear all auth data from browser storage
  localStorage.removeItem('authData')
  sessionStorage.removeItem('code_verifier')
  
  // Clear Cognito-related cookies (if any)
  document.cookie.split(";").forEach(function(c) { 
    if (c.includes('CognitoIdentityServiceProvider')) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    }
  })
  
  // Reset all state
  this.idToken = null
  this.accessToken = null
  this.refreshToken = null
  this.expiresAt = null
  this.credentials = null
  this.user = null
  
  // Optional: Clear any AWS SDK cached credentials
  if (window.AWS) {
    window.AWS.config.credentials = null
  }
  
  // Redirect to home/login page
  // This will trigger checkAuth() which will redirect to Cognito login
  window.location.href = '/'
}
