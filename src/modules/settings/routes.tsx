import ProtectedRoute from "../../app/router/ProtectedRoute";
import Permission from "../admin/pages/access-controll/Permission";
import Role from "../admin/pages/access-controll/Role";

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