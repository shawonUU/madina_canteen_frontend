
import axios from "axios";
import type { Meeting, MeetingFilters, PaginatedMeetings } from "../types/meeting";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    headers: {
        Accept: "application/json",
    },
    withCredentials: true,
});

export async function getMeetings(
    filters: MeetingFilters,
): Promise<PaginatedMeetings> {
    const response = await api.get("/api/meeting-management/meetings", {
        params: {
            search: filters.search || undefined,
            status: filters.status || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            page: filters.page,
            per_page: filters.per_page,
        },
    });

    const result = response.data;

    return {
        data: result.data ?? [],
        current_page: result.current_page ?? 1,
        last_page: result.last_page ?? 1,
        per_page: result.per_page ?? filters.per_page,
        total: result.total ?? 0,
    };
}

export async function deleteMeeting(id: number): Promise<void> {
    await api.delete(`/api/meeting-management/meetings/${id}`);
}

export async function getMeeting(id: number): Promise<Meeting> {
    const response = await api.get(`/api/meeting-management/meetings/${id}`);

    return response.data.data ?? response.data;
}
