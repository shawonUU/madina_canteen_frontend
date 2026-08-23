import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    ArrowLeft,
    LockKeyhole
} from "lucide-react";


function ForgotPassword() {


    const [email,setEmail] = useState("");



    const handleSubmit=(e:React.FormEvent)=>{

        e.preventDefault();


        console.log({
            email
        });


        // Forgot password API call here

    };




    return (

        <div className="
            min-h-screen
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-slate-100
            via-white
            to-indigo-100
            px-4
        ">


            <div className="
                w-full
                max-w-md
                bg-white
                rounded-3xl
                shadow-xl
                border
                border-gray-100
                p-8
            ">


                {/* Header */}

                <div className="
                    text-center
                    mb-8
                ">


                    <div className="
                        mx-auto
                        w-16
                        h-16
                        rounded-2xl
                        bg-indigo-100
                        flex
                        items-center
                        justify-center
                        mb-4
                    ">

                        <LockKeyhole
                            size={30}
                            className="text-indigo-600"
                        />

                    </div>



                    <h1 className="
                        text-3xl
                        font-bold
                        text-gray-800
                    ">

                        Forgot Password?

                    </h1>



                    <p className="
                        text-gray-500
                        mt-2
                    ">

                        Enter your email to receive a password reset link

                    </p>



                </div>






                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >



                    <div>


                        <label className="
                            block
                            text-sm
                            font-medium
                            text-gray-700
                            mb-2
                        ">

                            Email Address

                        </label>




                        <div className="
                            relative
                        ">


                            <Mail
                                size={20}
                                className="
                                    absolute
                                    left-3
                                    top-3.5
                                    text-gray-400
                                "
                            />



                            <input

                                type="email"

                                value={email}

                                onChange={
                                    e=>setEmail(e.target.value)
                                }

                                placeholder="Enter your email"

                                className="
                                    w-full
                                    pl-10
                                    pr-4
                                    py-3
                                    border
                                    rounded-xl
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-indigo-500
                                    focus:border-indigo-500
                                "

                                required

                            />


                        </div>


                    </div>







                    <button

                        type="submit"

                        className="
                            w-full
                            bg-gradient-to-r
                            from-indigo-600
                            to-purple-600
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                            hover:opacity-90
                            transition
                            shadow-lg
                        "

                    >

                        Send Reset Link

                    </button>







                    <div className="
                        text-center
                        pt-3
                    ">


                        <Link

                            to="/login"

                            className="
                                inline-flex
                                items-center
                                gap-2
                                text-indigo-600
                                hover:text-indigo-800
                                text-sm
                                font-medium
                            "

                        >

                            <ArrowLeft size={16}/>

                            Back to Login

                        </Link>


                    </div>





                </form>



            </div>


        </div>


    );

}


export default ForgotPassword;