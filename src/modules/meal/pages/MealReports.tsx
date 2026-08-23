import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Coins,
    Filter,
    RefreshCw,
    Utensils,
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


interface DailyReport {
    meal_date: string;
    meal_type_id: number;
    meal_type_name: string;
    total_bookings: number;
    selected_count: number;
    served_count: number;
    cancelled_count: number;
    total_quantity: number;
    total_amount: number;
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


interface ItemConsumption {
    menu_item_id: number;
    item_name: string;
    item_type: "Main" | "Alternative";
    alternative_of: number | null;
    meal_type_id: number;
    meal_type_name: string;
    selected_count: number;
}


type ReportType =
    | "daily"
    | "employee"
    | "items";


export default function MealReports() {

    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [reportType, setReportType] =
        useState<ReportType>("daily");

    const [mealTypes, setMealTypes] =
        useState<MealType[]>([]);

    const [dateFrom, setDateFrom] =
        useState(
            new Date().toISOString().slice(0, 10)
        );

    const [dateTo, setDateTo] =
        useState(
            new Date().toISOString().slice(0, 10)
        );

    const [mealTypeId, setMealTypeId] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [employeeId, setEmployeeId] =
        useState("");

    const [dailyData, setDailyData] =
        useState<DailyReport[]>([]);

    const [employeeData, setEmployeeData] =
        useState<EmployeeBooking[]>([]);

    const [itemData, setItemData] =
        useState<ItemConsumption[]>([]);

    const [summary, setSummary] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Load Meal Types
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

                const data =
                    response.data?.data?.data ||
                    response.data?.data ||
                    [];

                setMealTypes(data);

            } catch (error) {

                console.error(
                    "Failed to load meal types:",
                    error
                );

            }

        };

        loadMealTypes();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Generate Report
    |--------------------------------------------------------------------------
    */

    const generateReport = async () => {

        setLoading(true);

        try {

            const params: Record<string, any> = {
                date_from: dateFrom,
                date_to: dateTo,
            };

            if (mealTypeId) {
                params.meal_type_id =
                    Number(mealTypeId);
            }

            if (status) {
                params.status = status;
            }

            if (
                reportType === "employee" &&
                employeeId
            ) {
                params.employee_id =
                    Number(employeeId);
            }


            let endpoint = "";

            if (reportType === "daily") {

                endpoint =
                    "/meal-reports/daily";

            } else if (
                reportType === "employee"
            ) {

                endpoint =
                    "/meal-reports/employee-bookings";

            } else {

                endpoint =
                    "/meal-reports/item-consumption";

            }


            const response =
                await api.get(
                    endpoint,
                    {
                        params,
                    }
                );


            if (reportType === "daily") {

                setDailyData(
                    response.data?.data || []
                );

            } else if (
                reportType === "employee"
            ) {

                setEmployeeData(
                    response.data?.data || []
                );

            } else {

                setItemData(
                    response.data?.data || []
                );

            }


            setSummary(
                response.data?.summary || null
            );

        } catch (error) {

            console.error(
                "Failed to generate report:",
                error
            );

            alert(
                "Failed to generate report."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        generateReport();

    }, [reportType]);


    /*
    |--------------------------------------------------------------------------
    | Clear Filters
    |--------------------------------------------------------------------------
    */

    const clearFilters = () => {

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        setDateFrom(today);
        setDateTo(today);
        setMealTypeId("");
        setStatus("");
        setEmployeeId("");

    };


    /*
    |--------------------------------------------------------------------------
    | Status Badge
    |--------------------------------------------------------------------------
    */

    const statusBadge = (
        value: string
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


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

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

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

                        <div>

                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Meal Reports
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Analyze meal bookings, employees and item consumption.
                            </p>

                        </div>

                    </div>


                    {/* Report Tabs */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 mb-5">

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                            <button
                                onClick={() =>
                                    setReportType("daily")
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                                    reportType === "daily"
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >

                                <CalendarDays size={17} />

                                Daily Booking

                            </button>


                            <button
                                onClick={() =>
                                    setReportType("employee")
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                                    reportType === "employee"
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >

                                <Users size={17} />

                                Employee Bookings

                            </button>


                            <button
                                onClick={() =>
                                    setReportType("items")
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                                    reportType === "items"
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >

                                <Utensils size={17} />

                                Item Consumption

                            </button>

                        </div>

                    </div>


                    {/* Filters */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">

                        <div className="flex items-center gap-2 mb-4">

                            <Filter
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="font-bold text-gray-800">
                                Report Filters
                            </h3>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                            {/* From */}

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


                            {/* To */}

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


                            {/* Meal Type */}

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
                                                key={
                                                    mealType.id
                                                }
                                                value={
                                                    mealType.id
                                                }
                                            >
                                                {
                                                    mealType.name
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>


                            {/* Status */}

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


                            {/* Employee ID */}

                            {reportType === "employee" && (

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

                            )}

                        </div>


                        <div className="flex justify-end gap-2 mt-5">

                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Clear
                            </button>


                            <button
                                onClick={generateReport}
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

                    {summary && reportType !== "items" && (

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">

                            <SummaryCard
                                title="Bookings"
                                value={
                                    summary.total_bookings ?? 0
                                }
                                icon={
                                    <ClipboardList size={18} />
                                }
                            />

                            <SummaryCard
                                title="Selected"
                                value={
                                    summary.selected_count ?? 0
                                }
                                icon={
                                    <ClipboardList size={18} />
                                }
                            />

                            <SummaryCard
                                title="Served"
                                value={
                                    summary.served_count ?? 0
                                }
                                icon={
                                    <CheckCircle2 size={18} />
                                }
                            />

                            <SummaryCard
                                title="Cancelled"
                                value={
                                    summary.cancelled_count ?? 0
                                }
                                icon={
                                    <XCircle size={18} />
                                }
                            />

                            <SummaryCard
                                title="Quantity"
                                value={
                                    summary.total_quantity ?? 0
                                }
                                icon={
                                    <Utensils size={18} />
                                }
                            />

                            <SummaryCard
                                title="Amount"
                                value={`৳ ${Number(
                                    summary.total_amount ?? 0
                                ).toFixed(2)}`}
                                icon={
                                    <Coins size={18} />
                                }
                            />

                        </div>

                    )}


                    {/* Report Table */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                        <div className="overflow-x-auto">

                            {/* Daily */}

                            {reportType === "daily" && (

                                <table className="w-full text-sm">

                                    <thead className="bg-gray-50 border-b border-gray-100">

                                        <tr>

                                            <Th>
                                                Date
                                            </Th>

                                            <Th>
                                                Meal Type
                                            </Th>

                                            <Th>
                                                Bookings
                                            </Th>

                                            <Th>
                                                Selected
                                            </Th>

                                            <Th>
                                                Served
                                            </Th>

                                            <Th>
                                                Cancelled
                                            </Th>

                                            <Th>
                                                Quantity
                                            </Th>

                                            <Th>
                                                Amount
                                            </Th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {dailyData.map(
                                            (row, index) => (

                                                <tr
                                                    key={index}
                                                    className="border-b border-gray-50 hover:bg-gray-50/50"
                                                >

                                                    <Td>
                                                        {row.meal_date}
                                                    </Td>

                                                    <Td>
                                                        <span className="font-semibold text-gray-700">
                                                            {
                                                                row.meal_type_name
                                                            }
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.total_bookings
                                                        }
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.selected_count
                                                        }
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.served_count
                                                        }
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.cancelled_count
                                                        }
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.total_quantity
                                                        }
                                                    </Td>

                                                    <Td>
                                                        ৳{" "}
                                                        {Number(
                                                            row.total_amount
                                                        ).toFixed(2)}
                                                    </Td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}


                            {/* Employee */}

                            {reportType === "employee" && (

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

                                        {employeeData.map(
                                            (row) => (

                                                <tr
                                                    key={row.id}
                                                    className="border-b border-gray-50 hover:bg-gray-50/50"
                                                >

                                                    <Td>
                                                        {
                                                            row.meal_date
                                                        }
                                                    </Td>

                                                    <Td>
                                                        <span className="font-semibold">
                                                            {
                                                                row.employee_id
                                                            }
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.meal_type_name
                                                        }
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.menu_id ??
                                                            "-"
                                                        }
                                                    </Td>

                                                    <Td>
                                                        ৳{" "}
                                                        {Number(
                                                            row.meal_rate
                                                        ).toFixed(2)}
                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.quantity
                                                        }
                                                    </Td>

                                                    <Td>
                                                        ৳{" "}
                                                        {Number(
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

                            )}


                            {/* Item Consumption */}

                            {reportType === "items" && (

                                <table className="w-full text-sm">

                                    <thead className="bg-gray-50 border-b border-gray-100">

                                        <tr>

                                            <Th>
                                                Item
                                            </Th>

                                            <Th>
                                                Type
                                            </Th>

                                            <Th>
                                                Meal Type
                                            </Th>

                                            <Th>
                                                Selected Count
                                            </Th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {itemData.map(
                                            (row) => (

                                                <tr
                                                    key={`${row.menu_item_id}-${row.meal_type_id}`}
                                                    className="border-b border-gray-50 hover:bg-gray-50/50"
                                                >

                                                    <Td>

                                                        <div className="flex items-center gap-2">

                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">

                                                                <Utensils
                                                                    size={15}
                                                                    className="text-indigo-600"
                                                                />

                                                            </div>

                                                            <span className="font-semibold text-gray-700">
                                                                {
                                                                    row.item_name
                                                                }
                                                            </span>

                                                        </div>

                                                    </Td>

                                                    <Td>

                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">

                                                            {
                                                                row.item_type
                                                            }

                                                        </span>

                                                    </Td>

                                                    <Td>
                                                        {
                                                            row.meal_type_name
                                                        }
                                                    </Td>

                                                    <Td>

                                                        <span className="font-bold text-indigo-600">

                                                            {
                                                                row.selected_count
                                                            }

                                                        </span>

                                                    </Td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}


                            {/* Empty */}

                            {!loading && (

                                (
                                    reportType === "daily"
                                        ? dailyData.length === 0
                                        : reportType === "employee"
                                            ? employeeData.length === 0
                                            : itemData.length === 0
                                ) && (

                                    <div className="py-14 text-center">

                                        <Utensils
                                            size={30}
                                            className="mx-auto text-gray-300"
                                        />

                                        <p className="text-sm text-gray-500 mt-3">
                                            No report data found.
                                        </p>

                                    </div>

                                )

                            )}

                        </div>

                    </div>

                </div>

            </main>

        </div>

    );
}


/*
|--------------------------------------------------------------------------
| Small Components
|--------------------------------------------------------------------------
*/

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}) {

    return (

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-[11px] text-gray-400 font-medium">
                        {title}
                    </p>

                    <p className="text-lg font-bold text-gray-800 mt-1">
                        {value}
                    </p>

                </div>

                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {icon}
                </div>

            </div>

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