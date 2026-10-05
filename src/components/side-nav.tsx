import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { setCurrentMenu } from "../services/storage";

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

export default function SideNav({
    openSidebar,
    setOpenSidebar,
}: SidebarProps) {
    const navigate = useNavigate();

    const [modules, setModules] = useState<Module[]>([]);
    const [openModules, setOpenModules] = useState<Record<number, boolean>>(
        {}
    );
    const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);

            const response = await api.get("/admin/modules", {
                params: {
                    is_active: true,
                },
            });

            if (response.data.success) {
                setModules(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load sidebar menus:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (moduleId: number) => {
        setOpenModules((prev) => ({
            ...prev,
            [moduleId]: !prev[moduleId],
        }));
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
        if (!route) {return;}
        setCurrentMenu(moduleId,  menuId, childMenuId );
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
            {/* Mobile Close Button */}
            <button
                onClick={() => setOpenSidebar(false)}
                className="lg:hidden text-white text-right mr-3 text-2xl"
            >
                ✕
            </button>

            {/* Logo / Title */}
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
                {/* Dashboard */}
                <div
                    onClick={() => handleNavigate("/dashboard")}
                    className="
                        px-4 py-3
                        rounded-xl
                        hover:bg-white/20
                        cursor-pointer
                        transition
                    "
                >
                    Dashboard
                </div>

                {/* Loading */}
                {loading && (
                    <div className="px-4 py-3 text-sm text-white/70">
                        Loading menu...
                    </div>
                )}

                {/* Modules */}
                {!loading &&
                    modules.map((module) => {
                        const hasMenus =
                            module.menus && module.menus.length > 0;

                        const isModuleOpen =
                            openModules[module.id] ?? false;

                        return (
                            <div
                                key={module.id}
                                className="mt-2"
                            >
                                {/* Module */}
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
                                        {module.name}
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

                                {/* Module Menus */}
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
                                            {module.menus.map((menu) => {
                                                const hasChildren =
                                                    menu.child_menus &&
                                                    menu.child_menus.length > 0;

                                                const isMenuOpen =
                                                    openMenus[menu.id] ?? false;

                                                return (
                                                    <div
                                                        key={menu.id}
                                                    >
                                                        {/* Menu */}
                                                        <div
                                                            onClick={() => {
                                                                if (
                                                                    hasChildren
                                                                ) {
                                                                    toggleMenu(
                                                                        menu.id
                                                                    );
                                                                } else {
                                                                    handleNavigate( '/'+module.slug+'/'+menu.slug, module.id, menu.id, null );
                                                                }
                                                            }}
                                                            className="
                                                                px-4 py-2.5
                                                                rounded-lg
                                                                hover:bg-white/20
                                                                cursor-pointer
                                                                transition
                                                                flex
                                                                justify-between
                                                                items-center
                                                            "
                                                        >
                                                            <span>
                                                                {menu.name}
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

                                                        {/* Child Menus */}
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
                                                                    {menu.child_menus.map(
                                                                        (
                                                                            childMenu
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    childMenu.id
                                                                                }
                                                                                onClick={() =>
                                                                                    handleNavigate( '/'+module.slug+'/'+menu.slug+'/'+childMenu.slug,  module.id, menu.id, childMenu.id )
                                                                                }
                                                                                className="
                                                                                    px-4 py-2
                                                                                    rounded-lg
                                                                                    hover:bg-white/20
                                                                                    cursor-pointer
                                                                                    transition
                                                                                    text-sm
                                                                                "
                                                                            >
                                                                                {
                                                                                    childMenu.name
                                                                                }
                                                                            </div>
                                                                        )
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
                        );
                    })}
            </nav>
        </aside>
    );
}