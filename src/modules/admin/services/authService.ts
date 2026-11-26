
import api from "../../../services/api";
import {setToken, setUser, clearAuth, setUserAccess, setUserPermissions} from "../../../services/storage";

import type {
    LoginPayload,
    RegisterPayload,
    AuthResponse
} from "../types";

export const login = async(data:LoginPayload)=>{
    const response = await api.post<AuthResponse>("/auth/login", data);
    setToken(response.data.token);
    setUser(response.data.user);
    setUserAccess(response.data.accesses ?? []);
    setUserPermissions(response.data.permissions ?? []);
    return response.data;
};

export const register = async(data:RegisterPayload)=>{
    const response = await api.post("/auth/register",data);
    return response.data;
};

export const logout = async () => {
    try {
        const response = await api.post("/auth/logout");
        return response.data;
    } finally {
        clearAuth();
    }
};
