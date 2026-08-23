import {
    Bell,
    ChevronDown,
    LogOut,
    Search,
    Settings,
    User,
    UserCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../auth/services/authService";

interface TopNavProps {
    openSidebar: boolean;
    setOpenSidebar: (value: boolean) => void;
}

export default function TopNav({
    openSidebar,
    setOpenSidebar,
}: TopNavProps) {

    const [openProfile, setOpenProfile] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Click outside profile menu
    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setOpenProfile(false);
                setOpenSettings(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 lg:px-6">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">

                {/* Mobile Sidebar Button */}
                <button
                    onClick={() => setOpenSidebar(true)}
                    className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                    ☰
                </button>

                {/* Search */}
                <button
                    className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-200 transition"
                >
                    <Search size={19} />

                    <span className="text-sm">
                        Search
                    </span>
                </button>

            </div>


            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">

                {/* Mobile Search */}
                <button
                    className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                    <Search size={19} />
                </button>


                {/* Notification */}
                <button
                    className="relative p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                    <Bell size={19} />

                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>


                {/* Profile */}
                <div
                    className="relative"
                    ref={profileRef}
                >

                    <button
                        onClick={() => {
                            setOpenProfile(!openProfile);

                            if (openProfile) {
                                setOpenSettings(false);
                            }
                        }}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer transition"
                    >

                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                            <User size={17} />
                        </div>

                        <span className="hidden sm:block text-sm font-medium text-gray-700">
                            Sawon
                        </span>

                        <ChevronDown
                            size={16}
                            className={`hidden sm:block transition-transform duration-200 ${
                                openProfile
                                    ? "rotate-180"
                                    : ""
                            }`}
                        />

                    </button>


                    {/* PROFILE DROPDOWN */}
                    {openProfile && (

                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-[100]">

                            {/* User Info */}
                            <div className="px-3 py-3 border-b border-gray-100 mb-2">

                                <p className="font-semibold text-gray-800">
                                    Sawon
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    IT Officer
                                </p>

                            </div>


                            {/* Profile */}
                            <button
                                onClick={() => {
                                    setOpenProfile(false);
                                    navigate("/profile");
                                }}
                                className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center gap-3 transition text-left"
                            >

                                <UserCircle
                                    size={18}
                                    className="text-gray-500"
                                />

                                <span className="text-sm">
                                    Profile
                                </span>

                            </button>


                            {/* Settings */}
                            <div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        setOpenSettings(
                                            !openSettings
                                        );
                                    }}
                                    className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between transition"
                                >

                                    <div className="flex items-center gap-3">

                                        <Settings
                                            size={18}
                                            className="text-gray-500"
                                        />

                                        <span className="text-sm">
                                            Settings
                                        </span>

                                    </div>

                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-200 ${
                                            openSettings
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />

                                </button>


                                {/* Settings Submenu */}
                                <div
                                    className={`ml-8 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${
                                        openSettings
                                            ? "max-h-40 opacity-100"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >

                                    <button
                                        onClick={() =>
                                            navigate(
                                                "/settings/account"
                                            )
                                        }
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600"
                                    >
                                        Account Settings
                                    </button>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                "/settings/security"
                                            )
                                        }
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600"
                                    >
                                        Security
                                    </button>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                "/settings/notifications"
                                            )
                                        }
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600"
                                    >
                                        Notification Settings
                                    </button>

                                </div>

                            </div>


                            {/* Divider */}
                            <div className="border-t border-gray-100 my-2" />


                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2.5 hover:bg-red-50 rounded-xl cursor-pointer flex items-center gap-3 transition text-red-500 text-left"
                            >

                                <LogOut size={18} />

                                <span className="text-sm">
                                    Logout
                                </span>

                            </button>

                        </div>

                    )}

                </div>

            </div>

        </header>
    );
}