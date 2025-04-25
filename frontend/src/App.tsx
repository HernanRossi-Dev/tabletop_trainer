import { Router, Route } from '@solidjs/router';
import AboutPage from './pages/AboutPage';
import BasicAppBar from './pages/AppBarPage';
import HomePage from './pages/HomePage';
import BattlePage from './pages/BattlePage';
import LoginPage from './pages/LoginPage';
import BattleDashboardPage from './pages/BattleDashboardPage'; // Adjust path
import GameSetupPage from './pages/GameSetupPage';     // Adjust path
// Make sure your CSS is imported, e.g.:
import './index.css'; // Or './App.css' if you put global styles there

function App() {
  return (
    // 1. Replace the fragment with a div that will be our main flex container
    <div style={{
      display: 'flex',          // Enable flexbox
      "flex-direction": 'column', // Stack children vertically (AppBar on top, content below)
      "min-height": '100vh'     // Ensure this container is at least the full viewport height
    }}>
      {/* 2. AppBar remains the first flex item and is fixed at the top */}
      <div style={{
        position: 'sticky',
        top: 0,
        "z-index": 1000,
      }}>
        <BasicAppBar />
      </div>

      {/* 3. Add a wrapper div for the router content that will grow */}
      <div style={{
        "flex-grow": 5,           // Allow this div to grow and fill remaining vertical space
        display: 'flex',
        "flex-direction": 'column',
      }}>
        {/* 4. The Router renders the page content inside the growing div */}
        <Router>
          <Route path="/about" component={AboutPage} />
          {/* <Route path="/battles" component={BattlePage} /> */}
          <Route path="/home" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={HomePage} />
          <Route path="/battles" component={BattleDashboardPage} /> {/* Example: Dashboard is home */}
          <Route path="/setup" component={GameSetupPage} /> {/* Route for setup */}
        </Router>
      </div>

      {/* Optional Footer could go here, it would be the last flex item */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;