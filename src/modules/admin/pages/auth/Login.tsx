import { useEffect, useRef, useState } from "react";
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

type CharacterState =
  | "idle"
  | "watching"
  | "hiding"
  | "thinking"
  | "loading"
  | "error"
  | "success";

export default function Login() {
  const navigate = useNavigate();
  const characterRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [character, setCharacter] =
    useState<CharacterState>("idle");

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  // ============================================
  // MOUSE TRACKING
  // ============================================

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, []);

  // ============================================
  // EYE MOVEMENT
  // ============================================

  const getEyePosition = () => {
    if (!characterRef.current) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      characterRef.current.getBoundingClientRect();

    const centerX =
      rect.left + rect.width / 2;

    const centerY =
      rect.top + 125;

    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    const angle = Math.atan2(dy, dx);

    const distance = Math.min(
      8,
      Math.sqrt(dx * dx + dy * dy) / 50
    );

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  };

  const eye = getEyePosition();

  // ============================================
  // EMAIL CHANGE
  // ============================================

  const handleEmailChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setForm({
      ...form,
      email: value,
    });

    setError("");

    if (value.length > 0) {
      setCharacter("watching");
    } else {
      setCharacter("idle");
    }
  };

  // ============================================
  // PASSWORD FOCUS
  // ============================================

  const handlePasswordFocus = () => {
    setCharacter("hiding");
  };

  const handlePasswordBlur = () => {
    if (!loading && !error) {
      setCharacter(
        form.email.length > 0
          ? "watching"
          : "idle"
      );
    }
  };

  // ============================================
  // LOGIN
  // ============================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setCharacter("thinking");

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    setCharacter("loading");

    try {
      await login(form);

      setCharacter("success");
      setLoading(false);

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      navigate("/dashboard");
    } catch (err: any) {
      setLoading(false);

      setError(
        err.response?.data?.message ||
          "Invalid email or password"
      );

      setCharacter("error");
    }
  };

  // ============================================
  // CHARACTER MESSAGE
  // ============================================

  const getCharacterMessage = () => {
    switch (character) {
      case "idle":
        return "Welcome to Madina ERP";

      case "watching":
        return "Ready to sign in?";

      case "hiding":
        return "Your password is safe with me";

      case "thinking":
        return "Verifying your credentials...";

      case "loading":
        return "Signing you in...";

      case "error":
        return "Please check your credentials";

      case "success":
        return "Welcome back!";

      default:
        return "Welcome to Madina ERP";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] relative overflow-hidden flex items-center justify-center p-4">

      {/* ==========================================
          BACKGROUND
      =========================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        <div
          className="
            absolute
            -top-60
            -left-60
            w-[650px]
            h-[650px]
            rounded-full
            bg-blue-200/30
            blur-[140px]
          "
        />

        <div
          className="
            absolute
            -bottom-60
            -right-60
            w-[650px]
            h-[650px]
            rounded-full
            bg-slate-300/30
            blur-[140px]
          "
        />

        <div
          className="
            absolute
            top-[15%]
            right-[8%]
            w-2
            h-2
            rounded-full
            bg-blue-400
            animate-pulse
          "
        />

        <div
          className="
            absolute
            bottom-[18%]
            left-[7%]
            w-3
            h-3
            rounded-full
            bg-blue-300
            animate-ping
          "
        />

        <div
          className="
            absolute
            top-[35%]
            left-[3%]
            w-16
            h-16
            border
            border-blue-200/50
            rounded-full
          "
        />

        <div
          className="
            absolute
            bottom-[12%]
            right-[4%]
            w-24
            h-24
            border
            border-slate-200
            rounded-full
          "
        />

      </div>


      {/* ==========================================
          MAIN CARD
      =========================================== */}

      <div
        className="
          relative
          w-full
          max-w-[1180px]
          min-h-[680px]
          bg-white
          rounded-[30px]
          border
          border-slate-200
          shadow-[0_30px_80px_rgba(15,23,42,0.12)]
          overflow-hidden
          grid
          lg:grid-cols-2
          animate-[pageEnter_0.7s_ease-out]
        "
      >

        {/* ========================================
            LEFT / ERP ASSISTANT AREA
        ========================================= */}

        <div
          className="
            hidden
            lg:flex
            relative
            items-center
            justify-center
            overflow-hidden
            bg-gradient-to-br
            from-[#071a3d]
            via-[#0b2a5b]
            to-[#123b73]
          "
        >

          {/* background grid */}

          <div
            className="
              absolute
              inset-0
              opacity-[0.08]
              bg-[linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)]
              bg-[size:45px_45px]
            "
          />

          {/* blue glow */}

          <div
            className="
              absolute
              top-[-120px]
              left-[-120px]
              w-[400px]
              h-[400px]
              rounded-full
              bg-blue-400/20
              blur-[100px]
            "
          />

          <div
            className="
              absolute
              bottom-[-150px]
              right-[-100px]
              w-[450px]
              h-[450px]
              rounded-full
              bg-cyan-400/10
              blur-[110px]
            "
          />


          {/* ======================================
              TOP BRAND
          ======================================= */}

          <div
            className="
              absolute
              top-8
              left-8
              right-8
              flex
              items-center
              justify-between
              z-30
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-white/10
                  border
                  border-white/15
                  backdrop-blur
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
              >
                <Building2
                  size={22}
                  className="text-white"
                />
              </div>

              <div>

                <div
                  className="
                    text-white
                    font-black
                    text-lg
                    tracking-tight
                  "
                >
                  Madina ERP
                </div>

                <div
                  className="
                    text-blue-200
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                  "
                >
                  Enterprise Resource Planning
                </div>

              </div>

            </div>


            <div
              className="
                px-3
                py-1.5
                rounded-full
                bg-white/10
                border
                border-white/10
                text-blue-100
                text-xs
                font-semibold
              "
            >
              Secure Access
            </div>

          </div>


          {/* ======================================
              ORBITS
          ======================================= */}

          <div
            className="
              absolute
              w-[430px]
              h-[430px]
              rounded-full
              border
              border-white/10
              animate-[slowSpin_35s_linear_infinite]
            "
          />

          <div
            className="
              absolute
              w-[330px]
              h-[330px]
              rounded-full
              border
              border-dashed
              border-blue-300/15
              animate-[slowSpinReverse_25s_linear_infinite]
            "
          />


          {/* orbit dots */}

          <div
            className="
              absolute
              w-3
              h-3
              rounded-full
              bg-blue-300
              shadow-[0_0_20px_rgba(147,197,253,.8)]
              animate-[orbitDot_5s_linear_infinite]
            "
          />

          <div
            className="
              absolute
              w-2
              h-2
              rounded-full
              bg-cyan-300
              shadow-[0_0_15px_rgba(103,232,249,.8)]
              animate-[orbitDotReverse_7s_linear_infinite]
            "
          />


          {/* ======================================
              SPEECH BUBBLE
          ======================================= */}

          <div
            className={`
              absolute
              top-28
              right-14
              z-40
              px-5
              py-3
              bg-white
              rounded-2xl
              shadow-[0_15px_35px_rgba(0,0,0,.2)]
              border
              border-slate-100
              text-slate-700
              text-sm
              font-semibold
              transition-all
              duration-300
              ${
                character === "success"
                  ? "scale-105"
                  : ""
              }
            `}
          >
            {getCharacterMessage()}

            <div
              className="
                absolute
                -bottom-2
                left-8
                w-4
                h-4
                bg-white
                rotate-45
              "
            />

          </div>


          {/* ======================================
              3D ERP ASSISTANT
          ======================================= */}

          <div
            ref={characterRef}
            className={`
              relative
              w-[330px]
              h-[455px]
              z-20
              transition-all
              duration-500
              ${
                character === "success"
                  ? "animate-[assistantCelebrate_.55s_ease-in-out_infinite]"
                  : character === "error"
                  ? "animate-[assistantShake_.35s_ease-in-out_infinite]"
                  : character === "thinking"
                  ? "animate-[assistantThinking_1s_ease-in-out_infinite]"
                  : character === "loading"
                  ? "animate-[assistantLoading_.8s_ease-in-out_infinite]"
                  : "animate-[assistantFloat_4s_ease-in-out_infinite]"
              }
            `}
          >

            {/* shadow */}

            <div
              className="
                absolute
                bottom-0
                left-1/2
                -translate-x-1/2
                w-48
                h-7
                rounded-full
                bg-black/25
                blur-xl
              "
            />


            {/* ==================================
                BODY
            ================================== */}

            <div
              className="
                absolute
                bottom-12
                left-1/2
                -translate-x-1/2
                w-[225px]
                h-[220px]
                rounded-[42px]
                bg-gradient-to-br
                from-[#2563eb]
                via-[#1d4ed8]
                to-[#172554]
                shadow-[inset_-20px_-20px_30px_rgba(0,0,0,.25),inset_15px_10px_25px_rgba(255,255,255,.16),0_25px_45px_rgba(0,0,0,.25)]
              "
            >

              {/* shirt center */}

              <div
                className="
                  absolute
                  top-7
                  left-1/2
                  -translate-x-1/2
                  w-[145px]
                  h-[165px]
                  rounded-[32px]
                  bg-slate-50
                  shadow-inner
                "
              >

                {/* ID badge */}

                <div
                  className="
                    absolute
                    top-8
                    left-1/2
                    -translate-x-1/2
                    w-14
                    h-16
                    rounded-lg
                    bg-white
                    border
                    border-slate-200
                    shadow-md
                    flex
                    flex-col
                    items-center
                    justify-center
                  "
                >

                  <Building2
                    size={18}
                    className="text-blue-600"
                  />

                  <span
                    className="
                      text-[7px]
                      font-black
                      text-slate-500
                      mt-1
                    "
                  >
                    ERP
                  </span>

                </div>

                {/* buttons */}

                <div
                  className="
                    absolute
                    top-8
                    left-3
                    space-y-5
                  "
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>

              </div>


              {/* LEFT ARM */}

              <div
                className={`
                  absolute
                  -left-9
                  top-16
                  w-16
                  h-24
                  rounded-full
                  bg-gradient-to-br
                  from-[#2563eb]
                  to-[#172554]
                  origin-top-right
                  transition-all
                  duration-500
                  ${
                    character === "hiding"
                      ? "translate-x-9 -rotate-[55deg]"
                      : character === "success"
                      ? "-rotate-[35deg]"
                      : ""
                  }
                `}
              />


              {/* RIGHT ARM */}

              <div
                className={`
                  absolute
                  -right-9
                  top-16
                  w-16
                  h-24
                  rounded-full
                  bg-gradient-to-br
                  from-[#2563eb]
                  to-[#172554]
                  origin-top-left
                  transition-all
                  duration-500
                  ${
                    character === "hiding"
                      ? "-translate-x-9 rotate-[55deg]"
                      : character === "success"
                      ? "rotate-[35deg]"
                      : ""
                  }
                `}
              />

            </div>


            {/* ==================================
                HEAD
            ================================== */}

            <div
              className="
                absolute
                top-24
                left-1/2
                -translate-x-1/2
                w-[245px]
                h-[205px]
                rounded-[44%]
                bg-gradient-to-br
                from-[#ffd7b0]
                via-[#f5b98c]
                to-[#c97950]
                shadow-[inset_-15px_-18px_30px_rgba(0,0,0,.16),inset_15px_10px_25px_rgba(255,255,255,.35),0_20px_35px_rgba(0,0,0,.18)]
              "
            >

              {/* hair */}

              <div
                className="
                  absolute
                  -top-3
                  left-1/2
                  -translate-x-1/2
                  w-[220px]
                  h-[65px]
                  rounded-t-[50%]
                  bg-gradient-to-b
                  from-[#172033]
                  to-[#0f172a]
                  shadow-lg
                "
              />

              {/* hair side */}

              <div
                className="
                  absolute
                  top-7
                  left-2
                  w-9
                  h-20
                  rounded-full
                  bg-[#172033]
                "
              />

              <div
                className="
                  absolute
                  top-7
                  right-2
                  w-9
                  h-20
                  rounded-full
                  bg-[#172033]
                "
              />


              {/* =================================
                  LEFT EYE
              ================================== */}

              <div
                className="
                  absolute
                  top-[68px]
                  left-[38px]
                  w-[68px]
                  h-[74px]
                  rounded-full
                  bg-white
                  overflow-hidden
                  shadow-[inset_0_-7px_13px_rgba(0,0,0,.12)]
                "
              >

                {character !== "hiding" &&
                  character !== "error" && (
                    <div
                      className="
                        absolute
                        w-6
                        h-6
                        rounded-full
                        bg-slate-900
                        transition-transform
                        duration-100
                      "
                      style={{
                        left:
                          `calc(50% - 12px + ${eye.x}px)`,
                        top:
                          `calc(50% - 12px + ${eye.y}px)`,
                      }}
                    >
                      <div
                        className="
                          absolute
                          top-1
                          left-1
                          w-2
                          h-2
                          bg-white
                          rounded-full
                        "
                      />
                    </div>
                  )}

              </div>


              {/* RIGHT EYE */}

              <div
                className="
                  absolute
                  top-[68px]
                  right-[38px]
                  w-[68px]
                  h-[74px]
                  rounded-full
                  bg-white
                  overflow-hidden
                  shadow-[inset_0_-7px_13px_rgba(0,0,0,.12)]
                "
              >

                {character !== "hiding" &&
                  character !== "error" && (
                    <div
                      className="
                        absolute
                        w-6
                        h-6
                        rounded-full
                        bg-slate-900
                        transition-transform
                        duration-100
                      "
                      style={{
                        left:
                          `calc(50% - 12px + ${eye.x}px)`,
                        top:
                          `calc(50% - 12px + ${eye.y}px)`,
                      }}
                    >
                      <div
                        className="
                          absolute
                          top-1
                          left-1
                          w-2
                          h-2
                          bg-white
                          rounded-full
                        "
                      />
                    </div>
                  )}

              </div>


              {/* ERROR EYES */}

              {character === "error" && (
                <>
                  <div
                    className="
                      absolute
                      top-[96px]
                      left-[43px]
                      w-11
                      h-2
                      bg-red-600
                      rotate-[25deg]
                      rounded-full
                    "
                  />

                  <div
                    className="
                      absolute
                      top-[96px]
                      right-[43px]
                      w-11
                      h-2
                      bg-red-600
                      rotate-[-25deg]
                      rounded-full
                    "
                  />
                </>
              )}


              {/* SUCCESS EYES */}

              {character === "success" && (
                <>
                  <div
                    className="
                      absolute
                      top-[95px]
                      left-[45px]
                      w-11
                      h-6
                      border-t-4
                      border-slate-800
                      rounded-full
                    "
                  />

                  <div
                    className="
                      absolute
                      top-[95px]
                      right-[45px]
                      w-11
                      h-6
                      border-t-4
                      border-slate-800
                      rounded-full
                    "
                  />
                </>
              )}


              {/* NOSE */}

              <div
                className="
                  absolute
                  top-[128px]
                  left-1/2
                  -translate-x-1/2
                  w-4
                  h-6
                  border-r-2
                  border-b-2
                  border-[#b56b48]
                  rounded-br-full
                "
              />


              {/* MOUTH */}

              <div
                className={`
                  absolute
                  bottom-7
                  left-1/2
                  -translate-x-1/2
                  border-slate-800
                  transition-all
                  duration-300
                  ${
                    character === "success"
                      ? "w-16 h-9 border-b-8 rounded-full"
                      : character === "error"
                      ? "w-12 h-7 border-t-4 rounded-full"
                      : character === "thinking"
                      ? "w-7 h-7 border-r-4 border-b-4 rounded-full rotate-45"
                      : "w-14 h-7 border-b-4 rounded-full"
                  }
                `}
              />

            </div>


            {/* ==================================
                LAPTOP / ERP DEVICE
            ================================== */}

            <div
              className={`
                absolute
                bottom-[25px]
                left-1/2
                -translate-x-1/2
                z-30
                transition-all
                duration-500
                ${
                  character === "success"
                    ? "translate-y-[-15px] scale-110"
                    : character === "loading"
                    ? "rotate-[-2deg]"
                    : ""
                }
              `}
            >

              {/* screen */}

              <div
                className="
                  w-[150px]
                  h-[92px]
                  rounded-xl
                  bg-slate-900
                  border-[5px]
                  border-slate-700
                  shadow-2xl
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full
                    bg-gradient-to-br
                    from-blue-50
                    to-slate-100
                    p-3
                  "
                >

                  <div className="flex gap-1 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>

                  <div className="flex gap-2">

                    <div
                      className="
                        w-7
                        bg-blue-600/20
                        rounded
                        h-14
                      "
                    />

                    <div className="flex-1 space-y-2">

                      <div
                        className="
                          h-2
                          w-14
                          bg-blue-600/50
                          rounded
                        "
                      />

                      <div className="grid grid-cols-2 gap-1">

                        <div className="h-6 bg-white rounded shadow-sm" />
                        <div className="h-6 bg-white rounded shadow-sm" />
                        <div className="h-6 bg-white rounded shadow-sm" />
                        <div className="h-6 bg-white rounded shadow-sm" />

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* laptop base */}

              <div
                className="
                  w-[180px]
                  h-[10px]
                  -mt-1
                  -ml-[15px]
                  rounded-b-xl
                  bg-gradient-to-b
                  from-slate-500
                  to-slate-700
                  shadow-lg
                "
              />

            </div>

          </div>


          {/* ======================================
              FOOTER
          ======================================= */}

          <div
            className="
              absolute
              bottom-8
              left-0
              right-0
              text-center
              z-30
            "
          >

            <div
              className="
                text-white
                font-bold
                text-lg
              "
            >
              {character === "success"
                ? "Access granted"
                : "One platform. Complete control."}
            </div>

            <div
              className="
                text-blue-200
                text-xs
                mt-1
              "
            >
              Manage your business operations efficiently
            </div>

          </div>

        </div>


        {/* ========================================
            LOGIN FORM
        ========================================= */}

        <div
          className="
            flex
            items-center
            justify-center
            p-7
            sm:p-12
            lg:p-16
            bg-white
          "
        >

          <div
            className="
              w-full
              max-w-[400px]
            "
          >

            {/* mobile logo */}

            <div
              className="
                lg:hidden
                flex
                items-center
                gap-3
                mb-10
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#0b2a5b]
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
              >
                <Building2
                  size={24}
                  className="text-white"
                />
              </div>

              <div>

                <div
                  className="
                    text-xl
                    font-black
                    text-slate-900
                  "
                >
                  Madina ERP
                </div>

                <div
                  className="
                    text-[10px]
                    uppercase
                    tracking-widest
                    text-slate-400
                  "
                >
                  Enterprise Management System
                </div>

              </div>

            </div>


            {/* heading */}

            <div className="mb-9">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  bg-blue-50
                  text-blue-700
                  text-xs
                  font-bold
                  mb-4
                "
              >
                <ShieldCheck size={14} />

                Secure Portal
              </div>


              <h1
                className="
                  text-[36px]
                  leading-tight
                  font-black
                  tracking-tight
                  text-slate-900
                "
              >
                Welcome back
              </h1>


              <p
                className="
                  text-slate-500
                  mt-3
                  text-sm
                  leading-6
                "
              >
                Sign in to access your
                <span className="font-semibold text-slate-700">
                  {" "}Madina ERP
                </span>
                {" "}workspace.
              </p>

            </div>


            {/* error */}

            {error && (
              <div
                className="
                  mb-5
                  p-4
                  rounded-xl
                  bg-red-50
                  border
                  border-red-100
                  text-red-600
                  text-sm
                  font-medium
                  flex
                  items-start
                  gap-2
                  animate-[assistantShake_.4s_ease-in-out]
                "
              >
                <span className="text-base">
                  !
                </span>

                <span>{error}</span>

              </div>
            )}


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  "
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleEmailChange}
                    className="
                      w-full
                      h-[52px]
                      pl-12
                      pr-4
                      rounded-xl
                      bg-slate-50
                      border
                      border-slate-200
                      outline-none
                      text-slate-800
                      placeholder:text-slate-400
                      transition-all
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    mb-2
                  "
                >

                  <label
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="
                      text-xs
                      font-semibold
                      text-blue-600
                      hover:text-blue-700
                      transition
                    "
                  >
                    Forgot password?
                  </Link>

                </div>


                <div className="relative">

                  <Lock
                    size={19}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        password: e.target.value,
                      });

                      setError("");
                    }}
                    className="
                      w-full
                      h-[52px]
                      pl-12
                      pr-12
                      rounded-xl
                      bg-slate-50
                      border
                      border-slate-200
                      outline-none
                      text-slate-800
                      placeholder:text-slate-400
                      transition-all
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                      hover:text-blue-600
                      transition
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              {/* REMEMBER / SECURITY */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-slate-400
                "
              >
                <ShieldCheck
                  size={15}
                  className="text-emerald-500"
                />

                Your account information is protected
              </div>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  relative
                  w-full
                  h-[54px]
                  rounded-xl
                  bg-[#0b2a5b]
                  text-white
                  font-bold
                  overflow-hidden
                  shadow-[0_10px_25px_rgba(11,42,91,.22)]
                  hover:bg-[#123b73]
                  hover:-translate-y-[1px]
                  hover:shadow-[0_14px_30px_rgba(11,42,91,.28)]
                  transition-all
                  duration-300
                  disabled:opacity-60
                  disabled:hover:translate-y-0
                "
              >

                <span
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-blue-600
                    via-blue-500
                    to-cyan-500
                    translate-x-[-100%]
                    group-hover:translate-x-0
                    transition-transform
                    duration-500
                  "
                />

                <span
                  className="
                    relative
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  {loading ? (
                    <>
                      <span
                        className="
                          w-5
                          h-5
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                          animate-spin
                        "
                      />

                      Signing in...
                    </>
                  ) : character === "success" ? (
                    <>
                      <CheckCircle2 size={19} />
                      Access Granted
                    </>
                  ) : (
                    <>
                      Sign in to ERP

                      <ArrowRight
                        size={19}
                        className="
                          group-hover:translate-x-1
                          transition
                        "
                      />
                    </>
                  )}

                </span>

              </button>

            </form>

            {/* FOOTER */}

            <div
              className="
                mt-10
                pt-5
                border-t
                border-slate-100
                flex
                items-center
                justify-between
                text-[11px]
                text-slate-400
              "
            >

              <span>
                © {new Date().getFullYear()} Madina ERP
              </span>

              <span className="flex items-center gap-1">
                <ShieldCheck size={13} />
                Secure Login
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* ============================================
          ANIMATIONS
      ============================================= */}

      <style>
        {`

          @keyframes pageEnter {
            from {
              opacity: 0;
              transform:
                translateY(25px)
                scale(.98);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }
          }


          @keyframes assistantFloat {
            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg);
            }

            50% {
              transform:
                translateY(-12px)
                rotate(1deg);
            }
          }


          @keyframes assistantThinking {
            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg);
            }

            50% {
              transform:
                translateY(-7px)
                rotate(-3deg);
            }
          }


          @keyframes assistantLoading {
            0%, 100% {
              transform:
                translateY(0)
                scale(1);
            }

            50% {
              transform:
                translateY(-14px)
                scale(1.03);
            }
          }


          @keyframes assistantShake {
            0%, 100% {
              transform:
                translateX(0)
                rotate(0deg);
            }

            20% {
              transform:
                translateX(-9px)
                rotate(-2deg);
            }

            40% {
              transform:
                translateX(9px)
                rotate(2deg);
            }

            60% {
              transform:
                translateX(-7px)
                rotate(-2deg);
            }

            80% {
              transform:
                translateX(7px)
                rotate(2deg);
            }
          }


          @keyframes assistantCelebrate {
            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg)
                scale(1);
            }

            25% {
              transform:
                translateY(-20px)
                rotate(-4deg)
                scale(1.04);
            }

            50% {
              transform:
                translateY(-30px)
                rotate(0deg)
                scale(1.07);
            }

            75% {
              transform:
                translateY(-20px)
                rotate(4deg)
                scale(1.04);
            }
          }


          @keyframes slowSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }


          @keyframes slowSpinReverse {
            from {
              transform: rotate(360deg);
            }

            to {
              transform: rotate(0deg);
            }
          }


          @keyframes orbitDot {
            from {
              transform:
                rotate(0deg)
                translateX(215px)
                rotate(0deg);
            }

            to {
              transform:
                rotate(360deg)
                translateX(215px)
                rotate(-360deg);
            }
          }


          @keyframes orbitDotReverse {
            from {
              transform:
                rotate(360deg)
                translateX(165px)
                rotate(-360deg);
            }

            to {
              transform:
                rotate(0deg)
                translateX(165px)
                rotate(0deg);
            }
          }

        `}
      </style>

    </div>
  );
}

