import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Info,
  Utensils,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";

type MealKey = "breakfast" | "lunch" | "dinner";

type MealSelection = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

type MenuItem = {
  id: number;
  name: string;
  type: "Main" | "Alternative";
};

type MenuOption = {
  id: number;
  name: string;
  items: MenuItem[];
};

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  meals: MealKey[];
  selectedMenus: Record<MealKey, number | null>;
  status: "Booked" | "Cancelled";
  createdAt: string;
};

const today = new Date();

const formatISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
};

const initialMeals: MealSelection = {
  breakfast: false,
  lunch: true,
  dinner: false,
};

const initialSelectedMenus: Record<MealKey, number | null> = {
  breakfast: null,
  lunch: 2,
  dinner: null,
};

const initialBookings: Booking[] = [
  {
    id: 1,
    startDate: formatISO(today),
    endDate: formatISO(today),
    meals: ["breakfast", "lunch"],
    selectedMenus: {
      breakfast: null,
      lunch: 2,
      dinner: null,
    },
    status: "Booked",
    createdAt: formatISO(today),
  },
  {
    id: 2,
    startDate: formatISO(addDays(today, 2)),
    endDate: formatISO(addDays(today, 6)),
    meals: ["lunch", "dinner"],
    selectedMenus: {
      breakfast: null,
      lunch: 1,
      dinner: null,
    },
    status: "Booked",
    createdAt: formatISO(today),
  },
];

const mealInfo: Record<
  MealKey,
  {
    title: string;
    icon: React.ReactNode;
    time: string;
  }
> = {
  breakfast: {
    title: "Breakfast",
    icon: <Coffee size={19} />,
    time: "7:00 AM – 9:00 AM",
  },

  lunch: {
    title: "Lunch",
    icon: <Utensils size={19} />,
    time: "12:00 PM – 2:30 PM",
  },

  dinner: {
    title: "Dinner",
    icon: <Utensils size={19} />,
    time: "7:00 PM – 9:30 PM",
  },
};

const menuAvailability: Record<
  MealKey,
  {
    available: boolean;
    menus: MenuOption[];
  }
> = {
  breakfast: {
    available: true,
    menus: [
      {
        id: 1,
        name: "Menu 1",
        items: [
          {
            id: 101,
            name: "Paratha",
            type: "Main",
          },
          {
            id: 102,
            name: "Egg",
            type: "Main",
          },
          {
            id: 103,
            name: "Dal",
            type: "Main",
          },
        ],
      },

      {
        id: 2,
        name: "Menu 2",
        items: [
          {
            id: 104,
            name: "Roti",
            type: "Main",
          },
          {
            id: 105,
            name: "Vegetable",
            type: "Main",
          },
          {
            id: 106,
            name: "Egg",
            type: "Alternative",
          },
        ],
      },
    ],
  },

  lunch: {
    available: true,
    menus: [
      {
        id: 1,
        name: "Menu 1",
        items: [
          {
            id: 201,
            name: "Rice",
            type: "Main",
          },
          {
            id: 202,
            name: "Beef",
            type: "Main",
          },
          {
            id: 203,
            name: "Dal",
            type: "Main",
          },
        ],
      },

      {
        id: 2,
        name: "Menu 2",
        items: [
          {
            id: 204,
            name: "Rice",
            type: "Main",
          },
          {
            id: 205,
            name: "Chicken",
            type: "Alternative",
          },
          {
            id: 206,
            name: "Dal",
            type: "Main",
          },
        ],
      },
    ],
  },

  dinner: {
    available: false,
    menus: [],
  },
};

const MealSelection: React.FC = () => {
  const [bookingMode, setBookingMode] = useState<"today" | "advance">(
    "today"
  );
  const [openSidebar, setOpenSidebar] =
        useState(false);

  const [startDate, setStartDate] = useState(formatISO(today));
  const [endDate, setEndDate] = useState(formatISO(today));

  const [meals, setMeals] = useState<MealSelection>(initialMeals);

  const [selectedMenus, setSelectedMenus] =
    useState<Record<MealKey, number | null>>(initialSelectedMenus);

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const [editingBooking, setEditingBooking] = useState<number | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [showDetails, setShowDetails] = useState<Booking | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedMeals = useMemo(() => {
    return (Object.keys(meals) as MealKey[]).filter((meal) => meals[meal]);
  }, [meals]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const diff = end.getTime() - start.getTime();

    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const totalMealBookings = totalDays * selectedMeals.length;

  const showMessage = (
    type: "success" | "error",
    text: string
  ) => {
    setMessage({
      type,
      text,
    });

    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const resetForm = () => {
    setBookingMode("today");

    setStartDate(formatISO(today));
    setEndDate(formatISO(today));

    setMeals({
      breakfast: false,
      lunch: true,
      dinner: false,
    });

    setSelectedMenus({
      breakfast: null,
      lunch: 2,
      dinner: null,
    });

    setEditingBooking(null);
  };

  const selectMeal = (meal: MealKey) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: !prev[meal],
    }));

    if (meals[meal]) {
      setSelectedMenus((prev) => ({
        ...prev,
        [meal]: null,
      }));
    }
  };

  const selectAllMeals = () => {
    const allSelected =
      meals.breakfast &&
      meals.lunch &&
      meals.dinner;

    const newValue = !allSelected;

    setMeals({
      breakfast: newValue,
      lunch: newValue,
      dinner: newValue,
    });

    if (!newValue) {
      setSelectedMenus({
        breakfast: null,
        lunch: null,
        dinner: null,
      });
    }
  };

  const selectMenu = (
    meal: MealKey,
    menuId: number
  ) => {
    setSelectedMenus((prev) => ({
      ...prev,
      [meal]: prev[meal] === menuId ? null : menuId,
    }));
  };

  const setToday = () => {
    setBookingMode("today");

    setStartDate(formatISO(today));
    setEndDate(formatISO(today));
  };

  const setNextDays = (days: number) => {
    setBookingMode("advance");

    setStartDate(formatISO(today));
    setEndDate(
      formatISO(addDays(today, days - 1))
    );
  };

  const handleStartDate = (value: string) => {
    setStartDate(value);

    if (endDate < value) {
      setEndDate(value);
    }

    if (value !== formatISO(today)) {
      setBookingMode("advance");
    }
  };

  const validateBooking = () => {
    if (!startDate || !endDate) {
      showMessage(
        "error",
        "Please select booking date."
      );

      return false;
    }

    if (endDate < startDate) {
      showMessage(
        "error",
        "End date cannot be before start date."
      );

      return false;
    }

    if (selectedMeals.length === 0) {
      showMessage(
        "error",
        "Please select at least one meal."
      );

      return false;
    }

    if (totalDays > 90) {
      showMessage(
        "error",
        "You can book maximum 90 days at a time."
      );

      return false;
    }

    return true;
  };

  const openConfirmation = () => {
    if (!validateBooking()) return;

    setShowConfirm(true);
  };

  const confirmBooking = () => {
    if (editingBooking) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBooking
            ? {
                ...booking,
                startDate,
                endDate,
                meals: selectedMeals,
                selectedMenus: {
                  ...selectedMenus,
                },
              }
            : booking
        )
      );

      showMessage(
        "success",
        "Booking updated successfully."
      );
    } else {
      const newBooking: Booking = {
        id: Date.now(),

        startDate,
        endDate,

        meals: selectedMeals,

        selectedMenus: {
          ...selectedMenus,
        },

        status: "Booked",

        createdAt: formatISO(today),
      };

      setBookings((prev) => [
        newBooking,
        ...prev,
      ]);

      showMessage(
        "success",
        "Meal booking confirmed successfully."
      );
    }

    setShowConfirm(false);

    resetForm();
  };

  const editBooking = (booking: Booking) => {
    setEditingBooking(booking.id);

    setStartDate(booking.startDate);
    setEndDate(booking.endDate);

    setMeals({
      breakfast: booking.meals.includes("breakfast"),
      lunch: booking.meals.includes("lunch"),
      dinner: booking.meals.includes("dinner"),
    });

    setSelectedMenus({
      breakfast:
        booking.selectedMenus?.breakfast ?? null,

      lunch:
        booking.selectedMenus?.lunch ?? null,

      dinner:
        booking.selectedMenus?.dinner ?? null,
    });

    if (booking.startDate === booking.endDate) {
      setBookingMode("today");
    } else {
      setBookingMode("advance");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelBooking = (id: number) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: "Cancelled",
            }
          : booking
      )
    );

    showMessage(
      "success",
      "Booking cancelled."
    );
  };

  const getMenu = (
    meal: MealKey,
    menuId: number | null
  ) => {
    if (!menuId) return null;

    return menuAvailability[meal].menus.find(
      (menu) => menu.id === menuId
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
              openSidebar={openSidebar}
              setOpenSidebar={setOpenSidebar}
          />

        {/* Toast */}
        {message && (
          <div className="fixed right-5 top-5 z-[100]">
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${
                message.type === "success"
                  ? "border-emerald-200 bg-white text-emerald-700"
                  : "border-red-200 bg-white text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}

              <span className="text-sm font-medium">
                {message.text}
              </span>

              <button
                onClick={() => setMessage(null)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Meal Booking
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Book your meals for today or upcoming days.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <CalendarDays
                  size={18}
                  className="text-blue-600"
                />

                <span className="text-sm font-medium text-slate-700">
                  {formatDate(formatISO(today))}
                </span>
              </div>
            </div>
          </div>

          {/* Main Booking Card */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Booking Mode */}
            <div className="border-b border-slate-100 p-4 sm:p-5">
              {editingBooking && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Editing Booking
                    </p>

                    <p className="mt-0.5 text-xs text-amber-700">
                      Update the booking information below.
                    </p>
                  </div>

                  <button
                    onClick={resetForm}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel editing
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-inner">
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Today */}
                  <button
                    onClick={setToday}
                    className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-blue-100 to-indigo-100 ${
                      bookingMode === "today"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                    }`}
                  >
                    <CalendarDays
                      size={17}
                      className={`transition-transform duration-300 ${
                        bookingMode === "today"
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-500"
                      }`}
                    />

                    <span>Today</span>

                    {bookingMode === "today" && (
                      <Check
                        size={15}
                        strokeWidth={3}
                        className="ml-0.5 text-white"
                      />
                    )}
                  </button>

                  {/* Advance Booking */}
                  <button
                    onClick={() =>
                      setBookingMode("advance")
                    }
                    className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-blue-100 to-indigo-100 ${
                      bookingMode === "advance"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                    }`}
                  >
                    <Clock3
                      size={17}
                      className={`transition-transform duration-300 ${
                        bookingMode === "advance"
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-500"
                      }`}
                    />

                    <span>Advance Booking</span>

                    {bookingMode === "advance" && (
                      <Check
                        size={15}
                        strokeWidth={3}
                        className="ml-0.5 text-white"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Date */}
            {bookingMode === "advance" && (
              <div className="border-b border-slate-100 px-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Start Date
                        </label>

                        <div className="relative">
                          <CalendarDays
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="date"
                            min={formatISO(today)}
                            value={startDate}
                            onChange={(e) =>
                              handleStartDate(
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          End Date
                        </label>

                        <div className="relative">
                          <CalendarDays
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="date"
                            min={
                              startDate ||
                              formatISO(today)
                            }
                            value={endDate}
                            onChange={(e) =>
                              setEndDate(
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Quick ranges */}
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium text-slate-500">
                        Quick select
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {[7, 15, 30].map(
                          (days) => (
                            <button
                              key={days}
                              onClick={() =>
                                setNextDays(days)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                              Next {days} Days
                            </button>
                          )
                        )}
                      </div>
                    </div>
                
              </div>
            )}
            {/* Meals */}
            <div className="border-b border-slate-100 p-4 sm:p-5 hidden">
              <div className="mb-4 flex items-center justify-between ">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Select Meals
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose the meals you want to book.
                  </p>
                </div>

                <button
                  onClick={selectAllMeals}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {selectedMeals.length === 3
                    ? "Clear All"
                    : "Select All"}
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {(Object.keys(
                  mealInfo
                ) as MealKey[]).map((meal) => {
                  const selected =
                    meals[meal];

                  const info =
                    mealInfo[meal];

                  const menu =
                    menuAvailability[meal];

                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() =>
                        selectMeal(meal)
                      }
                      className={`text-left rounded-xl border p-4 transition ${
                        selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-white text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {info.icon}
                        </div>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {selected && (
                            <Check size={13} />
                          )}
                        </div>
                      </div>

                      <h4 className="mt-4 font-semibold text-slate-900">
                        {info.title}
                      </h4>

                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 size={13} />

                        {info.time}
                      </div>

                      <div className="mt-3">
                        {menu.available ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                            Menu Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            Menu Not Available
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Information */}
            {selectedMeals.length > 0 && (
              <div className="border-b border-slate-100 px-5">
                
             
                    
                      {selectedMeals.map((meal) => {
                        const menuData = menuAvailability[meal];
                        const selectedMenuId = selectedMenus[meal];

                        return (
                          <div
                            key={meal}
                            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            {/* Compact Meal Header */}
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                  <Info size={18} />
                                </div>

                                <div>
                                  <p className="text-sm font-bold leading-none text-slate-800">
                                    Menu Information
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-400">
                                    Choose your menu
                                  </p>
                                </div>
                              </div>

                              {selectedMenuId && (
                                <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                  <Check size={11} strokeWidth={3} />
                                  Menu {selectedMenuId}
                                </div>
                              )}
                            </div>

                            {menuData.available && menuData.menus.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {menuData.menus.map((menu) => {
                                  const isSelected = selectedMenuId === menu.id;

                                  return (
                                    <button
                                      key={menu.id}
                                      type="button"
                                      onClick={() => selectMenu(meal, menu.id)}
                                      className={`relative rounded-xl border p-3 text-left transition-all duration-200 ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-200"
                                          : "border-slate-500 bg-slate-50/40 hover:border-indigo-300 hover:bg-indigo-50/30"
                                      }`}
                                    >
                                      {/* Menu Top */}
                                      <div className="mb-2 flex items-center justify-between">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                                              isSelected
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white text-slate-500 ring-1 ring-slate-200"
                                            }`}
                                          >
                                            {menu.id}
                                          </div>

                                          <span className="truncate text-xs font-bold text-slate-700">
                                            {menu.name}
                                          </span>
                                        </div>

                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                            isSelected
                                              ? "border-indigo-600 bg-indigo-600"
                                              : "border-slate-300 bg-white"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check
                                              size={11}
                                              strokeWidth={3}
                                              className="text-white"
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* Compact Items */}
                                      <div className="flex flex-wrap gap-1.5">
                                        {menu.items.map((item) => (
                                          <span
                                            key={item.id}
                                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${
                                              item.type === "Alternative"
                                                ? "bg-purple-50 text-purple-600"
                                                : "bg-white text-slate-500 ring-1 ring-slate-100"
                                            }`}
                                          >
                                            <span
                                              className={`h-1 w-1 rounded-full ${
                                                item.type === "Alternative"
                                                  ? "bg-purple-400"
                                                  : "bg-indigo-400"
                                              }`}
                                            />

                                            {item.name}

                                            {item.type === "Alternative" && (
                                              <span className="ml-0.5 text-[9px] opacity-70">
                                                Alt
                                              </span>
                                            )}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Selected Indicator */}
                                      {isSelected && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                                          <Check size={12} strokeWidth={3} />
                                          Selected
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                  <Info size={15} />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700">
                                    Menu not scheduled yet
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    You can still book this meal.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
              


              </div>
            )}

            {/* Summary */}
            <div className="p-4 sm:p-5 pt-0">
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-400">
                      Booking Summary
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {totalDays}{" "}
                        {totalDays === 1
                          ? "Day"
                          : "Days"}
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-sm font-semibold">
                        {selectedMeals.length}{" "}
                        {selectedMeals.length === 1
                          ? "Meal"
                          : "Meals"}
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-sm font-semibold">
                        {totalMealBookings}{" "}
                        Bookings
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={openConfirmation}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    {editingBooking
                      ? "Update Booking"
                      : "Review Booking"}

                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Existing Bookings */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm hidden">
            <div className="border-b border-slate-100 p-4 sm:p-5 pt-0">
              <div>
                <h2 className="font-bold text-slate-900">
                  My Bookings
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  View and manage your meal bookings.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No bookings found.
                  </p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {booking.startDate ===
                            booking.endDate
                              ? formatDate(
                                  booking.startDate
                                )
                              : `${formatDate(
                                  booking.startDate
                                )} – ${formatDate(
                                  booking.endDate
                                )}`}
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              booking.status ===
                              "Booked"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.meals.map(
                            (meal) => (
                              <span
                                key={meal}
                                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"
                              >
                                {
                                  mealInfo[
                                    meal
                                  ].title
                                }
                              </span>
                            )
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.meals.map(
                            (meal) => {
                              const menuId =
                                booking
                                  .selectedMenus?.[
                                  meal
                                ];

                              const menu =
                                getMenu(
                                  meal,
                                  menuId
                                );

                              if (!menu) {
                                return null;
                              }

                              return (
                                <span
                                  key={`${meal}-${menu.id}`}
                                  className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
                                >
                                  {
                                    mealInfo[
                                      meal
                                    ].title
                                  }{" "}
                                  •{" "}
                                  {menu.name}
                                </span>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            setShowDetails(
                              booking
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          View Details
                        </button>

                        {booking.status ===
                          "Booked" && (
                          <>
                            <button
                              onClick={() =>
                                editBooking(
                                  booking
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                cancelBooking(
                                  booking.id
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              <Trash2
                                size={14}
                              />

                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 ">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  Confirm Booking
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Please check your booking before confirming.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowConfirm(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 pt-0">
              {/* Date */}
              <div className="rounded-xl bg-slate-50 p-4 pt-0">
                <p className="text-xs font-medium text-slate-500 hidden">
                  Date
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {startDate === endDate
                    ? formatDate(startDate)
                    : `${formatDate(
                        startDate
                      )} – ${formatDate(
                        endDate
                      )}`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {totalDays}{" "}
                  {totalDays === 1
                    ? "day"
                    : "days"}
                </p>
              </div>

              {/* Meals & Menus */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Selected Meals & Menus
                </p>

                <div className="space-y-2">
                  {selectedMeals.map(
                    (meal) => {
                      const menuId =
                        selectedMenus[
                          meal
                        ];

                      const menu =
                        getMenu(
                          meal,
                          menuId
                        );

                      return (
                        <div
                          key={meal}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-blue-600">
                                {
                                  mealInfo[
                                    meal
                                  ].icon
                                }
                              </div>

                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  mealInfo[
                                    meal
                                  ].title
                                }
                              </span>
                            </div>

                            {menu ? (
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                {
                                  menu.name
                                }
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No menu selected
                              </span>
                            )}
                          </div>

                          {menu && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {menu.items.map(
                                (item) => (
                                  <span
                                    key={
                                      item.id
                                    }
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                                      item.type ===
                                      "Alternative"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {
                                      item.name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Notice */}
            </div>

            <div className="flex gap-3 border-t border-slate-100 p-5">
              <button
                onClick={() =>
                  setShowConfirm(false)
                }
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Go Back
              </button>

              <button
                onClick={confirmBooking}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {editingBooking
                  ? "Update Booking"
                  : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  Booking Details
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Booking information
                </p>
              </div>

              <button
                onClick={() =>
                  setShowDetails(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Booking Date */}
              <div>
                <p className="text-xs text-slate-400">
                  Booking Date
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {showDetails.startDate ===
                  showDetails.endDate
                    ? formatDate(
                        showDetails.startDate
                      )
                    : `${formatDate(
                        showDetails.startDate
                      )} – ${formatDate(
                        showDetails.endDate
                      )}`}
                </p>
              </div>

              {/* Meals */}
              <div>
                <p className="text-xs text-slate-400">
                  Meals & Menus
                </p>

                <div className="mt-2 space-y-3">
                  {showDetails.meals.map(
                    (meal) => {
                      const menuId =
                        showDetails
                          .selectedMenus?.[
                          meal
                        ];

                      const menu =
                        getMenu(
                          meal,
                          menuId
                        );

                      return (
                        <div
                          key={meal}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-blue-600">
                                {
                                  mealInfo[
                                    meal
                                  ].icon
                                }
                              </div>

                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  mealInfo[
                                    meal
                                  ].title
                                }
                              </span>
                            </div>

                            {menu && (
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                {
                                  menu.name
                                }
                              </span>
                            )}
                          </div>

                          {menu ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {menu.items.map(
                                (item) => (
                                  <span
                                    key={
                                      item.id
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                                      item.type ===
                                      "Alternative"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {
                                      item.name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-400">
                              No menu selected
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                    showDetails.status ===
                    "Booked"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {showDetails.status}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5">
              <button
                onClick={() =>
                  setShowDetails(null)
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealSelection;
