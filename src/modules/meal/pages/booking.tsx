import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";
import { getUser } from "../../../services/storage";

type MenuItem = {
  id: number;
  name: string;
  item_type: "Main" | "Alternative";
  alternative_of: number | null;

  alternate?: MenuItem | null;
};

type ApiMenu = {
  id: number;
  menu_date: string;
  meal_type_id: number;
  items: MenuItem[];
};

type MealType = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  booking_cutoff_time?: string;
  meal_rate?: number;
  status?: string;
};

type MenuOption = {
  id: string;
  menuId: number;
  name: string;
  items: MenuItem[];
  selectedPairs: {
    main_item_id: number;
    selected_item_id: number;
  }[];
};

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  selectedMenus: Record<string, MenuOption | null>;
  status: "Booked" | "Cancelled";
  createdAt: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const today = new Date();

const formatISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date: string) => {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const addDays = (
  date: Date,
  days: number
) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
};

const getDateRange = (
  startDate: string,
  endDate: string
) => {
  if (!startDate || !endDate) {
    return [];
  }

  const dates: string[] = [];

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  const current = new Date(start);

  while (current <= end) {
    dates.push(formatISO(current));

    current.setDate(
      current.getDate() + 1
    );
  }

  return dates;
};

const getResponseData = <T,>(
  responseData: unknown
): T[] => {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    const data = (
      responseData as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  return [];
};

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }

    if (
      data &&
      typeof data === "object" &&
      "errors" in data &&
      data.errors &&
      typeof data.errors === "object"
    ) {
      const errors = data.errors as Record<
        string,
        string[] | string
      >;

      const firstError =
        Object.values(errors)[0];

      if (Array.isArray(firstError)) {
        return firstError[0];
      }

      if (
        typeof firstError === "string"
      ) {
        return firstError;
      }
    }
  }

  return fallback;
};

const getEmployeeId = () => {
  const directEmployeeId =
    getUser()?.employee?.id;

  if (directEmployeeId) {
    const id = Number(
      directEmployeeId
    );

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      return id;
    }
  }

  const userKeys = [
    "user",
    "auth_user",
    "current_user",
  ];

  for (const key of userKeys) {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const user =
        JSON.parse(raw);

      const employeeId =
        user?.employee_id ??
        user?.employee?.id ??
        user?.employeeId;

      const id = Number(
        employeeId
      );

      if (
        Number.isInteger(id) &&
        id > 0
      ) {
        return id;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const normalizeMenuItems = (
  items: MenuItem[]
): MenuItem[] => {
  const normalized: MenuItem[] = [];

  items.forEach((item) => {
    const mainItem: MenuItem = {
      id: item.id,
      name: item.name,
      item_type: item.item_type,
      alternative_of:
        item.alternative_of ?? null,
      alternate: null,
    };

    normalized.push(mainItem);

    if (
      item.item_type === "Main" &&
      item.alternate
    ) {
      const alternate =
        item.alternate;

      normalized.push({
        id: alternate.id,
        name: alternate.name,
        item_type:
          "Alternative",
        alternative_of:
          alternate.alternative_of ??
          item.id,
        alternate: null,
      });
    }
  });

  const uniqueItems =
    normalized.filter(
      (item, index, array) =>
        array.findIndex(
          (existing) =>
            existing.id === item.id
        ) === index
    );

  return uniqueItems;
};

const generateMenuCombinations = (
  menu: ApiMenu
): MenuOption[] => {
  const normalizedItems =
    normalizeMenuItems(
      menu.items
    );

  const mainItems =
    normalizedItems.filter(
      (item) =>
        item.item_type === "Main"
    );

  if (mainItems.length === 0) {
    return [];
  }

  const groups: {
    main: MenuItem;
    options: MenuItem[];
  }[] = [];

  mainItems.forEach(
    (mainItem) => {
      const alternatives =
        normalizedItems.filter(
          (item) =>
            item.item_type ===
              "Alternative" &&
            item.alternative_of ===
              mainItem.id
        );

      groups.push({
        main: mainItem,
        options: [
          mainItem,
          ...alternatives,
        ],
      });
    }
  );

  let combinations: {
    items: MenuItem[];
    selectedPairs: {
      main_item_id: number;
      selected_item_id: number;
    }[];
  }[] = [
    {
      items: [],
      selectedPairs: [],
    },
  ];

  groups.forEach(
    (group) => {
      const next: typeof combinations =
        [];

      combinations.forEach(
        (combination) => {
          group.options.forEach(
            (option) => {
              next.push({
                items: [
                  ...combination.items,
                  option,
                ],

                selectedPairs: [
                  ...combination.selectedPairs,
                  {
                    main_item_id:
                      group.main.id,

                    selected_item_id:
                      option.id,
                  },
                ],
              });
            }
          );
        }
      );

      combinations = next;
    }
  );

  return combinations.map(
    (
      combination,
      index
    ) => ({
      id: `${menu.id}-${index + 1}`,

      menuId: menu.id,

      name: `Menu ${
        index + 1
      }`,

      items:
        combination.items,

      selectedPairs:
        combination.selectedPairs,
    })
  );
};

const MealSelection = () => {
  const [
    bookingMode,
    setBookingMode,
  ] = useState<
    "today" | "advance"
  >("today");

  const [
    openSidebar,
    setOpenSidebar,
  ] = useState(false);

  const [
    startDate,
    setStartDate,
  ] = useState(
    formatISO(today)
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    formatISO(today)
  );

  const [
    menus,
    setMenus,
  ] = useState<ApiMenu[]>([]);

  const [
    lunchMealType,
    setLunchMealType,
  ] = useState<MealType | null>(
    null
  );

  const [
    loadingMenus,
    setLoadingMenus,
  ] = useState(false);

  const [
    booking,
    setBooking,
  ] = useState(false);

  const [
    selectedMenus,
    setSelectedMenus,
  ] = useState<
    Record<
      string,
      MenuOption | null
    >
  >({});

  const [
    bookings,
    setBookings,
  ] = useState<Booking[]>([]);

  const [
    editingBooking,
    setEditingBooking,
  ] = useState<number | null>(
    null
  );

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    showDetails,
    setShowDetails,
  ] = useState<Booking | null>(
    null
  );

  const [
    message,
    setMessage,
  ] = useState<Message | null>(
    null
  );

  const showMessage = (
    type: "success" | "error",
    text: string
  ) => {
    setMessage({
      type,
      text,
    });

    window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const loadMealType =
      async () => {
        try {
          const response =
            await api.get(
              "/meal-types"
            );

          const mealTypes =
            getResponseData<MealType>(
              response.data?.data
            );

          const lunch =
            mealTypes.find(
              (mealType) =>
                mealType.slug ===
                "lunch"
            ) ?? null;

          setLunchMealType(
            lunch
          );
        } catch (error) {
          showMessage(
            "error",
            getErrorMessage(
              error,
              "Unable to load lunch meal type."
            )
          );
        }
      };

    void loadMealType();
  }, []);

  useEffect(() => {
    const loadMenus =
      async () => {
        setLoadingMenus(true);

        try {
          const response =
            await api.get(
              "/menus"
            );

          const apiMenus =
            getResponseData<ApiMenu>(
              response.data
            );

          setMenus(apiMenus);
        } catch (error) {
          showMessage(
            "error",
            getErrorMessage(
              error,
              "Unable to load menus."
            )
          );
        } finally {
          setLoadingMenus(false);
        }
      };

    void loadMenus();
  }, []);

  const bookingDates =
    useMemo(() => {
      return getDateRange(
        startDate,
        endDate
      );
    }, [
      startDate,
      endDate,
    ]);

  const totalDays =
    useMemo(() => {
      return bookingDates.length;
    }, [bookingDates]);

  const totalMealBookings =
    totalDays;

  const getMenusForDate = (
    date: string
  ): MenuOption[] => {
    if (!lunchMealType) {
      return [];
    }

    return menus
      .filter(
        (menu) =>
          menu.meal_type_id ===
            lunchMealType.id &&
          menu.menu_date === date
      )
      .flatMap(
        (menu) =>
          generateMenuCombinations(
            menu
          )
      );
  };

  const getSelectionKey = (
    date: string
  ) => {
    return `${date}_lunch`;
  };

  const getSelectedMenu = (
    date: string
  ) => {
    return (
      selectedMenus[
        getSelectionKey(date)
      ] ?? null
    );
  };

  const resetForm = () => {
    setBookingMode("today");

    setStartDate(
      formatISO(today)
    );

    setEndDate(
      formatISO(today)
    );

    setSelectedMenus({});

    setEditingBooking(null);
  };

  const selectMenu = (
    date: string,
    menu: MenuOption
  ) => {
    const key =
      getSelectionKey(date);

    setSelectedMenus(
      (prev) => ({
        ...prev,

        [key]:
          prev[key]?.id ===
          menu.id
            ? null
            : menu,
      })
    );
  };

  const setToday = () => {
    setBookingMode("today");

    setStartDate(
      formatISO(today)
    );

    setEndDate(
      formatISO(today)
    );
  };

  const setNextDays = (
    days: number
  ) => {
    setBookingMode("advance");

    setStartDate(
      formatISO(today)
    );

    setEndDate(
      formatISO(
        addDays(
          today,
          days - 1
        )
      )
    );
  };

  const handleStartDate = (
    value: string
  ) => {
    setStartDate(value);

    if (endDate < value) {
      setEndDate(value);
    }

    if (
      value !==
      formatISO(today)
    ) {
      setBookingMode(
        "advance"
      );
    }
  };

  const validateBooking =
    () => {
      if (
        !startDate ||
        !endDate
      ) {
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

      if (totalDays === 0) {
        showMessage(
          "error",
          "Please select booking date."
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

      if (!lunchMealType) {
        showMessage(
          "error",
          "Lunch meal type was not found."
        );

        return false;
      }

      const employeeId =
        getEmployeeId();

      if (!employeeId) {
        showMessage(
          "error",
          "Employee information was not found."
        );

        return false;
      }

      return true;
    };

  const openConfirmation =
    () => {
      if (!validateBooking()) {
        return;
      }

      setShowConfirm(true);
    };

  const confirmBooking =
    async () => {
      if (!lunchMealType) {
        showMessage(
          "error",
          "Lunch meal type was not found."
        );

        return;
      }

      const employeeId =
        getEmployeeId();

      if (!employeeId) {
        showMessage(
          "error",
          "Employee information was not found."
        );

        return;
      }

      if (
        bookingDates.length ===
        0
      ) {
        showMessage(
          "error",
          "Please select booking date."
        );

        return;
      }

      setBooking(true);

      try {
        const bookingsPayload =
          bookingDates.map(
            (date) => {
              const selectedMenu =
                getSelectedMenu(
                  date
                );

              return {
                booking_date: date,

                menu_id:
                  selectedMenu?.menuId ??
                  null,

                items:
                  selectedMenu?.selectedPairs ??
                  [],
              };
            }
          );

        await api.post(
          "/booking-meals",
          {
            employee_id:
              employeeId,

            meal_type_id:
              lunchMealType.id,

            start_date:
              startDate,

            end_date:
              endDate,

            bookings:
              bookingsPayload,
          }
        );

        showMessage(
          "success",
          editingBooking
            ? "Booking updated successfully."
            : "Lunch booking confirmed successfully."
        );

        setShowConfirm(false);

        resetForm();
      } catch (error) {
        showMessage(
          "error",
          getErrorMessage(
            error,
            "Unable to complete meal booking."
          )
        );
      } finally {
        setBooking(false);
      }
    };

  const editBooking = (
    booking: Booking
  ) => {
    setEditingBooking(
      booking.id
    );

    setStartDate(
      booking.startDate
    );

    setEndDate(
      booking.endDate
    );

    setSelectedMenus(
      booking.selectedMenus
    );

    if (
      booking.startDate ===
      booking.endDate
    ) {
      setBookingMode("today");
    } else {
      setBookingMode(
        "advance"
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelBooking = (
    id: number
  ) => {
    setBookings(
      (prev) =>
        prev.map(
          (booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status:
                    "Cancelled",
                }
              : booking
        )
    );

    showMessage(
      "success",
      "Booking cancelled."
    );
  };

  const getMenuForDetails = (
    date: string,
    selectedMenu:
      | MenuOption
      | null
  ) => {
    if (!selectedMenu) {
      return null;
    }

    const dateMenus =
      getMenusForDate(date);

    return (
      dateMenus.find(
        (menu) =>
          menu.id ===
          selectedMenu.id
      ) ?? selectedMenu
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100">
      <div className="flex min-h-screen">
        <SideNav
          openSidebar={
            openSidebar
          }
          setOpenSidebar={
            setOpenSidebar
          }
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
            openSidebar={
              openSidebar
            }
            setOpenSidebar={
              setOpenSidebar
            }
          />

          {/* Toast */}
          {message && (
            <div className="fixed left-4 right-4 top-4 z-[100] sm:left-auto sm:right-5">
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${
                  message.type ===
                  "success"
                    ? "border-emerald-200 bg-white text-emerald-700"
                    : "border-red-200 bg-white text-red-700"
                }`}
              >
                {message.type ===
                "success" ? (
                  <CheckCircle2
                    size={20}
                    className="shrink-0"
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    className="shrink-0"
                  />
                )}

                <span className="min-w-0 flex-1 text-sm font-medium">
                  {
                    message.text
                  }
                </span>

                <button
                  onClick={() =>
                    setMessage(
                      null
                    )
                  }
                  className="shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* <main className="min-w-0 flex-1 px-3 py-4 pb-32 sm:px-5 sm:py-6 sm:pb-36 lg:px-8"> */}
            <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
            {/* Header */}
            <div className="mb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    Meal Booking
                  </h1>

                  <p className="mt-1 max-w-xl text-xs text-slate-500 sm:text-sm">
                    Book your meals for today or upcoming days.
                  </p>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4">
                  <CalendarDays
                    size={18}
                    className="shrink-0 text-blue-600"
                  />

                  <span className="text-xs font-medium text-slate-700 sm:text-sm">
                    {formatDate(
                      formatISO(
                        today
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Booking Card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Booking Mode */}
              <div className="border-b border-slate-100 p-3 sm:p-5">
                {editingBooking && (
                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Editing Booking
                      </p>

                      <p className="mt-0.5 text-xs text-amber-700">
                        Update the booking information below.
                      </p>
                    </div>

                    <button
                      onClick={
                        resetForm
                      }
                      className="w-fit text-sm font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel editing
                    </button>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-inner">
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Today */}
                    <button
                      onClick={
                        setToday
                      }
                      className={`group flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                        bookingMode ===
                        "today"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gradient-to-r from-blue-200 to-indigo-200 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                      }`}
                    >
                      <CalendarDays
                        size={17}
                        className={`shrink-0 transition-transform duration-300 ${
                          bookingMode ===
                          "today"
                            ? "text-white"
                            : "text-slate-400 group-hover:text-blue-500"
                        }`}
                      />

                      <span>
                        Today
                      </span>

                      {bookingMode ===
                        "today" && (
                        <Check
                          size={15}
                          strokeWidth={
                            3
                          }
                          className="ml-0.5 shrink-0 text-white"
                        />
                      )}
                    </button>

                    {/* Advance Booking */}
                    <button
                      onClick={() =>
                        setBookingMode(
                          "advance"
                        )
                      }
                      className={`group flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                        bookingMode ===
                        "advance"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gradient-to-r from-blue-200 to-indigo-200 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                      }`}
                    >
                      <Clock3
                        size={17}
                        className={`shrink-0 transition-transform duration-300 ${
                          bookingMode ===
                          "advance"
                            ? "text-white"
                            : "text-slate-400 group-hover:text-blue-500"
                        }`}
                      />

                      <span className="truncate">
                        Advance Booking
                      </span>

                      {bookingMode ===
                        "advance" && (
                        <Check
                          size={15}
                          strokeWidth={
                            3
                          }
                          className="ml-0.5 shrink-0 text-white"
                        />
                      )}
                    </button>

                    {/* Quick Days */}
                    <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-1.5 rounded-xl px-1.5 py-1.5 sm:col-span-2 lg:col-span-1">
                      {bookingMode ===
                        "advance" &&
                        [7, 15, 30].map(
                          (days) => (
                            <button
                              key={
                                days
                              }
                              onClick={() =>
                                setNextDays(
                                  days
                                )
                              }
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 sm:flex-none"
                            >
                              Next{" "}
                              {days}{" "}
                              Days
                            </button>
                          )
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              {bookingMode ===
                "advance" && (
                <div className="border-b border-slate-100 px-3 py-4 sm:px-5">
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
                          min={formatISO(
                            today
                          )}
                          value={
                            startDate
                          }
                          onChange={(
                            e
                          ) =>
                            handleStartDate(
                              e.target
                                .value
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
                            formatISO(
                              today
                            )
                          }
                          value={
                            endDate
                          }
                          onChange={(
                            e
                          ) =>
                            setEndDate(
                              e.target
                                .value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Information */}
              <div className="border-b border-slate-100 px-3 py-4 sm:px-5">
                <div className="space-y-3">
                  {bookingDates.map(
                    (date) => {
                      const menuData =
                        getMenusForDate(
                          date
                        );

                      const selectedMenu =
                        getSelectedMenu(
                          date
                        );

                      return (
                        <div
                          key={date}
                          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
                        >
                          {/* Compact Meal Header */}
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Info
                                  size={
                                    18
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold leading-none text-slate-800">
                                  Menu Information
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                  Choose your menu
                                </p>
                              </div>
                            </div>

                            {selectedMenu && (
                              <div className="flex max-w-[45%] shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                <Check
                                  size={
                                    11
                                  }
                                  strokeWidth={
                                    3
                                  }
                                />

                                <span className="truncate">
                                  {
                                    selectedMenu.name
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          {bookingMode ===
                            "advance" && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-700">
                                {formatDate(
                                  date
                                )}
                              </p>
                            </div>
                          )}

                          {loadingMenus ? (
                            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                <Info
                                  size={
                                    15
                                  }
                                />
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-slate-700">
                                  Loading menu...
                                </p>
                              </div>
                            </div>
                          ) : menuData.length >
                            0 ? (
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                              {menuData.map(
                                (
                                  menu,
                                  index
                                ) => {
                                  const isSelected =
                                    selectedMenu?.id ===
                                    menu.id;

                                  return (
                                    <button
                                      key={
                                        menu.id
                                      }
                                      type="button"
                                      onClick={() =>
                                        selectMenu(
                                          date,
                                          menu
                                        )
                                      }
                                      className={`relative min-w-0 rounded-xl border p-3 text-left transition-all duration-200 ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-200"
                                          : "border-slate-300 bg-slate-50/40 hover:border-indigo-300 hover:bg-indigo-50/30"
                                      }`}
                                    >
                                      {/* Menu Top */}
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                                              isSelected
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white text-slate-500 ring-1 ring-slate-200"
                                            }`}
                                          >
                                            {index +
                                              1}
                                          </div>

                                          <span className="truncate text-xs font-bold text-slate-700">
                                            {
                                              menu.name
                                            }
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
                                              size={
                                                11
                                              }
                                              strokeWidth={
                                                3
                                              }
                                              className="text-white"
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* Selected Combination Items */}
                                      <div className="flex flex-wrap gap-1.5">
                                        {menu.items.map(
                                          (
                                            item
                                          ) => (
                                            <span
                                              key={
                                                item.id
                                              }
                                              className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${
                                                item.item_type ===
                                                "Alternative"
                                                  ? "bg-purple-50 text-purple-600 ring-1 ring-purple-100"
                                                  : "bg-white text-slate-500 ring-1 ring-slate-100"
                                              }`}
                                            >
                                              <span
                                                className={`h-1 w-1 shrink-0 rounded-full ${
                                                  item.item_type ===
                                                  "Alternative"
                                                    ? "bg-purple-400"
                                                    : "bg-indigo-400"
                                                }`}
                                              />

                                              <span className="truncate">
                                                {
                                                  item.name
                                                }
                                              </span>

                                              {item.item_type ===
                                                "Alternative" && (
                                                <span className="ml-0.5 shrink-0 text-[9px] opacity-70">
                                                  Alt
                                                </span>
                                              )}
                                            </span>
                                          )
                                        )}
                                      </div>

                                      {/* Selected Indicator */}
                                      {isSelected && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                                          <Check
                                            size={
                                              12
                                            }
                                            strokeWidth={
                                              3
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
                          ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                <Info
                                  size={
                                    15
                                  }
                                />
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
                    }
                  )}
                </div>
              </div>

              {/* Summary Spacer */}
              <div className="h-24 sm:h-20" />
            </section>
          </main>

          {/* Fixed Booking Summary */}
          <div className="sticky bottom-3 z-50 mt-5">
            <div className="mx-auto w-full max-w-5xl">
              <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-2xl ring-1 ring-black/10 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 sm:text-xs">
                      Booking Summary
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold sm:text-sm">
                        {totalDays}{" "}
                        {totalDays === 1
                          ? "Day"
                          : "Days"}
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-xs font-semibold sm:text-sm">
                        1 Meal
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-xs font-semibold sm:text-sm">
                        {totalMealBookings}{" "}
                        Bookings
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={openConfirmation}
                    className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 sm:w-auto sm:px-5 sm:py-3"
                  >
                    <span className="truncate">
                      {editingBooking
                        ? "Update Booking"
                        : "Review Booking"}
                    </span>

                    <ChevronRight
                      size={17}
                      className="shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[85vh]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">
                  Confirm Booking
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Please check your booking before confirming.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowConfirm(
                    false
                  )
                }
                className="ml-3 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {/* Date */}
              <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {startDate ===
                  endDate
                    ? formatDate(
                        startDate
                      )
                    : `${formatDate(
                        startDate
                      )} – ${formatDate(
                        endDate
                      )}`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {totalDays}{" "}
                  {totalDays ===
                  1
                    ? "day"
                    : "days"}
                </p>
              </div>

              {/* Meals & Menus */}
              <div>
                <div className="space-y-2">
                  {bookingDates.map(
                    (date) => {
                      const selectedMenu =
                        getSelectedMenu(
                          date
                        );

                      const menu =
                        getMenuForDetails(
                          date,
                          selectedMenu
                        );

                      return (
                        <div
                          key={date}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {formatDate(
                                date
                              )}
                            </span>

                            {menu ? (
                              <span className="max-w-[50%] truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                {
                                  menu.name
                                }
                              </span>
                            ) : (
                              <span className="text-right text-xs text-slate-400">
                                No menu selected
                              </span>
                            )}
                          </div>

                          {menu && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {menu.items.map(
                                (
                                  item
                                ) => (
                                  <span
                                    key={
                                      item.id
                                    }
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                                      item.item_type ===
                                      "Alternative"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {
                                      item.name
                                    }

                                    {item.item_type ===
                                      "Alternative" && (
                                      <span className="ml-1 text-[9px] opacity-70">
                                        Alternative
                                      </span>
                                    )}
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
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:gap-3 sm:p-5">
              <button
                onClick={() =>
                  setShowConfirm(
                    false
                  )
                }
                className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Go Back
              </button>

              <button
                onClick={
                  confirmBooking
                }
                disabled={booking}
                className="min-h-[44px] flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {booking
                  ? "Booking..."
                  : editingBooking
                  ? "Update Booking"
                  : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[85vh]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">
                  Booking Details
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Booking information
                </p>
              </div>

              <button
                onClick={() =>
                  setShowDetails(
                    null
                  )
                }
                className="ml-3 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
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

              <div>
                <p className="text-xs text-slate-400">
                  Meals & Menus
                </p>

                <div className="mt-2 space-y-3">
                  {bookingDates.map(
                    (date) => {
                      const selectedMenu =
                        showDetails
                          .selectedMenus[
                          getSelectionKey(
                            date
                          )
                        ];

                      const menu =
                        selectedMenu;

                      return (
                        <div
                          key={date}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {formatDate(
                                date
                              )}
                            </span>

                            {menu && (
                              <span className="max-w-[50%] truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                {
                                  menu.name
                                }
                              </span>
                            )}
                          </div>

                          {menu ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {menu.items.map(
                                (
                                  item
                                ) => (
                                  <span
                                    key={
                                      item.id
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                                      item.item_type ===
                                      "Alternative"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {
                                      item.name
                                    }

                                    {item.item_type ===
                                      "Alternative" && (
                                      <span className="ml-1 text-[9px] opacity-70">
                                        Alternative
                                      </span>
                                    )}
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
                  {
                    showDetails.status
                  }
                </span>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 p-4 sm:p-5">
              <button
                onClick={() =>
                  setShowDetails(
                    null
                  )
                }
                className="min-h-[44px] w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
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