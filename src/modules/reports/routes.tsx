import ProtectedRoute from "../../app/router/ProtectedRoute";
import DailyMealBookingReport from "../reports/pages/DailyMealBookingReport";
import EmployeeMealBookingReport from "../reports/pages/EmployeeMealBookingReport";
import MealItemConsumptionReport from "../reports/pages/MealItemConsumptionReport";


const reportsRoutes = [
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