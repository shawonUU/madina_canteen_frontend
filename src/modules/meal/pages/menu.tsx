import {
    Plus,
    Edit,
    Trash2,
    Utensils,
    Save,
    X,
    RefreshCw,
    Search,
    CalendarDays,
    Eye,
    GitBranch,
    ChevronDown,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";

import api from "../../../services/api";


/* ============================================================
   TYPES
============================================================ */

interface MealType {
    id: number;
    name: string;
}

interface AlternativeItem {
    id: number;
    item_name: string;
    item_type: "Alternative";
    alternative_of: number;
}

interface MenuItem {
    id?: number;
    item_name: string;
    item_type?: "Main";
    alternate?: AlternativeItem | null;
}

interface Menu {
    id: number;
    menu_date: string;
    meal_type_id: number;
    meal_type?: MealType;
    items: MenuItem[];
}


/* ============================================================
   HELPER
============================================================ */

const extractArray = <T,>(response: any): T[] => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    return [];
};


/* ============================================================
   COMPONENT
============================================================ */

export default function MenuPage() {

    const [openSidebar, setOpenSidebar] = useState(false);

    const [menus, setMenus] = useState<Menu[]>([]);
    const [mealTypes, setMealTypes] = useState<MealType[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* Filters */
    const [filterDate, setFilterDate] = useState("");
    const [filterMealType, setFilterMealType] = useState("");
    const [search, setSearch] = useState("");

    /* Form Modal */
    const [showFormModal, setShowFormModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [menuDate, setMenuDate] = useState("");
    const [mealTypeId, setMealTypeId] = useState("");

    const [items, setItems] = useState<MenuItem[]>([
        {
            item_name: "",
            alternate: null,
        },
    ]);

    /* Details */
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

    /* Delete */
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);


    /* ============================================================
       LOAD MENUS
    ============================================================ */

    const loadMenus = async () => {
        try {
            setLoading(true);

            const params: Record<string, string> = {};

            if (filterDate) {
                params.menu_date = filterDate;
            }

            if (filterMealType) {
                params.meal_type_id = filterMealType;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await api.get("/menus", {
                params,
            });

            setMenus(extractArray<Menu>(res.data));

        } catch (error: any) {
            console.error(
                "Failed to load menus:",
                error?.response?.data || error
            );

            setMenus([]);
        } finally {
            setLoading(false);
        }
    };


    /* ============================================================
       LOAD MEAL TYPES
    ============================================================ */

    const loadMealTypes = async () => {
        try {
            const res = await api.get("/meal-types");

            setMealTypes(
                extractArray<MealType>(res.data)
            );

        } catch (error: any) {
            console.error(
                "Failed to load meal types:",
                error?.response?.data || error
            );

            setMealTypes([]);
        }
    };


    useEffect(() => {
        loadMealTypes();
    }, []);


    useEffect(() => {
        const timer = setTimeout(() => {
            loadMenus();
        }, 300);

        return () => clearTimeout(timer);
    }, [
        filterDate,
        filterMealType,
        search,
    ]);


    /* ============================================================
       CREATE
    ============================================================ */

    const openCreateModal = () => {
        setEditId(null);

        setMenuDate(
            new Date().toISOString().substring(0, 10)
        );

        setMealTypeId("");

        setItems([
            {
                item_name: "",
                alternate: null,
            },
        ]);

        setShowFormModal(true);
    };


    /* ============================================================
       EDIT
    ============================================================ */

    const openEditModal = async (menu: Menu) => {
        try {
            setSaving(true);

            const res = await api.get(
                `/menus/${menu.id}`
            );

            const data: Menu =
                res.data?.data || res.data;

            setEditId(data.id);

            setMenuDate(
                data.menu_date?.substring(0, 10) || ""
            );

            setMealTypeId(
                String(data.meal_type_id)
            );

            const mappedItems: MenuItem[] =
                (data.items || []).map((item) => ({
                    id: item.id,
                    item_name: item.item_name,

                    alternate: item.alternate
                        ? {
                            id: item.alternate.id,
                            item_name:
                                item.alternate.item_name,
                            item_type: "Alternative",
                            alternative_of:
                                item.id as number,
                        }
                        : null,
                }));

            setItems(
                mappedItems.length
                    ? mappedItems
                    : [
                        {
                            item_name: "",
                            alternate: null,
                        },
                    ]
            );

            setShowFormModal(true);

        } catch (error: any) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to load menu."
            );
        } finally {
            setSaving(false);
        }
    };


    /* ============================================================
       CLOSE FORM
    ============================================================ */

    const closeFormModal = () => {
        if (saving) return;

        setShowFormModal(false);
        setEditId(null);

        setMenuDate("");
        setMealTypeId("");

        setItems([
            {
                item_name: "",
                alternate: null,
            },
        ]);
    };


    /* ============================================================
       ITEM MANAGEMENT
    ============================================================ */

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                item_name: "",
                alternate: null,
            },
        ]);
    };


    const removeItem = (index: number) => {
        if (items.length === 1) return;

        setItems((prev) =>
            prev.filter(
                (_, i) => i !== index
            )
        );
    };


    const updateItemName = (
        index: number,
        value: string
    ) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        item_name: value,
                    }
                    : item
            )
        );
    };


    const updateAlternative = (
        index: number,
        value: string
    ) => {
        setItems((prev) =>
            prev.map((item, i) => {

                if (i !== index) {
                    return item;
                }

                if (item.alternate) {
                    return {
                        ...item,
                        alternate: {
                            ...item.alternate,
                            item_name: value,
                        },
                    };
                }

                return {
                    ...item,
                    alternate:
                        value.trim()
                            ? {
                                id: 0,
                                item_name: value,
                                item_type:
                                    "Alternative",
                                alternative_of:
                                    item.id || 0,
                            }
                            : null,
                };
            })
        );
    };


    const removeAlternative = (
        index: number
    ) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        alternate: null,
                    }
                    : item
            )
        );
    };


    /* ============================================================
       SAVE
    ============================================================ */

    const saveMenu = async () => {

        if (!menuDate) {
            alert("Please select menu date.");
            return;
        }

        if (!mealTypeId) {
            alert("Please select meal type.");
            return;
        }

        if (!items.length) {
            alert("Please add at least one item.");
            return;
        }

        const cleanedItems = items.map(
            (item) => ({
                ...(item.id
                    ? { id: item.id }
                    : {}),

                item_name:
                    item.item_name.trim(),

                alternate_item_name:
                    item.alternate?.item_name?.trim() ||
                    null,

                ...(item.alternate?.id &&
                    item.alternate.id > 0
                    ? {
                        alternate_id:
                            item.alternate.id,
                    }
                    : {}),
            })
        );

        if (
            cleanedItems.some(
                (item) =>
                    !item.item_name
            )
        ) {
            alert(
                "Every menu item must have a name."
            );
            return;
        }

        const payload = {
            menu_date: menuDate,
            meal_type_id: Number(mealTypeId),
            items: cleanedItems,
        };

        try {
            setSaving(true);

            if (editId) {
                await api.put(
                    `/menus/${editId}`,
                    payload
                );

                alert(
                    "Menu updated successfully."
                );
            } else {
                await api.post(
                    "/menus",
                    payload
                );

                alert(
                    "Menu created successfully."
                );
            }

            closeFormModal();

            await loadMenus();

        } catch (error: any) {

            console.error(
                error?.response?.data || error
            );

            const errors =
                error?.response?.data?.errors;

            if (errors) {
                const first =
                    Object.values(errors)
                        .flat()[0];

                alert(String(first));
            } else {
                alert(
                    error?.response?.data?.message ||
                    "Failed to save menu."
                );
            }

        } finally {
            setSaving(false);
        }
    };


    /* ============================================================
       DETAILS
    ============================================================ */

    const openDetails = async (
        menu: Menu
    ) => {
        try {
            const res = await api.get(
                `/menus/${menu.id}`
            );

            const data =
                res.data?.data || res.data;

            setSelectedMenu(data);
            setShowDetailsModal(true);

        } catch {
            setSelectedMenu(menu);
            setShowDetailsModal(true);
        }
    };


    /* ============================================================
       DELETE
    ============================================================ */

    const confirmDelete = (
        menu: Menu
    ) => {
        setDeleteTarget(menu);
        setShowDeleteModal(true);
    };


    const deleteMenu = async () => {

        if (!deleteTarget) return;

        try {
            setDeleting(true);

            await api.delete(
                `/menus/${deleteTarget.id}`
            );

            setShowDeleteModal(false);
            setDeleteTarget(null);

            alert(
                "Menu deleted successfully."
            );

            await loadMenus();

        } catch (error: any) {

            alert(
                error?.response?.data?.message ||
                "Failed to delete menu."
            );

        } finally {
            setDeleting(false);
        }
    };


    /* ============================================================
       HELPERS
    ============================================================ */

    const getMealTypeName = (
        id: number
    ) => {
        return (
            mealTypes.find(
                (item) => item.id === id
            )?.name ||
            `Meal Type #${id}`
        );
    };


    const formatDate = (
        date?: string
    ) => {
        if (!date) return "";

        return new Date(
            `${date.substring(0, 10)}T00:00:00`
        ).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    const clearFilters = () => {
        setFilterDate("");
        setFilterMealType("");
        setSearch("");
    };


    const totalItems = useMemo(
        () =>
            menus.reduce(
                (total, menu) =>
                    total +
                    (menu.items?.length || 0),
                0
            ),
        [menus]
    );


    const totalAlternatives = useMemo(
        () =>
            menus.reduce(
                (total, menu) =>
                    total +
                    (menu.items || []).filter(
                        (item) =>
                            !!item.alternate
                    ).length,
                0
            ),
        [menus]
    );


    /* ============================================================
       UI
    ============================================================ */

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">

            {/* SIDEBAR */}

            <SideNav
                openSidebar={openSidebar}
                setOpenSidebar={setOpenSidebar}
            />


            {/* MAIN */}

            <main className="flex-1">

                <TopNav
                    openSidebar={openSidebar}
                    setOpenSidebar={setOpenSidebar}
                />


                <div className="px-3 sm:px-5 lg:px-7 py-4 sm:py-5">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

                        <div className="min-w-0">

                            <div className="flex items-center gap-3">

                                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">

                                    <Utensils
                                        size={21}
                                        className="text-white"
                                    />

                                </div>


                                <div className="min-w-0">

                                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 truncate">
                                        Menu Management
                                    </h1>

                                    <p className="text-xs sm:text-sm text-slate-500">
                                        Manage daily canteen menus
                                    </p>

                                </div>

                            </div>

                        </div>


                        <button
                            onClick={
                                openCreateModal
                            }
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"
                        >

                            <Plus size={18} />

                            Create Menu

                        </button>

                    </div>


                    {/* =================================================
                        SMALL STATS
                    ================================================= */}

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">

                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-3">

                            <p className="text-[11px] sm:text-xs text-slate-500">
                                Menus
                            </p>

                            <p className="text-lg sm:text-xl font-black text-slate-800">
                                {menus.length}
                            </p>

                        </div>


                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-3">

                            <p className="text-[11px] sm:text-xs text-slate-500">
                                Items
                            </p>

                            <p className="text-lg sm:text-xl font-black text-slate-800">
                                {totalItems}
                            </p>

                        </div>


                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-3">

                            <p className="text-[11px] sm:text-xs text-slate-500">
                                Alternatives
                            </p>

                            <p className="text-lg sm:text-xl font-black text-slate-800">
                                {totalAlternatives}
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        FILTER
                    ================================================= */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4">

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] gap-2">

                            {/* Search */}

                            <div className="relative">

                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search menu item..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>


                            {/* Date */}

                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) =>
                                    setFilterDate(
                                        e.target.value
                                    )
                                }
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            />


                            {/* Meal */}

                            <select
                                value={
                                    filterMealType
                                }
                                onChange={(e) =>
                                    setFilterMealType(
                                        e.target.value
                                    )
                                }
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            >

                                <option value="">
                                    All Meal Types
                                </option>

                                {mealTypes.map(
                                    (type) => (
                                        <option
                                            key={
                                                type.id
                                            }
                                            value={
                                                type.id
                                            }
                                        >
                                            {
                                                type.name
                                            }
                                        </option>
                                    )
                                )}

                            </select>


                            <div className="flex gap-2">

                                {(filterDate ||
                                    filterMealType ||
                                    search) && (

                                    <button
                                        onClick={
                                            clearFilters
                                        }
                                        className="flex-1 lg:flex-none px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold"
                                    >
                                        Clear
                                    </button>

                                )}


                                <button
                                    onClick={
                                        loadMenus
                                    }
                                    className="px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                >

                                    <RefreshCw size={17} className={ loading ? "animate-spin" : "" }  />

                                </button>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        LIST HEADER
                    ================================================= */}

                    <div className="hidden md:grid grid-cols-[70px_150px_130px_1fr_130px] gap-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">

                        <span>ID</span>

                        <span>Date</span>

                        <span>Meal Type</span>

                        <span>Items</span>

                        <span className="text-right">
                            Actions
                        </span>

                    </div>


                    {/* =================================================
                        MENU LIST
                    ================================================= */}

                    {loading ? (

                        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center">

                            <RefreshCw
                                size={25}
                                className="mx-auto animate-spin text-indigo-600"
                            />

                            <p className="text-sm text-slate-500 mt-3">
                                Loading menus...
                            </p>

                        </div>

                    ) : menus.length === 0 ? (

                        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center">

                            <Utensils
                                size={30}
                                className="mx-auto text-slate-300"
                            />

                            <p className="font-bold text-slate-600 mt-3">
                                No menus found
                            </p>

                            <p className="text-sm text-slate-400 mt-1">
                                Create a menu to get started.
                            </p>

                        </div>

                    ) : (

                        <div className="space-y-1.5">

                            {menus.map(
                                (menu) => (

                                    <div
                                        key={
                                            menu.id
                                        }
                                        className="bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition"
                                    >

                                        {/* DESKTOP */}

                                        <div className="hidden md:grid grid-cols-[70px_150px_130px_1fr_130px] gap-4 items-center px-4 py-3">

                                            {/* ID */}

                                            <div>

                                                <span className="font-bold text-slate-500 text-sm">
                                                    #
                                                    {
                                                        menu.id
                                                    }
                                                </span>

                                            </div>


                                            {/* Date */}

                                            <div>

                                                <p className="text-sm font-semibold text-slate-700">
                                                    {formatDate(
                                                        menu.menu_date
                                                    )}
                                                </p>

                                            </div>


                                            {/* Meal */}

                                            <div>

                                                <span className="inline-flex bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                    {
                                                        menu.meal_type
                                                            ?.name ||
                                                        getMealTypeName(
                                                            menu.meal_type_id
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            {/* Items */}

                                            <div className="flex flex-wrap gap-1.5 min-w-0">

                                                {(menu.items || []).map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <span
                                                            key={
                                                                item.id ||
                                                                index
                                                            }
                                                            className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-medium max-w-[180px]"
                                                        >

                                                            <span className="truncate">
                                                                {
                                                                    item.item_name
                                                                }
                                                            </span>


                                                            {item.alternate && (

                                                                <span
                                                                    title={`Alternative: ${item.alternate.item_name}`}
                                                                    className="text-amber-500 shrink-0"
                                                                >
                                                                    <GitBranch
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </span>

                                                            )}

                                                        </span>

                                                    )
                                                )}

                                            </div>


                                            {/* Actions */}

                                            <div className="flex justify-end gap-1.5">

                                                <button
                                                    onClick={() =>
                                                        openDetails(
                                                            menu
                                                        )
                                                    }
                                                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600"
                                                    title="Details"
                                                >
                                                    <Eye
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        openEditModal(
                                                            menu
                                                        )
                                                    }
                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    title="Edit"
                                                >
                                                    <Edit
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        confirmDelete(
                                                            menu
                                                        )
                                                    }
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                                    title="Delete"
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                            </div>

                                        </div>


                                        {/* MOBILE */}

                                        <div className="md:hidden p-3">

                                            <div className="flex items-center justify-between gap-3 mb-3">

                                                <div className="min-w-0">

                                                    <div className="flex items-center gap-2">

                                                        <span className="text-xs font-bold text-slate-400">
                                                            #
                                                            {
                                                                menu.id
                                                            }
                                                        </span>

                                                        <span className="text-sm font-bold text-slate-700">
                                                            {formatDate(
                                                                menu.menu_date
                                                            )}
                                                        </span>

                                                    </div>

                                                    <span className="inline-block mt-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                                        {
                                                            menu.meal_type
                                                                ?.name ||
                                                            getMealTypeName(
                                                                menu.meal_type_id
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="flex gap-1">

                                                    <button
                                                        onClick={() =>
                                                            openDetails(
                                                                menu
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-slate-100 text-slate-600"
                                                    >
                                                        <Eye
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                menu
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600"
                                                    >
                                                        <Edit
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            confirmDelete(
                                                                menu
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-red-50 text-red-600"
                                                    >
                                                        <Trash2
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>

                                                </div>

                                            </div>


                                            <div className="border-t border-slate-100 pt-2.5 space-y-1.5">

                                                {(menu.items || []).map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            key={
                                                                item.id ||
                                                                index
                                                            }
                                                            className="flex items-start gap-2 text-sm"
                                                        >

                                                            <span className="text-slate-400 w-5 shrink-0">
                                                                {index +
                                                                    1}.
                                                            </span>

                                                            <div className="min-w-0">

                                                                <span className="font-semibold text-slate-700">
                                                                    {
                                                                        item.item_name
                                                                    }
                                                                </span>


                                                                {item.alternate && (

                                                                    <span className="block text-[11px] text-amber-600 mt-0.5">
                                                                        Alternative:{" "}
                                                                        {
                                                                            item
                                                                                .alternate
                                                                                .item_name
                                                                        }
                                                                    </span>

                                                                )}

                                                            </div>

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </main>


            {/* =====================================================
                CREATE / UPDATE MODAL
            ===================================================== */}

            {showFormModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">

                    <div
                        className="absolute inset-0 bg-slate-950/60 "
                        onClick={
                            closeFormModal
                        }
                    />


                    <div className="relative w-full max-w-3xl max-h-[96vh] sm:max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                        {/* Modal Header */}

                        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">

                            <div className="flex items-center gap-3 min-w-0">

                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">

                                    <Utensils
                                        size={19}
                                        className="text-indigo-600"
                                    />

                                </div>


                                <div className="min-w-0">

                                    <h2 className="font-black text-slate-800 text-lg truncate">

                                        {editId
                                            ? "Update Menu"
                                            : "Create Menu"}

                                    </h2>

                                    <p className="text-xs text-slate-500 truncate">
                                        Main items & optional alternatives
                                    </p>

                                </div>

                            </div>


                            <button
                                onClick={
                                    closeFormModal
                                }
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 shrink-0"
                            >

                                <X size={18} />

                            </button>

                        </div>


                        {/* Modal Content */}

                        <div className="overflow-y-auto flex-1 p-4 sm:p-5">

                            {/* Basic Information */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                                <div>

                                    <label className="text-xs font-bold text-slate-600 block mb-1.5">
                                        Menu Date
                                        <span className="text-red-500">
                                            {" "}*
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        readOnly
                                        value={
                                            menuDate
                                        }
                                        onChange={(e) =>
                                            setMenuDate(
                                                e.target.value
                                            )
                                        }
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>


                                <div>

                                    <label className="text-xs font-bold text-slate-600 block mb-1.5">
                                        Meal Type
                                        <span className="text-red-500">
                                            {" "}*
                                        </span>
                                    </label>

                                    <select
                                        value={
                                            mealTypeId
                                        }
                                        onChange={(e) =>
                                            setMealTypeId(
                                                e.target.value
                                            )
                                        }
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    >

                                        <option value="">
                                            Select Meal Type
                                        </option>

                                        {mealTypes.map(
                                            (
                                                type
                                            ) => (

                                                <option
                                                    key={
                                                        type.id
                                                    }
                                                    value={
                                                        type.id
                                                    }
                                                >
                                                    {
                                                        type.name
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                            </div>


                            {/* Items Header */}

                            <div className="flex items-center justify-between mb-2.5">

                                <div>

                                    <h3 className="font-black text-slate-800">
                                        Menu Items
                                    </h3>

                                    <p className="text-[11px] text-slate-400">
                                        One optional alternative per item
                                    </p>

                                </div>


                                <button
                                    onClick={
                                        addItem
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100"
                                >

                                    <Plus size={15} />

                                    Add Item

                                </button>

                            </div>


                            {/* Item List */}

                            <div className="space-y-2">

                                {items.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                item.id ||
                                                `new-${index}`
                                            }
                                            className="border border-slate-200 rounded-xl p-3 bg-slate-50"
                                        >

                                            <div className="grid grid-cols-[30px_1fr_30px] sm:grid-cols-[30px_1fr_1fr_30px] gap-2 items-start">

                                                {/* Number */}

                                                <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                                    {index +
                                                        1}
                                                </div>


                                                {/* Main */}

                                                <div className="min-w-0">

                                                    <label className="block text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">
                                                        Main Item
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            item.item_name
                                                        }
                                                        onChange={(e) =>
                                                            updateItemName(
                                                                index,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="e.g. Beef"
                                                        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />

                                                </div>


                                                {/* Alternative */}

                                                <div className="min-w-0 col-span-1 sm:col-auto">

                                                    <label className="block text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">

                                                        Alternative

                                                        <span className="text-amber-600 ml-1 normal-case">
                                                            optional
                                                        </span>

                                                    </label>


                                                    <div className="relative">

                                                        <input
                                                            type="text"
                                                            value={
                                                                item
                                                                    .alternate
                                                                    ?.item_name ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateAlternative(
                                                                    index,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g. Chicken"
                                                            className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm pr-8 outline-none focus:ring-2 focus:ring-amber-400"
                                                        />


                                                        {item
                                                            .alternate
                                                            ?.item_name && (

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeAlternative(
                                                                        index
                                                                    )
                                                                }
                                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded"
                                                            >

                                                                <X
                                                                    size={
                                                                        13
                                                                    }
                                                                />

                                                            </button>

                                                        )}

                                                    </div>

                                                </div>


                                                {/* Delete */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(
                                                            index
                                                        )
                                                    }
                                                    disabled={
                                                        items.length ===
                                                        1
                                                    }
                                                    className="mt-5 p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                                                >

                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />

                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* Footer */}

                        <div className="border-t border-slate-200 px-4 sm:px-5 py-3 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">

                            <button
                                onClick={
                                    closeFormModal
                                }
                                disabled={
                                    saving
                                }
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    saveMenu
                                }
                                disabled={
                                    saving
                                }
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                            >

                                {saving ? (

                                    <>
                                        <RefreshCw
                                            size={16}
                                            className="animate-spin"
                                        />

                                        Saving...
                                    </>

                                ) : (

                                    <>
                                        <Save
                                            size={16}
                                        />

                                        {editId
                                            ? "Update Menu"
                                            : "Save Menu"}
                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                DETAILS MODAL
            ===================================================== */}

            {showDetailsModal &&
                selectedMenu && (

                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">

                    <div
                        className="absolute inset-0 bg-slate-950/60 "
                        onClick={() =>
                            setShowDetailsModal(
                                false
                            )
                        }
                    />


                    <div className="relative w-full max-w-lg max-h-[94vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                        {/* Header */}

                        <div className="bg-indigo-600 px-5 py-4 text-white shrink-0">

                            <div className="flex items-center justify-between gap-3">

                                <div className="min-w-0">

                                    <div className="flex items-center gap-2">

                                        <span className="text-xs font-bold bg-white/15 px-2 py-1 rounded-md">
                                            MENU #
                                            {
                                                selectedMenu.id
                                            }
                                        </span>

                                        <span className="text-xs text-indigo-100">
                                            {
                                                selectedMenu
                                                    .meal_type
                                                    ?.name ||
                                                getMealTypeName(
                                                    selectedMenu.meal_type_id
                                                )
                                            }
                                        </span>

                                    </div>


                                    <h2 className="text-lg font-black mt-1">
                                        {formatDate(
                                            selectedMenu.menu_date
                                        )}
                                    </h2>

                                </div>


                                <button
                                    onClick={() =>
                                        setShowDetailsModal(
                                            false
                                        )
                                    }
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                                >

                                    <X size={18} />

                                </button>

                            </div>

                        </div>


                        {/* Details */}

                        <div className="overflow-y-auto p-4">

                            <div className="space-y-2">

                                {selectedMenu.items.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                item.id ||
                                                index
                                            }
                                            className="border border-slate-200 rounded-xl overflow-hidden"
                                        >

                                            {/* Main */}

                                            <div className="flex items-center gap-3 px-3 py-2.5">

                                                <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                                    {index +
                                                        1}
                                                </div>


                                                <div className="flex-1 min-w-0">

                                                    <p className="text-sm font-bold text-slate-700 truncate">
                                                        {
                                                            item.item_name
                                                        }
                                                    </p>

                                                    <p className="text-[10px] text-slate-400">
                                                        Main Item
                                                    </p>

                                                </div>

                                            </div>


                                            {/* Alternative */}

                                            {item.alternate && (

                                                <div className="border-t border-amber-100 bg-amber-50 px-3 py-2">

                                                    <div className="ml-10 flex items-center gap-2">

                                                        <GitBranch
                                                            size={
                                                                13
                                                            }
                                                            className="text-amber-500 shrink-0"
                                                        />

                                                        <div className="min-w-0">

                                                            <p className="text-[10px] text-amber-600 font-bold">
                                                                ALTERNATIVE
                                                            </p>

                                                            <p className="text-xs font-semibold text-slate-700 truncate">
                                                                {
                                                                    item
                                                                        .alternate
                                                                        .item_name
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* Footer */}

                        <div className="border-t border-slate-200 bg-slate-50 p-3 shrink-0">

                            <button
                                onClick={() =>
                                    setShowDetailsModal(
                                        false
                                    )
                                }
                                className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                DELETE MODAL
            ===================================================== */}

            {showDeleteModal &&
                deleteTarget && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

                    <div
                        className="absolute inset-0 bg-slate-950/60 "
                        onClick={() =>
                            setShowDeleteModal(
                                false
                            )
                        }
                    />


                    <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">

                        <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">

                            <Trash2
                                size={20}
                                className="text-red-600"
                            />

                        </div>


                        <h2 className="text-lg font-black text-slate-800 mt-4">
                            Delete Menu?
                        </h2>


                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">

                            This will delete the menu and its items.

                        </p>


                        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">

                            <button
                                onClick={() =>
                                    setShowDeleteModal(
                                        false
                                    )
                                }
                                disabled={
                                    deleting
                                }
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    deleteMenu
                                }
                                disabled={
                                    deleting
                                }
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 inline-flex items-center justify-center gap-2"
                            >

                                {deleting ? (

                                    <>
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />

                                        Deleting...
                                    </>

                                ) : (

                                    <>
                                        <Trash2
                                            size={15}
                                        />

                                        Delete
                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}