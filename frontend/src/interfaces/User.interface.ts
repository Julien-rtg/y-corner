export interface User {
    id: number;
    email: string;
    roles?: string[];
    firstName: string;
    lastName: string;
    birthDate?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: number;
    created_at?: string;
    updated_at?: string;
}