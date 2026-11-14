import { useState } from "react";
import api from "../../../../services/api";
import { LockKeyhole } from "lucide-react";

function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });

            alert(response.data.message || "Password changed successfully.");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                "Failed to change password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-6">

                    <LockKeyhole
                        size={40}
                        className="mx-auto text-indigo-600 mb-3"
                    />

                    <h1 className="text-2xl font-bold text-gray-800">
                        Change Password
                    </h1>

                    <p className="text-gray-500 text-sm mt-2">
                        Update your account password
                    </p>

                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Current Password
                        </label>

                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            New Password
                        </label>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default ChangePassword;