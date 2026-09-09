import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Edit3,
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

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  meals: MealKey[];
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

const formatShortDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const initialBookings: Booking[] = [
  {
    id: 1,
    startDate: formatISO(today),
    endDate: formatISO(today),
    meals: ["breakfast", "lunch"],
    status: "Booked",
    createdAt: formatISO(today),
  },
  {
    id: 2,
    startDate: formatISO(addDays(today, 2)),
    endDate: formatISO(addDays(today, 6)),
    meals: ["lunch", "dinner"],
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
    items: string[];
  }
> = {
  breakfast: {
    available: true,
    items: ["Paratha", "Egg", "Dal"],
  },
  lunch: {
    available: true,
    items: ["Rice", "Chicken Curry", "Dal", "Salad"],
  },
  dinner: {
    available: false,
    items: [],
  },
};

const MealSelection: React.FC = () => {
  const [bookingMode, setBookingMode] = useState<"today" | "advance">("today");

  const [startDate, setStartDate] = useState(formatISO(today));
  const [endDate, setEndDate] = useState(formatISO(today));

  const [meals, setMeals] = useState<MealSelection>({
    breakfast: false,
    lunch: true,
    dinner: false,
  });

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

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });

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

    setEditingBooking(null);
  };

  const selectMeal = (meal: MealKey) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: !prev[meal],
    }));
  };

  const selectAllMeals = () => {
    const allSelected =
      meals.breakfast && meals.lunch && meals.dinner;

    setMeals({
      breakfast: !allSelected,
      lunch: !allSelected,
      dinner: !allSelected,
    });
  };

  const setToday = () => {
    setBookingMode("today");
    setStartDate(formatISO(today));
    setEndDate(formatISO(today));
  };

  const setNextDays = (days: number) => {
    setBookingMode("advance");

    setStartDate(formatISO(today));
    setEndDate(formatISO(addDays(today, days - 1)));
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
      showMessage("error", "Please select booking date.");
      return false;
    }

    if (endDate < startDate) {
      showMessage("error", "End date cannot be before start date.");
      return false;
    }

    if (selectedMeals.length === 0) {
      showMessage("error", "Please select at least one meal.");
      return false;
    }

    if (totalDays > 90) {
      showMessage("error", "You can book maximum 90 days at a time.");
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
              }
            : booking
        )
      );

      showMessage("success", "Booking updated successfully.");
    } else {
      const newBooking: Booking = {
        id: Date.now(),
        startDate,
        endDate,
        meals: selectedMeals,
        status: "Booked",
        createdAt: formatISO(today),
      };

      setBookings((prev) => [newBooking, ...prev]);

      showMessage("success", "Meal booking confirmed successfully.");
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
          ? { ...booking, status: "Cancelled" }
          : booking
      )
    );

    showMessage("success", "Booking cancelled.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

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

              <button onClick={() => setMessage(null)}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
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
            {/* Booking mode */}
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Create Booking
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Menu is optional. You can book even when no menu
                    is available.
                  </p>
                </div>

                {editingBooking && (
                  <button
                    onClick={resetForm}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    Cancel editing
                  </button>
                )}
              </div>

<div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-inner">
  <div className="grid grid-cols-2 gap-1.5">

    {/* Today */}
    <button
      onClick={setToday}
      className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
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
      onClick={() => setBookingMode("advance")}
      className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
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
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Booking Date
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose one day or a date range.
                  </p>
                </div>

                {bookingMode === "advance" && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {totalDays > 0 ? `${totalDays} days` : "Select dates"}
                  </span>
                )}
              </div>

              {bookingMode === "today" ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Today
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatDate(startDate)}
                    </p>
                  </div>

                  <Check
                    size={20}
                    className="ml-auto text-blue-600"
                  />
                </div>
              ) : (
                <>
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
                            handleStartDate(e.target.value)
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
                          min={startDate || formatISO(today)}
                          value={endDate}
                          onChange={(e) =>
                            setEndDate(e.target.value)
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
                      {[7, 15, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => setNextDays(days)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Next {days} Days
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Meals */}
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
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

              <div className="grid gap-3 md:grid-cols-3 hidden">
                {(Object.keys(mealInfo) as MealKey[]).map((meal) => {
                  const selected = meals[meal];
                  const info = mealInfo[meal];
                  const menu = menuAvailability[meal];

                  return (
                    <button
                      key={meal}
                      onClick={() => selectMeal(meal)}
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
                          {selected && <Check size={13} />}
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

              {/* Menu information */}
              {selectedMeals.length > 0 && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-blue-600">
                      <Info size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Menu Information
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Menu is not required for booking. If a menu is
                        available, it will be shown below. If there is
                        no menu yet, your meal booking will still be
                        saved.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedMeals.map((meal) => {
                      const menu = menuAvailability[meal];

                      return (
                        <div
                          key={meal}
                          className="flex items-center justify-between rounded-lg bg-white px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {mealInfo[meal].title}
                            </p>

                            {menu.available ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {menu.items.join(" • ")}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-slate-400">
                                Menu not scheduled yet
                              </p>
                            )}
                          </div>

                          {menu.available ? (
                            <span className="text-xs font-medium text-emerald-600">
                              Available
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              No menu
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-400">
                      Booking Summary
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {totalDays}{" "}
                        {totalDays === 1 ? "Day" : "Days"}
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="text-sm font-semibold">
                        {selectedMeals.length}{" "}
                        {selectedMeals.length === 1
                          ? "Meal"
                          : "Meals"}
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="text-sm font-semibold">
                        {totalMealBookings} Bookings
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

          {/* Booking Records */}
          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                My Bookings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your existing meal bookings.
              </p>
            </div>

            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <CalendarDays
                  size={35}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-3 font-semibold text-slate-800">
                  No bookings yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your meal bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Date */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays size={20} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {booking.startDate ===
                            booking.endDate
                              ? formatDate(booking.startDate)
                              : `${formatShortDate(
                                  booking.startDate
                                )} – ${formatShortDate(
                                  booking.endDate
                                )}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {booking.startDate ===
                            booking.endDate
                              ? "1 day booking"
                              : "Multiple day booking"}
                          </p>
                        </div>
                      </div>

                      {/* Meals */}
                      <div className="flex flex-wrap gap-2">
                        {booking.meals.map((meal) => (
                          <span
                            key={meal}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {mealInfo[meal].title}
                          </span>
                        ))}
                      </div>

                      {/* Status */}
                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                            booking.status === "Booked"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setShowDetails(booking)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                          title="View"
                        >
                          <ChevronRight size={17} />
                        </button>

                        {booking.status === "Booked" && (
                          <>
                            <button
                              onClick={() =>
                                editBooking(booking)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              onClick={() =>
                                cancelBooking(booking.id)
                              }
                              className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
                              title="Cancel"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
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
                onClick={() => setShowConfirm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Date */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Date
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {startDate === endDate
                    ? formatDate(startDate)
                    : `${formatDate(startDate)} – ${formatDate(
                        endDate
                      )}`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {totalDays}{" "}
                  {totalDays === 1 ? "day" : "days"}
                </p>
              </div>

              {/* Meals */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Selected Meals
                </p>

                <div className="space-y-2">
                  {selectedMeals.map((meal) => (
                    <div
                      key={meal}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-blue-600">
                          {mealInfo[meal].icon}
                        </div>

                        <span className="text-sm font-medium">
                          {mealInfo[meal].title}
                        </span>
                      </div>

                      {menuAvailability[meal].available ? (
                        <span className="text-xs font-medium text-emerald-600">
                          Menu available
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No menu yet
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="flex gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Your booking will be saved even if a menu has
                  not been published yet.
                </span>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 p-5">
              <button
                onClick={() => setShowConfirm(false)}
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
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
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
                onClick={() => setShowDetails(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs text-slate-400">
                  Booking Date
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {showDetails.startDate ===
                  showDetails.endDate
                    ? formatDate(showDetails.startDate)
                    : `${formatDate(
                        showDetails.startDate
                      )} – ${formatDate(showDetails.endDate)}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Meals
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {showDetails.meals.map((meal) => (
                    <span
                      key={meal}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600"
                    >
                      {mealInfo[meal].title}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                    showDetails.status === "Booked"
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
                onClick={() => setShowDetails(null)}
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