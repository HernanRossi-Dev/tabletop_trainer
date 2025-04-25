// src/pages/BattleDashboardPage.tsx
import { createSignal, Show } from 'solid-js';
import { useNavigate } from "@solidjs/router"; // Import for navigation
import type { Battle } from '../types/battle';   // Adjust path
import BattleCard from '../components/BattleCard'; // Adjust path
import styles from './BattleDashboardPage.module.css'; // We'll create this

// --- Mock Data / Initial State ---
// In a real app, this would likely come from localStorage, an API call, or global state
const [currentBattle, setCurrentBattle] = createSignal<Battle | null>(null);

// Example: Function to simulate loading or setting a battle (replace with real logic)
function loadInitialBattle() {
    // Try loading from storage, etc.
    // For demo purposes, let's leave it null initially
    // Or uncomment below to start with a sample battle:
    /*
    setCurrentBattle({
        id: 'BATTLE_001',
        status: 'Ongoing',
        currentRound: 2,
        playArea: { width: 44, height: 30 },
        armies: [
            { id: 0, faction: 'Ultramarines', team: 1 },
            { id: 1, faction: 'Necrons', team: 2 }
        ]
    });
    */
}
// Call it once when the component mounts (or manage state globally)
// onMount(loadInitialBattle); // Uncomment if you want to load on mount


function BattleDashboardPage() {
  const navigate = useNavigate(); // Hook for navigation

  const handleStartNewBattle = () => {
    // Option 1: Navigate to the setup page
    console.log("Navigating to game setup...");
    navigate('/setup'); // Assumes you have a '/setup' route pointing to GameSetupPage

    // Option 2: (Placeholder) Directly set a mock battle for demo purposes
    /*
    console.log("Creating a placeholder new battle...");
    setCurrentBattle({
        id: `BATTLE_${Date.now()}`, // Simple unique ID
        status: 'Setting Up',
        currentRound: 0,
        playArea: { width: 44, height: 30 }, // Default size
        armies: [] // Armies would be added during setup
    });
    alert("Placeholder battle created. You'd normally go to the setup screen.");
    */
  };

   const handleClearBattle = () => {
       // In a real app, you might archive the battle or update its status
       console.log("Clearing current battle...");
       setCurrentBattle(null);
   }

  return (
    <div class={styles.dashboardContainer}>
      <h1>Battle Dashboard</h1>

      <Show
        when={currentBattle()}
        fallback={
          <div class={styles.noBattle}>
            <p>No active battle found.</p>
            <button onClick={handleStartNewBattle} class={styles.actionButton}>
              Start New Battle
            </button>
          </div>
        }
      >
        {/* Pass the non-null battle signal accessor to the card */}
        {/* Using a function ensures the Card re-renders if the battle object changes */}
        <BattleCard battle={currentBattle()!} />

         {/* Add a button here to clear the current battle for testing */}
         <button onClick={handleClearBattle} class={`${styles.actionButton} ${styles.clearButton}`}>
             Clear Current Battle (Test)
         </button>
      </Show>
    </div>
  );
}

export default BattleDashboardPage;