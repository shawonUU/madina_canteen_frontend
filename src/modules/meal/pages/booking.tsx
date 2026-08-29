import {
    CalendarDays,
    Check,
    Clock3,
    Lock,
    Utensils,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

interface MealCombination {
    id: string;
    items: MealItem[];
    selections: Record<number, number>;
}

export default function MealSelection() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const [menus, setMenus] = useState<TodayMenu[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedMenus, setSelectedMenus] = useState<Record<number, string>>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await api.get("/todays-menus");
                setMenus(response.data?.data || []);
            } catch (error) {
                console.error("Failed to load today's menus:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenus();
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get("/todays-booked-meals");
                const data: Booking[] = response.data?.data || [];

                setBookings(data);

                const bookedSelections: Record<number, string> = {};

                data.forEach((booking) => {
                    if (!Array.isArray(booking.items)) return;

                    const selections = booking.items
                        .map((item: any) => {
                            const selectedItemId = Number(item.menu_item_id);

                            const mainItemId =
                                item.menu_item?.item_type === "Alternative"
                                    ? Number(item.menu_item.alternative_of)
                                    : selectedItemId;

                            if (!mainItemId || !selectedItemId) return null;

                            return `${mainItemId}:${selectedItemId}`;
                        })
                        .filter(Boolean)
                        .sort()
                        .join("|");

                    if (selections) {
                        bookedSelections[booking.menu_id] = selections;
                    }
                });

                setSelectedMenus(bookedSelections);
            } catch (error) {
                console.error("Failed to load existing bookings:", error);
            }
        };

        fetchBookings();
    }, []);

    const isBookingClosed = (cutoffTime?: string) => {
        if (!cutoffTime) return false;

        const timeString = cutoffTime.trim().toUpperCase();

        const match = timeString.match(
            /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/
        );

        if (!match) return false;

        let hours = Number(match[1]);
        const minutes = Number(match[2]);
        const period = match[3];

        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const now = new Date();
        const cutoff = new Date();

        cutoff.setHours(hours, minutes, 0, 0);

        return now >= cutoff;
    };

    const generateCombinations = (menu: TodayMenu): MealCombination[] => {
        const mainItems = menu.items?.filter((item) => item.item_type === "Main") || [];

        if (!mainItems.length) return [];

        let combinations: Record<number, number>[] = [{}];

        mainItems.forEach((mainItem) => {
            const alternatives =
                menu.items?.filter(
                    (item) =>
                        item.item_type === "Alternative" &&
                        Number(item.alternative_of) === Number(mainItem.id)
                ) || [];

            const options = [mainItem, ...alternatives];

            combinations = combinations.flatMap((combination) =>
                options.map((option) => ({
                    ...combination,
                    [mainItem.id]: option.id,
                }))
            );
        });

        return combinations.map((selection, index) => {
            const items = mainItems.map((mainItem) => {
                const selectedId = selection[mainItem.id];

                return (
                    menu.items.find((item) => item.id === selectedId) ||
                    mainItem
                );
            });

            const id = Object.entries(selection)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([mainId, selectedId]) => `${mainId}:${selectedId}`)
                .join("|");

            return {
                id: id || `combination-${index}`,
                items,
                selections: selection,
            };
        });
    };

    const menuCombinations = useMemo(() => {
        const result: Record<number, MealCombination[]> = {};

        menus.forEach((menu) => {
            result[menu.id] = generateCombinations(menu);
        });

        return result;
    }, [menus]);

    const getCombinationKey = (combination: MealCombination) =>
        Object.entries(combination.selections)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([mainId, selectedId]) => `${mainId}:${selectedId}`)
            .join("|");

    const handleMenuSelect = (
        menuId: number,
        combination: MealCombination
    ) => {
        setSelectedMenus((prev) => ({
            ...prev,
            [menuId]: getCombinationKey(combination),
        }));
    };

    const handleSubmit = async (menu: TodayMenu) => {
        if (isBookingClosed(menu.meal_type?.booking_cutoff_time)) return;

        const selectedCombinationId = selectedMenus[menu.id];

        if (!selectedCombinationId) {
            alert("Please select a menu first.");
            return;
        }

        const combination = menuCombinations[menu.id]?.find(
            (item) => item.id === selectedCombinationId
        );

        if (!combination) {
            alert("Selected menu could not be found.");
            return;
        }

        const selectedItems: BookingItem[] = Object.entries(
            combination.selections
        ).map(([mainItemId, selectedItemId]) => ({
            main_item_id: Number(mainItemId),
            selected_item_id: Number(selectedItemId),
        }));

        setSubmitting(menu.id);

        try {
            const existingBooking = bookings.find(
                (booking) => booking.menu_id === menu.id
            );

            const payload = {
                employee_id: getUser()?.employee?.id,
                menu_id: menu.id,
                meal_type_id: menu.meal_type_id,
                booking_date: menu.menu_date,
                items: selectedItems,
            };

            let response;

            if (existingBooking?.id) {
                response = await api.put(
                    `/booking-meal/${existingBooking.id}`,
                    payload
                );
            } else {
                response = await api.post("/booking-meal", payload);
            }

            const savedBooking: Booking = response.data?.data;

            if (existingBooking?.id) {
                setBookings((prev) =>
                    prev.map((booking) =>
                        booking.id === existingBooking.id
                            ? savedBooking
                            : booking
                    )
                );
            } else {
                setBookings((prev) => [...prev, savedBooking]);
            }

            alert(
                existingBooking?.id
                    ? `${menu.meal_type?.name} meal updated successfully.`
                    : `${menu.meal_type?.name} meal booked successfully.`
            );
        } catch (error: any) {
            console.error("Meal booking failed:", error);

            const validationErrors = error?.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)?.[0];

                if (Array.isArray(firstError)) {
                    alert(firstError[0]);
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Meal Selection
                            </h2>
                            <p className="text-gray-500 mt-1">
                                Select your preferred meal for today
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2.5">
                            <CalendarDays
                                size={18}
                                className="text-indigo-600"
                            />
                            <span className="text-sm font-semibold text-gray-700">
                                {new Date().toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>

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
                                Select one complete menu before the cutoff time.
                                You can update your selection before the
                                deadline.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl py-12 text-center">
                            <RefreshCw
                                size={25}
                                className="mx-auto animate-spin text-indigo-600"
                            />
                            <p className="text-sm text-slate-500 mt-3">
                                Loading menus...
                            </p>
                        </div>
                    ) : menus.length === 0 ? (
                        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
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
                        <div className="max-w-5xl mx-auto space-y-6">
                            {menus.map((menu) => {
                                const closed = isBookingClosed(
                                    menu.meal_type?.booking_cutoff_time
                                );

                                const combinations =
                                    menuCombinations[menu.id] || [];

                                const selectedCombination =
                                    selectedMenus[menu.id];

                                const alreadyBooked = bookings.some(
                                    (booking) => booking.menu_id === menu.id
                                );

                                const isSubmitting = submitting === menu.id;

                                return (
                                    <div
                                        key={menu.id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                    >
                                        <div className="px-5 sm:px-6 py-5 border-b border-gray-100">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                        <Utensils
                                                            size={20}
                                                            className="text-indigo-600"
                                                        />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {
                                                                menu.meal_type
                                                                    ?.name
                                                            }
                                                        </h3>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {
                                                                menu.meal_type
                                                                    ?.description
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-left sm:text-right">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Clock3 size={13} />
                                                        Closes at
                                                        <span className="font-semibold text-gray-600">
                                                            {menu.meal_type
                                                                ?.booking_cutoff_time ||
                                                                "--"}
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

                                        <div className="p-5 sm:p-6">
                                            {combinations.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <AlertCircle
                                                        size={28}
                                                        className="mx-auto text-gray-300"
                                                    />
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        No menu combinations
                                                        available.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-bold text-gray-700">
                                                            Choose Your Menu
                                                        </h4>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Select one complete
                                                            combination.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {combinations.map(
                                                            (
                                                                combination,
                                                                index
                                                            ) => {
                                                                const isSelected =
                                                                    selectedCombination ===
                                                                    combination.id;

                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={
                                                                            combination.id
                                                                        }
                                                                        disabled={
                                                                            closed
                                                                        }
                                                                        onClick={() =>
                                                                            handleMenuSelect(
                                                                                menu.id,
                                                                                combination
                                                                            )
                                                                        }
                                                                        className={`text-left rounded-2xl border p-4 transition-all ${
                                                                            isSelected
                                                                                ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                                                                                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                                                                        } ${
                                                                            closed
                                                                                ? "cursor-not-allowed opacity-60"
                                                                                : "cursor-pointer"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                                                        isSelected
                                                                                            ? "bg-indigo-600 text-white"
                                                                                            : "bg-gray-100 text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    {index +
                                                                                        1}
                                                                                </div>

                                                                                <span className="text-sm font-bold text-gray-700">
                                                                                    Menu{" "}
                                                                                    {index +
                                                                                        1}
                                                                                </span>
                                                                            </div>

                                                                            <div
                                                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                                                    isSelected
                                                                                        ? "border-indigo-600 bg-indigo-600"
                                                                                        : "border-gray-300"
                                                                                }`}
                                                                            >
                                                                                {isSelected && (
                                                                                    <Check
                                                                                        size={
                                                                                            13
                                                                                        }
                                                                                        className="text-white"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            {combination.items.map(
                                                                                (
                                                                                    item,
                                                                                    itemIndex
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            item.id
                                                                                        }
                                                                                        className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2.5"
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />

                                                                                            <span className="text-sm font-medium text-gray-700">
                                                                                                {
                                                                                                    item.item_name
                                                                                                }
                                                                                            </span>
                                                                                        </div>

                                                                                        {item.item_type ===
                                                                                            "Alternative" && (
                                                                                            <span className="text-[10px] font-semibold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">
                                                                                                Alternative
                                                                                            </span>
                                                                                        )}

                                                                                        {item.item_type ===
                                                                                            "Main" && (
                                                                                            <span className="text-[10px] font-medium text-gray-400">
                                                                                                Main
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>

                                                                        {isSelected && (
                                                                            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                                                                <Check
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                Selected
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    {selectedCombination && (
                                                        <div className="mt-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <Check
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="text-green-600"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-semibold text-green-700">
                                                                        Menu
                                                                        selected
                                                                    </p>
                                                                    <p className="text-[11px] text-green-600 mt-0.5">
                                                                        Your
                                                                        complete
                                                                        meal
                                                                        combination
                                                                        is ready
                                                                        to book.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {closed && (
                                                        <div className="mt-4 flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                                                            <AlertCircle
                                                                size={15}
                                                                className="text-gray-400 mt-0.5 shrink-0"
                                                            />
                                                            <p className="text-xs text-gray-500">
                                                                The booking
                                                                deadline has
                                                                passed. You
                                                                cannot create or
                                                                update this
                                                                meal.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {!closed && (
                                                        <div className="mt-5 flex justify-end">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !selectedCombination ||
                                                                    isSubmitting
                                                                }
                                                                onClick={() =>
                                                                    handleSubmit(
                                                                        menu
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 min-w-[170px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                                            >
                                                                {isSubmitting ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check
                                                                            size={
                                                                                17
                                                                            }
                                                                        />
                                                                        {alreadyBooked
                                                                            ? "Update Meal"
                                                                            : "Submit Meal"}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}