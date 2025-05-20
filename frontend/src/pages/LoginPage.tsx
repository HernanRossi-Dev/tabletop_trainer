import { createSignal, onMount, Show } from 'solid-js';
import styles from './LoginPage.module.css';
import { user, replaceUser, UserProfile } from "../store/UserStore";
import { useNavigate } from '@solidjs/router';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '../config';
// import { isJwtExpired } from '../modules/Api';


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

declare global {
  interface Window {
    google: any;
    FB: any;
  }
}
declare const google: any;
declare const FB: any;

function LoginPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = createSignal(false);
  // const [isLoadingFacebook, setIsLoadingFacebook] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const navigate = useNavigate();
  // const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // --- SDK Initialization ---
  onMount(async () => {
    // if (user.jwt && isJwtExpired(user.jwt)) {
    //   handleLogout();
    //   navigate("/login"); // or your login route
    // }
    try {
      // Load Google SDK (New Google Identity Services)
      await loadScript('https://accounts.google.com/gsi/client', 'google-identity-services');
      if (!GOOGLE_CLIENT_ID) {
        console.error("Google Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in your .env file.");
        setError("Google Login configuration is missing.");
        return; // Don't initialize if ID is missing
      }
      // Initialize Google Identity Services
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
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
      // await loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk');
      // if (!facebookAppId) {
      //   console.error("Facebook App ID is missing. Set VITE_FACEBOOK_APP_ID in your .env file.");
      //   setError("Facebook Login configuration is missing.");
      //   return; // Don't initialize if ID is missing
      // }
      // Initialize Facebook SDK
      // FB.init({
      //   appId: facebookAppId,
      //   cookie: true, // Enable cookies to allow the server to access the session.
      //   xfbml: true, // Parse social plugins on this webpage.
      //   version: 'v18.0' // Use a specific API version.
      // });
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
    if (!GOOGLE_CLIENT_ID) {
       setError("Google Login is not configured.");
       setIsLoadingGoogle(false);
       return;
    }
    try {
       const client = google.accounts.oauth2.initCodeClient({
           client_id: GOOGLE_CLIENT_ID,
           scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
           ux_mode: 'popup',
           callback: handleGoogleCredentialResponse,
           error_callback: (err: any) => {
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

  const handleGoogleCredentialResponse = async (response: any) => {
    setError(null);
    setIsLoadingGoogle(true);
  
    try {
      const authBody = {
        code: `${response.code}`,
        client_id: GOOGLE_CLIENT_ID,
        audience: GOOGLE_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }
      const postAuthResponse = await fetch('http://127.0.0.1:5000/api/authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authBody),
      });
      if (!postAuthResponse.ok) {
        throw new Error(`Server error: ${postAuthResponse.status}`);
      }
      const postAuthData = await postAuthResponse.json();
      console.log("Post Auth Response:", postAuthData);
      const profile: UserProfile = {
        jwt: postAuthData.access_token,
        id: postAuthData.user.user_id,
        name: postAuthData.user.name,
        email: postAuthData.user.email,
        profilePicture: postAuthData.user.profile_picture,
        provider: 'google'
      };
      replaceUser(profile);
      console.log('After set up')
      console.log("User id:", user.id);
      console.log("User jwt:", user.jwt);
  
    } catch (e) {
      console.error("Failed to create or fetch User:", e);
      setError("Failed to create or fetch User. See console for details.");
    } finally {
      setIsLoadingGoogle(false);
      navigate('/login-success'); // Redirect to logged in page
    }
  };


  // --- Facebook Login Handler ---
  // const handleFacebookLoginClick = () => {
  //   setError(null);
  //   setIsLoadingFacebook(true);
  //   if (!facebookAppId) {
  //     setError("Facebook Login is not configured.");
  //     setIsLoadingFacebook(false);
  //     return;
  //   }
  //   try {
  //     FB.login(handleFacebookAuthResponse, { scope: 'public_profile,email' }); // Request permissions
  //   } catch (error) {
  //     console.error("Facebook Login Error", error);
  //     setError("Could not initiate Facebook Login.");
  //     setIsLoadingFacebook(false);
  //   }
  // };

  // // --- Facebook Auth Response Callback ---
  // const handleFacebookAuthResponse = (response: fb.StatusResponse) => {
  //   console.log("Facebook Auth Response:", response);
  //   if (response.status === 'connected') {
  //     // User is logged in and authorized.
  //     const accessToken = response.authResponse.accessToken;
  //     console.log("Facebook Access Token:", accessToken);

  //     // **CRITICAL STEP**: Send this `accessToken` to your BACKEND.
  //     // Your backend should verify this token with Facebook (using Graph API debug_token endpoint),
  //     // fetch user details securely, create its own session/token, and return user info.

  //     // --- Placeholder: Fetch basic info client-side (less secure, backend preferred) ---
  //      FB.api('/me', { fields: 'id,name,email,picture' }, (profileResponse: any) => {
  //         console.log('Facebook Profile Response:', profileResponse);
  //         if (profileResponse && !profileResponse.error) {
  //             const profile: UserProfile = {
  //                 id: profileResponse.id,
  //                 name: profileResponse.name,
  //                 email: profileResponse.email,
  //                 picture: profileResponse.picture?.data?.url,
  //                 provider: 'facebook'
  //             }
  //             setUser(profile); // Update state (replace with proper auth context update)
  //             // TODO: Store your app's session token received from your BACKEND
  //             setError(null);
  //         } else {
  //             console.error("Facebook API error:", profileResponse?.error);
  //             setError("Failed to fetch Facebook profile.");
  //         }
  //         setIsLoadingFacebook(false);
  //     });
  //      // --- End Placeholder ---

  //   } else if (response.status === 'not_authorized') {
  //     // The person is logged into Facebook, but not your app.
  //     setError("Please authorize the application to log in.");
  //     setIsLoadingFacebook(false);
  //   } else {
  //     // The person is not logged into Facebook, so we don't know if they are logged into your app.
  //     setError("Login failed. Please ensure you are logged into Facebook.");
  //     setIsLoadingFacebook(false);
  //   }
  // };

  // --- Logout Handler ---
  const handleLogout = () => {
     replaceUser({
      jwt: "",
      id: "",
      name: "",
      email: undefined,
      profilePicture: undefined,
      provider: "google"
  });
     setError(null);
     // Optional: Inform SDKs if needed
    //  google.accounts.id.disableAutoSelect(); // Prevent auto-login next time
     // FB.getLoginStatus(response => { if (response.status === 'connected') FB.logout(); });
     console.log("User logged out");
  }

  return (
    <div class={styles.loginContainer}>
      <Show when={false} fallback={
        <>
          <h2>Login to Battle Command AI</h2>
          <p style={{ 'font-style': "italic", color: "#888" }}>
            If you have visited before we will load your existing history after you login
          </p>
          <p style={{ 'font-style': "italic", color: "#888" }}>
            If you are concerned with the security of your Google account, create a new one for this app, they are free!
          </p>
          <button
            onClick={handleGoogleLoginClick}
            disabled={isLoadingGoogle()}
            // disabled={isLoadingGoogle() || isLoadingFacebook()}
            class={`${styles.button} ${styles.googleButton}`}
          >
            {isLoadingGoogle() ? 'Loading...' : 'Login with Google'}
          </button>
          {/* Facebook Button
           <button
            onClick={handleFacebookLoginClick}
            disabled={isLoadingFacebook() || isLoadingGoogle()}
            class={`${styles.button} ${styles.facebookButton}`}
          >
            {isLoadingFacebook() ? 'Loading...' : 'Login with Facebook'}
          </button> */}
          <Show when={error()}>
            <p class={styles.error}>Error: {error()}</p>
          </Show>

        </>
      }>
         <h1>Welcome, {user!.name}!</h1>
         <Show when={user!.profilePicture}>
           <img src={user!.profilePicture} alt="Profile picture" class={styles.profilePic}/>
         </Show>
         <p>You are logged in via {user!.provider}.</p>
         <Show when={user!.email}><p>Email: {user!.email}</p></Show>
         <button onClick={handleLogout} class={styles.button}>Logout</button>
      </Show>
    </div>
  );
}

export default LoginPage;
