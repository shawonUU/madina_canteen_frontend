import { useCallback } from "react";

type AccessAction = "view" | "create" | "update" | "delete";

interface UserAccess {
    module_id: number;
    menu_id: number;
    child_menu_id: number | null;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
}

export const userAccess = () => {
    const getAccesses = (): UserAccess[] => {
        const storedAccesses = localStorage.getItem("USER_ACCESSES");

        console.log("USER_ACCESSES:", storedAccesses);

        if (!storedAccesses) {
            return [];
        }

        try {
            const parsed = JSON.parse(storedAccesses);

            console.log("Parsed accesses:", parsed);

            if (!Array.isArray(parsed)) {
                console.error(
                    "USER_ACCESSES must be an array:",
                    parsed
                );

                return [];
            }

            return parsed;
        } catch (error) {
            console.error(
                "Invalid USER_ACCESSES in localStorage:",
                error
            );

            return [];
        }
    };

    const can = useCallback(
        (
            menuId: number,
            childMenuId: number | null,
            action: AccessAction
        ): boolean => {
            const accesses = getAccesses();

            const access = accesses.find(
                (item) =>
                    Number(item.menu_id) === Number(menuId) &&
                    (
                        childMenuId === null
                            ? item.child_menu_id === null
                            : Number(item.child_menu_id) ===
                              Number(childMenuId)
                    )
            );

            if (!access) {
                return false;
            }

            return Boolean(access[`can_${action}`]);
        },
        []
    );

    const menuHasAccess = useCallback(
        (menuId: number): boolean => {
            const accesses = getAccesses();

            return accesses.some(
                (item) =>
                    Number(item.menu_id) === Number(menuId) &&
                    item.can_view === true
            );
        },
        []
    );

    const childMenuHasAccess = useCallback(
        (
            menuId: number,
            childMenuId: number
        ): boolean => {
            const accesses = getAccesses();

            return accesses.some(
                (item) =>
                    Number(item.menu_id) === Number(menuId) &&
                    Number(item.child_menu_id) === Number(childMenuId) &&
                    item.can_view === true
            );
        },
        []
    );

    const moduleHasAccess = useCallback(
        (moduleId: number): boolean => {
            const accesses = getAccesses();

            return accesses.some(
                (item) =>
                    Number(item.module_id) === Number(moduleId) &&
                    item.can_view === true
            );
        },
        []
    );

    return {
        can,
        moduleHasAccess,
        menuHasAccess,
        childMenuHasAccess,
    };
};

