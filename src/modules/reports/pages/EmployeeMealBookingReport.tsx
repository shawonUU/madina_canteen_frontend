import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Filter,
    RefreshCw,
    Users,
    XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";


interface MealType {
    id: number;
    name: string;
}


interface EmployeeBooking {
    id: number;
    employee_id: number;
    meal_date: string;
    meal_type_id: number;
    meal_type_name: string;
    menu_id: number | null;
    meal_rate: number;
    quantity: number;
    total_amount: number;
    status: "Selected" | "Served" | "Cancelled";
    remarks: string | null;
}


export default function EmployeeMealBookingReport() {

    const [openSidebar, setOpenSidebar] = useState(false);

    const [mealTypes, setMealTypes] = useState<MealType[]>([]);

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    const [employeeId, setEmployeeId] = useState("");
    const [mealTypeId, setMealTypeId] = useState("");
    const [status, setStatus] = useState("");

    const [data, setData] = useState<EmployeeBooking[]>([]);

    const [loading, setLoading] = useState(false);


    const [summary, setSummary] = useState({
        total_bookings: 0,
        selected_count: 0,
        served_count: 0,
        cancelled_count: 0,
        total_quantity: 0,
        total_amount: 0,
    });


    /*
    |--------------------------------------------------------------------------
    | Meal Types
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadMealTypes = async () => {

            try {

                const response =
                    await api.get("/meal-types", {
                        params: {
                            per_page: 100,
                        },
                    });

                setMealTypes(
                    response.data?.data?.data ||
                    response.data?.data ||
                    []
                );

            } catch (error) {

                console.error(error);

            }

        };

        loadMealTypes();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Report
    |--------------------------------------------------------------------------
    */

    const loadReport = async () => {

        setLoading(true);

        try {

            const params: Record<string, any> = {
                date_from: dateFrom,
                date_to: dateTo,
            };

            if (employeeId) {
                params.employee_id =
                    Number(employeeId);
            }

            if (mealTypeId) {
                params.meal_type_id =
                    Number(mealTypeId);
            }

            if (status) {
                params.status = status;
            }


            const response =
                await api.get(
                    "/meal-reports/employee-bookings",
                    {
                        params,
                    }
                );


            setData(
                response.data?.data || []
            );


            const reportSummary =
                response.data?.summary || {};


            setSummary({

                total_bookings:
                    Number(
                        reportSummary.total_bookings || 0
                    ),

                selected_count:
                    Number(
                        reportSummary.selected_count || 0
                    ),

                served_count:
                    Number(
                        reportSummary.served_count || 0
                    ),

                cancelled_count:
                    Number(
                        reportSummary.cancelled_count || 0
                    ),

                total_quantity:
                    Number(
                        reportSummary.total_quantity || 0
                    ),

                total_amount:
                    Number(
                        reportSummary.total_amount || 0
                    ),

            });

        } catch (error) {

            console.error(
                "Failed to load employee booking report:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadReport();

    }, []);


    const clearFilters = () => {

        setDateFrom(today);
        setDateTo(today);
        setEmployeeId("");
        setMealTypeId("");
        setStatus("");

    };


    const statusBadge = (
        value: EmployeeBooking["status"]
    ) => {

        if (value === "Served") {

            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                    <CheckCircle2 size={13} />
                    Served
                </span>
            );

        }

        if (value === "Cancelled") {

            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                    <XCircle size={13} />
                    Cancelled
                </span>
            );

        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-semibold">
                <ClipboardList size={13} />
                Selected
            </span>
        );

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

                    <div className="mb-6">

                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                            Employee Meal Booking Report
                        </h2>

                        <p className="text-gray-500 mt-1">
                            View employee-wise meal booking details.
                        </p>

                    </div>


                    {/* Filters */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">

                        <div className="flex items-center gap-2 mb-4">

                            <Filter
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="font-bold text-gray-800">
                                Filters
                            </h3>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Employee ID
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={employeeId}
                                    onChange={(e) =>
                                        setEmployeeId(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Employee ID"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>


                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Date From
                                </label>

                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>


                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Date To
                                </label>

                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) =>
                                        setDateTo(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>


                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Meal Type
                                </label>

                                <select
                                    value={mealTypeId}
                                    onChange={(e) =>
                                        setMealTypeId(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >

                                    <option value="">
                                        All Meal Types
                                    </option>

                                    {mealTypes.map(
                                        (mealType) => (

                                            <option
                                                key={mealType.id}
                                                value={mealType.id}
                                            >
                                                {mealType.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Status
                                </label>

                                <select
                                    value={status}
                                    onChange={(e) =>
                                        setStatus(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >

                                    <option value="">
                                        All Status
                                    </option>

                                    <option value="Selected">
                                        Selected
                                    </option>

                                    <option value="Served">
                                        Served
                                    </option>

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        </div>


                        <div className="flex justify-end gap-2 mt-5">

                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Clear
                            </button>


                            <button
                                onClick={loadReport}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                            >

                                {loading ? (
                                    <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Filter size={16} />
                                )}

                                Generate Report

                            </button>

                        </div>

                    </div>


                    {/* Summary */}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">

                        <SummaryCard
                            title="Bookings"
                            value={summary.total_bookings}
                        />

                        <SummaryCard
                            title="Selected"
                            value={summary.selected_count}
                        />

                        <SummaryCard
                            title="Served"
                            value={summary.served_count}
                        />

                        <SummaryCard
                            title="Cancelled"
                            value={summary.cancelled_count}
                        />

                        <SummaryCard
                            title="Quantity"
                            value={summary.total_quantity}
                        />

                        <SummaryCard
                            title="Amount"
                            value={`৳ ${summary.total_amount.toFixed(2)}`}
                        />

                    </div>


                    {/* Table */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-gray-50 border-b border-gray-100">

                                    <tr>

                                        <Th>
                                            Date
                                        </Th>

                                        <Th>
                                            Employee ID
                                        </Th>

                                        <Th>
                                            Meal Type
                                        </Th>

                                        <Th>
                                            Menu ID
                                        </Th>

                                        <Th>
                                            Rate
                                        </Th>

                                        <Th>
                                            Qty
                                        </Th>

                                        <Th>
                                            Amount
                                        </Th>

                                        <Th>
                                            Status
                                        </Th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {data.map(
                                        (row) => (

                                            <tr
                                                key={row.id}
                                                className="border-b border-gray-50 hover:bg-gray-50"
                                            >

                                                <Td>
                                                    {row.meal_date}
                                                </Td>

                                                <Td>
                                                    <span className="font-semibold text-gray-700">
                                                        {row.employee_id}
                                                    </span>
                                                </Td>

                                                <Td>
                                                    {row.meal_type_name}
                                                </Td>

                                                <Td>
                                                    {row.menu_id ?? "-"}
                                                </Td>

                                                <Td>
                                                    ৳ {Number(
                                                        row.meal_rate
                                                    ).toFixed(2)}
                                                </Td>

                                                <Td>
                                                    {row.quantity}
                                                </Td>

                                                <Td>
                                                    ৳ {Number(
                                                        row.total_amount
                                                    ).toFixed(2)}
                                                </Td>

                                                <Td>
                                                    {statusBadge(
                                                        row.status
                                                    )}
                                                </Td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>


                            {!loading &&
                                data.length === 0 && (

                                    <div className="py-14 text-center">

                                        <Users
                                            size={32}
                                            className="mx-auto text-gray-300"
                                        />

                                        <p className="mt-3 text-sm text-gray-500">
                                            No employee booking found.
                                        </p>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}


function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: string | number;
}) {

    return (

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">

            <p className="text-[11px] text-gray-400">
                {title}
            </p>

            <p className="text-lg font-bold text-gray-800 mt-1">
                {value}
            </p>

        </div>

    );
}


function Th({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 whitespace-nowrap">
            {children}
        </th>
    );

}


function Td({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
            {children}
        </td>
    );

}