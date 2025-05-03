import { user } from '../store/UserStore';
import { fromApiBattle } from "../types/BattleType";
import type { Battle } from '../types/battle';

export async function getBattleByUserId() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/battles?user_id=${user.id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${user.jwt}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch battle data");
        }
        const data = await response.json();
        console.log("Battles Fetched:", data);
        if (data.length > 0) {
            const activeBattle = data.find((battle: Battle) => !battle.archived);
            if (activeBattle) {
                const convertedBattle = fromApiBattle(activeBattle);
                return convertedBattle;
            }
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}
