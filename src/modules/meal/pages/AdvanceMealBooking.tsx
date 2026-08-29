import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Coffee,
    Loader2,
    Lock,
    RefreshCw,
    Utensils,
    X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";


// ============================================================
// TYPES
// ============================================================

interface MealType {
    id: number;
    name: string;
    booking_cutoff_time: string | null;
}

interface ExistingBooking {
    id: number;
    employee_id: number;
    meal_type_id: number;
    booking_date: string;
    status: "booked" | "cancelled";
}

interface BookingItem {
    booking_date: string;
    meal_type_id: number;
    status: "booked" | "cancelled";
}

interface DateItem {
    date: string;
    day: string;
    dayNumber: number;
    month: string;
    isToday: boolean;
}


// ============================================================
// HELPERS
// ============================================================

const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const parseDate = (date: string) => {
    const [year, month, day] = date
        .split("-")
        .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
};


const getDatesBetween = (
    from: string,
    to: string
): DateItem[] => {

    if (!from || !to) {
        return [];
    }

    const start = parseDate(from);
    const end = parseDate(to);

    const dates: DateItem[] = [];

    const current = new Date(start);

    const today = formatDate(new Date());

    while (current <= end) {

        const dateString =
            formatDate(current);

        dates.push({
            date: dateString,

            day: current.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                }
            ),

            dayNumber: current.getDate(),

            month: current.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                }
            ),

            isToday:
                dateString === today,
        });

        current.setDate(
            current.getDate() + 1
        );
    }

    return dates;
};


const formatCutoff = (
    value: string | null
) => {

    if (!value) {
        return "No cutoff";
    }

    const date = new Date(
        `1970-01-01T${value}`
    );

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
};


// ============================================================
// COMPONENT
// ============================================================

export default function AdvanceMealBooking() {

    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [mealTypes, setMealTypes] =
        useState<MealType[]>([]);

    const [bookings, setBookings] =
        useState<BookingItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(0);


    // ========================================================
    // DATE RANGE
    // ========================================================

    const dates = useMemo(() => {
        return getDatesBetween(
            fromDate,
            toDate
        );
    }, [fromDate, toDate]);


    // ========================================================
    // LOAD
    // ========================================================

    const loadBookings = async () => {

        if (!fromDate || !toDate) {
            return;
        }

        try {

            setLoading(true);
            setError("");
            setMessage("");

            const response = await api.get(
                "/advance-meal-bookings",
                {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                    },
                }
            );

            setMealTypes(
                response.data.meal_types || []
            );

            const existing =
                response.data.bookings || [];

            const formatted: BookingItem[] =
                existing.map(
                    (item: ExistingBooking) => ({
                        booking_date:
                            item.booking_date.substring(
                                0,
                                10
                            ),

                        meal_type_id:
                            item.meal_type_id,

                        status:
                            item.status,
                    })
                );

            setBookings(formatted);

        } catch (err: any) {

            setError(
                err.response?.data?.message ||
                "Unable to load booking information."
            );

        } finally {

            setLoading(false);

        }
    };


    // ========================================================
    // INITIAL DATE
    // ========================================================

    useEffect(() => {

        const today =
            new Date();

        const future =
            new Date();

        future.setDate(
            future.getDate() + 6
        );

        setFromDate(
            formatDate(today)
        );

        setToDate(
            formatDate(future)
        );

    }, []);


    // ========================================================
    // AUTO LOAD
    // ========================================================

    useEffect(() => {

        if (
            fromDate &&
            toDate
        ) {
            loadBookings();
        }

    }, [fromDate, toDate]);


    // ========================================================
    // CHECK BOOKING
    // ========================================================

    const getBooking = (
        date: string,
        mealTypeId: number
    ) => {

        return bookings.find(
            item =>
                item.booking_date === date &&
                item.meal_type_id ===
                    mealTypeId
        );

    };


    // ========================================================
    // CHECK CUTOFF
    // ========================================================

    const isCutoffPassed = (
        date: string,
        mealType: MealType
    ) => {

        if (
            !mealType.booking_cutoff_time
        ) {
            return false;
        }

        const cutoff =
            new Date(
                `${date}T${mealType.booking_cutoff_time}`
            );

        return new Date() >= cutoff;
    };


    // ========================================================
    // TOGGLE BOOKING
    // ========================================================

    const toggleBooking = (
        date: string,
        mealType: MealType
    ) => {

        if (
            isCutoffPassed(
                date,
                mealType
            )
        ) {
            return;
        }

        setMessage("");
        setError("");

        const existing =
            getBooking(
                date,
                mealType.id
            );

        if (existing) {

            setBookings(prev =>
                prev.map(item =>
                    item.booking_date ===
                        date &&
                    item.meal_type_id ===
                        mealType.id
                        ? {
                            ...item,
                            status:
                                item.status ===
                                "booked"
                                    ? "cancelled"
                                    : "booked",
                        }
                        : item
                )
            );

            return;
        }

        setBookings(prev => [
            ...prev,

            {
                booking_date: date,
                meal_type_id: mealType.id,
                status: "booked",
            },
        ]);

    };


    // ========================================================
    // SAVE
    // ========================================================

    const saveBookings = async () => {

        if (!bookings.length) {

            setError(
                "Please select at least one meal."
            );

            return;
        }

        try {

            setSaving(true);
            setError("");
            setMessage("");

            await api.post(
                "/advance-meal-bookings",
                {
                    bookings,
                }
            );

            setMessage(
                "Advance meal booking updated successfully."
            );

            await loadBookings();

        } catch (err: any) {

            const validation =
                err.response?.data?.errors;

            if (validation?.booking?.[0]) {

                setError(
                    validation.booking[0]
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to update booking."
                );
            }

        } finally {

            setSaving(false);

        }
    };


    // ========================================================
    // SELECT ALL
    // ========================================================

    const selectAll = () => {

        const newBookings: BookingItem[] = [];

        dates.forEach(date => {

            mealTypes.forEach(meal => {

                if (
                    !isCutoffPassed(
                        date.date,
                        meal
                    )
                ) {

                    newBookings.push({
                        booking_date:
                            date.date,

                        meal_type_id:
                            meal.id,

                        status:
                            "booked",
                    });

                }

            });

        });

        setBookings(newBookings);

    };


    // ========================================================
    // CLEAR ALL
    // ========================================================

    const clearAll = () => {

        setBookings([]);

    };


    // ========================================================
    // SUMMARY
    // ========================================================

    const activeBookingCount =
        bookings.filter(
            item =>
                item.status === "booked"
        ).length;


    // ========================================================
    // ICON
    // ========================================================

    const mealIcon = (
        name: string
    ) => {

        const lower =
            name.toLowerCase();

        if (
            lower.includes("breakfast")
        ) {
            return "🍳";
        }

        if (
            lower.includes("lunch")
        ) {
            return "🍛";
        }

        if (
            lower.includes("dinner")
        ) {
            return "🍲";
        }

        return "🍽️";
    };


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">

            <SideNav
                open={openSidebar}
                onClose={() =>
                    setOpenSidebar(false)
                }
            />

            <div className="flex-1 min-w-0">

                <TopNav
                    onMenuClick={() =>
                        setOpenSidebar(true)
                    }
                />


                <main className="p-4 sm:p-6 lg:p-8">

                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div
                        className="
                            max-w-7xl
                            mx-auto
                            mb-7
                        "
                    >

                        <div
                            className="
                                flex
                                flex-col
                                lg:flex-row
                                lg:items-end
                                lg:justify-between
                                gap-5
                            "
                        >

                            <div>

                                <div
                                    className="
                                        inline-flex
                                        items-center
                                        gap-2
                                        px-3
                                        py-1.5
                                        rounded-full
                                        bg-orange-50
                                        text-orange-600
                                        text-xs
                                        font-bold
                                        mb-3
                                    "
                                >

                                    <CalendarDays
                                        size={14}
                                    />

                                    ADVANCE BOOKING

                                </div>

                                <h1
                                    className="
                                        text-3xl
                                        sm:text-4xl
                                        font-black
                                        text-gray-900
                                    "
                                >
                                    Plan your meals
                                    <span
                                        className="
                                            text-orange-500
                                            ml-2
                                        "
                                    >
                                        ahead.
                                    </span>
                                </h1>

                                <p
                                    className="
                                        mt-2
                                        text-gray-500
                                    "
                                >
                                    Select your meal dates
                                    before the booking
                                    cutoff time.
                                </p>

                            </div>


                            {/* SUMMARY */}

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        px-5
                                        py-3
                                        bg-white
                                        rounded-2xl
                                        border
                                        border-gray-100
                                        shadow-sm
                                    "
                                >

                                    <p
                                        className="
                                            text-xs
                                            text-gray-400
                                            font-medium
                                        "
                                    >
                                        Selected meals
                                    </p>

                                    <p
                                        className="
                                            text-2xl
                                            font-black
                                            text-gray-900
                                        "
                                    >
                                        {activeBookingCount}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        DATE FILTER
                    ================================================== */}

                    <div
                        className="
                            max-w-7xl
                            mx-auto
                            bg-white
                            rounded-[28px]
                            border
                            border-gray-100
                            shadow-sm
                            p-5
                            sm:p-6
                            mb-6
                        "
                    >

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                xl:grid-cols-[1fr_1fr_auto]
                                gap-4
                                items-end
                            "
                        >

                            <div>

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-bold
                                        text-gray-700
                                        mb-2
                                    "
                                >
                                    From date
                                </label>

                                <div className="relative">

                                    <CalendarDays
                                        size={19}
                                        className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-orange-400
                                        "
                                    />

                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={e =>
                                            setFromDate(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            pl-12
                                            pr-4
                                            py-3.5
                                            rounded-2xl
                                            border
                                            border-gray-200
                                            bg-gray-50
                                            outline-none
                                            focus:bg-white
                                            focus:border-orange-400
                                            focus:ring-4
                                            focus:ring-orange-100
                                        "
                                    />

                                </div>

                            </div>


                            <div>

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-bold
                                        text-gray-700
                                        mb-2
                                    "
                                >
                                    To date
                                </label>

                                <div className="relative">

                                    <CalendarDays
                                        size={19}
                                        className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-orange-400
                                        "
                                    />

                                    <input
                                        type="date"
                                        value={toDate}
                                        min={fromDate}
                                        onChange={e =>
                                            setToDate(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            pl-12
                                            pr-4
                                            py-3.5
                                            rounded-2xl
                                            border
                                            border-gray-200
                                            bg-gray-50
                                            outline-none
                                            focus:bg-white
                                            focus:border-orange-400
                                            focus:ring-4
                                            focus:ring-orange-100
                                        "
                                    />

                                </div>

                            </div>


                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                <button
                                    onClick={loadBookings}
                                    disabled={loading}
                                    className="
                                        flex-1
                                        xl:flex-none
                                        px-5
                                        py-3.5
                                        rounded-2xl
                                        bg-gray-900
                                        text-white
                                        font-bold
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        hover:bg-gray-800
                                        transition
                                    "
                                >

                                    {loading ? (
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <RefreshCw
                                            size={18}
                                        />
                                    )}

                                    Refresh

                                </button>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        MESSAGE
                    ================================================== */}

                    {message && (
                        <div
                            className="
                                max-w-7xl
                                mx-auto
                                mb-5
                                p-4
                                rounded-2xl
                                bg-green-50
                                border
                                border-green-100
                                text-green-600
                                font-medium
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <Check size={18} />

                            {message}

                        </div>
                    )}


                    {error && (
                        <div
                            className="
                                max-w-7xl
                                mx-auto
                                mb-5
                                p-4
                                rounded-2xl
                                bg-red-50
                                border
                                border-red-100
                                text-red-600
                                font-medium
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <X size={18} />

                            {error}

                        </div>
                    )}


                    {/* ==================================================
                        TOOLBAR
                    ================================================== */}

                    {dates.length > 0 && (
                        <div
                            className="
                                max-w-7xl
                                mx-auto
                                flex
                                flex-wrap
                                items-center
                                justify-between
                                gap-3
                                mb-5
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    text-gray-500
                                "
                            >

                                <Clock3
                                    size={17}
                                />

                                Booking is available
                                before each meal's
                                cutoff time.

                            </div>


                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                <button
                                    onClick={selectAll}
                                    className="
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        bg-orange-50
                                        text-orange-600
                                        font-bold
                                        text-sm
                                        hover:bg-orange-100
                                        transition
                                    "
                                >
                                    Select all
                                </button>

                                <button
                                    onClick={clearAll}
                                    className="
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        bg-gray-100
                                        text-gray-600
                                        font-bold
                                        text-sm
                                        hover:bg-gray-200
                                        transition
                                    "
                                >
                                    Clear
                                </button>

                            </div>

                        </div>
                    )}


                    {/* ==================================================
                        BOOKING GRID
                    ================================================== */}

                    <div
                        className="
                            max-w-7xl
                            mx-auto
                        "
                    >

                        {loading ? (

                            <div
                                className="
                                    bg-white
                                    rounded-[28px]
                                    p-16
                                    text-center
                                    border
                                    border-gray-100
                                "
                            >

                                <Loader2
                                    size={36}
                                    className="
                                        mx-auto
                                        animate-spin
                                        text-orange-500
                                    "
                                />

                                <p
                                    className="
                                        mt-4
                                        text-gray-500
                                    "
                                >
                                    Loading booking calendar...
                                </p>

                            </div>

                        ) : dates.length === 0 ? (

                            <div
                                className="
                                    bg-white
                                    rounded-[28px]
                                    p-16
                                    text-center
                                    border
                                    border-gray-100
                                "
                            >

                                <CalendarDays
                                    size={42}
                                    className="
                                        mx-auto
                                        text-gray-300
                                    "
                                />

                                <h3
                                    className="
                                        mt-4
                                        font-black
                                        text-gray-800
                                    "
                                >
                                    Select a date range
                                </h3>

                            </div>

                        ) : (

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    xl:grid-cols-3
                                    gap-5
                                "
                            >

                                {dates.map(date => (

                                    <div
                                        key={date.date}
                                        className="
                                            bg-white
                                            rounded-[26px]
                                            border
                                            border-gray-100
                                            shadow-sm
                                            overflow-hidden
                                            transition
                                            hover:shadow-lg
                                        "
                                    >

                                        {/* DATE HEADER */}

                                        <div
                                            className={`
                                                p-5
                                                border-b
                                                border-gray-100
                                                ${
                                                    date.isToday
                                                        ? "bg-orange-50"
                                                        : "bg-gray-50/70"
                                                }
                                            `}
                                        >

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                "
                                            >

                                                <div>

                                                    <p
                                                        className="
                                                            text-xs
                                                            uppercase
                                                            tracking-wider
                                                            font-bold
                                                            text-gray-400
                                                        "
                                                    >
                                                        {date.day}
                                                    </p>

                                                    <div
                                                        className="
                                                            flex
                                                            items-end
                                                            gap-2
                                                            mt-1
                                                        "
                                                    >

                                                        <span
                                                            className="
                                                                text-3xl
                                                                font-black
                                                                text-gray-900
                                                            "
                                                        >
                                                            {date.dayNumber}
                                                        </span>

                                                        <span
                                                            className="
                                                                text-sm
                                                                font-bold
                                                                text-gray-500
                                                                mb-1
                                                            "
                                                        >
                                                            {date.month}
                                                        </span>

                                                    </div>

                                                </div>


                                                {date.isToday && (
                                                    <span
                                                        className="
                                                            px-3
                                                            py-1.5
                                                            rounded-full
                                                            bg-orange-500
                                                            text-white
                                                            text-xs
                                                            font-black
                                                        "
                                                    >
                                                        TODAY
                                                    </span>
                                                )}

                                            </div>

                                        </div>


                                        {/* MEALS */}

                                        <div
                                            className="
                                                p-4
                                                space-y-3
                                            "
                                        >

                                            {mealTypes.map(meal => {

                                                const booking =
                                                    getBooking(
                                                        date.date,
                                                        meal.id
                                                    );

                                                const cutoffPassed =
                                                    isCutoffPassed(
                                                        date.date,
                                                        meal
                                                    );

                                                const selected =
                                                    booking?.status ===
                                                    "booked";

                                                const cancelled =
                                                    booking?.status ===
                                                    "cancelled";

                                                return (
                                                    <button
                                                        key={
                                                            meal.id
                                                        }
                                                        disabled={
                                                            cutoffPassed
                                                        }
                                                        onClick={() =>
                                                            toggleBooking(
                                                                date.date,
                                                                meal
                                                            )
                                                        }
                                                        className={`
                                                            w-full
                                                            text-left
                                                            p-4
                                                            rounded-2xl
                                                            border
                                                            transition-all
                                                            ${
                                                                cutoffPassed
                                                                    ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                                                    : selected
                                                                    ? "bg-orange-50 border-orange-300 shadow-sm"
                                                                    : "bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                                                            }
                                                        `}
                                                    >

                                                        <div
                                                            className="
                                                                flex
                                                                items-center
                                                                justify-between
                                                                gap-3
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-3
                                                                "
                                                            >

                                                                <div
                                                                    className={`
                                                                        w-11
                                                                        h-11
                                                                        rounded-xl
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                        text-xl
                                                                        ${
                                                                            selected
                                                                                ? "bg-orange-500"
                                                                                : "bg-orange-50"
                                                                        }
                                                                    `}
                                                                >
                                                                    {mealIcon(
                                                                        meal.name
                                                                    )}
                                                                </div>

                                                                <div>

                                                                    <p
                                                                        className="
                                                                            font-black
                                                                            text-gray-800
                                                                        "
                                                                    >
                                                                        {
                                                                            meal.name
                                                                        }
                                                                    </p>

                                                                    <div
                                                                        className="
                                                                            flex
                                                                            items-center
                                                                            gap-1
                                                                            text-xs
                                                                            text-gray-400
                                                                            mt-1
                                                                        "
                                                                    >

                                                                        <Clock3
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        Cutoff:

                                                                        <span>
                                                                            {formatCutoff(
                                                                                meal.booking_cutoff_time
                                                                            )}
                                                                        </span>

                                                                    </div>

                                                                </div>

                                                            </div>


                                                            {/* STATUS */}

                                                            {cutoffPassed ? (

                                                                <div
                                                                    className="
                                                                        w-9
                                                                        h-9
                                                                        rounded-full
                                                                        bg-gray-200
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                    "
                                                                >
                                                                    <Lock
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="
                                                                            text-gray-500
                                                                        "
                                                                    />
                                                                </div>

                                                            ) : selected ? (

                                                                <div
                                                                    className="
                                                                        w-9
                                                                        h-9
                                                                        rounded-full
                                                                        bg-orange-500
                                                                        text-white
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                    "
                                                                >
                                                                    <Check
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </div>

                                                            ) : cancelled ? (

                                                                <div
                                                                    className="
                                                                        w-9
                                                                        h-9
                                                                        rounded-full
                                                                        bg-gray-100
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                    "
                                                                >
                                                                    <X
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="
                                                                            text-gray-400
                                                                        "
                                                                    />
                                                                </div>

                                                            ) : (

                                                                <div
                                                                    className="
                                                                        w-9
                                                                        h-9
                                                                        rounded-full
                                                                        border-2
                                                                        border-gray-200
                                                                    "
                                                                />

                                                            )}

                                                        </div>


                                                        {cutoffPassed && (
                                                            <p
                                                                className="
                                                                    mt-3
                                                                    text-[11px]
                                                                    font-bold
                                                                    text-gray-400
                                                                    flex
                                                                    items-center
                                                                    gap-1
                                                                "
                                                            >
                                                                <Lock
                                                                    size={
                                                                        11
                                                                    }
                                                                />

                                                                Booking
                                                                closed
                                                            </p>
                                                        )}

                                                    </button>
                                                );

                                            })}

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>


                    {/* ==================================================
                        SAVE BAR
                    ================================================== */}

                    {dates.length > 0 && (
                        <div
                            className="
                                max-w-7xl
                                mx-auto
                                mt-7
                                sticky
                                bottom-4
                                z-30
                            "
                        >

                            <div
                                className="
                                    bg-gray-950
                                    text-white
                                    rounded-[24px]
                                    p-4
                                    sm:p-5
                                    shadow-[0_20px_50px_rgba(0,0,0,.2)]
                                    flex
                                    flex-col
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    gap-4
                                "
                            >

                                <div>

                                    <p
                                        className="
                                            text-xs
                                            text-gray-400
                                            font-bold
                                            uppercase
                                            tracking-wider
                                        "
                                    >
                                        Booking summary
                                    </p>

                                    <p
                                        className="
                                            font-black
                                            text-lg
                                            mt-1
                                        "
                                    >
                                        {activeBookingCount} meal
                                        {activeBookingCount !== 1
                                            ? "s"
                                            : ""}{" "}
                                        selected
                                    </p>

                                </div>


                                <button
                                    onClick={
                                        saveBookings
                                    }
                                    disabled={saving}
                                    className="
                                        px-7
                                        py-3.5
                                        rounded-2xl
                                        bg-orange-500
                                        hover:bg-orange-400
                                        text-white
                                        font-black
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        transition
                                        disabled:opacity-60
                                    "
                                >

                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="
                                                    animate-spin
                                                "
                                            />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check
                                                size={18}
                                            />

                                            Save Booking
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>
                    )}

                </main>

            </div>

        </div>
    );
}