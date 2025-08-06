# Cognito Logout Configuration Guide

## Issue
The "Invalid request" error occurs when the Cognito logout endpoint receives incorrect parameters or when the App Client is not properly configured.

## Solution

### 1. Update Your Code (Already Done)
The logout function has been updated to use the correct parameter format for Cognito hosted UI.

### 2. Configure Cognito App Client

You need to ensure your Cognito App Client has the correct Sign out URL(s) configured:

1. Go to AWS Console → Cognito → User Pools
2. Select your user pool
3. Go to "App integration" tab
4. Find your App client and click on it
5. Under "Hosted UI" section, check the following:

   **Sign out URL(s)**: Add your application URL
   - For local development: `http://localhost:5173`
   - For production: Your S3 static website URL (e.g., `https://your-bucket.s3-website-region.amazonaws.com`)

   **Allowed callback URLs**: Should already have these from login setup
   - For local development: `http://localhost:5173`
   - For production: Your S3 static website URL

### 3. Alternative Logout Methods

If the hosted UI logout continues to have issues, here are alternative approaches:

#### Option A: Simple Redirect Without Cognito Logout
```javascript
logout() {
  // Clear local storage
  localStorage.removeItem('authData')
  sessionStorage.removeItem('code_verifier')
  
  // Clear state
  this.idToken = null
  this.accessToken = null
  this.refreshToken = null
  this.expiresAt = null
  this.credentials = null
  this.user = null
  
  // Just redirect to login
  this.redirectToLogin()
}
```

#### Option B: Use RevokeToken API (if enabled)
```javascript
async logout() {
  try {
    // Revoke the refresh token if your Cognito app client has token revocation enabled
    if (this.refreshToken) {
      const revokeEndpoint = `https://${getCognitoDomain()}.auth.${config.AWS_REGION}.amazoncognito.com/oauth2/revoke`
      
      await fetch(revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          token: this.refreshToken,
          client_id: config.AWS_COGNITO_CLIENT_ID
        }).toString()
      })
    }
  } catch (error) {
    console.error('Token revocation error:', error)
  }
  
  // Clear local storage and redirect
  localStorage.removeItem('authData')
  sessionStorage.removeItem('code_verifier')
  this.redirectToLogin()
}
```

### 4. Debugging Tips

1. Check the exact error by inspecting the network request to the logout endpoint
2. Verify your App Client configuration in AWS Console
3. Ensure the `logout_uri` parameter value exactly matches one of the configured Sign out URLs
4. Check if there are any trailing slashes or protocol mismatches

### 5. Testing

After making changes:
1. Clear your browser cache and cookies
2. Log in to your application
3. Click logout
4. You should be redirected to the Cognito login page without errors

## Notes

- The `logout_uri` parameter must exactly match one of the Sign out URLs configured in your App Client
- URL encoding is important for the logout_uri parameter
- Some browsers may cache redirects, so clear cache when testing
