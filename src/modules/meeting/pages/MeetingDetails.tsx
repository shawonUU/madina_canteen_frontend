import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, LoaderCircle, MapPin, Pencil, Users, Video } from "lucide-react";
import SideNav from "../../../components/side-nav";
import TopNav from "../../../components/top-nav";
import api from "../../../services/api";

type Meeting = {
    id: number; meeting_number?: string; title: string; description?: string; meeting_type?: string;
    meeting_date?: string; start_time?: string; end_time?: string; location?: string; meeting_link?: string;
    status?: string; organizer?: { name?: string }; chairperson?: { name?: string }; participants_count?: number;
};

const statusClass: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700", in_progress: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-red-50 text-red-700",
};
const pretty = (value?: string) => (value || "—").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function MeetingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [openSidebar, setOpenSidebar] = useState(false);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get(`/meeting-management/meetings/${id}`)
            .then(({ data }) => { if (active) setMeeting(data?.data ?? data); })
            .catch((err) => { if (active) setError(err?.response?.data?.message || "Meeting details could not be loaded."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100">
            <SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <main className="min-w-0 flex-1"><TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
                <div className="h-[calc(100vh-64px)] overflow-y-auto p-4 lg:p-6"><div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-gray-500">Meeting Management / Meetings</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Meeting Details</h1><p className="mt-1 text-sm text-gray-500">Review meeting information and manage participants.</p></div><div className="flex gap-2"><button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"><ArrowLeft size={17} /> Back</button>{meeting && <Link to={`/meeting-management/meetings/${meeting.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Pencil size={16} /> Edit</Link>}</div></div>
                    {loading ? <div className="flex justify-center rounded-3xl bg-white p-16"><LoaderCircle className="animate-spin text-indigo-600" size={30} /></div> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : meeting && <>
                        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{meeting.meeting_number || `Meeting #${meeting.id}`}</p><h2 className="mt-2 text-2xl font-bold text-gray-900">{meeting.title}</h2><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-600">{meeting.description || "No description has been added."}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass[meeting.status || ""] || "bg-gray-100 text-gray-700"}`}>{pretty(meeting.status)}</span></div>
                            <div className="mt-6 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4"><Info icon={<CalendarDays size={18} />} label="Date" value={meeting.meeting_date?.slice(0, 10) || "—"} /><Info icon={<Clock3 size={18} />} label="Time" value={`${meeting.start_time?.slice(0, 5) || "—"} – ${meeting.end_time?.slice(0, 5) || "—"}`} /><Info icon={<Users size={18} />} label="Participants" value={String(meeting.participants_count ?? 0)} /><Info icon={<Video size={18} />} label="Meeting type" value={pretty(meeting.meeting_type)} /></div>
                        </section>
                        <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><h3 className="font-semibold text-gray-900">Organizing information</h3><div className="mt-4 space-y-4"><Detail label="Organizer" value={meeting.organizer?.name || "Not specified"} /><Detail label="Chairperson" value={meeting.chairperson?.name || "Not specified"} /><Detail label="Location" value={meeting.location || "Not specified"} icon={<MapPin size={16} />} />{meeting.meeting_link && <Detail label="Meeting link" value={meeting.meeting_link} link />}</div></section><section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-gray-900">Participants & invitations</h3><p className="mt-1 text-sm text-gray-500">Manage invitees and invitation responses.</p></div><Users className="text-indigo-600" size={22} /></div></section></div>
                    </>}</div></div>
            </main>
        </div>
    );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">{icon}</div><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-gray-900">{value}</p></div></div>;
}
function Detail({ label, value, icon, link }: { label: string; value: string; icon?: React.ReactNode; link?: boolean }) {
    return <div className="border-b border-gray-50 pb-3 last:border-0"> <p className="text-xs text-gray-500">{label}</p><p className="mt-1 flex items-center gap-2 break-all text-sm font-medium text-gray-800">{icon}{link ? <a className="text-indigo-600 underline" href={value} target="_blank" rel="noreferrer">{value}</a> : value}</p></div>;
}
