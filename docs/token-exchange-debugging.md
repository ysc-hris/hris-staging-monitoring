# Debugging Token Exchange Issues

## Why the page refreshes at lines 122-128

The page refreshes because when the token exchange request fails, it triggers this flow:

1. `fetch()` to token endpoint (line 122)
2. Response is not OK (line 130)
3. Error is thrown
4. Catch block catches the error (line 173)
5. `redirectToLogin()` is called (line 186)
6. Browser redirects to Cognito login page

## Common causes of token exchange failure:

### 1. Redirect URI mismatch
- The `redirect_uri` sent in the token request MUST exactly match the one used in the initial authorization request
- Check that `window.location.origin` matches your Cognito app client's callback URL

### 2. Code verifier issues
- The code verifier might be missing from sessionStorage
- The code verifier might not match the code challenge used in the initial request

### 3. Expired authorization code
- Authorization codes are only valid for a few minutes
- If there's a delay between getting the code and exchanging it, it might expire

### 4. CORS configuration
- Cognito token endpoint should allow CORS, but sometimes there are issues

## To debug:

1. Open browser DevTools Network tab
2. Look for the request to `/oauth2/token`
3. Check the request payload and response
4. The response will contain specific error details

## Temporary debugging fix:

To prevent the redirect and see the error in console:

```javascript
} catch (error) {
  console.error('Auth callback error:', error)
  
  // Temporarily comment out to see error without redirect
  // this.redirectToLogin()
  
  // Or add a delay
  setTimeout(() => {
    this.redirectToLogin()
  }, 5000) // 5 second delay to read console
}
```
