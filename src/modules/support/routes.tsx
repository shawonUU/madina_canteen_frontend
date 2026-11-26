import { lazy } from "react";

import type { RouteObject } from "react-router-dom";

const SupportDashboard = lazy(() => import("./pages/SupportDashboard"));
const TicketList = lazy(() => import("./pages/TicketList"));
const CreateTicket = lazy(() => import("./pages/CreateTicket"));
const ViewTicket = lazy(() => import("./pages/ViewTicket"));
const AssignedTickets = lazy(() => import("./pages/AssignedTickets"));
const AllTickets = lazy(() => import("./pages/AllTickets"));
const TicketSummary = lazy(() => import("./pages/reports/TicketSummary"));
const ResolutionReport = lazy(() => import("./pages/reports/ResolutionReport"));
const EditTicket = lazy(() => import("./pages/EditTicket"));

export const supportRoutes: RouteObject[] = [
    {
        path: "support",
        children: [
            {
                index: true,
                element: <SupportDashboard />,
            },
            {
                path: "support-dashboard",
                element: <SupportDashboard />,
            },
            {
                path: "create-ticket",
                element: <CreateTicket />,
            },
            {
                path: "edit-ticket/:id",
                element: <EditTicket />,
            },
            {
                path: "my-tickets",
                element: <TicketList />,
            },
            {
                path: "view-ticket/:id",
                element: <ViewTicket />,
            },
            {
                path: "all-tickets",
                element: <AllTickets />,
            },
            {
                path: "my-assigned-tickets",
                element: <AssignedTickets />,
            },
            {
                path: "support-reports/ticket-summary",
                element: <TicketSummary />,
            },
            {
                path: "support-reports/resolution-report",
                element: <ResolutionReport />,
            },
        ],
    },
];

export default supportRoutes;
