import {
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    ShieldCheck,
    UserRound,
    Package,
    UsersRound,
    FileDown,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../../../components/side-nav";
import TopNav from "../../../../components/top-nav";
import api from "../../../../services/api";

interface GatePassItem {
    id?: number;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit: string;
    asset_no: string;
    serial_no: string;
    remarks: string;
}

interface GatePassData {
    id: number;
    pass_no: string;
    gate_pass_type: "Person" | "Person With Material";
    requester?: { id: number; name: string };
    department_name: string;
    designation_name: string;
    purpose: string;
    expected_exit_at: string;
    expected_return_at: string | null;
    remarks: string | null;
    status:| "Pending"| "Approved"| "Rejected"| "Cancelled"| "Completed";
    pending_approval?: { level: string; approver: string | null; } | null;
    items: GatePassItem[];
}

interface GatePassForm {
    gate_pass_type:
        | "Person"
        | "Person With Material";
    department_name: string;
    designation_name: string;
    purpose: string;
    expected_exit_at: string;
    expected_return_at: string;
    remarks: string;
    items: GatePassItem[];
}

const initialForm: GatePassForm = {
    gate_pass_type: "Person",
    department_name: "",
    designation_name: "",
    purpose: "",
    expected_exit_at: "",
    expected_return_at: "",
    remarks: "",
    items: [],
};

const emptyItem: GatePassItem = {
    product_id: null,
    product_name: "",
    quantity: 1,
    unit: "Pcs",
    asset_no: "",
    serial_no: "",
    remarks: "",
};

export default function GatePass() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [gatePasses, setGatePasses] = useState<GatePassData[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(
        null
    );

    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<GatePassForm>({
        ...initialForm,
    });

    const fetchGatePasses = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(
                "/reception/gate-passes"
            );

            if (response.data.success) {
                setGatePasses(
                    response.data.data
                );
            }
        } catch (error) {
            console.error(
                "Failed to load gate passes:",
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGatePasses();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);

        setForm({
            ...initialForm,
        });

        setModalOpen(true);
    };

    const openEditModal = (
        gatePass: GatePassData
    ) => {
        setEditingId(gatePass.id);

        setForm({
            gate_pass_type:
                gatePass.gate_pass_type,

            department_name:
                gatePass.department_name || "",

            designation_name:
                gatePass.designation_name || "",

            purpose:
                gatePass.purpose || "",

            expected_exit_at:
                formatDateTimeForInput(
                    gatePass.expected_exit_at
                ),

            expected_return_at:
                gatePass.expected_return_at
                    ? formatDateTimeForInput(
                          gatePass.expected_return_at
                      )
                    : "",

            remarks:
                gatePass.remarks || "",

            items:
                gatePass.items?.map(
                    (item) => ({
                        id: item.id,

                        product_id:
                            item.product_id,

                        product_name:
                            item.product_name || "",

                        quantity:
                            Number(
                                item.quantity
                            ),

                        unit:
                            item.unit || "Pcs",

                        asset_no:
                            item.asset_no || "",

                        serial_no:
                            item.serial_no || "",

                        remarks:
                            item.remarks || "",
                    })
                ) || [],
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingId(null);

        setForm({
            ...initialForm,
        });
    };

    const handleTypeChange = (
        type:
            | "Person"
            | "Person With Material"
    ) => {
        setForm((prev) => ({
            ...prev,
            gate_pass_type: type,
            items:
                type === "Person"
                    ? []
                    : prev.items.length > 0
                    ? prev.items
                    : [{ ...emptyItem }],
        }));
    };

    const addItem = () => {
        setForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    ...emptyItem,
                },
            ],
        }));
    };

    const removeItem = (
        index: number
    ) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            ),
        }));
    };

    const updateItem = (
        index: number,
        field: keyof GatePassItem,
        value: string | number | null
    ) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map(
                (item, itemIndex) =>
                    itemIndex === index
                        ? {
                              ...item,
                              [field]: value,
                          }
                        : item
            ),
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!form.department_name.trim()) {
            alert(
                "Please enter department name."
            );
            return;
        }

        if (!form.designation_name.trim()) {
            alert(
                "Please enter designation name."
            );
            return;
        }

        if (!form.purpose.trim()) {
            alert(
                "Please enter purpose."
            );
            return;
        }

        if (!form.expected_exit_at) {
            alert(
                "Please select expected exit time."
            );
            return;
        }

        if (
            form.gate_pass_type ===
                "Person With Material"
        ) {
            if (form.items.length === 0) {
                alert(
                    "Please add at least one material item."
                );
                return;
            }

            const invalidItem =
                form.items.some(
                    (item) =>
                        !item.product_name.trim() ||
                        Number(item.quantity) <= 0
                );

            if (invalidItem) {
                alert(
                    "Please enter valid product name and quantity for all items."
                );
                return;
            }
        }

        setSaving(true);

        try {
            const data = {
                gate_pass_type:
                    form.gate_pass_type,

                department_name:
                    form.department_name.trim(),

                designation_name:
                    form.designation_name.trim(),

                purpose:
                    form.purpose.trim(),

                expected_exit_at:
                    form.expected_exit_at,

                expected_return_at:
                    form.expected_return_at ||
                    null,

                remarks:
                    form.remarks.trim() ||
                    null,

                items:
                    form.gate_pass_type ===
                    "Person"
                        ? []
                        : form.items.map(
                              (item) => ({
                                  product_id:
                                      item.product_id,

                                  product_name:
                                      item.product_name.trim(),

                                  quantity:
                                      Number(
                                          item.quantity
                                      ),

                                  unit:
                                      item.unit.trim() ||
                                      null,

                                  asset_no:
                                      item.asset_no.trim() ||
                                      null,

                                  serial_no:
                                      item.serial_no.trim() ||
                                      null,

                                  remarks:
                                      item.remarks.trim() ||
                                      null,
                              })
                          ),
            };

            if (editingId) {
                await api.put(
                    `/reception/gate-passes/${editingId}`,
                    data
                );
            } else {
                await api.post(
                    "/reception/gate-passes",
                    data
                );
            }

            setModalOpen(false);
            setEditingId(null);

            setForm({
                ...initialForm,
            });

            await fetchGatePasses(true);
        } catch (error: any) {
            console.error(
                "Failed to save gate pass:",
                error
            );

            alert(
                error?.response?.data?.message ||
                    "Failed to save gate pass."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (
        id: number
    ) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this gate pass?"
            )
        ) {
            return;
        }

        try {
            await api.delete(
                `/reception/gate-passes/${id}`
            );

            await fetchGatePasses(true);
        } catch (error: any) {
            console.error(
                "Failed to delete gate pass:",
                error
            );

            alert(
                error?.response?.data?.message ||
                    "Failed to delete gate pass."
            );
        }
    };

    const handleDownloadPdf = async (id: number) => {
        try {
            const response = await api.get(
                `/reception/gate-passes/${id}/pdf`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type: "application/pdf",
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download = `gate-pass-${id}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Failed to download gate pass PDF:",
                error
            );

            alert(
                "Failed to download gate pass PDF."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={
                    setOpenSidebar
                }
            />

            <main className="flex-1 min-w-0">
                <TopNav
                    openSidebar={
                        openSidebar
                    }
                    setOpenSidebar={
                        setOpenSidebar
                    }
                />

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Gate Pass
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Manage Person and material gate pass requests.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    fetchGatePasses(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                            </button>

                            <button
                                type="button"
                                onClick={
                                    openCreateModal
                                }
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition"
                            >
                                <Plus
                                    size={18}
                                />

                                Add Gate Pass
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                Gate Pass List
                            </h3>

                            <p className="text-sm text-gray-400 mt-1">
                                All gate pass requests
                            </p>
                        </div>

                        {loading ? (
                            <div className="py-16 text-center">
                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading gate passes...
                                </p>
                            </div>
                        ) : gatePasses.length ===
                          0 ? (
                            <div className="py-16 text-center">
                                <ShieldCheck
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 font-semibold text-gray-600">
                                    No gate passes found
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                #
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Pass No
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Type
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Requested By
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Department
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Purpose
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Exit Time
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {gatePasses.map(
                                            (
                                                gatePass,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        gatePass.id
                                                    }
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {index +
                                                            1}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-indigo-600">
                                                            {
                                                                gatePass.pass_no
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <TypeBadge
                                                            type={
                                                                gatePass.gate_pass_type
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {gatePass
                                                                .requester
                                                                ?.name ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {
                                                                    gatePass.department_name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {
                                                                    gatePass.designation_name
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">
                                                            {
                                                                gatePass.purpose
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                                            {formatDateTime(
                                                                gatePass.expected_exit_at
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <StatusBadge
                                                            status={
                                                                gatePass.status
                                                            }
                                                        />

                                                        {gatePass.pending_approval && (
                                                            <div className="text-xs text-gray-500">
                                                                <p className="font-semibold text-gray-600">
                                                                    Level - {gatePass.pending_approval.level}
                                                                </p>

                                                                <p>
                                                                    {gatePass.pending_approval.approver || "--"}
                                                                </p>
                                                            </div>
                                                        )}   

                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDownloadPdf(
                                                                        gatePass.id
                                                                    )
                                                                }
                                                                className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition"
                                                                title="Download PDF"
                                                            >
                                                                <FileDown size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        gatePass
                                                                    )
                                                                }
                                                                className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        gatePass.id
                                                                    )
                                                                }
                                                                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ShieldCheck
                                        size={20}
                                        className="text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {editingId
                                            ? "Update Gate Pass"
                                            : "Create Gate Pass"}
                                    </h3>

                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {editingId
                                            ? "Update gate pass information"
                                            : "Create a new gate pass request"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                            >
                                <X
                                    size={18}
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="flex flex-col min-h-0"
                        >
                            {/* Body */}
                            <div className="p-6 overflow-y-auto space-y-6">

                                {/* Gate Pass Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Gate Pass Type
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <TypeOption
                                            active={
                                                form.gate_pass_type ===
                                                "Person"
                                            }
                                            icon={
                                                <UserRound
                                                    size={
                                                        20
                                                    }
                                                />
                                            }
                                            title="Person"
                                            description="Person only"
                                            onClick={() =>
                                                handleTypeChange(
                                                    "Person"
                                                )
                                            }
                                        />

                                        <TypeOption
                                            active={
                                                form.gate_pass_type ===
                                                "Person With Material"
                                            }
                                            icon={
                                                <UsersRound
                                                    size={
                                                        20
                                                    }
                                                />
                                            }
                                            title="Person With Material"
                                            description="Person with material"
                                            onClick={() =>
                                                handleTypeChange(
                                                    "Person With Material"
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Request Information */}
                                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserRound
                                            size={17}
                                            className="text-indigo-600"
                                        />

                                        <h4 className="text-sm font-bold text-gray-800">
                                            Request Information
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Department */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Department
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    form.department_name
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            department_name:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="IT"
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        {/* Designation */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Designation
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    form.designation_name
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            designation_name:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="IT Officer"
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        {/* Purpose */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Purpose
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    form.purpose
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            purpose:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="Official Work"
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        {/* Exit */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Expected Exit
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="datetime-local"
                                                value={
                                                    form.expected_exit_at
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            expected_exit_at:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>

                                        {/* Return */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Expected Return
                                            </label>

                                            <input
                                                type="datetime-local"
                                                value={
                                                    form.expected_return_at
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setForm(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            expected_return_at:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Remarks
                                        </label>

                                        <textarea
                                            value={
                                                form.remarks
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        remarks:
                                                            e
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            rows={3}
                                            placeholder="Additional remarks..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Materials */}
                                {form.gate_pass_type !==
                                    "Person" && (
                                    <div className="rounded-2xl border border-gray-100 bg-white">
                                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package
                                                    size={
                                                        17
                                                    }
                                                    className="text-indigo-600"
                                                />

                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-800">
                                                        Material Items
                                                    </h4>

                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Products or assets being taken outside
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    addItem
                                                }
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition"
                                            >
                                                <Plus
                                                    size={
                                                        16
                                                    }
                                                />

                                                Add Item
                                            </button>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            {form.items.length ===
                                            0 ? (
                                                <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                                                    <Package
                                                        size={
                                                            28
                                                        }
                                                        className="mx-auto text-gray-300"
                                                    />

                                                    <p className="mt-2 text-sm text-gray-500">
                                                        No material items added.
                                                    </p>
                                                </div>
                                            ) : (
                                                form.items.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={
                                                                index
                                                            }
                                                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60"
                                                        >
                                                            <div className="flex items-center justify-between mb-4">
                                                                <p className="text-sm font-bold text-gray-700">
                                                                    Item{" "}
                                                                    {index +
                                                                        1}
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeItem(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                                                {/* Product */}
                                                                <div className="lg:col-span-2">
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Product / Material
                                                                        <span className="text-red-500 ml-1">
                                                                            *
                                                                        </span>
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.product_name
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "product_name",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Laptop"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                {/* Quantity */}
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Quantity
                                                                    </label>

                                                                    <input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "quantity",
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            )
                                                                        }
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                {/* Unit */}
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Unit
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.unit
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "unit",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Pcs"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                {/* Asset */}
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Asset No
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.asset_no
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "asset_no",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="IT-LAP-025"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                {/* Serial */}
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Serial No
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.serial_no
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "serial_no",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Serial number"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                {/* Item Remarks */}
                                                                <div className="md:col-span-2 lg:col-span-3">
                                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                        Item Remarks
                                                                    </label>

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.remarks
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "remarks",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Item remarks"
                                                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="px-5 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={
                                                    16
                                                }
                                                className="animate-spin"
                                            />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingId
                                                ? "Update"
                                                : "Create"}
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

function TypeOption({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-4 rounded-2xl border transition ${
                active
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
            }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {icon}
                </div>

                <div>
                    <p
                        className={`text-sm font-bold ${
                            active
                                ? "text-indigo-700"
                                : "text-gray-700"
                        }`}
                    >
                        {title}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
}

function TypeBadge({
    type,
}: {
    type:
        | "Person"
        | "Person With Material";
}) {
    if (type === "Person") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                <UserRound size={13} />
                Person
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
            <UsersRound size={13} />
            Person + Material
        </span>
    );
}

function StatusBadge({
    status,
}: {
    status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Cancelled"
        | "Completed";
}) {
    const config = {
        Pending: {
            label: "Pending",
            className:
                "bg-yellow-50 text-yellow-700 border-yellow-100",
        },

        Approved: {
            label: "Approved",
            className:
                "bg-green-50 text-green-700 border-green-100",
        },

        Rejected: {
            label: "Rejected",
            className:
                "bg-red-50 text-red-700 border-red-100",
        },

        Cancelled: {
            label: "Cancelled",
            className:
                "bg-gray-50 text-gray-600 border-gray-200",
        },

        Completed: {
            label: "Completed",
            className:
                "bg-blue-50 text-blue-700 border-blue-100",
        },
    };

    const item = config[status];

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${item.className}`}
        >
            {item.label}
        </span>
    );
}

function formatDateTime(
    value: string
) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatDateTimeForInput(
    value: string
) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    const year =
        date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    const hours = String(
        date.getHours()
    ).padStart(2, "0");

    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}