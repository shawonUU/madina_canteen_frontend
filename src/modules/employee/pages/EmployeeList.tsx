import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  UserPlus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  roles?: Role[];
}

interface Employee {
  id: number;
  employee_code: string;
  name: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  email?: string | null;
  status: "Active" | "Inactive";
  user?: User | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface EmployeeForm {
  name: string;
  employee_code?: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  create_user: boolean;
  user_password: string;
  role_id: string;
}

const initialForm: EmployeeForm = {
  name: "",
  employee_code: "",
  department: "",
  designation: "",
  phone: "",
  email: "",
  status: "Active",
  create_user: false,
  user_password: "",
  role_id: "",
};

export default function EmployeeList() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const [form, setForm] = useState<EmployeeForm>(initialForm);

    const [editId, setEditId] = useState<number | null>(null);

    const [openModal, setOpenModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [ openSidebar, setOpenSidebar, ] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const getErrorMessage = (error: any, fallback: string) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.errors) {
      const errors = error.response.data.errors;

      const firstError = Object.values(errors)
        .flat()
        .find((message) => typeof message === "string");

      if (firstError) {
        return firstError as string;
      }
    }

    return fallback;
  };

  const normalizeEmployeesResponse = (responseData: any) => {
    if (Array.isArray(responseData)) {
      return {
        data: responseData,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: responseData.length || 15,
          total: responseData.length,
        },
      };
    }

    if (
      responseData &&
      Array.isArray(responseData.data)
    ) {
      return {
        data: responseData.data,
        pagination: {
          current_page: Number(responseData.current_page) || 1,
          last_page: Number(responseData.last_page) || 1,
          per_page: Number(responseData.per_page) || 15,
          total: Number(responseData.total) || responseData.data.length,
        },
      };
    }

    if (
      responseData?.data &&
      Array.isArray(responseData.data.data)
    ) {
      return {
        data: responseData.data.data,
        pagination: {
          current_page:
            Number(responseData.data.current_page) || 1,
          last_page:
            Number(responseData.data.last_page) || 1,
          per_page:
            Number(responseData.data.per_page) || 15,
          total:
            Number(responseData.data.total) ||
            responseData.data.data.length,
        },
      };
    }

    return {
      data: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      },
    };
  };

  const normalizeRolesResponse = (responseData: any): Role[] => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (
      responseData &&
      Array.isArray(responseData.data)
    ) {
      return responseData.data;
    }

    if (
      responseData?.data &&
      Array.isArray(responseData.data.data)
    ) {
      return responseData.data.data;
    }

    return [];
  };

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);

      const response = await api.get("/employees", {
        params: {
          page,
          per_page: 15,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        },
      });

      const normalized = normalizeEmployeesResponse(response.data);

      setEmployees(
        Array.isArray(normalized.data)
          ? normalized.data
          : []
      );

      setPagination(normalized.pagination);
    } catch (error) {
      console.error("Failed to fetch employees:", error);

      setEmployees([]);

      alert(
        getErrorMessage(
          error,
          "Failed to load employees."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);

      const response = await api.get("/roles");

      const normalizedRoles = normalizeRolesResponse(
        response.data
      );

      setRoles(normalizedRoles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);

      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setForm({
      ...initialForm,
    });
    setOpenModal(true);
  };

  const openEditModal = (employee: Employee) => {
    const user = employee.user;

    const assignedRole =
      user?.roles && user.roles.length > 0
        ? user.roles[0]
        : null;

    setEditId(employee.id);

    setForm({
      name: employee.name || "",
      department: employee.department || "",
      designation: employee.designation || "",
      phone: employee.phone || "",
      email: employee.email || "",
      status: employee.status || "Active",
      create_user: !!user,
      user_password: "",
      role_id: assignedRole
        ? String(assignedRole.id)
        : "",
    });

    setOpenModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setOpenModal(false);
    setEditId(null);
    setForm({
      ...initialForm,
    });
  };

  const handleChange = <
    K extends keyof EmployeeForm
  >(
    field: K,
    value: EmployeeForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      alert("Employee name is required.");
      return false;
    }

    if (
      form.create_user &&
      !form.email.trim()
    ) {
      alert(
        "Email is required when system access is enabled."
      );
      return false;
    }

    if (
      form.create_user &&
      !form.role_id
    ) {
      alert("Please select a role.");
      return false;
    }

    if (
      !editId &&
      form.create_user &&
      !form.user_password
    ) {
      alert(
        "Password is required when creating a user account."
      );
      return false;
    }

    if (
      form.create_user &&
      form.user_password &&
      form.user_password.length < 6
    ) {
      alert(
        "Password must be at least 6 characters."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        department:
          form.department.trim() || null,
        designation:
          form.designation.trim() || null,
        phone:
          form.phone.trim() || null,
        email:
          form.email.trim() || null,
        status: form.status,
        create_user: form.create_user,
      };

      if (form.create_user) {
        payload.role_id = Number(form.role_id);

        if (form.user_password.trim()) {
          payload.user_password =
            form.user_password;
        }
      }

      if (editId !== null) {
        await api.put(
          `/employees/${editId}`,
          payload
        );
      } else {
        await api.post(
          "/employees",
          payload
        );
      }

      setOpenModal(false);
      setEditId(null);
      setForm({
        ...initialForm,
      });

      await fetchEmployees(
        editId !== null
          ? pagination.current_page
          : 1
      );
    } catch (error) {
      console.error(
        "Failed to save employee:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to save employee."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    employee: Employee
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${employee.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(employee.id);

      await api.delete(
        `/employees/${employee.id}`
      );

      const nextPage =
        employees.length === 1 &&
        pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      await fetchEmployees(nextPage);
    } catch (error) {
      console.error(
        "Failed to delete employee:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to delete employee."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    fetchEmployees(
      pagination.current_page
    );
  };

  const handlePreviousPage = () => {
    if (pagination.current_page > 1) {
      fetchEmployees(
        pagination.current_page - 1
      );
    }
  };

  const handleNextPage = () => {
    if (
      pagination.current_page <
      pagination.last_page
    ) {
      fetchEmployees(
        pagination.current_page + 1
      );
    }
  };

  const getStatusClass = (
    status: string
  ) => {
    if (status === "Active") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav
                openSidebar={
                  openSidebar
                }
                setOpenSidebar={
                  setOpenSidebar
                }
              />

      <div className="flex-1 min-w-0">
        <TopNav
                    openSidebar={
                      openSidebar
                    }
                    setOpenSidebar={
                      setOpenSidebar
                    }
                  />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Employees
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage employees and their
                  system access.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  <Plus size={18} />

                  Add Employee
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search by employee code, name, email, phone..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Employee
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Department
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Designation
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        System Access
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-16 text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <RefreshCw
                              size={28}
                              className="animate-spin text-indigo-500"
                            />

                            <p className="mt-3 text-sm font-medium text-slate-500">
                              Loading employees...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : employees.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-16 text-center"
                        >
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                              <UserPlus
                                size={26}
                              />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-800">
                              No employees
                              found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              Add a new employee
                              to get started.
                            </p>

                            <button
                              type="button"
                              onClick={
                                openCreateModal
                              }
                              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                              <Plus
                                size={17}
                              />

                              Add Employee
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      employees.map(
                        (employee) => (
                          <tr
                            key={
                              employee.id
                            }
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                                  {employee.name
                                    ?.charAt(
                                      0
                                    )
                                    ?.toUpperCase() ||
                                    "E"}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-800">
                                    {
                                      employee.name
                                    }
                                  </div>

                                  <div className="mt-0.5 text-xs font-medium text-indigo-600">
                                    {
                                      employee.employee_code
                                    }
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm text-slate-600">
                                {employee.department ||
                                  "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm text-slate-600">
                                {employee.designation ||
                                  "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <div className="text-sm text-slate-700">
                                  {employee.phone ||
                                    "-"}
                                </div>

                                <div className="max-w-[220px] truncate text-xs text-slate-400">
                                  {employee.email ||
                                    "-"}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {employee.user ? (
                                <div>
                                  <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                                    <ShieldCheck
                                      size={
                                        16
                                      }
                                    />

                                    Enabled
                                  </div>

                                  <div className="mt-1 text-xs text-slate-400">
                                    {employee
                                      .user
                                      .roles &&
                                    employee
                                      .user
                                      .roles
                                      .length >
                                      0
                                      ? employee
                                          .user
                                          .roles[0]
                                          .name
                                      : "No role"}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  No Login
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                  employee.status
                                )}`}
                              >
                                {
                                  employee.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      employee
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                  title="Edit Employee"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      employee
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    employee.id
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Delete Employee"
                                >
                                  {deletingId ===
                                  employee.id ? (
                                    <RefreshCw
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading &&
                employees.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {pagination.total ===
                        0
                          ? 0
                          : (pagination.current_page -
                              1) *
                              pagination.per_page +
                            1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-700">
                        {Math.min(
                          pagination.current_page *
                            pagination.per_page,
                          pagination.total
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">
                        {pagination.total}
                      </span>{" "}
                      employees
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          pagination.current_page <=
                          1
                        }
                        onClick={
                          handlePreviousPage
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft
                          size={17}
                        />
                      </button>

                      <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">
                        {
                          pagination.current_page
                        }
                      </div>

                      <button
                        type="button"
                        disabled={
                          pagination.current_page >=
                          pagination.last_page
                        }
                        onClick={
                          handleNextPage
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* Create / Update Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 ">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editId !== null
                    ? "Update Employee"
                    : "Create Employee"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editId !== null
                    ? "Update employee information and system access."
                    : "Add a new employee to the system."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Employee Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        handleChange(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Enter employee name"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Employee Code */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Employee Code
                    </label>

                    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-400">
                      {editId !== null
                        ? form.employee_code || "Auto generated"
                        : "Auto generated"}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        handleChange(
                          "status",
                          event.target
                            .value as
                            | "Active"
                            | "Inactive"
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Department
                    </label>

                    <input
                      type="text"
                      value={form.department}
                      onChange={(event) =>
                        handleChange(
                          "department",
                          event.target.value
                        )
                      }
                      placeholder="Enter department"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Designation
                    </label>

                    <input
                      type="text"
                      value={form.designation}
                      onChange={(event) =>
                        handleChange(
                          "designation",
                          event.target.value
                        )
                      }
                      placeholder="Enter designation"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone
                    </label>

                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) =>
                        handleChange(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="Enter phone number"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                      {form.create_user && (
                        <span className="text-red-500">
                          {" "}
                          *
                        </span>
                      )}
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleChange(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="Enter email address"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* System Access */}
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        System Access
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Create a login account
                        for this employee to
                        access the system.
                      </p>
                    </div>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={
                          form.create_user
                        }
                        onChange={(event) =>
                          handleChange(
                            "create_user",
                            event.target.checked
                          )
                        }
                        className="peer sr-only"
                      />

                      <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>

                  {form.create_user && (
                    <div className="mt-5 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 md:grid-cols-2">
                      {/* Role */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Role{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <select
                          value={form.role_id}
                          onChange={(event) =>
                            handleChange(
                              "role_id",
                              event.target.value
                            )
                          }
                          disabled={
                            rolesLoading
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">
                            {rolesLoading
                              ? "Loading roles..."
                              : "Select role"}
                          </option>

                          {roles.map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                {role.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          {editId !== null
                            ? "New Password"
                            : "Password"}

                          {editId === null && (
                            <span className="text-red-500">
                              {" "}
                              *
                            </span>
                          )}
                        </label>

                        <input
                          type="password"
                          value={
                            form.user_password
                          }
                          onChange={(event) =>
                            handleChange(
                              "user_password",
                              event.target.value
                            )
                          }
                          placeholder={
                            editId !== null
                              ? "Leave blank to keep current password"
                              : "Enter password"
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      {editId !== null ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={18} />
                      )}

                      {editId !== null
                        ? "Update Employee"
                        : "Create Employee"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}