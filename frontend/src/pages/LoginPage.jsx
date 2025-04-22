import { createSignal, Show } from 'solid-js';
import { API_HOSTNAME } from '../config'; // Adjust the path as needed
// Optional: If using routing
// import { useNavigate } from '@solidjs/router';

// Placeholder for your actual API call function
async function loginUser(credentials) {
  console.log('Attempting login with:', credentials);
  // --- Replace this with your actual API call ---
  return new Promise(async (resolve, reject) => {
    try {
      // Example using fetch:
      const response = await fetch(`${API_HOSTNAME}/api/login`, { // Use imported hostname
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Try to get error message from backend, or use generic one
        let errorMsg = `Login failed: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg; // Assuming backend returns { "error": "message" }
        } catch (jsonError) {
            // Ignore if response body isn't valid JSON
        }
        throw new Error(errorMsg);
      }

      // Assuming backend returns user data or a token on success
      const data = await response.json();
      console.log('Login successful:', data);
      resolve(data); // Resolve with user data/token

    } catch (error) {
       console.error('Login API call error:', error);
       // Pass a user-friendly error message
       reject((error instanceof Error ? error.message : 'An error occurred during login.'));
    }
  });
  // --- End of API call placeholder ---
}


function LoginPage() {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Optional: For redirecting after login
  // const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const credentials = {
        username: username(), // Or email, depending on your backend
        password: password(),
      };

      // Call the placeholder API function
      const loginResponse = await loginUser(credentials);

      // --- Handle Successful Login ---
      console.log('Login Success Data:', loginResponse);
      // TODO: Store authentication token (e.g., in localStorage, sessionStorage, or a global store)
      // Example: localStorage.setItem('authToken', loginResponse.token);

      // TODO: Redirect to a protected page (e.g., dashboard)
      // Example using router:
      // navigate('/dashboard', { replace: true }); // Replace history entry

      alert('Login successful! (Implement token storage & redirect)'); // Placeholder alert


    } catch (err) {
      console.error("Login attempt failed:", err);
      setError(typeof err === 'string' ? err : 'Login failed. Please check your credentials.'); // Set error message from API or generic

    } finally {
      setLoading(false); // Ensure loading is set to false whether success or fail
    }
  };

  return (
    <div style={{ 'max-width': '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', 'border-radius': '8px' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ 'margin-bottom': '15px' }}>
          <label for="username" style={{ display: 'block', 'margin-bottom': '5px' }}>Username or Email:</label>
          <input
            type="text"
            id="username"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            required
            disabled={loading()}
            style={{ width: '100%', padding: '8px', 'box-sizing': 'border-box' }}
          />
        </div>
        <div style={{ 'margin-bottom': '15px' }}>
          <label for="password" style={{ display: 'block', 'margin-bottom': '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            disabled={loading()}
            style={{ width: '100%', padding: '8px', 'box-sizing': 'border-box' }}
          />
        </div>

        {/* --- Error Message Display --- */}
        <Show when={error()}>
          <div style={{ color: 'red', 'margin-bottom': '15px', border: '1px solid red', padding: '10px', 'border-radius': '4px' }}>
            {error()}
          </div>
        </Show>

        <button type="submit" disabled={loading()} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          {loading() ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;