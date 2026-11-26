const TOKEN_KEY = "access_token";
const parse = (key: string, fallback: any = null) => {
    try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
};
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
export const setUser = (user: unknown) => localStorage.setItem("user", JSON.stringify(user));
export const getUser = () => parse("user");
export const removeUser = () => localStorage.removeItem("user");
export const setUserAccess = (accesses: unknown) => localStorage.setItem("USER_ACCESSES", JSON.stringify(accesses));
export const getUserAccess = (): any[] => { const data = parse("USER_ACCESSES", []); return Array.isArray(data) ? data : []; };
export const setUserPermissions = (permissions: string[]) => localStorage.setItem("USER_PERMISSIONS", JSON.stringify(permissions));
export const getUserPermissions = (): string[] => { const data = parse("USER_PERMISSIONS", []); return Array.isArray(data) ? data : []; };
export const setCurrentMenu = (moduleId: number | null, menuId: number | null, childMenuId: number | null) => {
    sessionStorage.setItem("current_menu", JSON.stringify({ moduleId, menuId, childMenuId }));
};
export const getCurrentMenu = () => {
    try { return JSON.parse(sessionStorage.getItem("current_menu") ?? "null") ?? { moduleId: null, menuId: null, childMenuId: null }; }
    catch { return { moduleId: null, menuId: null, childMenuId: null }; }
};
export const clearAuth = () => {
    [TOKEN_KEY, "user", "USER_ACCESSES", "USER_PERMISSIONS"].forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem("current_menu");
    window.dispatchEvent(new Event("auth-changed"));
};
