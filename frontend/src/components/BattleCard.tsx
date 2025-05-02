// src/components/BattleCard.tsx
import type { Battle } from '../types/battle'; // Adjust path if needed
import styles from './BattleCard.module.css'; // We'll create this CSS file
import { parseBattle } from '../types/battle_type';
import { useNavigate } from '@solidjs/router';
import { activeBattle } from "../store/battle_store";


interface BattleCardProps {
  battle: Battle;
  onComplete?: () => void;
}

function BattleCard(props: BattleCardProps) {
  const navigate = useNavigate();
  if (!activeBattle) return null;
  const parsed_battle = parseBattle(activeBattle);
  return (
    <div class={styles.battleCard}>
      <h2>Battle Name: {parsed_battle.battle_name}</h2>
      <div class={styles.details}>
        <p><strong>Round:</strong> {parsed_battle.battle_round}</p>
        <p><strong>Board Size:</strong> {parsed_battle.width}" x {parsed_battle.height}"</p>
        <p><strong>Army Turn:</strong> {parsed_battle.army_turn}</p>
      </div>
      <div class={styles.armiesSection}>
        <h3><strong>Player Army:</strong> {parsed_battle.player_army.faction} <br></br> <strong>Points:</strong> {parsed_battle.player_score}</h3>
      </div>
      <div class={styles.armiesSection}>
        <h3><strong>Opponent Army:</strong> {parsed_battle.opponent_army.faction} <br></br><strong>Points:</strong> {parsed_battle.opponent_score}</h3>
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