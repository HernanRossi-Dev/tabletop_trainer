import { createStore } from "solid-js/store";

export interface UserProfile {
    jwt: string;
    id: string;
    name: string;
    email?: string;
    profilePicture?: string;
    provider: 'google' | 'facebook';
}

const LOCAL_STORAGE_KEY = "user";

function loadUser(): UserProfile {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            // fallback to default if corrupted
        }
    }
    return {
        jwt: "",
        id: "",
        name: "",
        email: undefined,
        profilePicture: undefined,
        provider: "google"
    };
}

export const [user, setUser] = createStore<UserProfile>(loadUser());

// Save to localStorage whenever the user changes
function persistUser(newUser: UserProfile) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
}

// Wrap setUser to persist automatically
export function updateUser(updater: Partial<UserProfile>) {
    setUser(updater);
    persistUser({ ...user, ...updater });
}

// For full replacement (e.g., on login/logout)
export function replaceUser(newUser: UserProfile) {
    setUser(newUser);
    persistUser(newUser);
}

export function resetUser(){
    const emptyUser: UserProfile = {
        jwt: "",
        id: "",
        name: "",
        email: undefined,
        profilePicture: undefined,
        provider: "google"
    };
    setUser(emptyUser);
    persistUser(emptyUser);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
}