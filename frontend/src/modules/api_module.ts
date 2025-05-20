import { user, resetUser } from '../store/UserStore';
import { fromApiBattle } from "../types/BattleType";
import type { Battle } from '../types/battle';
import { API_HOST } from "../config";

export function isJwtExpired(token: string): boolean {
    if (!token) return true;
    try {
        const [, payload] = token.split(".");
        const decoded = JSON.parse(atob(payload));
        if (!decoded.exp) return true;
        return Date.now() / 1000 > decoded.exp;
    } catch {
        return true;
    }
}

export async function createBattle(gameSettings: Battle){
    const response = await fetch(`${API_HOST}/api/battles`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${user.jwt}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameSettings),
    });
    if (response.status === 401) {
        alert("Your session has expired or you are not logged in. Please log in again.");
        resetUser();
        return null;
    }
    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
}

export async function getBattleByUserId() {
    console.log("Fetching battle data for user:", user.id);
    const url = `${API_HOST}/api/battles?user_id=${user.id}`;
    console.log("Fetching battle from url:", url);
    try {
        const response = await fetch(url, {
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
