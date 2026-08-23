import {
    Users,
    Utensils,
    Coffee,
    Clock3,
    CheckCircle2,
    XCircle,
    TrendingUp,
    CalendarDays,
    Sparkles,
    RefreshCw,
    AlertCircle,
    IndianRupee,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../components/side-nav";
import TopNav from "../components/top-nav";
import api from "../../../services/api";


interface Summary {
    total_bookings: number;
    served: number;
    pending: number;
    cancelled: number;
    total_amount: number;
    total_employees: number;
}


interface MealStatistics {
    meal_type_id: number;
    total: number;
    served: number;
    pending: number;
    cancelled: number;
    amount: number;
    meal_type?: {
        id: number;
        name: string;
    };
}


interface MenuItem {
    id: number;
    Item_name: string;
    item_type: "Main" | "Alternative";
    alternative_of: number | null;
}


interface TodayMenu {
    id: number;
    menu_date: string;
    meal_type_id: number;

    meal_type?: {
        id: number;
        name: string;
        description?: string;
    };

    items: MenuItem[];
}


interface RecentBooking {
    id: number;

    employee_id: number;

    meal_type_id: number;

    meal_rate: number;

    meal_date: string;

    quantity: number;

    total_amount: number;

    status: "Selected" | "Served" | "Cancelled";

    employee?: {
        id: number;
        name?: string;
        employee_name?: string;
    };

    meal_type?: {
        id: number;
        name: string;
    };

    items?: any[];
}


interface DashboardData {
    date: string;

    summary: Summary;

    meal_statistics: MealStatistics[];

    menus: TodayMenu[];

    recent_bookings: RecentBooking[];
}


export default function Dashboard() {

    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Fetch Dashboard
    |--------------------------------------------------------------------------
    */

    const fetchDashboard = async (
        isRefresh = false
    ) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response =
                await api.get(
                    "/dashboard"
                );

            setDashboard(
                response.data?.data || null
            );

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            setDashboard(null);

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    };


    useEffect(() => {

        fetchDashboard();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const formatCurrency = (
        amount: number
    ) => {

        return new Intl.NumberFormat(
            "en-BD",
            {
                style: "currency",
                currency: "BDT",
                maximumFractionDigits: 2,
            }
        ).format(amount || 0);

    };


    const formatDate = (
        date?: string
    ) => {

        if (!date) {
            return "--";
        }

        return new Date(
            date
        ).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    const getEmployeeName = (
        booking: RecentBooking
    ) => {

        return (
            booking.employee?.name ||
            booking.employee?.employee_name ||
            `Employee #${booking.employee_id}`
        );

    };


    const getStatusClass = (
        status: string
    ) => {

        if (status === "Served") {

            return "bg-green-50 text-green-700 border-green-100";

        }

        if (status === "Cancelled") {

            return "bg-red-50 text-red-700 border-red-100";

        }

        return "bg-orange-50 text-orange-700 border-orange-100";

    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {

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

                    <div className="h-[calc(100vh-64px)] flex items-center justify-center">

                        <div className="text-center">

                            <RefreshCw
                                size={32}
                                className="mx-auto animate-spin text-indigo-600"
                            />

                            <p className="mt-3 text-sm text-gray-500">
                                Loading dashboard...
                            </p>

                        </div>

                    </div>

                </main>

            </div>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Data
    |--------------------------------------------------------------------------
    */

    const summary =
        dashboard?.summary || {

            total_bookings: 0,

            served: 0,

            pending: 0,

            cancelled: 0,

            total_amount: 0,

            total_employees: 0,

        };


    const mealStatistics =
        dashboard?.meal_statistics || [];


    const menus =
        dashboard?.menus || [];


    const recentBookings =
        dashboard?.recent_bookings || [];


    /*
    |--------------------------------------------------------------------------
    | Served Percentage
    |--------------------------------------------------------------------------
    */

    const servedPercentage =
        summary.total_bookings > 0
            ? Math.round(
                (
                    summary.served /
                    summary.total_bookings
                ) * 100
            )
            : 0;


    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">


            {/* Sidebar */}

            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />


            {/* Main */}

            <main className="flex-1 min-w-0">


                {/* Top Navigation */}

                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />


                {/* Content */}

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">


                    {/* Header */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                        <div>

                            <div className="flex items-center gap-2">

                                <Sparkles
                                    size={20}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-indigo-600">
                                    Meal Management
                                </span>

                            </div>

                            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mt-1">
                                Canteen Dashboard
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Monitor today's meal operations and bookings.
                            </p>

                        </div>


                        <div className="flex items-center gap-3">

                            {/* Date */}

                            <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2.5">

                                <CalendarDays
                                    size={17}
                                    className="text-indigo-600"
                                />

                                <span className="text-sm font-semibold text-gray-700">
                                    {formatDate(
                                        dashboard?.date
                                    )}
                                </span>

                            </div>


                            {/* Refresh */}

                            <button
                                type="button"
                                onClick={() =>
                                    fetchDashboard(true)
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

                    </div>


                    {/* Summary Cards */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">


                        {/* Total Bookings */}

                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition">

                            <div className="flex items-center justify-between">

                                <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">

                                    <Utensils
                                        size={22}
                                        className="text-indigo-600"
                                    />

                                </div>

                                <TrendingUp
                                    size={19}
                                    className="text-green-500"
                                />

                            </div>

                            <p className="mt-5 text-sm text-gray-500">
                                Today's Bookings
                            </p>

                            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
                                {summary.total_bookings}
                            </h3>

                        </div>


                        {/* Served */}

                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition">

                            <div className="flex items-center justify-between">

                                <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">

                                    <CheckCircle2
                                        size={22}
                                        className="text-green-600"
                                    />

                                </div>

                                <span className="text-xs font-bold text-green-600">
                                    {servedPercentage}%
                                </span>

                            </div>

                            <p className="mt-5 text-sm text-gray-500">
                                Meals Served
                            </p>

                            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
                                {summary.served}
                            </h3>

                        </div>


                        {/* Pending */}

                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition">

                            <div className="flex items-center justify-between">

                                <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">

                                    <Clock3
                                        size={22}
                                        className="text-orange-600"
                                    />

                                </div>

                                <span className="text-xs font-bold text-orange-600">
                                    Pending
                                </span>

                            </div>

                            <p className="mt-5 text-sm text-gray-500">
                                Pending Meals
                            </p>

                            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
                                {summary.pending}
                            </h3>

                        </div>


                        {/* Employees */}

                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition">

                            <div className="flex items-center justify-between">

                                <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center">

                                    <Users
                                        size={22}
                                        className="text-purple-600"
                                    />

                                </div>

                                <span className="text-xs font-bold text-purple-600">
                                    Employees
                                </span>

                            </div>

                            <p className="mt-5 text-sm text-gray-500">
                                Total Employees
                            </p>

                            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
                                {summary.total_employees}
                            </h3>

                        </div>

                    </div>


                    {/* Second Row */}

                    <div className="grid lg:grid-cols-3 gap-6 mt-6">


                        {/* Meal Statistics */}

                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

                            <div className="flex items-center justify-between">

                                <div>

                                    <h3 className="text-xl font-bold text-gray-800">
                                        Today's Meal Overview
                                    </h3>

                                    <p className="text-sm text-gray-400 mt-1">
                                        Meal type wise booking and serving status
                                    </p>

                                </div>

                                <Utensils
                                    size={21}
                                    className="text-indigo-500"
                                />

                            </div>


                            {mealStatistics.length === 0 ? (

                                <div className="py-12 text-center">

                                    <AlertCircle
                                        size={30}
                                        className="mx-auto text-gray-300"
                                    />

                                    <p className="mt-3 text-sm text-gray-500">
                                        No meal bookings today.
                                    </p>

                                </div>

                            ) : (

                                <div className="mt-7 space-y-6">

                                    {mealStatistics.map(
                                        (meal) => {

                                            const percentage =
                                                Number(meal.total) > 0
                                                    ? Math.round(
                                                        (
                                                            Number(meal.served) /
                                                            Number(meal.total)
                                                        ) * 100
                                                    )
                                                    : 0;

                                            return (

                                                <div
                                                    key={
                                                        meal.meal_type_id
                                                    }
                                                >

                                                    <div className="flex items-center justify-between mb-2">

                                                        <div className="flex items-center gap-2">

                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">

                                                                <Coffee
                                                                    size={15}
                                                                    className="text-indigo-600"
                                                                />

                                                            </div>

                                                            <span className="font-semibold text-gray-700">
                                                                {
                                                                    meal.meal_type?.name ||
                                                                    "Meal"
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="text-right">

                                                            <span className="text-sm font-bold text-gray-700">
                                                                {
                                                                    meal.served
                                                                }{" "}
                                                                /{" "}
                                                                {
                                                                    meal.total
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                                                        <div
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                                        />

                                                    </div>


                                                    <div className="flex items-center justify-between mt-2 text-xs">

                                                        <span className="text-green-600">
                                                            Served:{" "}
                                                            {
                                                                meal.served
                                                            }
                                                        </span>

                                                        <span className="text-orange-500">
                                                            Pending:{" "}
                                                            {
                                                                meal.pending
                                                            }
                                                        </span>

                                                        <span className="text-red-500">
                                                            Cancelled:{" "}
                                                            {
                                                                meal.cancelled
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            )}

                        </div>


                        {/* Financial Summary */}

                        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 shadow-lg">

                            <div className="flex items-center justify-between">

                                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">

                                    <IndianRupee
                                        size={22}
                                    />

                                </div>

                                <TrendingUp
                                    size={20}
                                    className="text-green-300"
                                />

                            </div>


                            <p className="text-indigo-100 text-sm mt-6">
                                Today's Meal Cost
                            </p>


                            <h3 className="text-3xl font-extrabold mt-2">
                                {formatCurrency(
                                    Number(
                                        summary.total_amount
                                    )
                                )}
                            </h3>


                            <div className="mt-7 pt-5 border-t border-white/15">

                                <div className="flex justify-between text-sm">

                                    <span className="text-indigo-100">
                                        Total Bookings
                                    </span>

                                    <span className="font-bold">
                                        {
                                            summary.total_bookings
                                        }
                                    </span>

                                </div>


                                <div className="flex justify-between text-sm mt-3">

                                    <span className="text-indigo-100">
                                        Served
                                    </span>

                                    <span className="font-bold">
                                        {
                                            summary.served
                                        }
                                    </span>

                                </div>


                                <div className="flex justify-between text-sm mt-3">

                                    <span className="text-indigo-100">
                                        Cancelled
                                    </span>

                                    <span className="font-bold">
                                        {
                                            summary.cancelled
                                        }
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* Today's Menu */}

                    <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                        <div className="px-6 py-5 border-b border-gray-100">

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">

                                        <Utensils
                                            size={21}
                                            className="text-white"
                                        />

                                    </div>

                                    <div>

                                        <h3 className="text-xl font-bold text-gray-800">
                                            Today's Menu
                                        </h3>

                                        <p className="text-sm text-gray-400">
                                            Today's scheduled meal items
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="p-6">

                            {menus.length === 0 ? (

                                <div className="py-10 text-center">

                                    <Utensils
                                        size={32}
                                        className="mx-auto text-gray-300"
                                    />

                                    <p className="mt-3 font-semibold text-gray-600">
                                        No menu available today
                                    </p>

                                </div>

                            ) : (

                                <div className="space-y-7">

                                    {menus.map(
                                        (menu) => {

                                            const mainItems =
                                                menu.items?.filter(
                                                    item =>
                                                        item.item_type ===
                                                        "Main"
                                                ) || [];

                                            const alternatives =
                                                menu.items?.filter(
                                                    item =>
                                                        item.item_type ===
                                                        "Alternative"
                                                ) || [];


                                            return (

                                                <div
                                                    key={
                                                        menu.id
                                                    }
                                                >

                                                    <div className="flex items-center gap-3 mb-4">

                                                        <div className="h-px flex-1 bg-gray-100" />

                                                        <div className="flex items-center gap-2">

                                                            <span className="font-bold text-gray-700">
                                                                {
                                                                    menu.meal_type?.name
                                                                }
                                                            </span>

                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                                                {
                                                                    mainItems.length
                                                                }{" "}
                                                                Items
                                                            </span>

                                                        </div>

                                                        <div className="h-px flex-1 bg-gray-100" />

                                                    </div>


                                                    <div className="flex flex-wrap gap-3">

                                                        {mainItems.map(
                                                            mainItem => {

                                                                const itemAlternatives =
                                                                    alternatives.filter(
                                                                        alternative =>
                                                                            Number(
                                                                                alternative.alternative_of
                                                                            ) ===
                                                                            Number(
                                                                                mainItem.id
                                                                            )
                                                                    );

                                                                return (

                                                                    <div
                                                                        key={
                                                                            mainItem.id
                                                                        }
                                                                        className="flex items-center gap-2"
                                                                    >

                                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-sm">

                                                                            <Utensils
                                                                                size={13}
                                                                            />

                                                                            {
                                                                                mainItem.item_name
                                                                            }

                                                                        </span>


                                                                        {itemAlternatives.map(
                                                                            alternative => (

                                                                                <span
                                                                                    key={
                                                                                        alternative.id
                                                                                    }
                                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"
                                                                                >

                                                                                    <Sparkles
                                                                                        size={11}
                                                                                    />

                                                                                    {
                                                                                        alternative.item_name
                                                                                    }

                                                                                </span>

                                                                            )
                                                                        )}

                                                                    </div>

                                                                );

                                                            }
                                                        )}

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            )}

                        </div>

                    </div>


                    {/* Recent Bookings */}

                    <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

                            <div>

                                <h3 className="text-xl font-bold text-gray-800">
                                    Recent Meal Bookings
                                </h3>

                                <p className="text-sm text-gray-400 mt-1">
                                    Latest meal booking activities
                                </p>

                            </div>

                            <Users
                                size={21}
                                className="text-indigo-500"
                            />

                        </div>


                        {recentBookings.length === 0 ? (

                            <div className="py-12 text-center">

                                <Users
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    No bookings today.
                                </p>

                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full">

                                    <thead>

                                        <tr className="bg-gray-50 text-left">

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Employee
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Meal
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Amount
                                            </th>

                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                                                Status
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-gray-100">

                                        {recentBookings.map(
                                            booking => (

                                                <tr
                                                    key={
                                                        booking.id
                                                    }
                                                    className="hover:bg-gray-50 transition"
                                                >

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">

                                                                <Users
                                                                    size={15}
                                                                    className="text-indigo-600"
                                                                />

                                                            </div>

                                                            <div>

                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {
                                                                        getEmployeeName(
                                                                            booking
                                                                        )
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-gray-400">
                                                                    ID:{" "}
                                                                    {
                                                                        booking.employee_id
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="text-sm font-semibold text-gray-700">

                                                            {
                                                                booking.meal_type?.name ||
                                                                "Meal"
                                                            }

                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="text-sm font-semibold text-gray-700">

                                                            {formatCurrency(
                                                                Number(
                                                                    booking.total_amount
                                                                )
                                                            )}

                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                                                                booking.status
                                                            )}`}
                                                        >

                                                            {booking.status ===
                                                            "Served" ? (

                                                                <CheckCircle2
                                                                    size={13}
                                                                />

                                                            ) : booking.status ===
                                                              "Cancelled" ? (

                                                                <XCircle
                                                                    size={13}
                                                                />

                                                            ) : (

                                                                <Clock3
                                                                    size={13}
                                                                />

                                                            )}

                                                            {
                                                                booking.status
                                                            }

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>


                    {/* Footer Stats */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pb-6">


                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">

                            <div className="flex items-center gap-3">

                                <CheckCircle2
                                    className="text-green-600"
                                    size={20}
                                />

                                <div>

                                    <p className="text-xs text-green-600 font-semibold">
                                        Served
                                    </p>

                                    <p className="text-xl font-bold text-green-700">
                                        {
                                            summary.served
                                        }
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">

                            <div className="flex items-center gap-3">

                                <Clock3
                                    className="text-orange-600"
                                    size={20}
                                />

                                <div>

                                    <p className="text-xs text-orange-600 font-semibold">
                                        Pending
                                    </p>

                                    <p className="text-xl font-bold text-orange-700">
                                        {
                                            summary.pending
                                        }
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">

                            <div className="flex items-center gap-3">

                                <XCircle
                                    className="text-red-600"
                                    size={20}
                                />

                                <div>

                                    <p className="text-xs text-red-600 font-semibold">
                                        Cancelled
                                    </p>

                                    <p className="text-xl font-bold text-red-700">
                                        {
                                            summary.cancelled
                                        }
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </main>

        </div>

    );

}