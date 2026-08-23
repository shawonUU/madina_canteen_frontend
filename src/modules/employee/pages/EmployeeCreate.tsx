import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();


        console.log(formData);


        // Temporary redirect
        navigate("/dashboard");

    };


    return (

        <form onSubmit={handleSubmit} className="space-y-4">


            {/* Email */}

            <div>

                <label className="block text-sm mb-1">
                    Email
                </label>

                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full border rounded px-3 py-2"
                    required
                />

            </div>



            {/* Password */}

            <div>

                <label className="block text-sm mb-1">
                    Password
                </label>


                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full border rounded px-3 py-2"
                    required
                />

            </div>



            {/* Button */}

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded"
            >
                Login
            </button>


        </form>

    );
}


export default Login;