import ProtectedRoute from "../../app/router/ProtectedRoute";
import MealType from "../meal/pages/meal-type";
import Menu from "../meal/pages/menu";
import Booking from "../meal/pages/booking";
import MealServing from "../meal/pages/MealServing";
import AdvanceMealBooking from "../meal/pages/AdvanceMealBooking";

const dashboardRoutes = [
    {
        path: "/meal/type",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <MealType />
            </ProtectedRoute>
        ),
    },
    {
        path: "/meal/menu",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Menu />
            </ProtectedRoute>
        ),
    },
    {
        path: "/meal/booking",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Booking />
            </ProtectedRoute>
        ),
    },

    {
        path: "/meal/serving",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <MealServing />
            </ProtectedRoute>
        ),
    },

    {
        path: "/meal/advance/booking",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <AdvanceMealBooking />
            </ProtectedRoute>
        ),
    },

];

export default dashboardRoutes;