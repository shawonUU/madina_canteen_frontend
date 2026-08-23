import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Coins,
    Filter,
    RefreshCw,
    Utensils,
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


export default function DailyMealBookingReport() {

    const [openSidebar, setOpenSidebar] = useState(false);

    const [mealTypes, setMealTypes] = useState<MealType[]>([]);

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    const [mealTypeId, setMealTypeId] = useState("");
    const [status, setStatus] = useState("");

    const [data, setData] = useState<DailyReport[]>([]);

    const [summary, setSummary] = useState({
        total_bookings: 0,
        selected_count: 0,
        served_count: 0,
        cancelled_count: 0,
        total_quantity: 0,
        total_amount: 0,
    });

    const [loading, setLoading] = useState(false);


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

                const mealTypeData =
                    response.data?.data?.data ||
                    response.data?.data ||
                    [];

                setMealTypes(mealTypeData);

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
    | Load Report
    |--------------------------------------------------------------------------
    */

    const loadReport = async () => {

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

            const response =
                await api.get(
                    "/meal-reports/daily",
                    {
                        params,
                    }
                );

            setData(
                response.data?.data || []
            );

            setSummary({
                total_bookings:
                    Number(
                        response.data?.summary
                            ?.total_bookings || 0
                    ),

                selected_count:
                    Number(
                        response.data?.summary
                            ?.selected_count || 0
                    ),

                served_count:
                    Number(
                        response.data?.summary
                            ?.served_count || 0
                    ),

                cancelled_count:
                    Number(
                        response.data?.summary
                            ?.cancelled_count || 0
                    ),

                total_quantity:
                    Number(
                        response.data?.summary
                            ?.total_quantity || 0
                    ),

                total_amount:
                    Number(
                        response.data?.summary
                            ?.total_amount || 0
                    ),
            });

        } catch (error) {

            console.error(
                "Failed to load daily meal report:",
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
        setMealTypeId("");
        setStatus("");

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
                            Daily Meal Booking Report
                        </h2>

                        <p className="text-gray-500 mt-1">
                            View daily meal booking summary and statistics.
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
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
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
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
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
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
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
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
                            icon={<ClipboardList size={18} />}
                        />

                        <SummaryCard
                            title="Selected"
                            value={summary.selected_count}
                            icon={<ClipboardList size={18} />}
                        />

                        <SummaryCard
                            title="Served"
                            value={summary.served_count}
                            icon={<CheckCircle2 size={18} />}
                        />

                        <SummaryCard
                            title="Cancelled"
                            value={summary.cancelled_count}
                            icon={<XCircle size={18} />}
                        />

                        <SummaryCard
                            title="Quantity"
                            value={summary.total_quantity}
                            icon={<Utensils size={18} />}
                        />

                        <SummaryCard
                            title="Amount"
                            value={`৳ ${summary.total_amount.toFixed(2)}`}
                            icon={<Coins size={18} />}
                        />

                    </div>


                    {/* Table */}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-gray-50 border-b border-gray-100">

                                    <tr>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            Date
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            Meal Type
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Bookings
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Selected
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Served
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Cancelled
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Quantity
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                                            Amount
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {data.map(
                                        (row, index) => (

                                            <tr
                                                key={index}
                                                className="border-b border-gray-50 hover:bg-gray-50"
                                            >

                                                <td className="px-4 py-3">
                                                    {row.meal_date}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-gray-700">
                                                    {row.meal_type_name}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {row.total_bookings}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {row.selected_count}
                                                </td>

                                                <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                                    {row.served_count}
                                                </td>

                                                <td className="px-4 py-3 text-center text-red-600 font-semibold">
                                                    {row.cancelled_count}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {row.total_quantity}
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold">
                                                    ৳ {Number(
                                                        row.total_amount
                                                    ).toFixed(2)}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>


                            {!loading &&
                                data.length === 0 && (

                                    <div className="py-14 text-center">

                                        <CalendarDays
                                            size={32}
                                            className="mx-auto text-gray-300"
                                        />

                                        <p className="mt-3 text-sm text-gray-500">
                                            No report data found.
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

                    <p className="text-[11px] text-gray-400">
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