
import { user } from '../store/UserStore';
import { clearBattle, replaceBattle } from "../store/BattleStore";
import { getBattleByUserId } from "../modules/api_module";


export function loadOngoingBattle() {
    if (!user.id) {
        console.log("No user ID found. Cannot fetch battles.");
        clearBattle();
        return;
    }
    getBattleByUserId()
        .then(fetchedBattle => {
            if (!fetchedBattle) {
                console.log("No active battle found for user.");
                clearBattle();
                return;
            }
            replaceBattle(fetchedBattle);
        })
        .catch(error => {
            console.error("Failed to fetch battles:", error);
            alert("Failed to fetch battles. See console for details.");
            clearBattle();
        });
}