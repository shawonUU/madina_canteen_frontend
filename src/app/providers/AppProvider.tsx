import { Suspense, useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import router from "../router";
import api from "../../services/api";
import { getToken, setUser, setUserAccess, setUserPermissions } from "../../services/storage";

export default function AppProvider() {
    const [ready, setReady] = useState(!getToken());
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (!getToken()) { setReady(true); return; }
        let cancelled = false;
        setError("");
        api.get("/auth/me").then(({ data }) => {
            if (cancelled) return;
            setUser(data.user); setUserAccess(data.accesses ?? []); setUserPermissions(data.permissions ?? []); setReady(true);
        }).catch(error => {
            if (!cancelled) {
                if (error.response?.status === 401) setReady(true);
                else setError("Unable to connect to the server. Check the backend connection and try again.");
            }
        });
        return () => { cancelled = true; };
    }, [attempt]);
    if (!ready) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center"><div><p>{error || "Loading your workspace…"}</p>{error && <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white" onClick={() => setAttempt(attempt + 1)}>Try again</button>}</div></div>;
    return (
        <Suspense fallback={
            <div role="status" className="grid min-h-screen place-items-center bg-slate-50 p-6 text-sm text-slate-600">
                Loading your workspace…
            </div>
        }>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </Suspense>
    );
}
