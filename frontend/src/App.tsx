import { render } from 'solid-js/web';
import { Router, Route } from 'solid-app-router';
import LoginPage from './pages/LoginPage';
import DefaultPage from './pages/DefaultPage';


function App() {
  return (
    <Router>
      <Route path="/login" component={LoginPage} />
      <Route path="/counter" component={DefaultPage} />
      {/* <Route path="/dashboard" component={DashboardPage} /> */}
      {/* <Route path="/" component={HomePage} /> */}
    </Router>
  );
}

render(() => <App />, document.getElementById('root'));
