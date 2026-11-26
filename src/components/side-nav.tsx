import {
    LayoutDashboard,
    X,
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
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { setCurrentMenu, getToken, setUserAccess, setUserPermissions } from "../services/storage";
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
let cachedToken: string | null = null;
export default function SideNav({
    openSidebar,
    setOpenSidebar,
}: SidebarProps) {
    const token = getToken();
    if (cachedToken !== token) { cachedModules = null; cachedToken = token; }
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
    const currentPath = location.pathname.replace(/\/+$/, "");
    const matches = (route: string | null | undefined) => Boolean(route && (currentPath === route.replace(/\/+$/, "") || currentPath.startsWith(route.replace(/\/+$/, "") + "/")));
    const activeEntry = modules.flatMap(module => module.menus.flatMap(menu => [
        { module, menu, child: null as ChildMenu | null, route: menu.route },
        ...(menu.child_menus ?? []).map(child => ({ module, menu, child, route: child.route })),
    ])).filter(entry => matches(entry.route)).sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))[0];
    const pathSegments = currentPath.split("/").filter(Boolean);
    const activeModuleSlug = activeEntry?.module.slug ?? pathSegments[0] ?? "";
    const activeMenuSlug = activeEntry?.menu.slug ?? pathSegments[1] ?? "";
    const activeChildMenuSlug = activeEntry?.child?.slug ?? (activeEntry ? "" : pathSegments[2] ?? "");
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
                const response = await api.get("/auth/navigation", {
                    params: {
                        is_active: true,
                    },
                });
                if (response.data.success) {
                    cachedModules = response.data.data;
                    setUserAccess(response.data.accesses ?? []);
                    setUserPermissions(response.data.permissions ?? []);
                    if (!cancelled) {
                        setModules(cachedModules ?? []);
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
        setOpenModules({ [activeModule.id]: true });
        setCurrentMenu(activeModule.id, activeMenu?.id ?? null, activeEntry?.child?.id ?? null);
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
        activeEntry?.child?.id,
    ]);
    const toggleModule = (moduleId: number) => {
        setOpenModules((prev) => ({
            [moduleId]: !prev[moduleId],
        }));
        setOpenMenus({});
    };
    const toggleMenu = (menuId: number) => {
        setOpenMenus((prev) => ({
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
    const dashboardState = isDashboardActive ? activeRow : idleRow;

    return (
        <>
            {openSidebar && (
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                    onClick={() => setOpenSidebar(false)}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-screen h-[100dvh] w-72 max-w-[90vw] shrink-0 flex-col
                    border-r border-white/10 bg-gradient-to-b from-indigo-700 to-purple-800
                    text-white shadow-xl transition-[transform,visibility] duration-300 ease-out
                    motion-reduce:transition-none lg:visible lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none
                    ${openSidebar ? "visible translate-x-0" : "invisible -translate-x-full"}`}
            >
                <header className="mx-4 flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white">
                        <Building2 size={21} aria-hidden="true" />
                    </div>
                    <h1 className="truncate text-lg font-semibold tracking-tight">Madina ERP</h1>
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        onClick={() => setOpenSidebar(false)}
                        className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-300 lg:hidden"
                    >
                        <X size={19} aria-hidden="true" />
                    </button>
                </header>

                <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#52527a_transparent]">
                    <button
                        type="button"
                        aria-current={isDashboardActive ? "page" : undefined}
                        onClick={() => handleNavigate("/dashboard")}
                        className={`${row} ${dashboardState}`}
                    >
                        <LayoutDashboard size={18} className="shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1">Dashboard</span>
                    </button>

                    {loading && <p role="status" className="px-3 py-2 text-sm text-slate-300">Loading menu…</p>}

                    {!loading && modules.filter((module) => moduleHasAccess(module.id)).map((module) => {
                        const ModuleIcon = getIcon(module.icon);
                        const moduleOpen = Boolean(openModules[module.id]);
                        const moduleActive = activeModuleSlug === module.slug;
                        const modulePanel = `sidenav-module-${module.id}`;
                        const visibleMenus = (module.menus ?? []).map((menu) => ({
                            menu,
                            children: (menu.child_menus ?? []).filter((child) => childMenuHasAccess(menu.id, child.id)),
                        })).filter(({ menu, children }) =>
                            menu.child_menus?.length ? children.length > 0 : menuHasAccess(menu.id)
                        );
                        const expandable = visibleMenus.length > 0;

                        return (
                            <div key={module.id}>
                                <button
                                    type="button"
                                    disabled={!expandable}
                                    aria-expanded={expandable ? moduleOpen : undefined}
                                    aria-controls={expandable ? modulePanel : undefined}
                                    onClick={() => toggleModule(module.id)}
                                    className={`${row} ${moduleActive ? branchRow : idleRow} disabled:opacity-50`}
                                >
                                    <ModuleIcon size={18} className="shrink-0" aria-hidden="true" />
                                    <span className="min-w-0 flex-1 break-words">{module.name}</span>
                                    {expandable && <DisclosureArrow expanded={moduleOpen} />}
                                </button>

                                {expandable && (
                                    <DisclosurePanel id={modulePanel} expanded={moduleOpen}>
                                        {visibleMenus.map(({ menu, children }) => {
                                            const MenuIcon = getIcon(menu.icon);
                                            const menuOpen = Boolean(openMenus[menu.id]);
                                            const menuActive = moduleActive && activeMenuSlug === menu.slug;
                                            const hasChildren = children.length > 0;
                                            const current = menuActive && !activeChildMenuSlug && !hasChildren;
                                            const menuPanel = `sidenav-menu-${module.id}-${menu.id}`;
                                            const menuRoute = menu.route || `/${module.slug}/${menu.slug}`;

                                            return (
                                                <div key={menu.id}>
                                                    <button
                                                        type="button"
                                                        tabIndex={moduleOpen ? undefined : -1}
                                                        aria-current={current ? "page" : undefined}
                                                        aria-expanded={hasChildren ? menuOpen : undefined}
                                                        aria-controls={hasChildren ? menuPanel : undefined}
                                                        onClick={() => hasChildren
                                                            ? toggleMenu(menu.id)
                                                            : handleNavigate(menuRoute, module.id, menu.id)}
                                                        className={`${row} ${current ? activeRow : menuActive ? branchRow : idleRow}`}
                                                    >
                                                        <MenuIcon size={16} className="shrink-0" aria-hidden="true" />
                                                        <span className="min-w-0 flex-1 break-words">{menu.name}</span>
                                                        {hasChildren && <DisclosureArrow expanded={menuOpen} />}
                                                    </button>

                                                    {hasChildren && (
                                                        <DisclosurePanel id={menuPanel} expanded={menuOpen}>
                                                            {children.map((child) => {
                                                                const ChildIcon = getChildIcon(child.icon);
                                                                const childActive = menuActive && activeChildMenuSlug === child.slug;
                                                                const childRoute = child.route || `/${module.slug}/${menu.slug}/${child.slug}`;

                                                                return (
                                                                    <button
                                                                        key={child.id}
                                                                        type="button"
                                                                        tabIndex={moduleOpen && menuOpen ? undefined : -1}
                                                                        aria-current={childActive ? "page" : undefined}
                                                                        onClick={() => handleNavigate(childRoute, module.id, menu.id, child.id)}
                                                                        className={`${row} ${childActive ? activeRow : idleRow}`}
                                                                    >
                                                                        <ChildIcon size={14} className="shrink-0" aria-hidden="true" />
                                                                        <span className="min-w-0 flex-1 break-words">{child.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </DisclosurePanel>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </DisclosurePanel>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}

const row = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm leading-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300 motion-reduce:transition-none";
const activeRow = "bg-indigo-500/[0.25] font-semibold text-white ring-1 ring-inset ring-indigo-300/30";
const branchRow = "bg-white/10 font-medium text-white hover:bg-white/[0.15]";
const idleRow = "text-slate-300 hover:bg-white/10 hover:text-white";

function DisclosureArrow({ expanded }: { expanded: boolean }) {
    return (
        <ChevronRight
            size={15}
            aria-hidden="true"
            className={`shrink-0 text-slate-400 transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`}
        />
    );
}

function DisclosurePanel({ id, expanded, children }: { id: string; expanded: boolean; children: ReactNode }) {
    return (
        <div
            id={id}
            aria-hidden={!expanded}
            className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-out motion-reduce:transition-none
                ${expanded ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
        >
            <div className="min-h-0 overflow-hidden">
                <div className="ml-4 space-y-1 border-l border-white/[0.15] py-1 pl-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
