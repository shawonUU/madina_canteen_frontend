import authRoutes from "../../modules/admin/routes";
import employeeRoutes from "../../modules/hrm/routes";
import settingsRoutes from "../../modules/settings/routes";
import mealRoutes from "../../modules/canteen/routes";
import reportsRoutes from "../../modules/reports/routes";
import RootRedirect from "./RootRedirect";
import ProtectedRoute from "../../app/router/ProtectedRoute";
import Dashboard from "../../pages/Dashboard";
import Reception from "../../modules/reception/routes";
import Approval from "../../modules/approval/routes";


export const routes = [

    {
        path: "/",
        element: <RootRedirect />,
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute roles={["admin", "manager"]}>
                <Dashboard />
            </ProtectedRoute>
        ),
    },

    ...Approval,
    ...mealRoutes,
    ...authRoutes,
    ...settingsRoutes,
    ...reportsRoutes,
    ...employeeRoutes,
    ...Reception,

];

export default routes;


// import { Navigate } from "react-router-dom";
// import Login from "../../modules/auth/pages/Login";
// import Register from "../../modules/auth/pages/Register";
// import Dashboard from "../../modules/dashboard/pages/Dashboard";
// import ProtectedRoute from "./ProtectedRoute";

// const routes = [
//     {
//         path: "/", element: <Navigate to="/login" replace />,
//     },

//     {
//         path: "/login", element: <Login />,
//     },

//     {
//         path: "/register", element: <Register />,
//     },

//     {
//         path: "/dashboard",
//         element: (
//             <ProtectedRoute roles={["admin", "manager"]}>
//                 <Dashboard />
//             </ProtectedRoute>
//         ),
//     },

//     {
//         path: "*",
//         element: <Navigate to="/login" replace />,
//     },
// ];

// export default routes;