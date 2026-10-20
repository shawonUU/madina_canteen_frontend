
export type MeetingType = "internal" | "external" | "online" | "hybrid";

export type MeetingStatus =
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";

export interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    description?: string | null;
    meeting_type: MeetingType;
    meeting_date: string;
    start_time: string;
    end_time: string;
    location?: string | null;
    meeting_link?: string | null;
    status: MeetingStatus;
    organizer_id?: number;
    participants_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface MeetingFilters {
    search: string;
    status: string;
    date_from: string;
    date_to: string;
    page: number;
    per_page: number;
}

export interface PaginatedMeetings {
    data: Meeting[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
