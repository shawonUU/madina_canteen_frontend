import { lazy } from "react";
import AuthLayout from "../../layouts/AuthLayout";

const ApprovalWorkFlow = lazy(() => import("./pages/ApprovalWorkflow"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));

const authRoutes = [
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/approval/approval-workflow",
                element: <ApprovalWorkFlow />,
            },   
            {
                path: "/approval/pending-approval",
                element: <PendingApproval />,
            },

            
        ],
    },
];

export default authRoutes;