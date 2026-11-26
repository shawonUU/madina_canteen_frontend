import { getUserAccess, getUserPermissions } from "./storage";
export const hasPermission = (key: string): boolean => getUserPermissions().includes(key);
export const canAccess = (moduleSlug: string, menuSlug: string, childSlug: string | null, action: "view" | "create" | "update" | "delete" = "view"): boolean =>
    getUserAccess().some(row => row.module_slug === moduleSlug && row.menu_slug === menuSlug && (row.child_menu_slug ?? null) === childSlug && Boolean(row[`can_${action}`]));
