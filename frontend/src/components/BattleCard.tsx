// src/components/BattleCard.tsx
import type { Battle } from '../types/battle'; // Adjust path if needed
import styles from './BattleCard.module.css'; // We'll create this CSS file
import { useNavigate } from '@solidjs/router';
import { activeBattle } from "../store/BattleStore";


interface BattleCardProps {
  battle: Battle;
  onComplete?: () => void;
}

function BattleCard(props: BattleCardProps) {
  const navigate = useNavigate();
  if (!activeBattle) return null;
  return (
    <div class={styles.battleCard}>
      <h2>Battle Name: {activeBattle.battleName}</h2>
      <div class={styles.details}>
        <p><strong>Round:</strong> {activeBattle.battleRound}</p>
        <p><strong>Board Size:</strong> {activeBattle.width}" x {activeBattle.height}"</p>
        <p><strong>Army Turn:</strong> {activeBattle.armyTurn}</p>
      </div>
      <div class={styles.armiesSection}>
        <h3>
          <strong>Player Army:</strong> {activeBattle.playerArmy?.faction ?? "Unknown"}
          <br />
          <strong>Points:</strong> {activeBattle.playerScore ?? "N/A"}
        </h3>
      </div>
      <div class={styles.armiesSection}>
        <h3>
          <strong>Opponent Army:</strong> {activeBattle.opponentArmy?.faction ?? "Unknown"}
          <br />
          <strong>Points:</strong> {activeBattle.opponentScore ?? "N/A"}
        </h3>
      </div>
      <div class={styles.actions} style={{ display: 'flex', 'justify-content': 'center', gap: '1rem' }}>
         <button
           class={styles.actionButton}
           onClick={() => {
            navigate('/active-battle');
           }}
         >
           Continue Battle
         </button>
         <button class={styles.actionButton}
            onClick={() => {
              if (props.onComplete) props.onComplete();
          }}>
         Archive Battle
         </button>
      </div>
    </div>
  );
}

export default BattleCard;