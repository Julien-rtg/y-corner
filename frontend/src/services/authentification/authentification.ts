import axios from 'axios';
import * as Sentry from '@sentry/react';
import { API_URL_BASE } from '@/constants/api';

function getApiUrl(): string {
    try {
        return process.env.VITE_API_URL as string;
    } catch (error) {
        try {
            return API_URL_BASE;
        } catch (error) {
            return 'http://localhost:8080';
        }
    }
}

export class AuthentificationService {
    private apiUrl: string;
    
    constructor(apiUrl?: string) {
        this.apiUrl = apiUrl || getApiUrl();
    }
    
    public async requestPasswordReset(email: string): Promise<any> {
        try {
            return axios.post(`${this.apiUrl}/api/reset-password`, {
                email: email
            });
        }
        catch (error) {
            Sentry.captureException(error, {
                tags: {
                    service: 'AuthentificationService',
                    method: 'requestPasswordReset',
                    endpoint: `/api/reset-password`
                },
                extra: {
                    email: email,
                    apiUrl: this.apiUrl
                }
            });
            throw error;
        }
    }

    public async login(username: string, password: string): Promise<any> {
        try {
            return axios.post(`${this.apiUrl}/api/login_check`, {
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
            Sentry.captureException(error, {
                tags: {
                    service: 'AuthentificationService',
                    method: 'login',
                    endpoint: `/api/login_check`
                },
                extra: {
                    username: username,
                    apiUrl: this.apiUrl
                }
            });
            throw error;
        }
    }

    public async register(userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        birthDate: string;
        address: string;
        city: string;
        country: string;
        postalCode?: string;
    }): Promise<any> {
        try {
            const registerData = {
                ...userData,
                country: userData.country || 'France'
            };
            
            return axios.post(`${this.apiUrl}/api/register`, registerData);
        }
        catch (error) {
            Sentry.captureException(error, {
                tags: {
                    service: 'AuthentificationService',
                    method: 'register',
                    endpoint: `/api/register`
                },
                extra: {
                    hasFirstName: !!userData.firstName,
                    hasLastName: !!userData.lastName,
                    hasEmail: !!userData.email,
                    hasBirthDate: !!userData.birthDate,
                    hasAddress: !!userData.address,
                    hasCity: !!userData.city,
                    hasCountry: !!userData.country,
                    apiUrl: this.apiUrl
                }
            });
            throw error;
        }
    }

    public logout(): void {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = '/login';
    }

    public async refresh(): Promise<any> {
        if(localStorage.getItem("token") === null) {
            return false;
        }
        try {
            return axios.post(`${this.apiUrl}/api/token/refresh`, {
                refresh_token: localStorage.getItem("refresh_token")
            })
                .then(function (response) {
                    localStorage.setItem("refresh_token", response.data.refresh_token);
                    localStorage.setItem("token", response.data.token);
                    return true;
                })
        }
        catch (error) {
            Sentry.captureException(error, {
                tags: {
                    service: 'AuthentificationService',
                    method: 'refresh',
                    endpoint: `/api/token/refresh`
                },
                extra: {
                    hasRefreshToken: !!localStorage.getItem("refresh_token"),
                    apiUrl: this.apiUrl
                }
            });
            throw error;
        }
    }
}
