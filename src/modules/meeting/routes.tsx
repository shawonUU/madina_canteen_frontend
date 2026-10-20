import MeetingList from "./pages/MeetingList";
import MeetingForm from "./pages/MeetingForm";
import MeetingDetails from "./pages/MeetingDetails";
import MeetingParticipants from "./pages/MeetingParticipants";
import MeetingCalendar from "./pages/meetingCalendar";
import MeetingInvitations from "./pages/MeetingInvitations";
import MeetingAgenda from "./pages/MeetingAgenda";
import MeetingAttendance from "./pages/MeetingAttendance";

const meetingManagementRoutes = [
    { path: "/meeting/meeting-scheduling/meeting-list", element: <MeetingList /> },
    { path: "/meeting/meeting-scheduling/create-meeting", element: <MeetingForm /> },
    { path: "/meeting/meeting-scheduling/view-meeting/:id", element: <MeetingDetails /> },
    { path: "/meeting-management/meetings/:id/edit", element: <MeetingForm /> },
    { path: "/meeting-management/meetings/:id/participants", element: <MeetingParticipants /> },
    { path: "/meeting/meeting-scheduling/meeting-calendar", element: <MeetingCalendar /> },
    { path: "/meeting/invitations", element: <MeetingInvitations />, },
    { path: "/meeting/meeting-agenda", element: <MeetingAgenda />, },
    { path: "/meeting/meeting-attendance", element: <MeetingAttendance />, },

    
];

export default meetingManagementRoutes;

