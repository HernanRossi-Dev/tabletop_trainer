import { Router, Route } from '@solidjs/router';
import AboutPage from './pages/AboutPage';
import BasicAppBar from './pages/AppBarPage';
import HomePage from './pages/HomePage';
import BattlePage from './pages/BattlePage';
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
      {/* 2. AppBar remains the first flex item */}
      <BasicAppBar />

      {/* 3. Add a wrapper div for the router content that will grow */}
      <div style={{
        "flex-grow": 5,           // Allow this div to grow and fill remaining vertical space
        display: 'flex',
        "flex-direction": 'column',
      }}>
        {/* 4. The Router renders the page content inside the growing div */}
        <Router>
          <Route path="/about" component={AboutPage} />
          <Route path="/battle" component={BattlePage} />
          <Route path="/home" component={HomePage} />
          <Route path="/" component={HomePage} />
        </Router>
      </div>

      {/* Optional Footer could go here, it would be the last flex item */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;