import { lazy } from "react";
const MealRate = lazy(() => import("./pages/MealRate"));
import ProtectedRoute from "../../app/router/ProtectedRoute";
const MealType = lazy(() => import("../canteen/pages/MealType"));
const Menu = lazy(() => import("../canteen/pages/Menu"));
const Booking = lazy(() => import("../canteen/pages/Booking"));
const MealServing = lazy(() => import("../canteen/pages/MealServing"));

const dashboardRoutes = [
    { path: "/canteen/meal-rate", element: <ProtectedRoute roles={["admin"]}><MealRate /></ProtectedRoute> },
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