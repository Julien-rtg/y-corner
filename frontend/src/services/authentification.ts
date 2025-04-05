import axios from 'axios';

export class AuthentificationService {

    public async login(username: string, password: string): Promise<any> {
        try {
            return axios.post(`${import.meta.env.VITE_API_URL}/api/login_check`, {
                username: username,
                password: password
            })
                .then(function (response) {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("refresh_token", response.data.refresh_token);
                    localStorage.setItem("user", JSON.stringify(response.data.user));
                    return true;
                })
        }
        catch (error) {
            throw error;
        }
    }

    public logout(): void {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = '/login';
    }

    public async refresh(): Promise<any> {
        if(localStorage.getItem("token") === null) {
            return false;
        }
        try {
            return axios.post(`${import.meta.env.VITE_API_URL}/api/token/refresh`, {
                refresh_token: localStorage.getItem("refresh_token")
            })
                .then(function (response) {
                    localStorage.setItem("token", response.data.token);
                    return true;
                })
        }
        catch (error) {
            throw error;
        }
    }
}
