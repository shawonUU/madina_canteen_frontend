            
import {
    ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
    openSidebar: boolean;
    setOpenSidebar: (value:boolean)=>void;
}





export default function SideNav({ openSidebar, setOpenSidebar }: SidebarProps) {
    const [openSidebarSettings, setOpenSidebarSettings] = useState(false);
    const [openMealManagement, setOpenMealManagement] = useState(false);
    const [openReportManagement, setOpenReportManagement] = useState(false);
    const navigate = useNavigate();
    // const [openSidebar, setOpenSidebar] = useState(false);
return (
    <aside
        className={`
            fixed lg:static top-0 left-0 z-50
            w-72 min-h-screen
            bg-gradient-to-b from-indigo-700 to-purple-800
            text-white flex flex-col p-6 pr-0 pt-0
            transform transition-transform duration-300

            ${openSidebar ? "translate-x-0" : "-translate-x-full"}

            lg:translate-x-0
        `}
    >
        <button onClick={() => setOpenSidebar(false)} className="lg:hidden text-white text-right mr-3 text-2xl"> ✕ </button>

        <h1 className="text-3xl font-bold mb-10 lg:mt-8">
            Madina ERP
        </h1>

        <nav className="space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full scrollbar-track-rounded-full overflow-y-auto h-[calc(100vh-64px)]">
            <div onClick={() => navigate("/dashboard")} className="px-4 py-3 m-0 rounded-xl hover:bg-white/20 cursor-pointer transition">
                Dashboard
            </div>
            <div className="m-0">
                <div
                    onClick={() => setOpenMealManagement(!openMealManagement)}
                    className="px-4 py-3 rounded-xl hover:bg-white/20 cursor-pointer transition flex justify-between items-center"
                >
                    <span>
                        Meal Management
                    </span>

                    <ChevronDown
                        size={18}
                        className={`transition ${
                            openMealManagement ? "rotate-180" : ""
                        }`}
                    />

                </div>


                    <div className={`
                        ml-5 mt-2 space-y-2 
                        overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${openMealManagement ? "max-h-150 opacity-100" : "max-h-0 opacity-0"}
                    `}>

                        <div onClick={() => navigate("/meal/type")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Meal Type
                        </div>

                        <div onClick={() => navigate("/meal/menu")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Menu
                        </div>

                        <div onClick={() => navigate("/meal/booking")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Meal Booking
                        </div>

                        <div onClick={() => navigate("/meal/serving")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Meal Serving
                        </div>

                        
                        
                    </div>
            </div>
            <div className="px-4 py-3 m-0 rounded-xl hover:bg-white/20 cursor-pointer transition">
                Employees
            </div>
            <div className="m-0">
                <div
                    onClick={() => setOpenReportManagement(!openReportManagement)}
                    className="px-4 py-3 rounded-xl hover:bg-white/20 cursor-pointer transition flex justify-between items-center"
                >
                    <span>
                        Report Management
                    </span>

                    <ChevronDown
                        size={18}
                        className={`transition ${
                            openReportManagement ? "rotate-180" : ""
                        }`}
                    />

                </div>


                    <div className={`
                        ml-5 mt-2 space-y-2 
                        overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${openReportManagement ? "max-h-150 opacity-100" : "max-h-0 opacity-0"}
                    `}>

                        <div onClick={() => navigate("/reports/daily")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Daily Meal Booking Reports
                        </div>

                        <div onClick={() => navigate("/reports/employee-bookings")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Employee Meal Booking Reports
                        </div>

                        <div onClick={() => navigate("/reports/item-consumption")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Item Consumption Reports
                        </div>
                    </div>
            </div>

            <div>
                <div
                    onClick={() => setOpenSidebarSettings(!openSidebarSettings)}
                    className="px-4 py-3 rounded-xl hover:bg-white/20 cursor-pointer transition flex justify-between items-center"
                >
                    <span>
                        Settings
                    </span>

                    <ChevronDown
                        size={18}
                        className={`transition ${
                            openSidebarSettings ? "rotate-180" : ""
                        }`}
                    />

                </div>


                    <div className={`
                        ml-5 mt-2 space-y-2 
                        overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${openSidebarSettings ? "max-h-150 opacity-100" : "max-h-0 opacity-0"}
                    `}>

                        <div className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Account Settings
                        </div>

                        <div className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            User Management
                        </div>

                        <div onClick={() => navigate("/settings/permission")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Permission
                        </div>

                        <div onClick={() => navigate("/settings/role")} className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            Role
                        </div>

                        <div className="px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer text-sm">
                            System Configuration
                        </div>

                    </div>
            </div>
        </nav>

    </aside>
);
}