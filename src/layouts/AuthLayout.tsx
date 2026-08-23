import { Outlet } from "react-router-dom";


function AuthLayout() {

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="w-full  bg-white rounded-lg shadow-md">

                {/* Logo / App Name */}



                {/* Child Route Render */}
                <Outlet />


            </div>

        </div>
    );
}


export default AuthLayout;