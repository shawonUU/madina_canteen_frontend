import { lazy } from "react";
import AuthLayout from "../../layouts/AuthLayout";

import ProtectedRoute from "../../app/router/ProtectedRoute";
import Permission from "../admin/pages/access-controll/Permission";
import Role from "../admin/pages/access-controll/Role";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));


const Module = lazy(() => import("./pages/system-management/Module"));
const Menu = lazy(() => import("./pages/system-management/Menu"));
const ChildMenu = lazy(() => import("./pages/system-management/ChildMenu"));

const authRoutes = [
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/login",
                element: <Login />,
            },
            {
                path: "/register",
                element: <Register />,
            },
            {
                path: "/forgot-password",
                element: <ForgotPassword />,
            },

            {
                path: "/admin/system-management/module",
                element: <Module />,
            },
            {
                path: "/admin/system-management/menu",
                element: <Menu />,
            },
            {
                path: "/admin/system-management/child-menu",
                element: <ChildMenu />,
            },
            {
                path: "/admin/access-control/permission",
                element: (
                    <ProtectedRoute roles={["admin"]}>
                        <Permission />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/admin/access-control/role",
                element: (
                    <ProtectedRoute roles={["admin"]}>
                        <Role />
                    </ProtectedRoute>
                ),
            },
        ],
    },
];

export default authRoutes;