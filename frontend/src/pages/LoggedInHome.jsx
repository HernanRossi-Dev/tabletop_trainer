import { useNavigate } from '@solidjs/router'
import sectorCommandLogo from '../assets/sc_logo.png'
import '../App.css'

function LoggedInHome() {
  const navigate = useNavigate();

  return (
    <>
      <div>
        <div style={{ cursor: 'pointer', display: 'inline-block' }}>
          <img src={sectorCommandLogo} class="logo" />
        </div>
      </div>
      <div class="card">
        <button onClick={() => navigate('/battles')}>
          Thank you for logging in! Click here see your ongoing battles or to start a new battle.
        </button>
      </div>
    </>
  )
}

export default LoggedInHome;