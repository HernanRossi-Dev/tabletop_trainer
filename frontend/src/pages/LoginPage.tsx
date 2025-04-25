// src/pages/LoginPage.tsx
import { createSignal, onMount, Show } from 'solid-js';
import styles from './LoginPage.module.css'; // For styling

// --- Interfaces (Optional but good practice) ---
interface UserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: 'google' | 'facebook';
}

// --- Helper to load scripts ---
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.body.appendChild(script);
  });
}

function LoginPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = createSignal(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  // --- Authentication State (replace with your actual auth store/context later) ---
  const [user, setUser] = createSignal<UserProfile | null>(null); // Example state

  // --- Environment Variables ---
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // --- SDK Initialization ---
  onMount(async () => {
    try {
      // Load Google SDK (New Google Identity Services)
      await loadScript('https://accounts.google.com/gsi/client', 'google-identity-services');
      if (!googleClientId) {
        console.error("Google Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in your .env file.");
        setError("Google Login configuration is missing.");
        return; // Don't initialize if ID is missing
      }
      // Initialize Google Identity Services
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse, // Function to handle the response
        // ux_mode: 'redirect', // Use 'redirect' if you want a full page redirect flow
        // login_uri: 'YOUR_BACKEND_ENDPOINT_FOR_GOOGLE', // For redirect flow backend handling
      });
      // Optionally render the Google Button (or trigger prompt on custom button click)
      // google.accounts.id.renderButton(
      //   document.getElementById("googleSignInButton")!, // Ensure this element exists
      //   { theme: "outline", size: "large" }
      // );
      // google.accounts.id.prompt(); // Trigger One Tap programmatically


      // Load Facebook SDK
      await loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk');
      if (!facebookAppId) {
        console.error("Facebook App ID is missing. Set VITE_FACEBOOK_APP_ID in your .env file.");
        setError("Facebook Login configuration is missing.");
        return; // Don't initialize if ID is missing
      }
      // Initialize Facebook SDK
      FB.init({
        appId: facebookAppId,
        cookie: true, // Enable cookies to allow the server to access the session.
        xfbml: true, // Parse social plugins on this webpage.
        version: 'v18.0' // Use a specific API version.
      });
      // Optional: Check login status on load
      // FB.getLoginStatus(handleFacebookAuthResponse);

    } catch (err) {
      console.error("Error loading OAuth SDKs:", err);
      setError("Failed to load login services. Please try again later.");
    }
  });

  // --- Google Login Handler ---
  const handleGoogleLoginClick = () => {
    setError(null);
    setIsLoadingGoogle(true);
    if (!googleClientId) {
       setError("Google Login is not configured.");
       setIsLoadingGoogle(false);
       return;
    }
    try {
       // Use the initialized Google Identity Services client
       // Option 1: Trigger the One Tap UI or button rendering (if not auto-rendered)
       // google.accounts.id.prompt(); // If using the callback in initialize

       // Option 2: For more control or backend code exchange, use OAuth 2.0 flow
       const client = google.accounts.oauth2.initCodeClient({
           client_id: googleClientId,
           scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
           ux_mode: 'popup', // 'popup' or 'redirect'
           callback: handleGoogleCodeResponse, // This callback receives an AUTHORIZATION CODE
           error_callback: (err) => {
              console.error('Google Code Flow Error:', err);
              setError('Google login failed.');
              setIsLoadingGoogle(false);
           }
       });
       client.requestCode();

    } catch (error) {
      console.error("Google Sign-In Error", error);
      setError("Could not initiate Google Sign-In.");
      setIsLoadingGoogle(false);
    }
  };

  // --- Google Credential Response Callback (Handles ID Token from google.accounts.id.initialize) ---
  const handleGoogleCredentialResponse = (response: any) => {
    console.log("Google Credential Response (ID Token):", response.credential);
    setError(null);

    // **SECURITY RISK**: Decoding JWT on client is okay for display, NOT for auth verification.
    // Ideally, send response.credential (ID Token) to your backend for verification.
    // Your backend should verify the token signature, audience, issuer, expiry.
    // If valid, backend creates its own session/token and returns user info.

    // --- Example: Client-side decode (for display only) ---
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decodedProfile = JSON.parse(jsonPayload);

      console.log("Decoded Google Profile (Client-Side):", decodedProfile);
      const profile: UserProfile = {
          id: decodedProfile.sub,
          name: decodedProfile.name,
          email: decodedProfile.email,
          picture: decodedProfile.picture,
          provider: 'google'
      }
      setUser(profile); // Update state (replace with proper auth context update)
      // TODO: Store your app's session token received from your BACKEND
    } catch (e) {
      console.error("Error decoding Google token:", e);
      setError("Failed to process Google login response.");
    } finally {
       setIsLoadingGoogle(false);
    }
    // --- End Example ---
  };

  // --- Google Code Response Callback (Handles Authorization Code from initCodeClient) ---
  const handleGoogleCodeResponse = (response: any) => {
      console.log("Google Code Response:", response);
      setError(null);

      // **CRITICAL STEP**: Send this `response.code` to your BACKEND.
      // Your backend will exchange this code (along with client secret) for tokens
      // with Google, verify the user, create a session, and return user data + session token.

      // --- Placeholder: Simulate backend interaction ---
      alert(`Received Google auth code: ${response.code}. Send this to your backend!`);
      // fetch('/api/auth/google/callback', { method: 'POST', body: JSON.stringify({ code: response.code }) })
      //   .then(res => res.json())
      //   .then(backendResponse => {
      //      if (backendResponse.success) {
      //        setUser(backendResponse.user);
      //        // store backendResponse.sessionToken
      //      } else {
      //        setError(backendResponse.message || "Backend Google auth failed.");
      //      }
      //   })
      //   .catch(err => setError("Network error during Google auth."))
      //   .finally(() => setIsLoadingGoogle(false));
      setIsLoadingGoogle(false); // Remove this when actual backend call is made
      // --- End Placeholder ---
  };

  // --- Facebook Login Handler ---
  const handleFacebookLoginClick = () => {
    setError(null);
    setIsLoadingFacebook(true);
    if (!facebookAppId) {
      setError("Facebook Login is not configured.");
      setIsLoadingFacebook(false);
      return;
    }
    try {
      FB.login(handleFacebookAuthResponse, { scope: 'public_profile,email' }); // Request permissions
    } catch (error) {
      console.error("Facebook Login Error", error);
      setError("Could not initiate Facebook Login.");
      setIsLoadingFacebook(false);
    }
  };

  // --- Facebook Auth Response Callback ---
  const handleFacebookAuthResponse = (response: fb.StatusResponse) => {
    console.log("Facebook Auth Response:", response);
    if (response.status === 'connected') {
      // User is logged in and authorized.
      const accessToken = response.authResponse.accessToken;
      console.log("Facebook Access Token:", accessToken);

      // **CRITICAL STEP**: Send this `accessToken` to your BACKEND.
      // Your backend should verify this token with Facebook (using Graph API debug_token endpoint),
      // fetch user details securely, create its own session/token, and return user info.

      // --- Placeholder: Fetch basic info client-side (less secure, backend preferred) ---
       FB.api('/me', { fields: 'id,name,email,picture' }, (profileResponse: any) => {
          console.log('Facebook Profile Response:', profileResponse);
          if (profileResponse && !profileResponse.error) {
              const profile: UserProfile = {
                  id: profileResponse.id,
                  name: profileResponse.name,
                  email: profileResponse.email,
                  picture: profileResponse.picture?.data?.url,
                  provider: 'facebook'
              }
              setUser(profile); // Update state (replace with proper auth context update)
              // TODO: Store your app's session token received from your BACKEND
              setError(null);
          } else {
              console.error("Facebook API error:", profileResponse?.error);
              setError("Failed to fetch Facebook profile.");
          }
          setIsLoadingFacebook(false);
      });
       // --- End Placeholder ---

    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      setError("Please authorize the application to log in.");
      setIsLoadingFacebook(false);
    } else {
      // The person is not logged into Facebook, so we don't know if they are logged into your app.
      setError("Login failed. Please ensure you are logged into Facebook.");
      setIsLoadingFacebook(false);
    }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
     // TODO: Call your backend logout endpoint to invalidate the session/token.
     // fetch('/api/auth/logout', { method: 'POST' });

     // Clear local state
     setUser(null);
     setError(null);
     // Optional: Inform SDKs if needed
     // google.accounts.id.disableAutoSelect(); // Prevent auto-login next time
     // FB.getLoginStatus(response => { if (response.status === 'connected') FB.logout(); });
     console.log("User logged out");
  }

  return (
    <div class={styles.loginContainer}>
      <Show when={user()} fallback={
        <>
          <h1>Login to Battle Command AI</h1>
          <p>Please choose a provider to continue:</p>

          {/* Google Button */}
          <button
            onClick={handleGoogleLoginClick}
            disabled={isLoadingGoogle() || isLoadingFacebook()}
            class={`${styles.button} ${styles.googleButton}`}
          >
            {isLoadingGoogle() ? 'Loading...' : 'Login with Google'}
          </button>
          {/* You could also render the official Google button here */}
          {/* <div id="googleSignInButton"></div> */}


          {/* Facebook Button */}
           <button
            onClick={handleFacebookLoginClick}
            disabled={isLoadingFacebook() || isLoadingGoogle()}
            class={`${styles.button} ${styles.facebookButton}`}
          >
            {isLoadingFacebook() ? 'Loading...' : 'Login with Facebook'}
          </button>


          <Show when={error()}>
            <p class={styles.error}>Error: {error()}</p>
          </Show>

          <p class={styles.note}>
            Note: For full security, user verification should be completed on a backend server.
          </p>
        </>
      }>
         {/* --- Logged In View --- */}
         <h1>Welcome, {user()!.name}!</h1>
         <Show when={user()!.picture}>
           <img src={user()!.picture} alt="Profile picture" class={styles.profilePic}/>
         </Show>
         <p>You are logged in via {user()!.provider}.</p>
         <Show when={user()!.email}><p>Email: {user()!.email}</p></Show>

         <button onClick={handleLogout} class={styles.button}>Logout</button>
      </Show>

    </div>
  );
}

export default LoginPage;

// --- Add corresponding CSS module (LoginPage.module.css) ---
/* Example styles */
/* .loginContainer { ... } */
/* .button { ... } */
/* .googleButton { background-color: #DB4437; color: white; } */
/* .facebookButton { background-color: #4267B2; color: white; } */
/* .error { color: red; } */
/* .note { font-size: 0.8em; color: grey; } */
/* .profilePic { border-radius: 50%; width: 50px; height: 50px; } */