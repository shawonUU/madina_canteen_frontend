import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";


export default function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: ""
    });


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };



    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setLoading(true);
        setError("");


        try {

            await register(form);

            navigate("/login");


        } catch (err: any) {

            setError(
                err.response?.data?.message ||
                "Registration failed"
            );

        } finally {

            setLoading(false);

        }

    };



    return (

        <div className="
        h-screen
        overflow-hidden
        flex
        bg-gradient-to-br
        from-slate-100
        via-white
        to-indigo-100
        ">



            {/* Left Section */}

            <div className="
            hidden
            lg:flex
            w-1/2
            h-screen
            bg-gradient-to-br
            from-indigo-600
            to-purple-700
            items-center
            justify-center
            relative
            overflow-hidden
            ">


                <div className="
                absolute
                w-96
                h-96
                bg-white/10
                rounded-full
                top-10
                left-10
                ">
                </div>


                <div className="
                absolute
                w-80
                h-80
                bg-white/10
                rounded-full
                bottom-10
                right-10
                ">
                </div>



                <div className="
                relative
                px-16
                text-white
                ">


                    <h1 className="
                    text-5xl
                    font-bold
                    mb-5
                    ">
                        Madina ERP
                    </h1>


                    <p className="
                    text-xl
                    text-indigo-100
                    leading-relaxed
                    ">
                        Create your account and manage
                        your business operations easily.
                    </p>



                    <div className="
                    mt-8
                    space-y-3
                    text-indigo-100
                    ">

                        <p>✓ Inventory Management</p>

                        <p>✓ POS Management</p>

                        <p>✓ Employee Management</p>

                        <p>✓ Reports & Analytics</p>

                    </div>


                </div>


            </div>





            {/* Register Area */}


            <div className="
            w-full
            lg:w-1/2
            h-screen
            flex
            items-center
            justify-center
            p-5
            ">



                <div className="
                w-full
                max-w-md
                bg-white
                rounded-3xl
                shadow-xl
                border
                border-gray-100
                p-6
                ">



                    <div className="mb-5">


                        <h2 className="
                        text-3xl
                        font-bold
                        text-gray-800
                        ">
                            Create Account
                        </h2>


                        <p className="
                        text-gray-500
                        mt-1
                        ">
                            Register to access ERP system
                        </p>


                    </div>





                    {
                        error &&

                        <div className="
                        bg-red-50
                        text-red-600
                        px-4
                        py-2
                        rounded-xl
                        mb-4
                        text-sm
                        ">
                            {error}
                        </div>

                    }





                    <form
                    onSubmit={handleSubmit}
                    className="space-y-3"
                    >




                        <div>

                            <label className="
                            text-sm
                            font-medium
                            text-gray-700
                            ">
                                Full Name
                            </label>


                            <input

                            type="text"

                            name="name"

                            value={form.name}

                            onChange={handleChange}

                            placeholder="Enter your name"


                            className="
                            mt-1
                            w-full
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            outline-none
                            focus:border-indigo-500
                            focus:ring-4
                            focus:ring-indigo-100
                            "

                            />

                        </div>






                        <div>

                            <label className="
                            text-sm
                            font-medium
                            text-gray-700
                            ">
                                Email
                            </label>


                            <input

                            type="email"

                            name="email"

                            value={form.email}

                            onChange={handleChange}

                            placeholder="Enter email"


                            className="
                            mt-1
                            w-full
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            outline-none
                            focus:border-indigo-500
                            focus:ring-4
                            focus:ring-indigo-100
                            "

                            />

                        </div>






                        <div>

                            <label className="
                            text-sm
                            font-medium
                            text-gray-700
                            ">
                                Password
                            </label>


                            <input

                            type="password"

                            name="password"

                            value={form.password}

                            onChange={handleChange}

                            placeholder="Create password"


                            className="
                            mt-1
                            w-full
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            outline-none
                            focus:border-indigo-500
                            focus:ring-4
                            focus:ring-indigo-100
                            "

                            />

                        </div>






                        <div>

                            <label className="
                            text-sm
                            font-medium
                            text-gray-700
                            ">
                                Confirm Password
                            </label>


                            <input

                            type="password"

                            name="password_confirmation"

                            value={form.password_confirmation}

                            onChange={handleChange}

                            placeholder="Confirm password"


                            className="
                            mt-1
                            w-full
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            outline-none
                            focus:border-indigo-500
                            focus:ring-4
                            focus:ring-indigo-100
                            "

                            />

                        </div>







                        <button

                        type="submit"

                        disabled={loading}

                        className="
                        w-full
                        py-3
                        mt-2
                        rounded-xl
                        bg-indigo-600
                        hover:bg-indigo-700
                        text-white
                        font-semibold
                        transition
                        shadow-lg
                        shadow-indigo-200
                        disabled:opacity-50
                        "

                        >

                        {
                            loading
                            ?
                            "Creating..."
                            :
                            "Create Account"
                        }


                        </button>



                    </form>







                    <div className="
                    mt-5
                    text-center
                    text-sm
                    text-gray-500
                    ">


                        Already have an account?


                        <Link

                        to="/login"

                        className="
                        ml-2
                        text-indigo-600
                        font-semibold
                        hover:underline
                        "

                        >
                            Login
                        </Link>


                    </div>



                </div>


            </div>



        </div>

    );

}