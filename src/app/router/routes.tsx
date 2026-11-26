import authRoutes from "../../modules/admin/routes";
import employeeRoutes from "../../modules/hrm/routes";
// import settingsRoutes from "../../modules/settings/routes";
import mealRoutes from "../../modules/canteen/routes";
import reportsRoutes from "../../modules/reports/routes";
import RootRedirect from "./RootRedirect";
import ProtectedRoute from "../../app/router/ProtectedRoute";
import Dashboard from "../../pages/Dashboard";
import Reception from "../../modules/reception/routes";
import Approval from "../../modules/approval/routes";
import meeting from "../../modules/meeting/routes";
import support from "../../modules/support/routes";
import ActivityLog from "../../modules/admin/pages/system-management/ActivityLog";


const protect = (items: any[]): any[] => items.map(route => ({
    ...route,
    ...(route.element ? { element: <ProtectedRoute>{route.element}</ProtectedRoute> } : {}),
    ...(route.children ? { children: protect(route.children) } : {}),
}));

export const routes = [
    { path: "/", element: <RootRedirect /> },
    { path: "/dashboard", element: <ProtectedRoute roles={["admin", "manager"]}><Dashboard /></ProtectedRoute> },
    ...authRoutes,
    { path: "/admin/system-management/activity-log", element: <ProtectedRoute><ActivityLog /></ProtectedRoute> },
    ...protect([...Approval, ...mealRoutes, ...reportsRoutes, ...employeeRoutes, ...Reception, ...meeting, ...support]),
    { path: "*", element: <div className="p-10 text-center"><h1 className="text-2xl font-bold">Page not found</h1><a className="mt-4 inline-block text-indigo-700" href="/dashboard">Go to dashboard</a></div> },
];

export default routes;
