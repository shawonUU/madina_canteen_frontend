import axios from "axios";
import { getToken, getCurrentMenu, clearAuth } from "./storage";
const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || (local ? "http://127.0.0.1:8000/api" : "/api")).replace(/\/+$/, ""),
    headers: { Accept: "application/json" }, withCredentials: false, timeout: 30000,
});
api.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const { moduleId, menuId, childMenuId } = getCurrentMenu();
    if (moduleId != null) config.headers["X-Module-Id"] = String(moduleId);
    if (menuId != null) config.headers["X-Menu-Id"] = String(menuId);
    if (childMenuId != null) config.headers["X-Child-Menu-Id"] = String(childMenuId);
    return config;
});
api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
        clearAuth();
        if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
});
export default api;
