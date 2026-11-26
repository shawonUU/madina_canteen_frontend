import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../../../../services/api";

export default function ResetPassword() {
  const [search] = useSearchParams();
  const params = useParams();
  const token = params.token ?? search.get("token") ?? "";
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    if (!token) { setError("The reset link is invalid. Request a new link."); return; }
    setSaving(true);
    try {
      await api.post("/auth/reset-password", { email: email.trim(), token, password, password_confirmation: confirmation });
      setDone(true); setPassword(""); setConfirmation("");
    } catch (error: any) { setError(error?.response?.data?.message ?? "Unable to reset password. Request a new link if this one has expired."); }
    finally { setSaving(false); }
  };
  return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
    <h1 className="mb-2 text-2xl font-bold text-slate-800">Reset Password</h1>
    <p className="mb-6 text-sm text-slate-500">Choose a new password for your account.</p>
    {done ? <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">Your password has been reset. Sign in with your new password.</p> : <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm">New password<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm">Confirm password<input required type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={saving || !token} className="w-full rounded-lg bg-indigo-600 p-3 text-white disabled:opacity-50">{saving ? "Updating…" : "Reset Password"}</button>
    </form>}
    <div className="mt-5 flex justify-between text-sm text-indigo-600"><Link to="/login">Back to login</Link><Link to="/forgot-password">Request a new link</Link></div>
  </div></div>;
}
