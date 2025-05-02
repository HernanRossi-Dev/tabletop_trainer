import { useNavigate } from '@solidjs/router'
import sectorCommandLogo from '../assets/command_logo.png'
import '../App.css'

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div>
        <div style={{ cursor: 'pointer', display: 'inline-block' }}>
          <img src={sectorCommandLogo} class="logo" />
        </div>
      </div>
      {/* <div class="card">
        <button onClick={() => navigate('/battle')}>
          Go to Battles
        </button>
      </div> */}
    </>
  )
}

export default HomePage;