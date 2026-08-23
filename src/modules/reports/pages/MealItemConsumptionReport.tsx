import {
    Filter,
    RefreshCw,
    Utensils,
    CalendarDays,
} from "lucide-react";

import { useEffect, useState } from "react";

import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";


interface MealType {
    id: number;
    name: string;
}


interface ItemConsumption {
    menu_item_id: number;
    item_name: string;
    item_type: "Main" | "Alternative";
    alternative_of: number | null;
    meal_type_id: number;
    meal_type_name: string;
    selected_count: number;
}


export default function MealItemConsumptionReport() {

    const [openSidebar, setOpenSidebar] =
        useState(false);

    const [mealTypes, setMealTypes] =
        useState<MealType[]>([]);

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [dateFrom, setDateFrom] =
        useState(today);

    const [dateTo, setDateTo] =
        useState(today);

    const [mealTypeId, setMealTypeId] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [data, setData] =
        useState<ItemConsumption[]>([]);

    const [loading, setLoading] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Load Meal Types
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadMealTypes = async () => {

            try {

                const response =
                    await api.get(
                        "/meal-types",
                        {
                            params: {
                                per_page: 100,
                            },
                        }
                    );

                setMealTypes(
                    response.data?.data?.data ||
                    response.data?.data ||
                    []
                );

            } catch (error) {

                console.error(
                    "Failed to load meal types:",
                    error
                );

            }

        };

        loadMealTypes();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Load Report
    |--------------------------------------------------------------------------
    */

    const loadReport = async () => {

        setLoading(true);

        try {

            const params: Record<string, any> = {
                date_from: dateFrom,
                date_to: dateTo,
            };

            if (mealTypeId) {

                params.meal_type_id =
                    Number(mealTypeId);

            }

            if (status) {

                params.status =
                    status;

            }


            const response =
                await api.get(
                    "/meal-reports/item-consumption",
                    {
                        params,
                    }
                );


            setData(
                response.data?.data || []
            );

        } catch (error) {

            console.error(
                "Failed to load item consumption report:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadReport();

    }, []);


    const clearFilters = () => {

        setDateFrom(today);
        setDateTo(today);
        setMealTypeId("");
        setStatus("");

    };


    /*
    |--------------------------------------------------------------------------
    | Total Selected
    |--------------------------------------------------------------------------
    */

    const totalSelected =
        data.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.selected_count
                ),
            0
        );


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


                    {/* Header */}

                    <div className="mb-6">

                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                            Meal Item Consumption Report
                        </h2>

                        <p className="text-gray-500 mt-1">
                            View how many times each meal item has been selected.
                        </p>

                    </div>


                    {/* Filter */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">

                        <div className="flex items-center gap-2 mb-4">

                            <Filter
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="font-bold text-gray-800">
                                Filters
                            </h3>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


                            {/* Date From */}

                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Date From
                                </label>

                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>


                            {/* Date To */}

                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Date To
                                </label>

                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) =>
                                        setDateTo(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>


                            {/* Meal Type */}

                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Meal Type
                                </label>

                                <select
                                    value={mealTypeId}
                                    onChange={(e) =>
                                        setMealTypeId(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >

                                    <option value="">
                                        All Meal Types
                                    </option>

                                    {mealTypes.map(
                                        (mealType) => (

                                            <option
                                                key={
                                                    mealType.id
                                                }
                                                value={
                                                    mealType.id
                                                }
                                            >
                                                {
                                                    mealType.name
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* Status */}

                            <div>

                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Booking Status
                                </label>

                                <select
                                    value={status}
                                    onChange={(e) =>
                                        setStatus(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >

                                    <option value="">
                                        All Status
                                    </option>

                                    <option value="Selected">
                                        Selected
                                    </option>

                                    <option value="Served">
                                        Served
                                    </option>

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* Buttons */}

                        <div className="flex justify-end gap-2 mt-5">

                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Clear
                            </button>


                            <button
                                onClick={loadReport}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                            >

                                {loading ? (

                                    <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                    />

                                ) : (

                                    <Filter
                                        size={16}
                                    />

                                )}

                                Generate Report

                            </button>

                        </div>

                    </div>


                    {/* Summary */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                            <div className="flex items-center gap-3">

                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                                    <Utensils size={21} />

                                </div>

                                <div>

                                    <p className="text-xs text-gray-400">
                                        Total Items
                                    </p>

                                    <p className="text-2xl font-bold text-gray-800">
                                        {data.length}
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                            <div className="flex items-center gap-3">

                                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">

                                    <CalendarDays size={21} />

                                </div>

                                <div>

                                    <p className="text-xs text-gray-400">
                                        Total Selections
                                    </p>

                                    <p className="text-2xl font-bold text-gray-800">
                                        {totalSelected}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* Report Table */}

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-gray-50 border-b border-gray-100">

                                    <tr>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            #
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            Item Name
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            Item Type
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                                            Meal Type
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                                            Selected Count
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {data.map(
                                        (item, index) => (

                                            <tr
                                                key={`${item.menu_item_id}-${item.meal_type_id}`}
                                                className="border-b border-gray-50 hover:bg-gray-50"
                                            >

                                                <td className="px-4 py-3 text-gray-400">
                                                    {index + 1}
                                                </td>


                                                <td className="px-4 py-3">

                                                    <div className="flex items-center gap-3">

                                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">

                                                            <Utensils
                                                                size={16}
                                                            />

                                                        </div>

                                                        <span className="font-semibold text-gray-700">
                                                            {
                                                                item.item_name
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                <td className="px-4 py-3">

                                                    {item.item_type ===
                                                    "Main" ? (

                                                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                                            Main
                                                        </span>

                                                    ) : (

                                                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                                                            Alternative
                                                        </span>

                                                    )}

                                                </td>


                                                <td className="px-4 py-3 text-gray-600">
                                                    {
                                                        item.meal_type_name
                                                    }
                                                </td>


                                                <td className="px-4 py-3 text-center">

                                                    <span className="inline-flex min-w-[45px] justify-center px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-bold">
                                                        {
                                                            item.selected_count
                                                        }
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>


                            {!loading &&
                                data.length === 0 && (

                                    <div className="py-14 text-center">

                                        <Utensils
                                            size={32}
                                            className="mx-auto text-gray-300"
                                        />

                                        <p className="mt-3 text-sm text-gray-500">
                                            No item consumption data found.
                                        </p>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

            </main>

        </div>

    );
}