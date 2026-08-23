import {
    CalendarDays,
    Check,
    Clock3,
    Lock,
    Utensils,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";
import { getUser } from "../../../services/storage";


interface MealItem {
    id: number;
    item_name: string;
    item_type: "Main" | "Alternative";
    alternative_of: number | null;
}

interface MealType {
    id: number;
    name: string;
    description?: string;
    booking_cutoff_time?: string;
}

interface TodayMenu {
    id: number;
    menu_date: string;
    meal_type_id: number;
    meal_type: MealType;
    items: MealItem[];
}

interface BookingItem {
    main_item_id: number;
    selected_item_id: number;
}

interface Booking {
    id?: number;
    menu_id: number;
    meal_type_id: number;
    booking_date: string;
    items?: BookingItem[];
    status?: string;
}


export default function MealSelection() {

    const [openSidebar, setOpenSidebar] = useState(false);
    const [menus, setMenus] = useState<TodayMenu[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selections, setSelections] =useState< Record<number, Record<number, number>> >({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    useEffect(() => {

        const fetchMenus = async () => {
            try {
                const response = await api.get("/todays-menus");
                const menuData: TodayMenu[] = response.data?.data || [];
                setMenus(menuData);

                const initialSelections:Record<number,Record<number, number> > = {};
                menuData.forEach((menu) => {
                    initialSelections[menu.id] = {};
                    const mainItems = menu.items?.filter((item) =>item.item_type ==="Main") || [];

                    mainItems.forEach(
                        (mainItem) => {
                            initialSelections[ menu.id][mainItem.id] = mainItem.id;
                        }
                    );

                });
                setSelections(initialSelections);

            } catch (error) {

                console.error(
                    "Failed to load today's menus:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        fetchMenus();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Fetch Existing Today's Bookings
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const fetchBookings = async () => {

            try {

                const response = await api.get( "/todays-booked-meals" );
                const data: Booking[] = response.data?.data || [];
                setBookings(data);


                setSelections((prev) => {

                    const mergedSelections = {...prev,};

                    data.forEach((booking) => {
                        if (!Array.isArray(booking.items)) {
                            return;
                        }
                        if (!mergedSelections[booking.menu_id]) {
                            mergedSelections[booking.menu_id] = {};
                        }
                        console.log(
                            `Processing booking for menu_id ${booking.menu_id}:`,
                            booking.items
                        );

                        booking.items.forEach((item) => {

                            const selectedItemId =
                                item.menu_item_id;
                            const mainItemId =
                                item.menu_item?.item_type === "Alternative"
                                    ? item.menu_item.alternative_of
                                    : item.menu_item_id;
                            if (
                                mainItemId == null ||
                                selectedItemId == null
                            ) {
                                return;
                            }

                            mergedSelections[
                                booking.menu_id
                            ][
                                Number(mainItemId)
                            ] = Number(selectedItemId);

                        });

                    });

                    console.log(
                        "Merged selections after fetching bookings:",
                        mergedSelections
                    );

                    return mergedSelections;

                });

            } catch (error) {

                console.error(
                    "Failed to load existing bookings:",
                    error
                );

            }

        };

        fetchBookings();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Check Booking Cutoff
    |--------------------------------------------------------------------------
    */

    const isBookingClosed = (
        cutoffTime?: string
    ) => {

        if (!cutoffTime) {
            return false;
        }

        /*
        | Handles:
        | 08:00:00
        | 08:00:00 AM
        | 08:00 AM
        */

        const timeString =
            cutoffTime
                .trim()
                .toUpperCase();

        const match =
            timeString.match(
                /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/
            );

        if (!match) {
            return false;
        }

        let hours =
            Number(match[1]);

        const minutes =
            Number(match[2]);

        const period =
            match[3];

        if (period === "PM" && hours < 12) {
            hours += 12;
        }

        if (period === "AM" && hours === 12) {
            hours = 0;
        }

        const now =
            new Date();

        const cutoff =
            new Date();

        cutoff.setHours(
            hours,
            minutes,
            0,
            0
        );

        return now >= cutoff;

    };


    /*
    |--------------------------------------------------------------------------
    | Select Item
    |--------------------------------------------------------------------------
    */

    const handleSelect = (
        menuId: number,
        mainItemId: number,
        selectedItemId: number
    ) => {

        setSelections((prev) => ({

            ...prev,

            [menuId]: {

                ...(prev[menuId] || {}),

                [mainItemId]:
                    selectedItemId,

            },

        }));

    };


    /*
    |--------------------------------------------------------------------------
    | Get Selected Item
    |--------------------------------------------------------------------------
    */

    const getSelectedItem = (
        menuId: number,
        mainItemId: number
    ) => {

        return selections[
            menuId
        ]?.[
            mainItemId
        ];

    };


    /*
    |--------------------------------------------------------------------------
    | Submit / Update Meal
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        menu: TodayMenu
    ) => {

        const closed =
            isBookingClosed(
                menu.meal_type
                    ?.booking_cutoff_time
            );

        if (closed) {
            return;
        }


        const menuSelections =
            selections[
                menu.id
            ] || {};


        /*
        |--------------------------------------------------------------------------
        | Main Items
        |--------------------------------------------------------------------------
        */

        const mainItems =
            menu.items?.filter(
                (item) =>
                    item.item_type ===
                    "Main"
            ) || [];


        /*
        |--------------------------------------------------------------------------
        | Check Every Main Item Has Selection
        |--------------------------------------------------------------------------
        */

        const missingItems =
            mainItems.filter(
                (item) =>
                    !menuSelections[
                        item.id
                    ]
            );


        if (
            missingItems.length > 0
        ) {

            alert(
                "Please select an item from every meal group."
            );

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Prepare Items
        |
        | [
        |   {
        |      main_item_id: 1,
        |      selected_item_id: 1
        |   },
        |   {
        |      main_item_id: 2,
        |      selected_item_id: 5
        |   }
        | ]
        |--------------------------------------------------------------------------
        */

        const selectedItems:
            BookingItem[] =
            Object.entries(
                menuSelections
            ).map(
                ([
                    mainItemId,
                    selectedItemId
                ]) => ({

                    main_item_id:
                        Number(
                            mainItemId
                        ),

                    selected_item_id:
                        Number(
                            selectedItemId
                        ),

                })
            );


        setSubmitting(menu.id);


        try {

            const existingBooking =
                bookings.find(
                    (booking) =>
                        booking.menu_id ===
                        menu.id
                );


            const payload = {

                employee_id:
                    getUser()?.employee?.id,

                menu_id:
                    menu.id,

                meal_type_id:
                    menu.meal_type_id,

                booking_date:
                    menu.menu_date,

                items:
                    selectedItems,

            };

            console.log(payload);


            let response;


            /*
            |--------------------------------------------------------------------------
            | Update Existing Booking
            |--------------------------------------------------------------------------
            */

            if (
                existingBooking?.id
            ) {

                response =
                    await api.put(
                        `/booking-meal/${existingBooking.id}`,
                        payload
                    );

            }

            /*
            |--------------------------------------------------------------------------
            | Create New Booking
            |--------------------------------------------------------------------------
            */

            else {

                response =
                    await api.post(
                        "/booking-meal",
                        payload
                    );

            }


            /*
            |--------------------------------------------------------------------------
            | Saved Booking
            |--------------------------------------------------------------------------
            */

            const savedBooking:
                Booking =
                response.data?.data;


            /*
            |--------------------------------------------------------------------------
            | Update Local Booking State
            |--------------------------------------------------------------------------
            */

            if (
                existingBooking?.id
            ) {

                setBookings(
                    (prev) =>
                        prev.map(
                            (booking) =>
                                booking.id ===
                                existingBooking.id
                                    ? savedBooking
                                    : booking
                        )
                );

            } else {

                setBookings(
                    (prev) => [
                        ...prev,
                        savedBooking,
                    ]
                );

            }


            alert(
                existingBooking?.id
                    ? `${menu.meal_type?.name} meal updated successfully.`
                    : `${menu.meal_type?.name} meal booked successfully.`
            );

        } catch (error: any) {

            console.error(
                "Meal booking failed:",
                error
            );

            /*
            |--------------------------------------------------------------------------
            | Laravel Validation Error
            |--------------------------------------------------------------------------
            */

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
                "Failed to submit meal booking."
            );

        } finally {

            setSubmitting(null);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">


            {/* Sidebar */}

            <SideNav
                openSidebar={
                    openSidebar
                }
                setOpenSidebar={
                    setOpenSidebar
                }
            />


            {/* Main */}

            <main className="flex-1 min-w-0">


                {/* Top Navigation */}

                <TopNav
                    openSidebar={
                        openSidebar
                    }
                    setOpenSidebar={
                        setOpenSidebar
                    }
                />


                {/* Content */}

                <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-64px)]">


                    {/* Header */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                        <div>

                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Meal Selection
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Select your preferred meal for today
                            </p>

                        </div>


                        {/* Date */}

                        <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2.5">

                            <CalendarDays
                                size={18}
                                className="text-indigo-600"
                            />

                            <span className="text-sm font-semibold text-gray-700">

                                {new Date().toLocaleDateString(
                                    "en-GB",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }
                                )}

                            </span>

                        </div>

                    </div>


                    {/* Info */}

                    <div className="mb-6 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">

                        <Clock3
                            size={18}
                            className="text-indigo-600 mt-0.5 shrink-0"
                        />

                        <div>

                            <p className="text-sm font-semibold text-indigo-800">
                                Meal booking deadline
                            </p>

                            <p className="text-xs text-indigo-600 mt-1">
                                Select one option from each meal group before the cutoff time.
                                You can update your selection before the deadline.
                            </p>

                        </div>

                    </div>


                    {/* Loading */}

                    {loading ? (

                        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl py-12 text-center">

                            <RefreshCw
                                size={25}
                                className="mx-auto animate-spin text-indigo-600"
                            />

                            <p className="text-sm text-slate-500 mt-3">
                                Loading menus...
                            </p>

                        </div>

                    ) : menus.length === 0 ? (

                        /* No Menu */

                        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">

                            <Utensils
                                size={32}
                                className="mx-auto text-gray-300"
                            />

                            <h3 className="mt-4 font-semibold text-gray-700">
                                No meals available
                            </h3>

                            <p className="text-sm text-gray-400 mt-1">
                                No menu has been scheduled for today.
                            </p>

                        </div>

                    ) : (

                        <div className="max-w-4xl mx-auto space-y-5">

                            {menus.map(
                                (menu) => {

                                    const closed =
                                        isBookingClosed(
                                            menu.meal_type
                                                ?.booking_cutoff_time
                                        );


                                    const menuSelections =
                                        selections[
                                            menu.id
                                        ] || {};


                                    const mainItems =
                                        menu.items?.filter(
                                            (item) =>
                                                item.item_type ===
                                                "Main"
                                        ) || [];


                                    const alternatives =
                                        menu.items?.filter(
                                            (item) =>
                                                item.item_type ===
                                                "Alternative"
                                        ) || [];


                                    const allSelected =
                                        mainItems.length > 0 &&
                                        mainItems.every(
                                            (item) =>
                                                menuSelections[
                                                    item.id
                                                ]
                                        );


                                    const isSubmitting =
                                        submitting ===
                                        menu.id;


                                    const alreadyBooked =
                                        bookings.some(
                                            (booking) =>
                                                booking.menu_id ===
                                                menu.id
                                        );


                                    return (

                                        <div
                                            key={
                                                menu.id
                                            }
                                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                                                closed
                                                    ? "border-gray-200"
                                                    : "border-gray-100"
                                            }`}
                                        >


                                            {/* Meal Header */}

                                            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">

                                                <div className="flex items-center justify-between gap-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

                                                            <Utensils
                                                                size={19}
                                                                className="text-indigo-600"
                                                            />

                                                        </div>

                                                        <div>

                                                            <h3 className="font-bold text-gray-800">
                                                                {
                                                                    menu
                                                                        .meal_type
                                                                        ?.name
                                                                }
                                                            </h3>

                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    menu
                                                                        .meal_type
                                                                        ?.description
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>


                                                    <div className="text-right">

                                                        <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">

                                                            <Clock3
                                                                size={13}
                                                            />

                                                            Closes at

                                                            <span className="font-semibold text-gray-600">

                                                                {
                                                                    menu
                                                                        .meal_type
                                                                        ?.booking_cutoff_time ||
                                                                    "--"
                                                                }

                                                            </span>

                                                        </div>


                                                        <div className="mt-1">

                                                            {closed ? (

                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">

                                                                    <Lock
                                                                        size={11}
                                                                    />

                                                                    Booking Closed

                                                                </span>

                                                            ) : (

                                                                <span className="text-[11px] font-semibold text-green-600">
                                                                    Booking Open
                                                                </span>

                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* Items */}

                                            <div className="p-5 sm:p-6">

                                                <div className="space-y-3">

                                                    {mainItems.map(
                                                        (
                                                            mainItem
                                                        ) => {

                                                            /*
                                                            |--------------------------------------------------------------------------
                                                            | Find Alternatives Belonging To This Main Item
                                                            |--------------------------------------------------------------------------
                                                            */

                                                            const itemAlternatives =
                                                                alternatives.filter(
                                                                    (
                                                                        alternative
                                                                    ) =>
                                                                        Number(
                                                                            alternative.alternative_of
                                                                        ) ===
                                                                        Number(
                                                                            mainItem.id
                                                                        )
                                                                );


                                                            const selectedItem =
                                                                getSelectedItem(
                                                                    menu.id,
                                                                    mainItem.id
                                                                );


                                                            const isMainSelected =
                                                                selectedItem ===
                                                                mainItem.id;


                                                            return (

                                                                <div
                                                                    key={
                                                                        mainItem.id
                                                                    }
                                                                    className="rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                                                                >


                                                                    {/* Main */}

                                                                    <label
                                                                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-3 cursor-pointer transition ${
                                                                            isMainSelected
                                                                                ? "bg-indigo-50 border border-indigo-200"
                                                                                : "bg-white border border-transparent hover:border-indigo-200"
                                                                        } ${
                                                                            closed
                                                                                ? "cursor-not-allowed opacity-70"
                                                                                : ""
                                                                        }`}
                                                                    >

                                                                        <div className="flex items-center gap-3 min-w-0">

                                                                            <input
                                                                                type="radio"
                                                                                name={`menu-${menu.id}-group-${mainItem.id}`}
                                                                                value={
                                                                                    mainItem.id
                                                                                }
                                                                                checked={
                                                                                    isMainSelected
                                                                                }
                                                                                disabled={
                                                                                    closed
                                                                                }
                                                                                onChange={() =>
                                                                                    handleSelect(
                                                                                        menu.id,
                                                                                        mainItem.id,
                                                                                        mainItem.id
                                                                                    )
                                                                                }
                                                                                className="w-4 h-4 accent-indigo-600 shrink-0"
                                                                            />

                                                                            <span className="text-sm font-semibold text-gray-700">

                                                                                {
                                                                                    mainItem.item_name
                                                                                }

                                                                            </span>

                                                                        </div>


                                                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">

                                                                            Main

                                                                        </span>

                                                                    </label>


                                                                    {/* Alternatives */}

                                                                    {itemAlternatives.length >
                                                                        0 && (

                                                                        <div className="mt-2 ml-7 space-y-2">

                                                                            {itemAlternatives.map(
                                                                                (
                                                                                    alternative
                                                                                ) => {

                                                                                    const isAlternativeSelected =
                                                                                        selectedItem ===
                                                                                        alternative.id;


                                                                                    return (

                                                                                        <label
                                                                                            key={
                                                                                                alternative.id
                                                                                            }
                                                                                            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition ${
                                                                                                isAlternativeSelected
                                                                                                    ? "bg-purple-50 border border-purple-200"
                                                                                                    : "bg-white border border-transparent hover:border-purple-200"
                                                                                            } ${
                                                                                                closed
                                                                                                    ? "cursor-not-allowed opacity-70"
                                                                                                    : ""
                                                                                            }`}
                                                                                        >

                                                                                            <div className="flex items-center gap-3 min-w-0">

                                                                                                <input
                                                                                                    type="radio"
                                                                                                    name={`menu-${menu.id}-group-${mainItem.id}`}
                                                                                                    value={
                                                                                                        alternative.id
                                                                                                    }
                                                                                                    checked={
                                                                                                        isAlternativeSelected
                                                                                                    }
                                                                                                    disabled={
                                                                                                        closed
                                                                                                    }
                                                                                                    onChange={() =>
                                                                                                        handleSelect(
                                                                                                            menu.id,
                                                                                                            mainItem.id,
                                                                                                            alternative.id
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-4 h-4 accent-purple-600 shrink-0"
                                                                                                />

                                                                                                <span className="text-sm text-gray-600">

                                                                                                    {
                                                                                                        alternative.item_name
                                                                                                    }

                                                                                                </span>

                                                                                            </div>


                                                                                            <span className="text-[10px] font-medium text-purple-500 shrink-0">

                                                                                                Alternative

                                                                                            </span>

                                                                                        </label>

                                                                                    );

                                                                                }
                                                                            )}

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            );

                                                        }
                                                    )}

                                                </div>


                                                {/* Selection Summary */}

                                                {allSelected && (

                                                    <div className="mt-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3">

                                                        <div className="flex items-center gap-2">

                                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">

                                                                <Check
                                                                    size={14}
                                                                    className="text-green-600"
                                                                />

                                                            </div>

                                                            <div>

                                                                <p className="text-[11px] font-medium text-green-600">

                                                                    Selection complete

                                                                </p>

                                                                <p className="text-xs text-green-700 mt-0.5">

                                                                    {
                                                                        Object.keys(
                                                                            menuSelections
                                                                        ).length
                                                                    }{" "}
                                                                    meal item groups selected

                                                                </p>

                                                            </div>

                                                        </div>

                                                    </div>

                                                )}


                                                {/* Closed Message */}

                                                {closed && (

                                                    <div className="mt-4 flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">

                                                        <AlertCircle
                                                            size={15}
                                                            className="text-gray-400 mt-0.5 shrink-0"
                                                        />

                                                        <p className="text-xs text-gray-500">

                                                            The booking deadline has passed.
                                                            You cannot create or update this meal.

                                                        </p>

                                                    </div>

                                                )}


                                                {/* Submit */}

                                                {!closed && (

                                                    <div className="mt-5 flex justify-end">

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !allSelected ||
                                                                isSubmitting
                                                            }
                                                            onClick={() =>
                                                                handleSubmit(
                                                                    menu
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center gap-2 min-w-[150px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                                        >

                                                            {isSubmitting ? (

                                                                <>

                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                                                                    Saving...

                                                                </>

                                                            ) : (

                                                                <>

                                                                    <Check
                                                                        size={17}
                                                                    />

                                                                    {
                                                                        alreadyBooked
                                                                            ? "Update Meal"
                                                                            : "Submit Meal"
                                                                    }

                                                                </>

                                                            )}

                                                        </button>

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </main>

        </div>

    );

}