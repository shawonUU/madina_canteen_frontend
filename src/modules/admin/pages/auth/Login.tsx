
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { login } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    Mail,
    ShieldCheck,
    Building2,
    CheckCircle2,
} from "lucide-react";

type Effect = "normal" | "night" | "wrong" | "success";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [effect, setEffect] = useState<Effect>("normal");
    const [message, setMessage] = useState("");
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        setMouse({ x, y });
    };

    const sceneStyle = {
        "--mouse-x": `${mouse.x * 18}px`,
        "--mouse-y": `${mouse.y * 18}px`,
    } as CSSProperties;

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setMessage("");

        if (effect === "wrong" || effect === "success") {
            setEffect("normal");
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setMessage("");

        if (effect === "wrong" || effect === "success") {
            setEffect("normal");
        }

        if (timer.current) {
            clearTimeout(timer.current);
        }

        if (value.length > 0) {
            setEffect("night");

            timer.current = setTimeout(() => {
                setEffect("normal");
            }, 1100);
        } else {
            setEffect("normal");
        }
    };

    const handlePasswordFocus = () => {
        if (password.length > 0) {
            setEffect("night");
        }
    };

    const handlePasswordBlur = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        if (effect === "night") {
            setEffect("normal");
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setMessage("");
        setEffect("night");

        if (timer.current) {
            clearTimeout(timer.current);
        }

        try {
            await login({
                email,
                password,
            });

            setEffect("success");
            setMessage("Welcome back! Login successful.");

            await new Promise((resolve) => setTimeout(resolve, 1200));

            navigate("/dashboard");
        } catch (err: any) {
            setEffect("wrong");

            setMessage(
                err.response?.data?.message ||
                "Invalid email or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`app ${effect}`}
            onMouseMove={handleMouseMove}
            style={sceneStyle}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

                * {
                    box-sizing: border-box;
                }

                html, body, #root {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    overflow: hidden;
                }

                body {
                    font-family: 'DM Sans', sans-serif;
                }

                button, input {
                    font: inherit;
                }

                .app {
                    --mouse-x: 0px;
                    --mouse-y: 0px;
                    position: relative;
                    width: 100%;
                    height: 100vh;
                    height: 100dvh;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    background: #090b20;
                    color: white;
                    isolation: isolate;
                    transition: background 1s ease;
                }

                .app::before {
                    content: "";
                    position: absolute;
                    inset: -30%;
                    z-index: -2;
                    background:
                        radial-gradient(circle at 75% 35%, rgba(102,65,255,.30), transparent 27%),
                        radial-gradient(circle at 20% 80%, rgba(0,220,255,.13), transparent 28%),
                        radial-gradient(circle at 50% 10%, rgba(255,76,180,.12), transparent 25%);
                    animation: backgroundFloat 12s ease-in-out infinite alternate;
                    transform: translate(var(--mouse-x), var(--mouse-y));
                    transition: background 1s ease;
                }

                .app::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    pointer-events: none;
                    opacity: 0;
                    background:
                        radial-gradient(circle at 50% 50%, rgba(0,0,0,.78), transparent 75%),
                        linear-gradient(120deg, rgba(8,12,36,.85), rgba(22,17,55,.5));
                    transition: opacity .8s ease;
                }

                .app.night::after {
                    opacity: 1;
                }

                .app.night {
                    background: #030511;
                }

                .app.wrong {
                    background: #190817;
                }

                .app.success {
                    background: #061c1a;
                }

                .app.wrong::before {
                    background:
                        radial-gradient(circle at 75% 35%, rgba(255,35,75,.32), transparent 30%),
                        radial-gradient(circle at 20% 80%, rgba(255,90,30,.15), transparent 30%);
                }

                .app.success::before {
                    background:
                        radial-gradient(circle at 75% 35%, rgba(0,255,160,.30), transparent 30%),
                        radial-gradient(circle at 20% 80%, rgba(0,220,255,.18), transparent 30%);
                }

                .ambient {
                    position: absolute;
                    width: 450px;
                    height: 450px;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    transition: all 1s ease;
                }

                .ambient.one {
                    top: -220px;
                    right: 10%;
                    background: rgba(105,65,255,.23);
                }

                .ambient.two {
                    bottom: -250px;
                    left: 20%;
                    background: rgba(0,200,255,.15);
                }

                .sun-glow, .moon-glow {
                    position: absolute;
                    width: 260px;
                    height: 260px;
                    border-radius: 50%;
                    right: 13%;
                    top: 12%;
                    pointer-events: none;
                    transition: all 1s ease;
                }

                .sun-glow {
                    opacity: .65;
                    background: radial-gradient(circle, rgba(255,186,72,.23), transparent 70%);
                    animation: sunPulse 5s ease-in-out infinite;
                }

                .moon-glow {
                    opacity: 0;
                    transform: scale(.7);
                    background: radial-gradient(circle, rgba(110,130,255,.35), transparent 70%);
                }

                .app.night .sun-glow {
                    opacity: .12;
                    transform: scale(.7);
                }

                .app.night .moon-glow {
                    opacity: 1;
                    transform: scale(1);
                }

                .stars {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: .4;
                    transition: opacity .8s ease;
                }

                .app.night .stars {
                    opacity: 1;
                }

                .star {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 0 10px white;
                    animation: twinkle 2s ease-in-out infinite alternate;
                }

                .layout {
                    width: min(1180px, 90%);
                    height: 100%;
                    margin: auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: 40px;
                    position: relative;
                    z-index: 2;
                }

                .login-section {
                    width: 100%;
                    max-width: 430px;
                    padding: 20px 0;
                    animation: enterLeft .8s ease both;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 55px;
                }

                .brand-icon {
                    width: 43px;
                    height: 43px;
                    display: grid;
                    place-items: center;
                    border-radius: 14px;
                    font-size: 23px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #9b6cff, #4b7bff);
                    box-shadow: 0 8px 30px rgba(115,95,255,.4);
                }

                .brand-name {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 23px;
                    font-weight: 700;
                    letter-spacing: 2px;
                }

                .heading {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: clamp(35px, 4vw, 48px);
                    line-height: 1.12;
                    font-weight: 700;
                    letter-spacing: -2px;
                    margin: 0 0 14px;
                }

                .heading span {
                    color: #a78bfa;
                }

                .subtitle {
                    color: #999bb9;
                    font-size: 14px;
                    line-height: 1.7;
                    margin-bottom: 36px;
                }

                .field {
                    margin-bottom: 22px;
                }

                .field label {
                    display: block;
                    color: #d8d7ed;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                .input-wrap {
                    height: 55px;
                    display: flex;
                    align-items: center;
                    border: 1px solid rgba(255,255,255,.12);
                    border-radius: 13px;
                    background: rgba(255,255,255,.045);
                    transition: all .3s ease;
                    overflow: hidden;
                }

                .input-wrap:focus-within {
                    border-color: #9b7cff;
                    background: rgba(130,100,255,.09);
                    box-shadow: 0 0 0 4px rgba(140,110,255,.10), 0 0 25px rgba(130,100,255,.12);
                }

                .app.night .input-wrap:focus-within {
                    border-color: #7e8fff;
                    box-shadow: 0 0 25px rgba(95,120,255,.22);
                }

                .app.wrong .input-wrap {
                    border-color: rgba(255,65,90,.7);
                    box-shadow: 0 0 18px rgba(255,50,80,.13);
                }

                .app.success .input-wrap {
                    border-color: rgba(0,255,170,.6);
                    box-shadow: 0 0 18px rgba(0,255,170,.12);
                }

                .input-icon {
                    width: 48px;
                    text-align: center;
                    color: #8889ad;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .input-wrap input {
                    width: 100%;
                    height: 100%;
                    color: white;
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    padding: 0 12px 0 0;
                }

                .input-wrap input::placeholder {
                    color: #686a8b;
                }

                .password-toggle {
                    border: none;
                    color: #9698b8;
                    background: transparent;
                    cursor: pointer;
                    padding: 12px 15px;
                }

                .password-toggle:hover {
                    color: white;
                }

                .form-options {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 4px 0 28px;
                    font-size: 12px;
                }

                .remember {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #aaaac5;
                    cursor: pointer;
                }

                .remember input {
                    accent-color: #9674ff;
                }

                .text-link {
                    color: #ad94ff;
                    text-decoration: none;
                    cursor: pointer;
                }

                .text-link:hover {
                    color: white;
                }

                .submit-btn {
                    width: 100%;
                    height: 55px;
                    border: none;
                    border-radius: 13px;
                    color: white;
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: .4px;
                    cursor: pointer;
                    background: linear-gradient(100deg, #8058ed, #5278ff);
                    box-shadow: 0 10px 30px rgba(105,90,255,.25);
                    transition: all .3s ease;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 35px rgba(105,90,255,.4);
                }

                .submit-btn:active:not(:disabled) {
                    transform: scale(.98);
                }

                .submit-btn:disabled {
                    opacity: .7;
                    cursor: not-allowed;
                }

                .app.wrong .submit-btn {
                    background: linear-gradient(100deg, #e83e64, #ff754d);
                    box-shadow: 0 10px 30px rgba(255,60,80,.2);
                }

                .app.success .submit-btn {
                    background: linear-gradient(100deg, #00a982, #00c9a7);
                    box-shadow: 0 10px 30px rgba(0,220,160,.2);
                }

                .message {
                    min-height: 22px;
                    margin-top: 14px;
                    font-size: 12px;
                    color: #ff8293;
                }

                .app.success .message {
                    color: #53eac0;
                }

                .register {
                    text-align: center;
                    color: #888aa9;
                    font-size: 13px;
                    margin-top: 28px;
                }

                .scene {
                    height: 580px;
                    position: relative;
                    display: grid;
                    place-items: center;
                    perspective: 1000px;
                }

                .app.wrong .scene {
                    animation: shake .45s ease;
                }

                .app.success .scene {
                    animation: celebrate .8s ease;
                }

                .scene-inner {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    transform:
                        rotateY(calc(var(--mouse-x) * .45))
                        rotateX(calc(var(--mouse-y) * -.45));
                    transition: transform .18s ease-out;
                }

                .orb {
                    position: absolute;
                    width: 220px;
                    height: 220px;
                    left: 50%;
                    top: 50%;
                    margin: -110px 0 0 -110px;
                    border-radius: 50%;
                    background:
                        radial-gradient(circle at 30% 25%, #fff 0%, #c3b0ff 5%, #8861ed 25%, #4427a5 55%, #17104e 80%);
                    box-shadow:
                        inset -20px -25px 45px rgba(0,0,0,.55),
                        inset 12px 12px 25px rgba(255,255,255,.35),
                        0 0 70px rgba(125,88,255,.5),
                        0 0 140px rgba(90,75,255,.2);
                    transform: translate3d(
                        calc(var(--mouse-x) * .7),
                        calc(var(--mouse-y) * .7),
                        40px
                    );
                    animation: orbFloat 5s ease-in-out infinite;
                    transition: box-shadow .8s ease, filter .8s ease;
                }

                .app.night .orb {
                    filter: brightness(.65) hue-rotate(20deg);
                    box-shadow: 0 0 90px rgba(90,120,255,.5);
                }

                .app.wrong .orb {
                    filter: hue-rotate(120deg);
                    box-shadow: 0 0 90px rgba(255,40,75,.6);
                }

                .app.success .orb {
                    filter: hue-rotate(100deg);
                    box-shadow: 0 0 100px rgba(0,255,170,.5);
                }

                .orb::before {
                    content: "";
                    position: absolute;
                    inset: 12px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,.35);
                    transform: rotate(-25deg) scaleY(.35);
                }

                .orbit {
                    position: absolute;
                    width: 390px;
                    height: 145px;
                    left: 50%;
                    top: 50%;
                    margin: -72px 0 0 -195px;
                    border: 2px solid rgba(178,153,255,.7);
                    border-radius: 50%;
                    transform: rotate(-28deg) translate3d(
                        calc(var(--mouse-x) * 1.1),
                        calc(var(--mouse-y) * 1.1),
                        70px
                    );
                    box-shadow: 0 0 18px rgba(150,115,255,.3);
                    animation: orbitSpin 12s linear infinite;
                    transition: border-color .8s ease;
                }

                .orbit.two {
                    width: 380px;
                    height: 155px;
                    margin-left: -190px;
                    transform: rotate(65deg);
                    animation: orbitSpinReverse 16s linear infinite;
                    border-color: rgba(65,220,255,.55);
                }

                .orbit-dot {
                    position: absolute;
                    width: 13px;
                    height: 13px;
                    border-radius: 50%;
                    background: #8eeaff;
                    box-shadow: 0 0 20px #48dfff;
                    top: 45%;
                    left: 16%;
                }

                .cube-wrap {
                    position: absolute;
                    right: 5%;
                    top: 14%;
                    width: 90px;
                    height: 90px;
                    transform: translate3d(
                        calc(var(--mouse-x) * -1.1),
                        calc(var(--mouse-y) * -1.1),
                        100px
                    );
                    animation: cubeFloat 7s ease-in-out infinite;
                }

                .cube {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: cubeRotate 12s linear infinite;
                }

                .cube-face {
                    position: absolute;
                    width: 90px;
                    height: 90px;
                    border: 1px solid rgba(255,255,255,.6);
                    background: rgba(142,105,255,.18);
                    box-shadow: inset 0 0 25px rgba(160,125,255,.2);
                    backdrop-filter: blur(5px);
                }

                .front { transform: translateZ(45px); }
                .back { transform: rotateY(180deg) translateZ(45px); }
                .right { transform: rotateY(90deg) translateZ(45px); }
                .left { transform: rotateY(-90deg) translateZ(45px); }
                .top { transform: rotateX(90deg) translateZ(45px); }
                .bottom { transform: rotateX(-90deg) translateZ(45px); }

                .donut {
                    position: absolute;
                    width: 85px;
                    height: 85px;
                    left: 7%;
                    bottom: 18%;
                    border: 15px solid #ff78d2;
                    border-radius: 50%;
                    box-shadow: 0 0 30px rgba(255,90,200,.4), inset 0 0 15px rgba(255,255,255,.4);
                    transform: translate3d(
                        calc(var(--mouse-x) * .8),
                        calc(var(--mouse-y) * .8),
                        80px
                    ) rotateX(65deg);
                    animation: donutFloat 6s ease-in-out infinite;
                }

                .floating-ball {
                    position: absolute;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #9efaff, #477dff);
                    box-shadow: 0 0 25px rgba(70,200,255,.6);
                    right: 12%;
                    bottom: 22%;
                    transform: translate3d(
                        calc(var(--mouse-x) * -1.5),
                        calc(var(--mouse-y) * -1.5),
                        130px
                    );
                    animation: ballFloat 4s ease-in-out infinite;
                }

                .mini-ball {
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: 19%;
                    top: 20%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ffe1a0, #ff8c7a);
                    box-shadow: 0 0 25px rgba(255,180,100,.5);
                    animation: ballFloat 5s ease-in-out infinite reverse;
                }

                .app.wrong .orbit {
                    border-color: rgba(255,75,100,.7);
                }

                .app.success .orbit {
                    border-color: rgba(0,255,180,.7);
                }

                .scene-label {
                    position: absolute;
                    left: 50%;
                    bottom: 5%;
                    transform: translateX(-50%);
                    color: rgba(220,215,255,.65);
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 11px;
                    letter-spacing: 5px;
                    white-space: nowrap;
                }

                @keyframes backgroundFloat {
                    from { transform: translate3d(-2%,-1%,0) scale(1); }
                    to { transform: translate3d(2%,2%,0) scale(1.08); }
                }

                @keyframes sunPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }

                @keyframes twinkle {
                    from { opacity: .25; transform: scale(.7); }
                    to { opacity: 1; transform: scale(1.5); }
                }

                @keyframes orbFloat {
                    0%, 100% { margin-top: -110px; }
                    50% { margin-top: -130px; }
                }

                @keyframes orbitSpin {
                    from { rotate: 0deg; }
                    to { rotate: 360deg; }
                }

                @keyframes orbitSpinReverse {
                    from { rotate: 360deg; }
                    to { rotate: 0deg; }
                }

                @keyframes cubeRotate {
                    from { transform: rotateX(0) rotateY(0); }
                    to { transform: rotateX(360deg) rotateY(360deg); }
                }

                @keyframes cubeFloat {
                    0%, 100% { margin-top: 0; }
                    50% { margin-top: -25px; }
                }

                @keyframes donutFloat {
                    0%, 100% { margin-bottom: 0; }
                    50% { margin-bottom: 25px; }
                }

                @keyframes ballFloat {
                    0%, 100% { margin-top: 0; }
                    50% { margin-top: -35px; }
                }

                @keyframes enterLeft {
                    from { opacity: 0; transform: translateX(-35px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-9px); }
                    40%, 80% { transform: translateX(9px); }
                }

                @keyframes celebrate {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                @media (max-width: 850px) {
                    .layout {
                        width: min(480px, 88%);
                        grid-template-columns: 1fr;
                        gap: 0;
                    }

                    .login-section {
                        max-width: 100%;
                    }

                    .scene {
                        display: none;
                    }

                    .brand {
                        margin-bottom: 45px;
                    }

                    .ambient.one {
                        right: -250px;
                    }
                }

                @media (max-height: 650px) and (min-width: 851px) {
                    .layout {
                        width: 92%;
                        gap: 20px;
                    }

                    .login-section {
                        transform: scale(.88);
                        transform-origin: left center;
                    }

                    .scene {
                        transform: scale(.82);
                    }

                    .brand {
                        margin-bottom: 25px;
                    }

                    .subtitle {
                        margin-bottom: 22px;
                    }

                    .field {
                        margin-bottom: 15px;
                    }

                    .form-options {
                        margin-bottom: 18px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: .01ms !important;
                        animation-iteration-count: 1 !important;
                        scroll-behavior: auto !important;
                    }
                }
            `}</style>

            <div className="ambient one" />
            <div className="ambient two" />
            <div className="sun-glow" />
            <div className="moon-glow" />

            <div className="stars">
                {Array.from({ length: 35 }).map((_, i) => (
                    <span
                        key={i}
                        className="star"
                        style={{
                            left: `${(i * 37) % 100}%`,
                            top: `${(i * 61) % 100}%`,
                            animationDelay: `${(i % 5) * 0.4}s`,
                        }}
                    />
                ))}
            </div>

            <main className="layout">
                <section className="login-section">
                    <div className="brand">
                        <div className="brand-icon">M</div>
                        <div className="brand-name">MADINA ERP</div>
                    </div>

                    <h1 className="heading">
                        Welcome
                        <br />
                        <span>Back Again.</span>
                    </h1>

                    <p className="subtitle">
                        Sign in to continue your journey.
                        <br />
                        Your business workspace awaits.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>Email Address</label>

                            <div className="input-wrap">
                                <span className="input-icon">
                                    <Mail size={18} />
                                </span>

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label>Password</label>

                            <div className="input-wrap">
                                <span className="input-icon">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    onFocus={handlePasswordFocus}
                                    onBlur={handlePasswordBlur}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                Remember me
                            </label>

                            <Link to="/forgot-password" className="text-link">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            className="submit-btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                "Signing in..."
                            ) : effect === "success" ? (
                                "Login Successful ✓"
                            ) : effect === "wrong" ? (
                                "Try Again"
                            ) : (
                                "Sign In →"
                            )}
                        </button>

                        <div className="message" role="status">
                            {message}
                        </div>
                    </form>

                    <div className="register">
                        <ShieldCheck
                            size={14}
                            style={{ verticalAlign: "middle", marginRight: 5 }}
                        />
                        Secure access to Madina ERP
                    </div>
                </section>

                <section className="scene">
                    <div className="scene-inner">
                        <div className="orb" />

                        <div className="orbit">
                            <div className="orbit-dot" />
                        </div>

                        <div className="orbit two" />

                        <div className="cube-wrap">
                            <div className="cube">
                                <div className="cube-face front" />
                                <div className="cube-face back" />
                                <div className="cube-face right" />
                                <div className="cube-face left" />
                                <div className="cube-face top" />
                                <div className="cube-face bottom" />
                            </div>
                        </div>

                        <div className="donut" />
                        <div className="floating-ball" />
                        <div className="mini-ball" />
                    </div>

                    <div className="scene-label">
                        MADINA ERP · BUSINESS MANAGEMENT
                    </div>
                </section>
            </main>
        </div>
    );
}
