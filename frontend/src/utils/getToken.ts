import { User } from "@/interfaces/User.interface";

export function getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Token not found in localStorage.");
        return null;
    }
    return token;
}

export function getUser(): User {
    const user = localStorage.getItem('user');
    return JSON.parse(user || '');
}