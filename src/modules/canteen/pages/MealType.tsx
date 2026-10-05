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

import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";

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

const initialForm = {
  name: "",
  description: "",
  bookingCutoffTime: "",
  mealRate: "",
  status: "Active" as "Active" | "Inactive",
};

export default function MealTypePage() {
  const [openSidebar, setOpenSidebar] = useState(false);

  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({ ...initialForm });

  const loadMealTypes = async () => {
    try {
      setLoading(true);

      const response = await api.get("/meal-types");

      setMealTypes(response.data?.data?.data || []);
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

  const openCreateModal = () => {
    setEditId(null);
    setForm({ ...initialForm });
    setModalOpen(true);
  };

  const openEditModal = (item: MealType) => {
    setEditId(item.id);

    setForm({
      name: item.name,
      description: item.description || "",
      bookingCutoffTime:
        item.booking_cutoff_time?.substring(0, 5) || "",
      mealRate: String(item.meal_rate),
      status: item.status,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditId(null);
    setForm({ ...initialForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter meal type name.");
      return;
    }

    if (!form.bookingCutoffTime) {
      alert("Please select booking cutoff time.");
      return;
    }

    if (
      form.mealRate === "" ||
      Number(form.mealRate) < 0
    ) {
      alert("Please enter a valid meal rate.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        booking_cutoff_time: form.bookingCutoffTime,
        meal_rate: Number(form.mealRate),
        status: form.status,
      };

      if (editId !== null) {
        await api.put(
          `/meal-types/${editId}`,
          payload
        );

        alert("Meal type updated successfully.");
      } else {
        await api.post("/meal-types", payload);

        alert("Meal type created successfully.");
      }

      setModalOpen(false);
      setEditId(null);
      setForm({ ...initialForm });

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

  const deleteMealType = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meal type?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/meal-types/${id}`);

      alert("Meal type deleted successfully.");

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

        <div className="p-5">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Meal Type Management
              </h2>

              <p className="text-gray-500 mt-1">
                Create and manage meal types
              </p>
            </div>

            {/* <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold"
            >
              <Plus size={18} />
              Add Meal Type
            </button> */}
          </div>

          {/* List */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Meal Type List
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {mealTypes.length} meal type
                  {mealTypes.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <button
                type="button"
                onClick={loadMealTypes}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
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
                {mealTypes.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
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

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(item)
                        }
                        className="bg-blue-100 p-2 rounded-lg text-blue-600 hover:bg-blue-200 transition"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteMealType(item.id)
                        }
                        className="bg-red-100 p-2 rounded-lg text-red-600 hover:bg-red-200 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= MODAL ================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Utensils
                    size={21}
                    className="text-indigo-600"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {editId !== null
                      ? "Update Meal Type"
                      : "Create Meal Type"}
                  </h3>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {editId !== null
                      ? "Update existing meal type information"
                      : "Add a new meal type"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col min-h-0"
            >
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meal Type Name
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Breakfast"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter description"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Cutoff + Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Booking Cutoff Time
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="time"
                      value={form.bookingCutoffTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bookingCutoffTime:
                            e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meal Rate
                      <span className="text-red-500"> *</span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        ৳
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.mealRate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            mealRate:
                              e.target.value,
                          })
                        }
                        placeholder="Enter meal rate"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-9 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as
                          | "Active"
                          | "Inactive",
                      })
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
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : editId !== null ? (
                    <>
                      <Save size={16} />
                      Update Meal Type
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Meal Type
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}