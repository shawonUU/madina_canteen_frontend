import {
  ShieldCheck,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  UserRound,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";

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

interface ChildMenu {
  id: number;
  code: string;
  name: string;
  slug: string;
  route?: string | null;
  icon?: string | null;
  sort_order: number;
  permission: Permission;
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
  child_menus: ChildMenu[];
}

interface Module {
  id: number;
  code: string;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order: number;
  menus: Menu[];
}

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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const res = await api.get("/admin/users");

      setUsers(res.data.data ?? res.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserAccess = async (userId: number) => {
    try {
      setLoadingAccess(true);

      const res = await api.get(`/admin/users/${userId}/access`);

      setModules(res.data.data?.modules ?? []);

      const moduleIds =
        res.data.data?.modules?.map((module: Module) => module.id) ?? [];

      setExpandedModules(moduleIds);
      setExpandedMenus([]);
    } catch (error) {
      console.error("Failed to load user access:", error);
      setModules([]);
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserAccess(selectedUser);
    } else {
      setModules([]);
    }
  }, [selectedUser]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const updateMenuPermission = (
    moduleId: number,
    menuId: number,
    field: keyof Permission,
    value: boolean
  ) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) {
              return menu;
            }

            if (!menu.permission) {
              return menu;
            }

            return {
              ...menu,
              permission: {
                ...menu.permission,
                [field]: value,
              },
            };
          }),
        };
      })
    );
  };

  const updateChildPermission = (
    moduleId: number,
    menuId: number,
    childMenuId: number,
    field: keyof Permission,
    value: boolean
  ) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          menus: module.menus.map((menu) => {
            if (menu.id !== menuId) {
              return menu;
            }

            return {
              ...menu,
              child_menus: menu.child_menus.map((child) => {
                if (child.id !== childMenuId) {
                  return child;
                }

                return {
                  ...child,
                  permission: {
                    ...child.permission,
                    [field]: value,
                  },
                };
              }),
            };
          }),
        };
      })
    );
  };

  const getPermissionValues = (
    permission: Permission | null
  ): boolean[] => {
    if (!permission) {
      return [false, false, false, false];
    }

    return [
      permission.can_view,
      permission.can_create,
      permission.can_update,
      permission.can_delete,
    ];
  };

  const isAllPermissionChecked = (
    permission: Permission | null
  ): boolean => {
    if (!permission) {
      return false;
    }

    return (
      permission.can_view &&
      permission.can_create &&
      permission.can_update &&
      permission.can_delete
    );
  };

  const setAllMenuPermissions = (
    moduleId: number,
    menuId: number,
    value: boolean
  ) => {
    const fields: (keyof Permission)[] = [
      "can_view",
      "can_create",
      "can_update",
      "can_delete",
    ];

    fields.forEach((field) => {
      updateMenuPermission(moduleId, menuId, field, value);
    });
  };

  const setAllChildPermissions = (
    moduleId: number,
    menuId: number,
    childMenuId: number,
    value: boolean
  ) => {
    const fields: (keyof Permission)[] = [
      "can_view",
      "can_create",
      "can_update",
      "can_delete",
    ];

    fields.forEach((field) => {
      updateChildPermission(
        moduleId,
        menuId,
        childMenuId,
        field,
        value
      );
    });
  };

  const saveAccess = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setSaving(true);

      const permissions: any[] = [];

      modules.forEach((module) => {
        module.menus.forEach((menu) => {
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
      });

      await loadUserAccess(selectedUser);
    } catch (error) {
      console.error("Failed to save user access:", error);
    } finally {
      setSaving(false);
    }
  };

  const refreshAccess = () => {
    if (selectedUser) {
      loadUserAccess(selectedUser);
    }
  };

  const permissionLabels = [
    {
      key: "can_view" as keyof Permission,
      label: "View",
    },
    {
      key: "can_create" as keyof Permission,
      label: "Create",
    },
    {
      key: "can_update" as keyof Permission,
      label: "Update",
    },
    {
      key: "can_delete" as keyof Permission,
      label: "Delete",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />

      <main className="flex-1">
        <TopNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />

        <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              User Access Management
            </h2>

            <p className="text-gray-500 mt-1">
              Manage module, menu and child menu permissions for users
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-5">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select User
                </label>

                <div className="relative">
                  <UserRound
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={selectedUser ?? ""}
                    onChange={(e) =>
                      setSelectedUser(
                        e.target.value
                          ? Number(e.target.value)
                          : null
                      )
                    }
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers
                        ? "Loading users..."
                        : "Select a user"}
                    </option>

                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                        {user.email ? ` - ${user.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={refreshAccess}
                  disabled={!selectedUser || loadingAccess}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={18}
                    className={loadingAccess ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={saveAccess}
                  disabled={!selectedUser || saving || loadingAccess}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Access"}
                </button>
              </div>
            </div>
          </div>

          {!selectedUser && (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
              <div className="bg-indigo-100 p-4 rounded-2xl w-fit mx-auto">
                <ShieldCheck
                  size={35}
                  className="text-indigo-600"
                />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mt-5">
                Select a User
              </h3>

              <p className="text-gray-500 mt-2">
                Select a user above to manage their module and menu
                access.
              </p>
            </div>
          )}

          {selectedUser && (
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Access Permissions
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Select the permissions this user should have.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
                    {permissionLabels.map((permission) => (
                      <div
                        key={permission.key}
                        className="w-20 text-center"
                      >
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {loadingAccess ? (
                <div className="p-12 text-center">
                  <RefreshCw
                    size={30}
                    className="animate-spin text-indigo-600 mx-auto"
                  />

                  <p className="text-gray-500 mt-4">
                    Loading access permissions...
                  </p>
                </div>
              ) : modules.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No active modules found.
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {modules.map((module) => {
                    const moduleExpanded =
                      expandedModules.includes(module.id);

                    return (
                      <div
                        key={module.id}
                        className="border border-gray-200 rounded-2xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            {moduleExpanded ? (
                              <ChevronDown size={20} />
                            ) : (
                              <ChevronRight size={20} />
                            )}

                            <ShieldCheck
                              size={20}
                              className="text-indigo-600"
                            />

                            <span className="font-bold text-gray-800">
                              {module.name}
                            </span>

                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                              {module.menus.length} Menus
                            </span>
                          </div>
                        </button>

                        {moduleExpanded && (
                          <div className="p-4 space-y-3">
                            {module.menus.map((menu) => {
                              const hasChildren =
                                menu.child_menus.length > 0;

                              const menuExpanded =
                                expandedMenus.includes(menu.id);

                              return (
                                <div
                                  key={menu.id}
                                  className="border border-gray-100 rounded-xl overflow-hidden"
                                >
                                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {hasChildren ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleMenu(menu.id)
                                          }
                                          className="p-1 rounded-lg hover:bg-gray-100"
                                        >
                                          {menuExpanded ? (
                                            <ChevronDown size={18} />
                                          ) : (
                                            <ChevronRight size={18} />
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-7" />
                                      )}

                                      <span className="font-semibold text-gray-700">
                                        {menu.name}
                                      </span>

                                      {hasChildren && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                          {menu.child_menus.length}
                                        </span>
                                      )}
                                    </div>

                                    {!hasChildren &&
                                      menu.permission && (
                                        <div className="flex items-center gap-4">
                                          {permissionLabels.map(
                                            (permission) => (
                                              <label
                                                key={permission.key}
                                                className="w-20 flex flex-col items-center justify-center gap-1 cursor-pointer"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    menu.permission?.[
                                                      permission.key
                                                    ] ?? false
                                                  }
                                                  onChange={(e) =>
                                                    updateMenuPermission(
                                                      module.id,
                                                      menu.id,
                                                      permission.key,
                                                      e.target.checked
                                                    )
                                                  }
                                                  className="hidden peer"
                                                />

                                                <span className="w-7 h-7 rounded-lg border-2 border-black-100 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition">
                                                  {menu.permission?.[
                                                    permission.key
                                                  ] && (
                                                    <Check
                                                      size={17}
                                                      className="text-white"
                                                    />
                                                  )}
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-500">
                                                    {permission.label}
                                                </span>
                                              </label>
                                            )
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setAllMenuPermissions(
                                                module.id,
                                                menu.id,
                                                !isAllPermissionChecked(
                                                  menu.permission
                                                )
                                              )
                                            }
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-2"
                                          >
                                            {isAllPermissionChecked(
                                              menu.permission
                                            )
                                              ? "Clear"
                                              : "All"}
                                          </button>
                                        </div>
                                      )}
                                  </div>

                                  {hasChildren && menuExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                                      {menu.child_menus.map(
                                        (child) => (
                                          <div
                                            key={child.id}
                                            className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="w-7" />

                                              <span className="text-sm font-medium text-gray-600">
                                                {child.name}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                              {permissionLabels.map(
                                                (permission) => (
                                                  <label
                                                    key={
                                                      permission.key
                                                    }
                                                    className="w-20 flex flex-col items-center justify-center gap-1 cursor-pointer"
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      checked={
                                                        child
                                                          .permission[
                                                          permission.key
                                                        ] ?? false
                                                      }
                                                      onChange={(
                                                        e
                                                      ) =>
                                                        updateChildPermission(
                                                          module.id,
                                                          menu.id,
                                                          child.id,
                                                          permission.key,
                                                          e.target
                                                            .checked
                                                        )
                                                      }
                                                      className="hidden peer"
                                                    />

                                                    <span className="w-7 h-7 rounded-lg border-2 border-black-100 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition">
                                                      {child
                                                        .permission[
                                                        permission.key
                                                      ] && (
                                                        <Check
                                                          size={
                                                            17
                                                          }
                                                          className="text-white"
                                                        />
                                                      )}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-gray-500">
                                                        {permission.label}
                                                    </span>
                                                  </label>
                                                )
                                              )}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setAllChildPermissions(
                                                    module.id,
                                                    menu.id,
                                                    child.id,
                                                    !isAllPermissionChecked(
                                                      child.permission
                                                    )
                                                  )
                                                }
                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-2"
                                              >
                                                {isAllPermissionChecked(
                                                  child.permission
                                                )
                                                  ? "Clear"
                                                  : "All"}
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}