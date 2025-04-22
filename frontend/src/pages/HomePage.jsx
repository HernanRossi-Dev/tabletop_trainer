import { createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import sectorCommandLogo from '../assets/sc_logo.png'
import '../App.css'

function HomePage() {
  const [count, setCount] = createSignal(0)
  const navigate = useNavigate();

  return (
    <>
      <div>
        <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => navigate('/about')}>
          <img src={sectorCommandLogo} class="logo" />
        </div>
      </div>
      <div class="card">
        <button onClick={() => navigate('/battle')}>
          Go to Battle
        </button>
      </div>
    </>
  )
}

export default HomePage;