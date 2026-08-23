import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "../../app/router/ProtectedRoute";

const dashboardRoutes = [
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute roles={["admin", "manager"]}>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
];

export default dashboardRoutes;