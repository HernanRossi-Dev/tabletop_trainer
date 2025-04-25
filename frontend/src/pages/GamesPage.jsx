import { createSignal } from 'solid-js'
import GameSetupPage from './GameSetupPage';
import '../App.css'

function BattlePage() {
  const [count, setCount] = createSignal(0)

  return (
    <>
        <GameSetupPage />
    </>
  )
}

export default BattlePage;