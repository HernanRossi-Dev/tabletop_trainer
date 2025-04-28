export interface UserProfile {
    jwt: string;
    id: string;
    name: string;
    email?: string;
    profile_picture?: string;
    provider: 'google' | 'facebook';
}
