import authRoutes from "../../modules/auth/routes";
// import employeeRoutes from "../../modules/employee/routes";
import dashboardRoutes from "../../modules/dashboard/routes";
import settingsRoutes from "../../modules/settings/routes";
import mealRoutes from "../../modules/meal/routes";
import reportsRoutes from "../../modules/reports/routes";
import RootRedirect from "./RootRedirect";


export const routes = [

    {
        path: "/",
        element: <RootRedirect />,
    },
 ...mealRoutes,

 ...authRoutes,

 ...dashboardRoutes,
 
 ...settingsRoutes,
 
    ...reportsRoutes,

//  ...employeeRoutes

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