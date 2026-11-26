import { lazy } from "react";
const MeetingSummary = lazy(() => import("./pages/reports/MeetingSummary"));
const AttendanceReport = lazy(() => import("./pages/reports/AttendanceReport"));
const MeetingList = lazy(() => import("./pages/MeetingList"));
const MeetingForm = lazy(() => import("./pages/MeetingForm"));
const MeetingDetails = lazy(() => import("./pages/MeetingDetails"));
const MeetingParticipants = lazy(() => import("./pages/MeetingParticipants"));
const MeetingCalendar = lazy(() => import("./pages/meetingCalendar"));
const MeetingInvitations = lazy(() => import("./pages/MeetingInvitations"));
const MeetingAgenda = lazy(() => import("./pages/MeetingAgenda"));
const MeetingAttendance = lazy(() => import("./pages/MeetingAttendance"));
const MeetingMinutes = lazy(() => import("./pages/MeetingMinutes"));

const meetingManagementRoutes = [
    { path: "/meeting-management/meetings/:id", element: <MeetingDetails /> },
    { path: "/meeting/meetings", element: <MeetingList /> },
    { path: "/meeting-management/meetings", element: <MeetingList /> },
    { path: "/meeting/meetings/create", element: <MeetingForm /> },
    { path: "/meeting/calendar", element: <MeetingCalendar /> },
    { path: "/meeting/meeting-reports/meeting-summary", element: <MeetingSummary /> },
    { path: "/meeting/reports/summary", element: <MeetingSummary /> },
    { path: "/meeting/meeting-reports/attendance-report", element: <AttendanceReport /> },
    { path: "/meeting/attendance/report", element: <AttendanceReport /> },
    { path: "/meeting/meeting-scheduling/meeting-list", element: <MeetingList /> },
    { path: "/meeting/meeting-scheduling/create-meeting", element: <MeetingForm /> },
    { path: "/meeting/meeting-scheduling/view-meeting/:id", element: <MeetingDetails /> },
    { path: "/meeting-management/meetings/:id/edit", element: <MeetingForm /> },
    { path: "/meeting-management/meetings/:id/participants", element: <MeetingParticipants /> },
    { path: "/meeting/meeting-scheduling/meeting-calendar", element: <MeetingCalendar /> },
    { path: "/meeting/invitations", element: <MeetingInvitations />, },
    { path: "/meeting/meeting-agenda", element: <MeetingAgenda />, },
    { path: "/meeting/meeting-attendance", element: <MeetingAttendance />, },
    { path: "/meeting/meeting-minutes", element: <MeetingMinutes />, },

    
];

export default meetingManagementRoutes;

