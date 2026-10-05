import {
    Check,
    Eye,
    RefreshCw,
    RotateCcw,
    Search,
    X,
    Clock,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

interface ApprovalLevel {
    id: number;
    level_no: number;
    name: string;
    approver_type: "Role" | "User" | "Department Role";
    status: string;
}

interface ApprovalRequest {
    id: number;
    document_type: string;
    document_id: number;
    document_no: string | null;
    status: string;
    current_level: number;
    total_levels: number;
    submitted_at: string;
    created_at?: string;
    requester?: {
        id: number;
        name: string;
        email?: string;
    };
    workflow?: {
        id: number;
        name: string;
        description?: string | null;
    };
    current_level_data?: ApprovalLevel | null;
}

interface ApprovalActionModal {
    open: boolean;
    type: "Approve" | "Reject" | "Return" | null;
    request: ApprovalRequest | null;
}

export default function PendingApproval() {
    const [openSidebar, setOpenSidebar] = useState(false);

    const [requests, setRequests] = useState<ApprovalRequest[]>(
        []
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] =
        useState<ApprovalRequest | null>(null);

    const [actionModal, setActionModal] =
        useState<ApprovalActionModal>({
            open: false,
            type: null,
            request: null,
        });

    const [actionComment, setActionComment] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchPendingApprovals = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(
                "/approvals"
            );

            if (
                response.data.success ||
                response.data.status === "Success"
            ) {
                setRequests(
                    response.data.data?.data ||
                        response.data.data ||
                        []
                );
            }
        } catch (error) {
            console.error(
                "Failed to load pending approvals:",
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const filteredRequests = requests.filter(
        (request) => {
            const keyword = search
                .trim()
                .toLowerCase();

            if (!keyword) {
                return true;
            }

            return (
                request.document_type
                    ?.toLowerCase()
                    .includes(keyword) ||
                request.document_no
                    ?.toLowerCase()
                    .includes(keyword) ||
                request.requester?.name
                    ?.toLowerCase()
                    .includes(keyword) ||
                request.workflow?.name
                    ?.toLowerCase()
                    .includes(keyword)
            );
        }
    );

    const openViewModal = (
        request: ApprovalRequest
    ) => {
        setSelectedRequest(request);
        setViewModalOpen(true);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setSelectedRequest(null);
    };

    const openActionModal = (
        request: ApprovalRequest,
        type: "Approve" | "Reject" | "Return"
    ) => {
        setActionModal({
            open: true,
            type,
            request,
        });

        setActionComment("");
    };

    const closeActionModal = () => {
        if (processing) {
            return;
        }

        setActionModal({
            open: false,
            type: null,
            request: null,
        });

        setActionComment("");
    };

    const handleAction = async () => {
        if (
            !actionModal.request ||
            !actionModal.type
        ) {
            return;
        }

        if (
            (actionModal.type === "Reject" ||
                actionModal.type === "Return") &&
            !actionComment.trim()
        ) {
            alert(
                `Please enter ${actionModal.type.toLowerCase()} reason.`
            );

            return;
        }

        setProcessing(true);

        try {
            const requestId =
                actionModal.request.id;

            let endpoint = "";

            if (actionModal.type === "Approve") {
                endpoint = `/approvals/${requestId}/approve`;
            }

            if (actionModal.type === "Reject") {
                endpoint = `/approvals/${requestId}/reject`;
            }

            if (actionModal.type === "Return") {
                endpoint = `/approvals/${requestId}/return`;
            }

            await api.post(endpoint, {
                comment:
                    actionComment.trim() || null,
            });

            closeActionModal();

            await fetchPendingApprovals(true);
        } catch (error: any) {
            console.error(
                `Failed to ${actionModal.type?.toLowerCase()} approval:`,
                error
            );

            alert(
                error?.response?.data?.message ||
                    `Failed to ${actionModal.type?.toLowerCase()} approval request.`
            );
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (
        date: string | undefined
    ) => {
        if (!date) {
            return "--";
        }

        return new Date(date).toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const getActionTitle = () => {
        if (!actionModal.type) {
            return "";
        }

        if (actionModal.type === "Approve") {
            return "Approve Request";
        }

        if (actionModal.type === "Reject") {
            return "Reject Request";
        }

        return "Return Request";
    };

    const getActionDescription = () => {
        if (!actionModal.type) {
            return "";
        }

        if (actionModal.type === "Approve") {
            return "Are you sure you want to approve this request?";
        }

        if (actionModal.type === "Reject") {
            return "Please provide a reason for rejecting this request.";
        }

        return "Please provide a reason for returning this request.";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />

            <main className="flex-1 min-w-0">
                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock
                                    size={20}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-indigo-600">
                                    Approval Management
                                </span>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Pending Approval
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Review and process your pending approval requests.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fetchPendingApprovals(
                                    true
                                )
                            }
                            disabled={refreshing}
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
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* Card Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Pending Requests
                                    </h3>

                                    <p className="text-sm text-gray-400 mt-1">
                                        Approval requests waiting for your action
                                    </p>
                                </div>

                                {/* Search */}
                                <div className="relative w-full md:w-72">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Search request..."
                                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Loading */}
                        {loading ? (
                            <div className="py-16 text-center">
                                <RefreshCw
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading pending approvals...
                                </p>
                            </div>
                        ) : filteredRequests.length ===
                          0 ? (
                            <div className="py-16 text-center">
                                <Clock
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 font-semibold text-gray-600">
                                    No pending approval found
                                </p>

                                <p className="text-sm text-gray-400 mt-1">
                                    There are no approval requests waiting for your action.
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
                                                Document
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Requester
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Workflow
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Level
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Submitted
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
                                        {filteredRequests.map(
                                            (
                                                request,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        request.id
                                                    }
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {index +
                                                            1}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {
                                                                    request.document_type
                                                                }
                                                            </p>

                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {request
                                                                    .document_no ||
                                                                    `Document #${request.document_id}`}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">
                                                                {request
                                                                    .requester
                                                                    ?.name ||
                                                                    "--"}
                                                            </p>

                                                            {request
                                                                .requester
                                                                ?.email && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {
                                                                        request
                                                                            .requester
                                                                            .email
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">
                                                            {request
                                                                .workflow
                                                                ?.name ||
                                                                "--"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                                                            Level{" "}
                                                            {
                                                                request.current_level
                                                            }{" "}
                                                            /{" "}
                                                            {
                                                                request.total_levels
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(
                                                                request.submitted_at ||
                                                                    request.created_at
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-xs font-semibold">
                                                            {
                                                                request.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">

                                                            {/* View */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        request
                                                                    )
                                                                }
                                                                title="View"
                                                                className="w-9 h-9 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition"
                                                            >
                                                                <Eye
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {/* Approve */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openActionModal(
                                                                        request,
                                                                        "Approve"
                                                                    )
                                                                }
                                                                title="Approve"
                                                                className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition"
                                                            >
                                                                <Check
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {/* Return */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openActionModal(
                                                                        request,
                                                                        "Return"
                                                                    )
                                                                }
                                                                title="Return"
                                                                className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition"
                                                            >
                                                                <RotateCcw
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {/* Reject */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openActionModal(
                                                                        request,
                                                                        "Reject"
                                                                    )
                                                                }
                                                                title="Reject"
                                                                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                                                            >
                                                                <X
                                                                    size={
                                                                        16
                                                                    }
                                                                />
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

            {/* View Modal */}
            {viewModalOpen &&
                selectedRequest && (
                    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Eye
                                            size={20}
                                            className="text-indigo-600"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            Approval Request
                                        </h3>

                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Request details
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Document Type
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {
                                                selectedRequest.document_type
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Document No
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {selectedRequest.document_no ||
                                                `Document #${selectedRequest.document_id}`}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Requester
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {selectedRequest
                                                .requester
                                                ?.name ||
                                                "--"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Workflow
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {selectedRequest
                                                .workflow
                                                ?.name ||
                                                "--"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Current Level
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            Level{" "}
                                            {
                                                selectedRequest.current_level
                                            }{" "}
                                            /{" "}
                                            {
                                                selectedRequest.total_levels
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-400">
                                            Submitted At
                                        </p>

                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                            {formatDate(
                                                selectedRequest.submitted_at ||
                                                    selectedRequest.created_at
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {selectedRequest
                                    .workflow
                                    ?.description && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </p>

                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                                            {
                                                selectedRequest
                                                    .workflow
                                                    .description
                                            }
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={
                                            closeViewModal
                                        }
                                        className="px-5 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition"
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeViewModal();

                                            openActionModal(
                                                selectedRequest,
                                                "Approve"
                                            );
                                        }}
                                        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
                                    >
                                        <Check
                                            size={16}
                                        />
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Action Modal */}
            {actionModal.open &&
                actionModal.request && (
                    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            actionModal.type ===
                                            "Approve"
                                                ? "bg-green-50 text-green-600"
                                                : actionModal.type ===
                                                  "Reject"
                                                ? "bg-red-50 text-red-600"
                                                : "bg-orange-50 text-orange-600"
                                        }`}
                                    >
                                        {actionModal.type ===
                                        "Approve" ? (
                                            <Check
                                                size={
                                                    20
                                                }
                                            />
                                        ) : actionModal.type ===
                                          "Reject" ? (
                                            <X
                                                size={
                                                    20
                                                }
                                            />
                                        ) : (
                                            <RotateCcw
                                                size={
                                                    20
                                                }
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {getActionTitle()}
                                        </h3>

                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {
                                                actionModal
                                                    .request
                                                    .document_type
                                            }{" "}
                                            -{" "}
                                            {actionModal
                                                .request
                                                .document_no ||
                                                `#${actionModal.request.document_id}`}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeActionModal
                                    }
                                    disabled={processing}
                                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">

                                <p className="text-sm text-gray-600 mb-5">
                                    {getActionDescription()}
                                </p>

                                {actionModal.type !==
                                    "Approve" && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Reason
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            value={
                                                actionComment
                                            }
                                            onChange={(e) =>
                                                setActionComment(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows={4}
                                            placeholder={`Enter ${actionModal.type?.toLowerCase()} reason...`}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={
                                            closeActionModal
                                        }
                                        disabled={processing}
                                        className="px-5 h-11 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleAction
                                        }
                                        disabled={processing}
                                        className={`inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
                                            actionModal.type ===
                                            "Approve"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : actionModal.type ===
                                                  "Reject"
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-orange-500 hover:bg-orange-600"
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <RefreshCw
                                                    size={
                                                        16
                                                    }
                                                    className="animate-spin"
                                                />

                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {actionModal.type ===
                                                "Approve" ? (
                                                    <Check
                                                        size={
                                                            16
                                                        }
                                                    />
                                                ) : actionModal.type ===
                                                  "Reject" ? (
                                                    <X
                                                        size={
                                                            16
                                                        }
                                                    />
                                                ) : (
                                                    <RotateCcw
                                                        size={
                                                            16
                                                        }
                                                    />
                                                )}

                                                {
                                                    actionModal.type
                                                }
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
