import ProtectedRoute from "../../app/router/ProtectedRoute";
import Permission from "./pages/Permission";
import Role from "./pages/Role";

const dashboardRoutes = [
    {
        path: "/settings/permission",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Permission />
            </ProtectedRoute>
        ),
    },

    {
        path: "/settings/role",
        element: (
            <ProtectedRoute roles={["admin"]}>
                <Role />
            </ProtectedRoute>
        ),
    },
];

export default dashboardRoutes;