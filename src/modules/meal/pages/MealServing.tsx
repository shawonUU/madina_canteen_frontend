import {
    CalendarDays,
    Check,
    Clock3,
    RefreshCw,
    Search,
    Utensils,
    User,
    XCircle,
    AlertCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";

import api from "../../../services/api";


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Employee {
    id: number;
    name?: string;
    employee_name?: string;
    first_name?: string;
    last_name?: string;
    employee_code?: string;
}

interface MealType {
    id: number;
    name: string;
    description?: string;
}

interface MenuItem {
    id: number;
    Item_name?: string;
    item_name?: string;
    item_type: "Main" | "Alternative";
    alternative_of: number | null;
}

interface BookingItem {
    id: number;
    menu_item_id: number;
    menuItem?: MenuItem;
}

interface Booking {
    id: number;
    employee_id: number;
    meal_type_id: number;
    meal_rate: string | number;
    meal_date: string;
    quantity: number;
    total_amount: string | number;
    menu_id: number | null;
    remarks?: string | null;

    status:
        | "Selected"
        | "Served"
        | "Cancelled";

    employee?: Employee;
    mealType?: MealType;
    items?: BookingItem[];
}


// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function MealServing() {

    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [bookings, setBookings] =
        useState<Booking[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [servingId, setServingId] =
        useState<number | null>(null);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<
            "All" | "Selected" | "Served" | "Cancelled"
        >("All");


    // -------------------------------------------------------------------------
    // Fetch Today's Bookings
    // -------------------------------------------------------------------------

    const fetchBookings = async (
        showRefresh = false
    ) => {

        try {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response =
                await api.get(
                    "/todays-booked-meals"
                );

            const data: Booking[] =
                response.data?.data || [];

            setBookings(data);

        } catch (error) {

            console.error(
                "Failed to load today's booked meals:",
                error
            );

            alert(
                "Failed to load today's booked meals."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    useEffect(() => {

        fetchBookings();

    }, []);


    // -------------------------------------------------------------------------
    // Employee Name
    // -------------------------------------------------------------------------

    const getEmployeeName = (
        booking: Booking
    ) => {

        const employee =
            booking.employee;

        if (!employee) {
            return `Employee #${booking.employee_id}`;
        }

        if (employee.name) {
            return employee.name;
        }

        if (employee.employee_name) {
            return employee.employee_name;
        }

        const fullName = [
            employee.first_name,
            employee.last_name,
        ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
            return fullName;
        }

        return `Employee #${booking.employee_id}`;
    };


    // -------------------------------------------------------------------------
    // Employee Code
    // -------------------------------------------------------------------------

    const getEmployeeCode = (
        booking: Booking
    ) => {

        return (
            booking.employee?.employee_code ||
            `ID: ${booking.employee_id}`
        );

    };


    // -------------------------------------------------------------------------
    // Item Name
    // -------------------------------------------------------------------------

    const getItemName = (
        item: BookingItem
    ) => {

        return (
            item.menu_item?.item_name ||
            `Item #${item.menu_item_id}`
        );

    };


    // -------------------------------------------------------------------------
    // Serve Meal
    // -------------------------------------------------------------------------

    const handleServeMeal = async (
        booking: Booking
    ) => {

        if (
            booking.status !== "Selected"
        ) {
            return;
        }


        const employeeName =
            getEmployeeName(booking);


        const confirmed =
            window.confirm(
                `Serve meal to ${employeeName}?`
            );


        if (!confirmed) {
            return;
        }


        setServingId(booking.id);


        try {

            const response =
                await api.put(
                    `/meal-bookings/${booking.id}/serve`
                );


            const updatedBooking:
                Booking =
                response.data?.data;


            setBookings((prev) =>
                prev.map((item) =>
                    item.id === booking.id
                        ? {
                            ...item,
                            ...updatedBooking,
                            status: "Served",
                        }
                        : item
                )
            );


            alert(
                response.data?.message ||
                "Meal served successfully."
            );

        } catch (error: any) {

            console.error(
                "Failed to serve meal:",
                error
            );


            const validationErrors =
                error?.response?.data?.errors;


            if (
                validationErrors
            ) {

                const firstError =
                    Object.values(
                        validationErrors
                    )?.[0];


                if (
                    Array.isArray(
                        firstError
                    )
                ) {

                    alert(
                        firstError[0]
                    );

                    return;
                }
            }


            alert(
                error?.response?.data?.message ||
                "Failed to serve meal."
            );

        } finally {

            setServingId(null);

        }
    };


    // -------------------------------------------------------------------------
    // Filter Bookings
    // -------------------------------------------------------------------------

    const filteredBookings =
        bookings.filter((booking) => {

            // Status filter

            if (
                statusFilter !== "All" &&
                booking.status !== statusFilter
            ) {
                return false;
            }


            // Search

            if (!search.trim()) {
                return true;
            }


            const searchText =
                search
                    .trim()
                    .toLowerCase();


            const employeeName =
                getEmployeeName(
                    booking
                ).toLowerCase();


            const employeeCode =
                getEmployeeCode(
                    booking
                ).toLowerCase();


            const mealType =
                booking.mealType?.name
                    ?.toLowerCase() || "";


            const itemNames =
                booking.items
                    ?.map(
                        (item) =>
                            getItemName(
                                item
                            )
                    )
                    .join(" ")
                    .toLowerCase() || "";


            return (
                employeeName.includes(
                    searchText
                ) ||
                employeeCode.includes(
                    searchText
                ) ||
                mealType.includes(
                    searchText
                ) ||
                itemNames.includes(
                    searchText
                )
            );

        });


    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    const totalBookings =
        bookings.length;

    const selectedCount =
        bookings.filter(
            (booking) =>
                booking.status ===
                "Selected"
        ).length;

    const servedCount =
        bookings.filter(
            (booking) =>
                booking.status ===
                "Served"
        ).length;

    const cancelledCount =
        bookings.filter(
            (booking) =>
                booking.status ===
                "Cancelled"
        ).length;


    // -------------------------------------------------------------------------
    // Date
    // -------------------------------------------------------------------------

    const today =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );


    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">


            {/* -----------------------------------------------------------------
                Sidebar
            ------------------------------------------------------------------ */}

            <SideNav
                openSidebar={
                    openSidebar
                }
                setOpenSidebar={
                    setOpenSidebar
                }
            />


            {/* -----------------------------------------------------------------
                Main
            ------------------------------------------------------------------ */}

            <main className="flex-1 min-w-0">


                {/* -----------------------------------------------------------------
                    Top Navigation
                ------------------------------------------------------------------ */}

                <TopNav
                    openSidebar={
                        openSidebar
                    }
                    setOpenSidebar={
                        setOpenSidebar
                    }
                />


                {/* -----------------------------------------------------------------
                    Content
                ------------------------------------------------------------------ */}

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">


                    {/* -----------------------------------------------------------------
                        Header
                    ------------------------------------------------------------------ */}

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">


                        <div>

                            <div className="flex items-center gap-3">

                                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">

                                    <Utensils
                                        size={22}
                                        className="text-indigo-600"
                                    />

                                </div>


                                <div>

                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">

                                        Meal Serving

                                    </h2>


                                    <p className="text-gray-500 mt-1">

                                        Manage today's booked and served meals

                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* Date */}

                        <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2.5">

                            <CalendarDays
                                size={18}
                                className="text-indigo-600"
                            />

                            <span className="text-sm font-semibold text-gray-700">

                                {today}

                            </span>

                        </div>

                    </div>


                    {/* -----------------------------------------------------------------
                        Statistics
                    ------------------------------------------------------------------ */}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">


                        {/* Total */}

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-gray-400 font-medium">
                                        Total Bookings
                                    </p>

                                    <p className="text-2xl font-bold text-gray-800 mt-1">
                                        {totalBookings}
                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

                                    <Utensils
                                        size={18}
                                        className="text-indigo-600"
                                    />

                                </div>

                            </div>

                        </div>


                        {/* Pending */}

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-gray-400 font-medium">
                                        Pending
                                    </p>

                                    <p className="text-2xl font-bold text-orange-600 mt-1">
                                        {selectedCount}
                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">

                                    <Clock3
                                        size={18}
                                        className="text-orange-500"
                                    />

                                </div>

                            </div>

                        </div>


                        {/* Served */}

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-gray-400 font-medium">
                                        Served
                                    </p>

                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {servedCount}
                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">

                                    <Check
                                        size={18}
                                        className="text-green-600"
                                    />

                                </div>

                            </div>

                        </div>


                        {/* Cancelled */}

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-gray-400 font-medium">
                                        Cancelled
                                    </p>

                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {cancelledCount}
                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">

                                    <XCircle
                                        size={18}
                                        className="text-red-500"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* -----------------------------------------------------------------
                        Info
                    ------------------------------------------------------------------ */}

                    <div className="mb-6 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">

                        <AlertCircle
                            size={18}
                            className="text-indigo-600 mt-0.5 shrink-0"
                        />

                        <div>

                            <p className="text-sm font-semibold text-indigo-800">

                                Meal Serving

                            </p>

                            <p className="text-xs text-indigo-600 mt-1">

                                After handing the meal to an employee,
                                click <b>Serve</b> to mark the booking as served.

                            </p>

                        </div>

                    </div>


                    {/* -----------------------------------------------------------------
                        Search + Filter
                    ------------------------------------------------------------------ */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-5">

                        <div className="flex flex-col lg:flex-row gap-3">


                            {/* Search */}

                            <div className="relative flex-1">

                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search employee, ID, meal or item..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm"
                                />

                            </div>


                            {/* Status */}

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as
                                            | "All"
                                            | "Selected"
                                            | "Served"
                                            | "Cancelled"
                                    )
                                }
                                className="lg:w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >

                                <option value="All">
                                    All Status
                                </option>

                                <option value="Selected">
                                    Pending
                                </option>

                                <option value="Served">
                                    Served
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>

                            </select>


                            {/* Refresh */}

                            <button
                                type="button"
                                onClick={() =>
                                    fetchBookings(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >

                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                Refresh

                            </button>

                        </div>

                    </div>


                    {/* -----------------------------------------------------------------
                        Loading
                    ------------------------------------------------------------------ */}

                    {loading ? (

                        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">

                            <RefreshCw
                                size={28}
                                className="mx-auto animate-spin text-indigo-600"
                            />

                            <p className="text-sm text-gray-500 mt-3">

                                Loading today's meal bookings...

                            </p>

                        </div>

                    ) : filteredBookings.length === 0 ? (


                        /* -----------------------------------------------------------------
                            Empty
                        ------------------------------------------------------------------ */

                        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">

                            <Utensils
                                size={35}
                                className="mx-auto text-gray-300"
                            />

                            <h3 className="mt-4 font-semibold text-gray-700">

                                No meal bookings found

                            </h3>

                            <p className="text-sm text-gray-400 mt-1">

                                There are no bookings matching your criteria.

                            </p>

                        </div>

                    ) : (


                        /* -----------------------------------------------------------------
                            Booking Table
                        ------------------------------------------------------------------ */

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">


                            {/* Table Header */}

                            <div className="px-5 py-4 border-b border-gray-100">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h3 className="text-base font-bold text-gray-800">

                                            Today's Meal Bookings

                                        </h3>

                                        <p className="text-xs text-gray-400 mt-1">

                                            Showing{" "}
                                            {
                                                filteredBookings.length
                                            }{" "}
                                            booking
                                            {
                                                filteredBookings.length !==
                                                1
                                                    ? "s"
                                                    : ""
                                            }

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* Table */}

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[1150px]">


                                    {/* -------------------------------------------------
                                        Table Head
                                    -------------------------------------------------- */}

                                    <thead>

                                        <tr className="bg-gray-50 border-b border-gray-100">

                                            <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Meal
                                            </th>

                                            <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Selected Items
                                            </th>

                                            <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Rate
                                            </th>

                                            <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Qty
                                            </th>

                                            <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>

                                            <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>

                                            <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    {/* -------------------------------------------------
                                        Table Body
                                    -------------------------------------------------- */}

                                    <tbody className="divide-y divide-gray-100">

                                        {filteredBookings.map(
                                            (booking) => {

                                                const isServing =
                                                    servingId ===
                                                    booking.id;


                                                return (

                                                    <tr
                                                        key={
                                                            booking.id
                                                        }
                                                        className="hover:bg-gray-50/70 transition"
                                                    >


                                                        {/* -------------------------------------------------
                                                            Employee
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">

                                                                    <User
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="text-indigo-600"
                                                                    />

                                                                </div>


                                                                <div className="min-w-0">

                                                                    <p className="text-sm font-semibold text-gray-800 truncate">

                                                                        {
                                                                            getEmployeeName(
                                                                                booking
                                                                            )
                                                                        }

                                                                    </p>

                                                                    <p className="text-[11px] text-gray-400 mt-0.5">

                                                                        {
                                                                            getEmployeeCode(
                                                                                booking
                                                                            )
                                                                        }

                                                                        <span className="mx-1">
                                                                            •
                                                                        </span>

                                                                        Booking #
                                                                        {
                                                                            booking.id
                                                                        }

                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Meal
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4">

                                                            <div className="flex items-center gap-2">

                                                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">

                                                                    <Utensils
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="text-orange-500"
                                                                    />

                                                                </div>


                                                                <div>

                                                                    <p className="text-sm font-semibold text-gray-700">

                                                                        {
                                                                            booking
                                                                                .mealType
                                                                                ?.name ||
                                                                            `Meal #${booking.meal_type_id}`
                                                                        }

                                                                    </p>


                                                                    {booking.remarks && (

                                                                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-[180px] truncate">

                                                                            {
                                                                                booking.remarks
                                                                            }

                                                                        </p>

                                                                    )}

                                                                </div>

                                                            </div>

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Selected Items
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4">

                                                            {booking.items &&
                                                            booking
                                                                .items
                                                                .length >
                                                                0 ? (

                                                                <div className="flex flex-wrap gap-1.5 max-w-[300px]">

                                                                    {booking.items.map(
                                                                        (
                                                                            item
                                                                        ) => (

                                                                            <span
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[11px] font-medium text-indigo-700"
                                                                            >

                                                                                <Check
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />

                                                                                {
                                                                                    getItemName(
                                                                                        item
                                                                                    )
                                                                                }

                                                                            </span>

                                                                        )
                                                                    )}

                                                                </div>

                                                            ) : (

                                                                <span className="text-xs text-gray-400">

                                                                    No selected items

                                                                </span>

                                                            )}

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Rate
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4 text-right">

                                                            <span className="text-sm font-semibold text-gray-700">

                                                                ৳
                                                                {Number(
                                                                    booking.meal_rate
                                                                ).toFixed(
                                                                    2
                                                                )}

                                                            </span>

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Quantity
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4 text-center">

                                                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">

                                                                {
                                                                    booking.quantity
                                                                }

                                                            </span>

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Total
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4 text-right">

                                                            <span className="text-sm font-bold text-gray-800">

                                                                ৳
                                                                {Number(
                                                                    booking.total_amount
                                                                ).toFixed(
                                                                    2
                                                                )}

                                                            </span>

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Status
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4 text-center">

                                                            {booking.status ===
                                                                "Selected" && (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-semibold whitespace-nowrap">

                                                                    <Clock3
                                                                        size={
                                                                            12
                                                                        }
                                                                    />

                                                                    Pending

                                                                </span>

                                                            )}


                                                            {booking.status ===
                                                                "Served" && (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-50 text-green-600 text-[11px] font-semibold whitespace-nowrap">

                                                                    <Check
                                                                        size={
                                                                            12
                                                                        }
                                                                    />

                                                                    Served

                                                                </span>

                                                            )}


                                                            {booking.status ===
                                                                "Cancelled" && (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold whitespace-nowrap">

                                                                    <XCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                    />

                                                                    Cancelled

                                                                </span>

                                                            )}

                                                        </td>


                                                        {/* -------------------------------------------------
                                                            Action
                                                        -------------------------------------------------- */}

                                                        <td className="px-5 py-4 text-center">

                                                            {booking.status ===
                                                                "Selected" ? (

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleServeMeal(
                                                                            booking
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isServing
                                                                    }
                                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold shadow-sm hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                                                                >

                                                                    {isServing ? (

                                                                        <>

                                                                            <RefreshCw
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="animate-spin"
                                                                            />

                                                                            Serving...

                                                                        </>

                                                                    ) : (

                                                                        <>

                                                                            <Check
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />

                                                                            Serve

                                                                        </>

                                                                    )}

                                                                </button>

                                                            ) : booking.status ===
                                                                "Served" ? (

                                                                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-green-600 text-xs font-semibold whitespace-nowrap">

                                                                    <Check
                                                                        size={
                                                                            14
                                                                        }
                                                                    />

                                                                    Served

                                                                </span>

                                                            ) : (

                                                                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-500 text-xs font-semibold whitespace-nowrap">

                                                                    <XCircle
                                                                        size={
                                                                            14
                                                                        }
                                                                    />

                                                                    Cancelled

                                                                </span>

                                                            )}

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* -------------------------------------------------
                                Table Footer
                            -------------------------------------------------- */}

                            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                                    <p className="text-xs text-gray-500">

                                        Total{" "}
                                        <span className="font-semibold text-gray-700">
                                            {filteredBookings.length}
                                        </span>{" "}
                                        bookings

                                    </p>


                                    <div className="flex items-center gap-4 text-xs">

                                        <span className="flex items-center gap-1.5 text-orange-600">

                                            <span className="w-2 h-2 rounded-full bg-orange-500" />

                                            Pending:{" "}
                                            <b>
                                                {selectedCount}
                                            </b>

                                        </span>


                                        <span className="flex items-center gap-1.5 text-green-600">

                                            <span className="w-2 h-2 rounded-full bg-green-500" />

                                            Served:{" "}
                                            <b>
                                                {servedCount}
                                            </b>

                                        </span>


                                        <span className="flex items-center gap-1.5 text-red-500">

                                            <span className="w-2 h-2 rounded-full bg-red-500" />

                                            Cancelled:{" "}
                                            <b>
                                                {cancelledCount}
                                            </b>

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}