import { lazy } from "react";
import AuthLayout from "../../layouts/AuthLayout";


const GatePassrequest = lazy(() => import("./pages/gatepass/GatePassrequest"));

const authRoutes = [
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