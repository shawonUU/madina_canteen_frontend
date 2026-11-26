import { lazy } from "react";
import ProtectedRoute from "../../app/router/ProtectedRoute";
const ApprovalWorkflow = lazy(() => import("./pages/ApprovalWorkflow"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const ApprovalDelegation = lazy(() => import("./pages/ApprovalDelegation"));
export default [
  { path: "/approval/approval-workflow", element: <ProtectedRoute><ApprovalWorkflow /></ProtectedRoute> },
  { path: "/approval/pending-approval", element: <ProtectedRoute><PendingApproval /></ProtectedRoute> },
  { path: "/approval/approval-delegation", element: <ProtectedRoute><ApprovalDelegation /></ProtectedRoute> },
];
