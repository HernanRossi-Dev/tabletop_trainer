// src/components/BattleCard.tsx
import type { Battle } from '../types/battle'; // Adjust path if needed
import { For } from 'solid-js';
import styles from './BattleCard.module.css'; // We'll create this CSS file

interface BattleCardProps {
  battle: Battle;
}

function BattleCard(props: BattleCardProps) {
  return (
    <div class={styles.battleCard}>
      <h2>Current Battle (ID: {props.battle.id})</h2>
      <div class={styles.details}>
        <p><strong>Status:</strong> {props.battle.status}</p>
        <p><strong>Round:</strong> {props.battle.currentRound}</p>
        <p><strong>Board Size:</strong> {props.battle.playArea.width}" x {props.battle.playArea.height}"</p>
        {/* Add other details like scenario if available */}
      </div>
      <div class={styles.armiesSection}>
        <h3>Armies:</h3>
        <ul>
          <For each={props.battle.armies}>
            {(army, index) => (
              <li class={styles.armyItem}>
                <span><strong>Army {index() + 1}:</strong> {army.faction}</span>
                <span>(Team {army.team})</span>
              </li>
            )}
          </For>
        </ul>
      </div>
      <div class={styles.actions}>
         {/* Add buttons for actions like "View Details", "Next Round", "End Battle" later */}
         <button class={styles.actionButton} onClick={() => alert(`Viewing details for Battle ${props.battle.id}`)}>
             View Details
         </button>
         <button class={styles.actionButton} onClick={() => alert(`Ending Battle ${props.battle.id}`)}>
             End Battle
         </button>
      </div>
    </div>
  );
}

export default BattleCard;