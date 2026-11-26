import { lazy } from "react";
const CostReport = lazy(() => import("./pages/CostReport"));
import ProtectedRoute from "../../app/router/ProtectedRoute";
const DailyMealBookingReport = lazy(() => import("../reports/pages/DailyMealBookingReport"));
const EmployeeMealBookingReport = lazy(() => import("../reports/pages/EmployeeMealBookingReport"));
const MealItemConsumptionReport = lazy(() => import("../reports/pages/MealItemConsumptionReport"));


const reportsRoutes = [
    { path: "/reports/cost", element: <ProtectedRoute roles={["admin"]}><CostReport /></ProtectedRoute> },
    {
        path: "/reports/daily",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <DailyMealBookingReport />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/employee-bookings",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <EmployeeMealBookingReport />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/item-consumption",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <MealItemConsumptionReport />
            </ProtectedRoute>
        ),
    },



];

export default reportsRoutes;