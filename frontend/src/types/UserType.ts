export interface UserProfile {
    jwt: string;
    id: string;
    name: string;
    email?: string;
    profilePicture?: string;
    provider: 'google' | 'facebook';
}

export function fromApiUser(apiUser: any): UserProfile {
    return {
        jwt: apiUser.jwt,
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        profilePicture: apiUser.profile_picture,
        provider: apiUser.provider,
    };
}