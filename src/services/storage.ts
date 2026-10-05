const TOKEN_KEY = "access_token";

export const setToken = (token:string) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

export const setUser = (user:any) => {
    localStorage.setItem("user", JSON.stringify(user));
}

export const getUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

export const removeUser = () => {
    localStorage.removeItem("user");
}

export const setCurrentMenu = ( moduleId: number | null,  menuId: number | null, childMenuId: number | null ) => {
    sessionStorage.setItem( "current_menu", JSON.stringify({ moduleId, menuId, childMenuId, }));
};

export const getCurrentMenu = () => {
    const data = sessionStorage.getItem("current_menu");
    if (!data) { return { moduleId: null,menuId: null,childMenuId: null, };}
    try { return JSON.parse(data); } 
    catch {return { moduleId: null, menuId: null, childMenuId: null, };}
};
