import {
    ChevronDown,
    Settings,
    Users,
    Package,
    ShieldCheck,
    UserRound,
    FileText,
    ClipboardList,
    CalendarDays,
    BarChart3,
    Database,
    Building2,
    Truck,
    Receipt,
    ShoppingCart,
    Boxes,
    Folder,
    Circle,
    Utensils,
    ChevronRight,
    CircleDot,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { setCurrentMenu } from "../services/storage";
import { userAccess } from "../hooks/userAccess";

interface SidebarProps {
    openSidebar: boolean;
    setOpenSidebar: (value: boolean) => void;
}

interface ChildMenu {
    id: number;
    name: string;
    slug: string;
    route: string | null;
    permission: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
}

interface Menu {
    id: number;
    name: string;
    slug: string;
    route: string | null;
    permission: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    child_menus: ChildMenu[];
}

interface Module {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    menus: Menu[];
}

let cachedModules: Module[] | null = null;

export default function SideNav({
    openSidebar,
    setOpenSidebar,
}: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        moduleHasAccess,
        menuHasAccess,
        childMenuHasAccess,
    } = userAccess();

    const iconMap: Record<string, React.ElementType> = {
        Settings,
        Users,
        Package,
        ShieldCheck,
        UserRound,
        FileText,
        ClipboardList,
        CalendarDays,
        BarChart3,
        Database,
        Building2,
        Truck,
        Receipt,
        ShoppingCart,
        Boxes,
        Folder,
        Utensils,
        ChevronRight,
        CircleDot,
    };

    const getIcon = (icon: string | null) => {
        return iconMap[icon ?? ""] ?? Circle;
    };

    const getChildIcon = (icon: string | null) => {
        return iconMap[icon ?? ""] ?? CircleDot;
    };

    const [modules, setModules] = useState<Module[]>(
        () => cachedModules ?? []
    );

    const [openModules, setOpenModules] = useState<
        Record<number, boolean>
    >({});

    const [openMenus, setOpenMenus] = useState<
        Record<number, boolean>
    >({});

    const [loading, setLoading] = useState(
        () => cachedModules === null
    );

    const pathSegments = location.pathname
        .split("/")
        .filter(Boolean);

    const activeModuleSlug = pathSegments[0] ?? "";
    const activeMenuSlug = pathSegments[1] ?? "";
    const activeChildMenuSlug = pathSegments[2] ?? "";

    const isDashboardActive =
        location.pathname.replace(/\/+$/, "") === "/dashboard";

    useEffect(() => {
        if (cachedModules !== null) {
            setModules(cachedModules);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchModules = async () => {
            try {
                setLoading(true);

                const response = await api.get("/admin/modules", {
                    params: {
                        is_active: true,
                    },
                });

                if (response.data.success) {
                    cachedModules = response.data.data;

                    if (!cancelled) {
                        setModules(cachedModules);
                    }
                }
            } catch (error) {
                console.error(
                    "Failed to load sidebar menus:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchModules();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!modules.length) {
            setOpenModules({});
            setOpenMenus({});
            return;
        }

        const activeModule = modules.find(
            (module) => module.slug === activeModuleSlug
        );

        if (!activeModule) {
            setOpenModules({});
            setOpenMenus({});
            return;
        }

        const activeMenu = activeModule.menus?.find(
            (menu) => menu.slug === activeMenuSlug
        );

        setOpenModules({
            [activeModule.id]: true,
        });

        setOpenMenus(
            activeMenu
                ? { [activeMenu.id]: true }
                : {}
        );
    }, [
        location.pathname,
        modules,
        activeModuleSlug,
        activeMenuSlug,
    ]);

    const toggleModule = (moduleId: number) => {
        setOpenModules((prev) => ({
            [moduleId]: !prev[moduleId],
        }));

        setOpenMenus({});
    };

    const toggleMenu = (menuId: number) => {
        setOpenMenus((prev) => ({
            ...prev,
            [menuId]: !prev[menuId],
        }));
    };

    const handleNavigate = (
        route: string | null,
        moduleId: number | null = null,
        menuId: number | null = null,
        childMenuId: number | null = null
    ) => {
        if (!route) {
            return;
        }

        setCurrentMenu(moduleId, menuId, childMenuId);
        navigate(route);
        setOpenSidebar(false);
    };

    return (
        <aside
            className={`
                fixed lg:static top-0 left-0 z-50
                w-72 min-h-screen
                bg-gradient-to-b from-indigo-700 to-purple-800
                text-white flex flex-col p-6 pr-0 pt-0
                transform transition-transform duration-300
                ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
            `}
        >
            <button
                onClick={() => setOpenSidebar(false)}
                className="lg:hidden text-white text-right mr-3 text-2xl"
            >
                ✕
            </button>

            <h1 className="text-3xl font-bold mb-10 lg:mt-8">
                Madina ERP
            </h1>

            <nav
                className="
                    space-y-2
                    scrollbar-thin
                    scrollbar-thumb-gray-300
                    scrollbar-track-gray-100
                    scrollbar-thumb-rounded-full
                    scrollbar-track-rounded-full
                    overflow-y-auto
                    h-[calc(100vh-64px)]
                    pr-3
                "
            >
                <div
                    onClick={() => handleNavigate("/dashboard")}
                    className={`
                        px-4 py-3
                        rounded-xl
                        cursor-pointer
                        transition
                        ${
                            isDashboardActive
                                ? "bg-white/25 font-semibold"
                                : "hover:bg-white/20"
                        }
                    `}
                >
                    Dashboard
                </div>

                {loading && (
                    <div className="px-4 py-3 text-sm text-white/70">
                        Loading menu...
                    </div>
                )}

                {!loading &&
                    modules.map((module) => {
                        const hasMenus =
                            module.menus &&
                            module.menus.length > 0;

                        const isModuleOpen =
                            openModules[module.id] ?? false;

                        return (
                            moduleHasAccess(module.id) && (
                                <div
                                    key={module.id}
                                    className="mt-2"
                                >
                                    <div
                                        onClick={() => {
                                            if (hasMenus) {
                                                toggleModule(module.id);
                                            } else {
                                                handleNavigate(null);
                                            }
                                        }}
                                        className="
                                            px-4 py-3
                                            rounded-xl
                                            hover:bg-white/20
                                            cursor-pointer
                                            transition
                                            flex
                                            justify-between
                                            items-center
                                        "
                                    >
                                        <span className="font-medium">
                                            {(() => {
                                                const ModuleIcon =
                                                    getIcon(module.icon);

                                                return (
                                                    <span className="flex items-center gap-3 font-medium">
                                                        <ModuleIcon size={19} />
                                                        {module.name}
                                                    </span>
                                                );
                                            })()}
                                        </span>

                                        {hasMenus && (
                                            <ChevronDown
                                                size={18}
                                                className={`
                                                    transition-transform
                                                    duration-200
                                                    ${
                                                        isModuleOpen
                                                            ? "rotate-180"
                                                            : ""
                                                    }
                                                `}
                                            />
                                        )}
                                    </div>

                                    {hasMenus && (
                                        <div
                                            className={`
                                                ml-3
                                                overflow-hidden
                                                transition-all
                                                duration-300
                                                ease-in-out
                                                ${
                                                    isModuleOpen
                                                        ? "max-h-[1000px] opacity-100"
                                                        : "max-h-0 opacity-0"
                                                }
                                            `}
                                        >
                                            <div className="mt-1 space-y-1">
                                                {module.menus
                                                    .filter((menu) => {
                                                        if (
                                                            menu.child_menus &&
                                                            menu.child_menus.length > 0
                                                        ) {
                                                            return menu.child_menus.some(
                                                                (childMenu) =>
                                                                    childMenuHasAccess(
                                                                        menu.id,
                                                                        childMenu.id
                                                                    )
                                                            );
                                                        }

                                                        return menuHasAccess(
                                                            menu.id
                                                        );
                                                    })
                                                    .map((menu) => {
                                                        const accessibleChildren =
                                                            menu.child_menus?.filter(
                                                                (childMenu) =>
                                                                    childMenuHasAccess(
                                                                        menu.id,
                                                                        childMenu.id
                                                                    )
                                                            ) ?? [];

                                                        const hasChildren =
                                                            accessibleChildren.length > 0;

                                                        const isMenuOpen =
                                                            openMenus[menu.id] ?? false;

                                                        const isActiveMenu =
                                                            activeModuleSlug === module.slug &&
                                                            activeMenuSlug === menu.slug &&
                                                            !activeChildMenuSlug;

                                                        return (
                                                            <div key={menu.id}>
                                                                <div
                                                                    onClick={() => {
                                                                        if (hasChildren) {
                                                                            toggleMenu(menu.id);
                                                                        } else {
                                                                            handleNavigate(
                                                                                "/" +
                                                                                    module.slug +
                                                                                    "/" +
                                                                                    menu.slug,
                                                                                module.id,
                                                                                menu.id,
                                                                                null
                                                                            );
                                                                        }
                                                                    }}
                                                                    className={`
                                                                        px-4 py-2.5
                                                                        rounded-lg
                                                                        cursor-pointer
                                                                        transition
                                                                        flex
                                                                        justify-between
                                                                        items-center
                                                                        ${
                                                                            isActiveMenu
                                                                                ? "bg-white/25 font-semibold"
                                                                                : "hover:bg-white/20"
                                                                        }
                                                                    `}
                                                                >
                                                                    <span>
                                                                        {(() => {
                                                                            const MenuIcon =
                                                                                getIcon(menu.icon);

                                                                            return (
                                                                                <span className="flex items-center gap-3">
                                                                                    <MenuIcon size={17} />
                                                                                    {menu.name}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </span>

                                                                    {hasChildren && (
                                                                        <ChevronDown
                                                                            size={17}
                                                                            className={`
                                                                                transition-transform
                                                                                duration-200
                                                                                ${
                                                                                    isMenuOpen
                                                                                        ? "rotate-180"
                                                                                        : ""
                                                                                }
                                                                            `}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {hasChildren && (
                                                                    <div
                                                                        className={`
                                                                            ml-4
                                                                            overflow-hidden
                                                                            transition-all
                                                                            duration-300
                                                                            ease-in-out
                                                                            ${
                                                                                isMenuOpen
                                                                                    ? "max-h-[1000px] opacity-100"
                                                                                    : "max-h-0 opacity-0"
                                                                            }
                                                                        `}
                                                                    >
                                                                        <div className="mt-1 space-y-1">
                                                                            {accessibleChildren.map(
                                                                                (childMenu) => {
                                                                                    const isActiveChildMenu =
                                                                                        activeModuleSlug === module.slug &&
                                                                                        activeMenuSlug === menu.slug &&
                                                                                        activeChildMenuSlug === childMenu.slug;

                                                                                    return (
                                                                                        <div
                                                                                            key={childMenu.id}
                                                                                            onClick={() =>
                                                                                                handleNavigate(
                                                                                                    "/" +
                                                                                                        module.slug +
                                                                                                        "/" +
                                                                                                        menu.slug +
                                                                                                        "/" +
                                                                                                        childMenu.slug,
                                                                                                    module.id,
                                                                                                    menu.id,
                                                                                                    childMenu.id
                                                                                                )
                                                                                            }
                                                                                            className={`
                                                                                                px-4 py-2
                                                                                                rounded-lg
                                                                                                cursor-pointer
                                                                                                transition
                                                                                                text-sm
                                                                                                ${
                                                                                                    isActiveChildMenu
                                                                                                        ? "bg-white/25 font-semibold"
                                                                                                        : "hover:bg-white/20"
                                                                                                }
                                                                                            `}
                                                                                        >
                                                                                            {(() => {
                                                                                                const ChildIcon =
                                                                                                    getChildIcon(
                                                                                                        childMenu.icon
                                                                                                    );

                                                                                                return (
                                                                                                    <span className="flex items-center gap-3">
                                                                                                        <ChildIcon size={15} />
                                                                                                        {childMenu.name}
                                                                                                    </span>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        );
                    })}
            </nav>
        </aside>
    );
}