import {
  Typography
} from "@suid/material";
import { createSignal, Show, onMount } from 'solid-js';
import { useNavigate } from "@solidjs/router";
import BattleCard from '../components/BattleCard';
import Modal from '../components/Modal';
import styles from './BattleDashboardPage.module.css';
import { user } from '../store/UserStore';
import { activeBattle, clearBattle } from "../store/BattleStore";
import { loadOngoingBattle } from "../modules/battle-utils";


function BattleDashboardPage() {
  const [showLoginModal, setShowLoginModal] = createSignal(false);
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = createSignal(false);

  onMount(() => {
      loadOngoingBattle();
  });


  const handleStartNewBattle = () => {
    console.log("Button:", user);
    if (!user.id) {
      setShowLoginModal(true);
    } else{
      navigate('/setup');
    }
  };

  const handleClearBattle = () => {
    setShowConfirmModal(true);
  };
  const confirmClearBattle = () => {
    clearBattle();
    setShowConfirmModal(false);
  };

  function setCurrentBattle(_: null): void {
    clearBattle();
  }

  return (
    <div class={styles.dashboardContainer}>
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 700,
          fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
          mr: 2,
          letterSpacing: 2,
          textTransform: "uppercase",
          pb: 2,
        }}
      >
        Command Bunker
      </Typography>

      <Show
        when={!!activeBattle.id}
        fallback={
          <div class={styles.noBattle}>
            <p>No active battles found.</p>
            <Show when={!user.id}>
              <p style={{ color: "#aaa", 'font-style': "italic" }}>
                Note: You must be logged in to view existing battle sessions
              </p>
            </Show>
            <button onClick={handleStartNewBattle} class={styles.actionButton}>
              Start New Battle
            </button>
          </div>
        }
      >
        {() =>
          activeBattle ? (
            <>
              <BattleCard
                battle={activeBattle!}
                onComplete={() => setCurrentBattle(null)}
              />
              <button
                onClick={handleClearBattle}
                class={`${styles.actionButton} ${styles.clearButton}`}
              >
                Delete Current Battle
              </button>
            </>
          ) : null
        }
      </Show>

      <Show when={showLoginModal()}>
        <Modal open={true} onClose={() => setShowLoginModal(false)}>
          <h2>Please Login</h2>
          <p>You must be logged in to start a new battle.</p>
          <button
            class={`${styles.actionButton} ${styles.loginButton}`}
            onClick={() => { setShowLoginModal(false); navigate('/login'); }}
          >
            Proceed to Login
          </button>
        </Modal>
      </Show>

      <Show when={showConfirmModal()}>
        <Modal open={true} onClose={() => setShowConfirmModal(false)}>
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete the current battle?</p>
            <div style={{ display: "flex", gap: "1rem", 'justify-content': "center", 'align-items': "center" }}>
            {/* <button
              class={styles.actionButton}
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button> */}
            <button
              class={`${styles.actionButton}`}
              onClick={confirmClearBattle}
            >
              Delete
            </button>
          </div>
        </Modal>
      </Show>
    </div>
  );
}

export default BattleDashboardPage;