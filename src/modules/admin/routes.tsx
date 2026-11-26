import { lazy } from "react";
import AuthLayout from "../../layouts/AuthLayout";
import ProtectedRoute from "../../app/router/ProtectedRoute";
import Permission from "./pages/access-controll/Permission";
import UserAccess from "./pages/access-controll/UserAccess";
import Role from "./pages/access-controll/Role";
import Users from "./pages/access-controll/Users";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("./pages/auth/ChangePassword"));
const Module = lazy(() => import("./pages/system-management/Module"));
const Menu = lazy(() => import("./pages/system-management/Menu"));
const ChildMenu = lazy(() => import("./pages/system-management/ChildMenu"));

const authRoutes = [
  { element: <AuthLayout />, children: [
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/reset-password/:token", element: <ResetPassword /> },
  ] },
  { path: "/change-password", element: <ProtectedRoute><ChangePassword /></ProtectedRoute> },
  { path: "/admin/system-management/module", element: <ProtectedRoute><Module /></ProtectedRoute> },
  { path: "/admin/system-management/menu", element: <ProtectedRoute><Menu /></ProtectedRoute> },
  { path: "/admin/system-management/child-menu", element: <ProtectedRoute><ChildMenu /></ProtectedRoute> },
  { path: "/admin/access-control/users", element: <ProtectedRoute><Users /></ProtectedRoute> },
  { path: "/admin/access-control/user-access", element: <ProtectedRoute><UserAccess /></ProtectedRoute> },
  { path: "/admin/access-control/permission", element: <ProtectedRoute><Permission /></ProtectedRoute> },
  { path: "/admin/access-control/role", element: <ProtectedRoute><Role /></ProtectedRoute> },
];
export default authRoutes;
