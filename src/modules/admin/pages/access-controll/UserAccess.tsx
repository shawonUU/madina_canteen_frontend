import {
  ShieldCheck,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  UserRound,
  Check,
  RotateCcw,
  Search,
  Layers3,
  Menu as MenuIcon,
  ListTree,
  LockKeyhole,
  UnlockKeyhole,
  CheckCheck,
  X,
  CircleHelp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Permission {
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface ExtraPermission {
  id: number;
  name: string;
  key: string;
  description?: string | null;
  allowed: boolean;
}

interface ChildMenu {
  id: number;
  code: string;
  name: string;
  slug: string;
  route?: string | null;
  icon?: string | null;
  sort_order: number;
  permission: Permission;
  extra_permissions: ExtraPermission[];
}

interface Menu {
  id: number;
  code: string;
  name: string;
  slug: string;
  route?: string | null;
  icon?: string | null;
  sort_order: number;
  has_child_menu: boolean;
  permission: Permission | null;
  extra_permissions: ExtraPermission[];
  child_menus: ChildMenu[];
}

interface Module {
  id: number;
  code: string;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order: number;
  extra_permissions: ExtraPermission[];
  menus: Menu[];
}

type PermissionKey = keyof Permission;

const PERMISSION_FIELDS: {
  key: PermissionKey;
  label: string;
  short: string;
}[] = [
  { key: "can_view", label: "View", short: "V" },
  { key: "can_create", label: "Create", short: "C" },
  { key: "can_update", label: "Update", short: "U" },
  { key: "can_delete", label: "Delete", short: "D" },
];

const EMPTY_PERMISSION: Permission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
};

const getPermissionCount = (permission?: Permission | null) =>
  permission
    ? PERMISSION_FIELDS.filter((field) => permission[field.key]).length
    : 0;

const isPermissionFull = (permission?: Permission | null) =>
  getPermissionCount(permission) === PERMISSION_FIELDS.length;

const isPermissionEmpty = (permission?: Permission | null) =>
  getPermissionCount(permission) === 0;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const normalizeList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

export default function UserAccessPage() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<Module[]>([]);

  const selectedUserInfo = useMemo(
    () => users.find((user) => user.id === selectedUser),
    [users, selectedUser]
  );

  const isDirty = useMemo(
    () => JSON.stringify(modules) !== JSON.stringify(savedSnapshot),
    [modules, savedSnapshot]
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/admin/users");
      const list = res.data.data?.users ?? res.data.data ?? res.data;
      setUsers(normalizeList<User>(list));
    } catch (error) {
      console.error("Failed to load users:", error);
      setNotice({ type: "error", message: "Unable to load users." });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadUserAccess = useCallback(async (userId: number) => {
    try {
      setLoadingAccess(true);
      setNotice(null);

      const res = await api.get(`/admin/users/${userId}/access`);
      const loadedModules = normalizeList<Module>(
        res.data.data?.modules ?? []
      );

      setModules(loadedModules);
      setSavedSnapshot(JSON.parse(JSON.stringify(loadedModules)));
      setExpandedModules(loadedModules.map((module) => module.id));
      setExpandedMenus([]);
    } catch (error) {
      console.error("Failed to load user access:", error);
      setModules([]);
      setSavedSnapshot([]);
      setNotice({
        type: "error",
        message: "Unable to load this user's access permissions.",
      });
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      loadUserAccess(selectedUser);
    } else {
      setModules([]);
      setSavedSnapshot([]);
      setExpandedModules([]);
      setExpandedMenus([]);
    }
  }, [selectedUser, loadUserAccess]);

  const updatePermission = (
    moduleId: number,
    menuId: number,
    childMenuId: number | null,
    field: PermissionKey,
    value: boolean
  ) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) return menu;

            if (childMenuId === null) {
              if (!menu.permission) return menu;

              return {
                ...menu,
                permission: { ...menu.permission, [field]: value },
              };
            }

            return {
              ...menu,
              child_menus: menu.child_menus.map((child) =>
                child.id === childMenuId
                  ? {
                      ...child,
                      permission: {
                        ...child.permission,
                        [field]: value,
                      },
                    }
                  : child
              ),
            };
          }),
        };
      })
    );
  };

  const setMenuAll = (
    moduleId: number,
    menuId: number,
    value: boolean
  ) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) return menu;

            return {
              ...menu,
              permission: menu.permission
                ? {
                    can_view: value,
                    can_create: value,
                    can_update: value,
                    can_delete: value,
                  }
                : menu.permission,
              child_menus: menu.child_menus.map((child) => ({
                ...child,
                permission: {
                  can_view: value,
                  can_create: value,
                  can_update: value,
                  can_delete: value,
                },
              })),
            };
          }),
        };
      })
    );
  };

  const setModuleAll = (moduleId: number, value: boolean) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        return {
          ...module,
          menus: module.menus.map((menu) => ({
            ...menu,
            permission: menu.permission
              ? {
                  can_view: value,
                  can_create: value,
                  can_update: value,
                  can_delete: value,
                }
              : menu.permission,
            child_menus: menu.child_menus.map((child) => ({
              ...child,
              permission: {
                can_view: value,
                can_create: value,
                can_update: value,
                can_delete: value,
              },
            })),
          })),
        };
      })
    );
  };

  const updateExtraPermission = (
    moduleId: number,
    permissionId: number,
    value: boolean,
    menuId?: number,
    childMenuId?: number
  ) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        if (menuId === undefined) {
          return {
            ...module,
            extra_permissions: module.extra_permissions.map((permission) =>
              permission.id === permissionId
                ? { ...permission, allowed: value }
                : permission
            ),
          };
        }

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) return menu;

            if (childMenuId === undefined) {
              return {
                ...menu,
                extra_permissions: menu.extra_permissions.map((permission) =>
                  permission.id === permissionId
                    ? { ...permission, allowed: value }
                    : permission
                ),
              };
            }

            return {
              ...menu,
              child_menus: menu.child_menus.map((child) =>
                child.id === childMenuId
                  ? {
                      ...child,
                      extra_permissions: child.extra_permissions.map(
                        (permission) =>
                          permission.id === permissionId
                            ? { ...permission, allowed: value }
                            : permission
                      ),
                    }
                  : child
              ),
            };
          }),
        };
      })
    );
  };

  const setExtraPermissions = (
    moduleId: number,
    value: boolean,
    menuId?: number,
    childMenuId?: number
  ) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        if (menuId === undefined) {
          return {
            ...module,
            extra_permissions: module.extra_permissions.map((item) => ({
              ...item,
              allowed: value,
            })),
          };
        }

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) return menu;

            if (childMenuId === undefined) {
              return {
                ...menu,
                extra_permissions: menu.extra_permissions.map((item) => ({
                  ...item,
                  allowed: value,
                })),
              };
            }

            return {
              ...menu,
              child_menus: menu.child_menus.map((child) =>
                child.id === childMenuId
                  ? {
                      ...child,
                      extra_permissions: child.extra_permissions.map(
                        (item) => ({ ...item, allowed: value })
                      ),
                    }
                  : child
              ),
            };
          }),
        };
      })
    );
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId]
    );
  };

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((current) =>
      current.includes(menuId)
        ? current.filter((id) => id !== menuId)
        : [...current, menuId]
    );
  };

  const expandAll = () => {
    setExpandedModules(modules.map((module) => module.id));
    setExpandedMenus(
      modules.flatMap((module) => module.menus.map((menu) => menu.id))
    );
  };

  const collapseAll = () => {
    setExpandedModules([]);
    setExpandedMenus([]);
  };

  const saveAccess = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      setNotice(null);

      const permissions: {
        module_id: number;
        menu_id: number;
        child_menu_id: number | null;
        can_view: boolean;
        can_create: boolean;
        can_update: boolean;
        can_delete: boolean;
      }[] = [];

      const extraPermissions = new Set<number>();

      modules.forEach((module) => {
        module.extra_permissions.forEach((permission) => {
          if (permission.allowed) extraPermissions.add(permission.id);
        });

        module.menus.forEach((menu) => {
          menu.extra_permissions.forEach((permission) => {
            if (permission.allowed) extraPermissions.add(permission.id);
          });

          if (menu.child_menus.length > 0) {
            menu.child_menus.forEach((child) => {
              permissions.push({
                module_id: module.id,
                menu_id: menu.id,
                child_menu_id: child.id,
                can_view: child.permission.can_view,
                can_create: child.permission.can_create,
                can_update: child.permission.can_update,
                can_delete: child.permission.can_delete,
              });

              child.extra_permissions.forEach((permission) => {
                if (permission.allowed) extraPermissions.add(permission.id);
              });
            });
          } else if (menu.permission) {
            permissions.push({
              module_id: module.id,
              menu_id: menu.id,
              child_menu_id: null,
              can_view: menu.permission.can_view,
              can_create: menu.permission.can_create,
              can_update: menu.permission.can_update,
              can_delete: menu.permission.can_delete,
            });
          }
        });
      });

      await api.put(`/admin/users/${selectedUser}/access`, {
        permissions,
        extra_permissions: Array.from(extraPermissions),
      });

      await loadUserAccess(selectedUser);
      setNotice({
        type: "success",
        message: "User access permissions saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save user access:", error);
      setNotice({
        type: "error",
        message: "Failed to save access. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const undoChanges = () => {
    if (!isDirty) return;
    setModules(JSON.parse(JSON.stringify(savedSnapshot)));
    setNotice({
      type: "success",
      message: "Unsaved changes have been discarded.",
    });
  };

  const getModuleStats = (module: Module) => {
    const records = module.menus.flatMap((menu) =>
      menu.child_menus.length
        ? menu.child_menus.map((child) => child.permission)
        : menu.permission
          ? [menu.permission]
          : []
    );

    const granted = records.reduce(
      (total, permission) => total + getPermissionCount(permission),
      0
    );

    const possible = records.length * PERMISSION_FIELDS.length;

    const extraGranted = [
      ...module.extra_permissions,
      ...module.menus.flatMap((menu) => [
        ...menu.extra_permissions,
        ...menu.child_menus.flatMap((child) => child.extra_permissions),
      ]),
    ].filter((permission) => permission.allowed).length;

    return { granted, possible, extraGranted, records: records.length };
  };

  const filteredModules = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return modules;

    return modules
      .map((module) => {
        const moduleMatches =
          module.name.toLowerCase().includes(keyword) ||
          module.code.toLowerCase().includes(keyword);

        if (moduleMatches) return module;

        const menus = module.menus
          .map((menu) => {
            const menuMatches =
              menu.name.toLowerCase().includes(keyword) ||
              menu.code.toLowerCase().includes(keyword);

            if (menuMatches) return menu;

            const child_menus = menu.child_menus.filter(
              (child) =>
                child.name.toLowerCase().includes(keyword) ||
                child.code.toLowerCase().includes(keyword)
            );

            return child_menus.length ? { ...menu, child_menus } : null;
          })
          .filter(Boolean) as Menu[];

        return menus.length ? { ...module, menus } : null;
      })
      .filter(Boolean) as Module[];
  }, [modules, search]);

  const totals = useMemo(() => {
    let records = 0;
    let granted = 0;
    let extraGranted = 0;

    modules.forEach((module) => {
      const stats = getModuleStats(module);
      records += stats.records;
      granted += stats.granted;
      extraGranted += stats.extraGranted;
    });

    return {
      modules: modules.length,
      records,
      granted,
      possible: records * 4,
      extraGranted,
    };
  }, [modules]);

  const renderExtraPermissions = (
    items: ExtraPermission[],
    moduleId: number,
    menuId?: number,
    childMenuId?: number
  ) => {
    if (!items?.length) return null;

    const enabledCount = items.filter((item) => item.allowed).length;
    const allEnabled = enabledCount === items.length;

    return (
      <section className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LockKeyhole size={15} className="text-violet-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-800">
              Extra permissions
            </h4>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {enabledCount}/{items.length} enabled
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setExtraPermissions(
                moduleId,
                !allEnabled,
                menuId,
                childMenuId
              )
            }
            className="text-xs font-semibold text-violet-700 transition hover:text-violet-900"
          >
            {allEnabled ? "Remove all" : "Grant all"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((permission) => (
            <label
              key={permission.id}
              title={permission.description || permission.key}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                permission.allowed
                  ? "border-violet-300 bg-white shadow-sm"
                  : "border-violet-100 bg-white/60 hover:border-violet-200"
              }`}
            >
              <input
                type="checkbox"
                checked={permission.allowed}
                onChange={(event) =>
                  updateExtraPermission(
                    moduleId,
                    permission.id,
                    event.target.checked,
                    menuId,
                    childMenuId
                  )
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-violet-700"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-700">
                  {permission.name}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                  {permission.key}
                </span>
                {permission.description && (
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {permission.description}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </section>
    );
  };

  const renderCrudControls = (
    permission: Permission,
    onChange: (field: PermissionKey, value: boolean) => void,
    onToggleAll: () => void,
    compact = false
  ) => {
    const full = isPermissionFull(permission);
    const empty = isPermissionEmpty(permission);

    return (
      <div className="flex flex-wrap items-center gap-2">
        {PERMISSION_FIELDS.map((field) => {
          const checked = permission[field.key];

          return (
            <label
              key={field.key}
              title={`${field.label} permission`}
              className={`flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                checked
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              } ${compact ? "min-w-[66px] justify-center" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  onChange(field.key, event.target.checked)
                }
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              {field.label}
            </label>
          );
        })}

        <button
          type="button"
          onClick={onToggleAll}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
            full
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {full ? "Clear all" : empty ? "Grant all" : "Grant all"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <SideNav
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />

      <main className="min-w-0 flex-1">
        <TopNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />

        <div className="mx-auto h-[calc(100vh-64px)] max-w-[1700px] overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                <ShieldCheck size={15} />
                Administration / Access control
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                User Access Management
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Control module, menu, child menu and additional permissions
                from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={undoChanges}
                disabled={!selectedUser || !isDirty || saving || loadingAccess}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={16} />
                Undo changes
              </button>
              <button
                type="button"
                onClick={() => selectedUser && loadUserAccess(selectedUser)}
                disabled={!selectedUser || loadingAccess || saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw
                  size={16}
                  className={loadingAccess ? "animate-spin" : ""}
                />
                Reload
              </button>
              <button
                type="button"
                onClick={saveAccess}
                disabled={!selectedUser || !isDirty || saving || loadingAccess}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === "success" ? (
                  <Check size={17} />
                ) : (
                  <CircleHelp size={17} />
                )}
                {notice.message}
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-md p-1 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(110px,150px))] lg:items-center">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select user
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={selectedUser ?? ""}
                    onChange={(event) =>
                      setSelectedUser(
                        event.target.value
                          ? Number(event.target.value)
                          : null
                      )
                    }
                    disabled={loadingUsers}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
                  >
                    <option value="">
                      {loadingUsers ? "Loading users..." : "Choose a user"}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                        {user.email ? ` — ${user.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUserInfo && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {getInitials(selectedUserInfo.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {selectedUserInfo.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {selectedUserInfo.email || `User ID: ${selectedUserInfo.id}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {[
                {
                  label: "Modules",
                  value: totals.modules,
                  icon: Layers3,
                  color: "text-indigo-600 bg-indigo-50",
                },
                {
                  label: "Access points",
                  value: totals.records,
                  icon: ListTree,
                  color: "text-sky-600 bg-sky-50",
                },
                {
                  label: "CRUD granted",
                  value: `${totals.granted}/${totals.possible}`,
                  icon: CheckCheck,
                  color: "text-emerald-600 bg-emerald-50",
                },
                {
                  label: "Extra granted",
                  value: totals.extraGranted,
                  icon: LockKeyhole,
                  color: "text-violet-600 bg-violet-50",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-5 text-slate-800">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {!selectedUser ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ShieldCheck size={30} />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-800">
                Select a user to get started
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Choose a user from the selector above. Their assigned modules,
                menus, child menus and extra permissions will appear here.
              </p>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">
                        Permission structure
                      </h2>
                      {isDirty ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          Unsaved changes
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          All changes saved
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Grant access at module level or fine-tune each menu and
                      child menu.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1 xl:flex-none">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search module or menu..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={expandAll}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Expand all
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Collapse all
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-slate-400">
                    Permission legend
                  </span>
                  {PERMISSION_FIELDS.map((field) => (
                    <span key={field.key} className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-[10px] font-bold text-indigo-700">
                        {field.short}
                      </span>
                      {field.label}
                    </span>
                  ))}
                  <span className="ml-auto flex items-center gap-1.5 text-violet-700">
                    <LockKeyhole size={13} />
                    Extra permissions
                  </span>
                </div>
              </div>

              {loadingAccess ? (
                <div className="flex flex-col items-center justify-center px-6 py-20">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-indigo-600"
                  />
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Loading access permissions...
                  </p>
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Search size={22} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {search ? "No matching access items found" : "No active modules found"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {search
                      ? "Try another module, menu or child menu name."
                      : "There are no modules available for this user."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50/60 p-3 sm:p-5">
                  {filteredModules.map((module) => {
                    const moduleExpanded = expandedModules.includes(module.id);
                    const stats = getModuleStats(module);
                    const moduleFull =
                      stats.records > 0 && stats.granted === stats.possible;

                    return (
                      <article
                        key={module.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                          <button
                            type="button"
                            onClick={() => toggleModule(module.id)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Layers3 size={19} />
                            </span>
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-bold text-slate-800">
                                  {module.name}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {module.menus.length} menus
                                </span>
                                {moduleFull && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    Full access
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-[11px] text-slate-400">
                                {stats.granted} of {stats.possible} CRUD
                                permissions enabled
                                {stats.extraGranted > 0
                                  ? ` · ${stats.extraGranted} extra enabled`
                                  : ""}
                              </span>
                            </span>
                            <span className="ml-1 text-slate-400">
                              {moduleExpanded ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </span>
                          </button>

                          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <div className="h-2 min-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-100 sm:w-28 sm:flex-none">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all"
                                style={{
                                  width: `${
                                    stats.possible
                                      ? (stats.granted / stats.possible) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setModuleAll(module.id, !moduleFull)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                moduleFull
                                  ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              }`}
                            >
                              {moduleFull ? (
                                <UnlockKeyhole size={14} />
                              ) : (
                                <CheckCheck size={14} />
                              )}
                              {moduleFull ? "Remove module access" : "Grant full module access"}
                            </button>
                          </div>
                        </div>

                        {moduleExpanded && (
                          <div className="border-t border-slate-100 p-3 sm:p-4">
                            {renderExtraPermissions(
                              module.extra_permissions,
                              module.id
                            )}

                            {module.menus.length === 0 ? (
                              <p className="rounded-lg bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                                No menus found in this module.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {module.menus.map((menu) => {
                                  const hasChildren = menu.child_menus.length > 0;
                                  const menuExpanded = expandedMenus.includes(menu.id);
                                  const menuPermission = menu.permission || EMPTY_PERMISSION;
                                  const menuRecords = hasChildren
                                    ? menu.child_menus.map((child) => child.permission)
                                    : menu.permission
                                      ? [menu.permission]
                                      : [];
                                  const menuGranted = menuRecords.reduce(
                                    (sum, item) => sum + getPermissionCount(item),
                                    0
                                  );
                                  const menuPossible = menuRecords.length * 4;
                                  const menuFull =
                                    menuPossible > 0 && menuGranted === menuPossible;

                                  return (
                                    <div
                                      key={menu.id}
                                      className="overflow-hidden rounded-xl border border-slate-200"
                                    >
                                      <div className="flex flex-col gap-3 bg-white p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                          {hasChildren ? (
                                            <button
                                              type="button"
                                              onClick={() => toggleMenu(menu.id)}
                                              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                            >
                                              {menuExpanded ? (
                                                <ChevronDown size={17} />
                                              ) : (
                                                <ChevronRight size={17} />
                                              )}
                                            </button>
                                          ) : (
                                            <span className="w-7" />
                                          )}
                                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                            <MenuIcon size={16} />
                                          </span>
                                          <span className="min-w-0">
                                            <span className="flex flex-wrap items-center gap-2">
                                              <span className="truncate text-sm font-semibold text-slate-700">
                                                {menu.name}
                                              </span>
                                              {hasChildren && (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                  {menu.child_menus.length} child menus
                                                </span>
                                              )}
                                            </span>
                                            <span className="mt-0.5 block text-[10px] text-slate-400">
                                              {menuGranted}/{menuPossible} CRUD enabled
                                            </span>
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                          {hasChildren ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setMenuAll(module.id, menu.id, !menuFull)
                                              }
                                              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                                menuFull
                                                  ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                  : "bg-sky-600 text-white hover:bg-sky-700"
                                              }`}
                                            >
                                              {menuFull ? "Remove menu access" : "Grant menu access"}
                                            </button>
                                          ) : menu.permission ? (
                                            renderCrudControls(
                                              menuPermission,
                                              (field, value) =>
                                                updatePermission(
                                                  module.id,
                                                  menu.id,
                                                  null,
                                                  field,
                                                  value
                                                ),
                                              () =>
                                                setMenuAll(
                                                  module.id,
                                                  menu.id,
                                                  !isPermissionFull(menuPermission)
                                                ),
                                              true
                                            )
                                          ) : (
                                            <span className="text-xs text-slate-400">
                                              No CRUD access record
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="border-t border-slate-100 px-3 pb-3 sm:px-4">
                                        {renderExtraPermissions(
                                          menu.extra_permissions,
                                          module.id,
                                          menu.id
                                        )}
                                      </div>

                                      {hasChildren && menuExpanded && (
                                        <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4">
                                          {menu.child_menus.map((child) => (
                                            <div
                                              key={child.id}
                                              className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4"
                                            >
                                              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                    <ListTree size={15} />
                                                  </span>
                                                  <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold text-slate-700">
                                                      {child.name}
                                                    </span>
                                                    <span className="mt-0.5 block text-[10px] text-slate-400">
                                                      {getPermissionCount(child.permission)}/4 CRUD permissions enabled
                                                    </span>
                                                  </span>
                                                </div>

                                                {renderCrudControls(
                                                  child.permission,
                                                  (field, value) =>
                                                    updatePermission(
                                                      module.id,
                                                      menu.id,
                                                      child.id,
                                                      field,
                                                      value
                                                    ),
                                                  () =>
                                                    setModules((current) =>
                                                      current.map((item) =>
                                                        item.id !== module.id
                                                          ? item
                                                          : {
                                                              ...item,
                                                              menus: item.menus.map((entry) =>
                                                                entry.id !== menu.id
                                                                  ? entry
                                                                  : {
                                                                      ...entry,
                                                                      child_menus: entry.child_menus.map((nested) =>
                                                                        nested.id !== child.id
                                                                          ? nested
                                                                          : {
                                                                              ...nested,
                                                                              permission: {
                                                                                can_view: !isPermissionFull(child.permission),
                                                                                can_create: !isPermissionFull(child.permission),
                                                                                can_update: !isPermissionFull(child.permission),
                                                                                can_delete: !isPermissionFull(child.permission),
                                                                              },
                                                                            }
                                                                      ),
                                                                    }
                                                              ),
                                                            }
                                                      )
                                                    ),
                                                  true
                                                )}
                                              </div>

                                              <div className="ml-0 sm:ml-10">
                                                {renderExtraPermissions(
                                                  child.extra_permissions,
                                                  module.id,
                                                  menu.id,
                                                  child.id
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {selectedUser && (
            <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Changes are local until you click Save changes. Use Undo changes
                to discard unsaved edits.
              </p>
              <p className="font-medium">
                {isDirty ? "You have pending changes." : "Everything is up to date."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
