import { lazy } from "react";
import AuthLayout from "../../layouts/AuthLayout";


const GatePassrequest = lazy(() => import("./pages/gatepass/GatePassrequest"));
const GatepassPurpose = lazy(() => import("./pages/configuration/GatepassPurpose"));

const authRoutes = [
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/reception/configuration/gatepass-purpose",
                element: <GatepassPurpose />,
            },
        ],
    },
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/reception/gatepass/create-gatepass-request",
                element: <GatePassrequest />,
            },
        ],
    },
];

export default authRoutes;