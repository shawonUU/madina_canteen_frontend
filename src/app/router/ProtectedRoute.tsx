import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUserAccess } from "../../services/storage";

interface Props { children: React.ReactNode; roles?: string[] }
export default function ProtectedRoute({ children }: Props) {
    const { pathname } = useLocation();
    if (!getToken()) return <Navigate to="/login" replace />;
    if (["/dashboard", "/change-password"].includes(pathname)) return children;
    const accesses = getUserAccess();
    const matches = accesses.filter(row => row.route && (pathname === row.route || pathname.startsWith(row.route + "/")))
        .sort((a, b) => b.route.length - a.route.length);
    const length = matches[0]?.route.length;
    const candidates = matches.filter(row => row.route.length === length);
    const action = pathname.endsWith("/create") ? "create" : /\/[^/]+\/edit$/.test(pathname) ? "update" : "view";
    const module = pathname.split("/")[1]?.replace("meeting-management", "meeting");
    const allowed = candidates.length ? candidates.some(row => Boolean(row.can_view) && Boolean(row[`can_${action}`])) : accesses.some(row => row.module_slug === module && row.can_view);
    if (!allowed) return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6"><div className="text-center"><h1 className="text-2xl font-bold">Access not assigned</h1><p className="mt-2 text-gray-600">You do not have permission to open this page.</p><a href="/dashboard" className="mt-4 inline-block text-indigo-700">Go to dashboard</a></div></div>;
    return children;
}
