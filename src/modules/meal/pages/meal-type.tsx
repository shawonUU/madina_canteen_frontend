import {
  Plus,
  Edit,
  Trash2,
  Utensils,
  Save,
  X,
  RefreshCw,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";

import api from "../../../services/api";

interface MealType {
  id: number;
  name: string;
  description?: string | null;
  booking_cutoff_time: string;
  meal_rate: string | number;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}

export default function MealTypePage() {
  const [openSidebar, setOpenSidebar] = useState(false);

  const [mealTypes, setMealTypes] = useState<MealType[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bookingCutoffTime, setBookingCutoffTime] =
    useState("");

  const [mealRate, setMealRate] = useState("");

  const [status, setStatus] = useState<
    "Active" | "Inactive"
  >("Active");

  const [editId, setEditId] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  // =========================
  // Load Meal Types
  // =========================

  const loadMealTypes = async () => {
    try {
      setLoading(true);

      const response = await api.get("/meal-types");

      console.log("Meal Types:", response.data);

      setMealTypes(
        response.data?.data?.data || []
      );

    } catch (error: any) {
      console.error(
        "Failed to load meal types:",
        error?.response?.data || error
      );

      setMealTypes([]);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadMealTypes();
  }, []);


  // =========================
  // Save / Update
  // =========================

  const saveMealType = async () => {
    if (!name.trim()) {
      alert("Please enter meal type name.");
      return;
    }

    if (!bookingCutoffTime) {
      alert("Please select booking cutoff time.");
      return;
    }

    if (
      mealRate === "" ||
      Number(mealRate) < 0
    ) {
      alert("Please enter a valid meal rate.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description:
          description.trim() || null,
        booking_cutoff_time:
          bookingCutoffTime,
        meal_rate: Number(mealRate),
        status,
      };

      if (editId !== null) {
        await api.put(
          `/meal-types/${editId}`,
          payload
        );

        alert(
          "Meal type updated successfully."
        );
      } else {
        await api.post(
          "/meal-types",
          payload
        );

        alert(
          "Meal type created successfully."
        );
      }

      resetForm();

      await loadMealTypes();

    } catch (error: any) {
      console.error(
        "Failed to save meal type:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save meal type."
      );

    } finally {
      setSaving(false);
    }
  };


  // =========================
  // Edit
  // =========================

  const editMealType = (item: MealType) => {
    setName(item.name);

    setDescription(
      item.description || ""
    );

    setBookingCutoffTime(
      item.booking_cutoff_time?.substring(
        0,
        5
      ) || ""
    );

    setMealRate(
      String(item.meal_rate)
    );

    setStatus(item.status);

    setEditId(item.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // =========================
  // Delete
  // =========================

  const deleteMealType = async (
    id: number
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meal type?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/meal-types/${id}`
      );

      alert(
        "Meal type deleted successfully."
      );

      await loadMealTypes();

    } catch (error: any) {
      console.error(
        "Failed to delete meal type:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to delete meal type."
      );
    }
  };


  // =========================
  // Reset Form
  // =========================

  const resetForm = () => {
    setName("");
    setDescription("");
    setBookingCutoffTime("");
    setMealRate("");
    setStatus("Active");

    setEditId(null);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">

      {/* ================= SIDE NAV ================= */}

      <SideNav
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />


      <main className="flex-1">

        {/* ================= TOP NAV ================= */}

        <TopNav
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />


        {/* ================= CONTENT ================= */}

        <div className="p-5">

          {/* ================= HEADER ================= */}

          <div className="mb-6">

            <h2 className="text-3xl font-bold text-gray-800">
              Meal Type Management
            </h2>

            <p className="text-gray-500 mt-1">
              Create and manage meal types
            </p>

          </div>


          <div className="grid lg:grid-cols-3 gap-6 ">

            {/* ================= FORM ================= */}

            <div className="bg-white rounded-3xl shadow-lg p-6 h-fit">

              {/* Icon */}

              <div className="bg-indigo-100 p-3 rounded-2xl w-fit">

                <Utensils
                  className="text-indigo-600"
                  size={24}
                />

              </div>


              {/* Title */}

              <div className="flex items-center justify-between mt-5 ">

                <div>

                  <h3 className="text-xl font-bold text-gray-800">

                    {editId !== null
                      ? "Update Meal Type"
                      : "Create Meal Type"}

                  </h3>

                  <p className="text-sm text-gray-500 mt-1">

                    {editId !== null
                      ? "Update existing meal type"
                      : "Add a new meal type"}

                  </p>

                </div>


                {editId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
                    title="Cancel Edit"
                  >
                    <X size={18} />
                  </button>
                )}

              </div>


              {/* ================= NAME ================= */}

              <div className="mt-5">

                <label className="block text-sm font-semibold text-gray-700 mb-2">

                  Meal Type Name

                  <span className="text-red-500">
                    {" "}*
                  </span>

                </label>


                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Breakfast"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />

              </div>


              {/* ================= DESCRIPTION ================= */}

              <div className="mt-4">

                <label className="block text-sm font-semibold text-gray-700 mb-2">

                  Description

                </label>


                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter description"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />

              </div>


              {/* ================= CUTOFF TIME ================= */}

              <div className="mt-4">

                <label className="block text-sm font-semibold text-gray-700 mb-2">

                  Booking Cutoff Time

                  <span className="text-red-500">
                    {" "}*
                  </span>

                </label>


                <input
                  type="time"
                  value={bookingCutoffTime}
                  onChange={(e) =>
                    setBookingCutoffTime(
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />

              </div>


              {/* ================= MEAL RATE ================= */}

              <div className="mt-4">

                <label className="block text-sm font-semibold text-gray-700 mb-2">

                  Meal Rate

                  <span className="text-red-500">
                    {" "}*
                  </span>

                </label>


                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ৳
                  </span>


                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={mealRate}
                    onChange={(e) =>
                      setMealRate(
                        e.target.value
                      )
                    }
                    placeholder="Enter meal rate"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-9 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />

                </div>

              </div>


              {/* ================= STATUS ================= */}

              <div className="mt-4">

                <label className="block text-sm font-semibold text-gray-700 mb-2">

                  Status

                </label>


                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "Active"
                        | "Inactive"
                    )
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

              </div>


              {/* ================= SAVE ================= */}

              <button
                type="button"
                onClick={saveMealType}
                disabled={saving}
                className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="inline mr-2 animate-spin"
                    />

                    Saving...
                  </>
                ) : editId !== null ? (
                  <>
                    <Save
                      size={18}
                      className="inline mr-2"
                    />

                    Update Meal Type
                  </>
                ) : (
                  <>
                    <Plus
                      size={18}
                      className="inline mr-2"
                    />

                    Save Meal Type
                  </>
                )}

              </button>


              {/* ================= CANCEL ================= */}

              {editId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel Update
                </button>
              )}

            </div>


            {/* ================= LIST ================= */}

            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6">

              {/* Header */}

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="text-xl font-bold text-gray-800">
                    Meal Type List
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">

                    {mealTypes.length} meal type
                    {mealTypes.length !== 1
                      ? "s"
                      : ""}{" "}
                    found

                  </p>

                </div>


                <button
                  type="button"
                  onClick={loadMealTypes}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                  title="Refresh"
                >

                  <RefreshCw
                    size={18}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                </button>

              </div>


              {/* Loading */}

              {loading ? (

                <div className="py-12 text-center text-gray-500">

                  <RefreshCw
                    size={25}
                    className="mx-auto animate-spin mb-2"
                  />

                  Loading meal types...

                </div>

              ) : mealTypes.length === 0 ? (

                /* Empty */

                <div className="py-12 text-center">

                  <div className="bg-gray-100 p-4 rounded-2xl w-fit mx-auto">

                    <Utensils className="text-gray-400" />

                  </div>


                  <p className="font-semibold text-gray-600 mt-4">
                    No meal types found
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Create your first meal type.
                  </p>

                </div>

              ) : (

                /* List */

                <div className="space-y-3">

                  {mealTypes.map(
                    (item, index) => (

                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-gray-100 transition"
                      >

                        {/* Information */}

                        <div className="flex items-center gap-4">

                          {/* Number */}

                          <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0">

                            {index + 1}

                          </div>


                          <div>

                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>


                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}


                            <div className="flex flex-wrap items-center gap-3 mt-2">

                              <span className="text-sm text-gray-500">

                                Cutoff:{" "}

                                <strong className="text-gray-700">

                                  {item.booking_cutoff_time?.substring(
                                    0,
                                    5
                                  )}

                                </strong>

                              </span>


                              <span className="text-sm text-gray-500">

                                Rate:{" "}

                                <strong className="text-gray-700">

                                  ৳
                                  {Number(
                                    item.meal_rate
                                  ).toFixed(0)}

                                </strong>

                              </span>

                            </div>

                          </div>

                        </div>


                        {/* Right */}

                        <div className="flex items-center gap-3">

                          {/* Status */}

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.status ===
                              "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >

                            {item.status}

                          </span>


                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() =>
                              editMealType(
                                item
                              )
                            }
                            className="bg-blue-100 p-2 rounded-lg text-blue-600 hover:bg-blue-200 transition"
                            title="Edit"
                          >

                            <Edit size={18} />

                          </button>


                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteMealType(
                                item.id
                              )
                            }
                            className="bg-red-100 p-2 rounded-lg text-red-600 hover:bg-red-200 transition"
                            title="Delete"
                          >

                            <Trash2 size={18} />

                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}