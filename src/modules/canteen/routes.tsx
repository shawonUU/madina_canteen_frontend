import ProtectedRoute from "../../app/router/ProtectedRoute";
import MealType from "../canteen/pages/MealType";
import Menu from "./pages/menu";
import Booking from "./pages/booking";
import MealServing from "../canteen/pages/MealServing";

const dashboardRoutes = [
    {
        path: "/canteen/meal-type",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <MealType />
            </ProtectedRoute>
        ),
    },
    {
        path: "/canteen/meal-menu",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Menu />
            </ProtectedRoute>
        ),
    },
    {
        path: "/canteen/meal-booking",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Booking />
            </ProtectedRoute>
        ),
    },

    {
        path: "/canteen/serve-meal",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <MealServing />
            </ProtectedRoute>
        ),
    },
];

export default dashboardRoutes;