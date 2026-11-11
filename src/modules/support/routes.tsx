
import type { RouteObject } from "react-router-dom";

import SupportDashboard from "./pages/SupportDashboard";
import TicketList from "./pages/TicketList";
import CreateTicket from "./pages/CreateTicket";
import ViewTicket from "./pages/ViewTicket";
import AssignedTickets from "./pages/AssignedTickets";
import AllTickets from "./pages/AllTickets";
import TicketSummary from "./pages/reports/TicketSummary";
import ResolutionReport from "./pages/reports/ResolutionReport";

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
