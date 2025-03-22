export function getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Token not found in localStorage.");
        return null;
    }
    return token;
}