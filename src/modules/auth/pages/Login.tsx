import { useEffect, useRef, useState } from "react";
import { login } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Coffee,
  Utensils,
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
      rect.top + 120;

    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    const angle = Math.atan2(dy, dx);

    const distance = Math.min(
      9,
      Math.sqrt(dx * dx + dy * dy) / 45
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
        setTimeout(resolve, 1800)
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
        return "Welcome to our canteen! 👨‍🍳";

      case "watching":
        return "Looking for your order? 👀";

      case "hiding":
        return "I won't peek! 🙈";

      case "thinking":
        return "Checking your order... 🤔";

      case "loading":
        return "Almost ready! 🍽️";

      case "error":
        return "Oops! Wrong order? 😵";

      case "success":
        return "Order confirmed! 🎉";

      default:
        return "Welcome! 👨‍🍳";
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-[#fffaf3]
        relative
        overflow-hidden
        flex
        items-center
        justify-center
        p-4
      "
    >

      {/* ==========================================
          BACKGROUND
      =========================================== */}

      <div className="absolute inset-0 pointer-events-none">

        {/* warm glow */}

        <div
          className="
            absolute
            -top-52
            -left-52
            w-[650px]
            h-[650px]
            rounded-full
            bg-orange-200/40
            blur-[130px]
          "
        />

        <div
          className="
            absolute
            -bottom-52
            -right-52
            w-[650px]
            h-[650px]
            rounded-full
            bg-yellow-200/40
            blur-[130px]
          "
        />

        {/* small food bubbles */}

        <div
          className="
            absolute
            top-[12%]
            left-[8%]
            text-4xl
            animate-[foodFloat_4s_ease-in-out_infinite]
          "
        >
          🍛
        </div>

        <div
          className="
            absolute
            top-[18%]
            right-[10%]
            text-3xl
            animate-[foodFloat_5s_ease-in-out_infinite_reverse]
          "
        >
          ☕
        </div>

        <div
          className="
            absolute
            bottom-[18%]
            left-[12%]
            text-3xl
            animate-[foodFloat_4.5s_ease-in-out_infinite]
          "
        >
          🥤
        </div>

        <div
          className="
            absolute
            bottom-[12%]
            right-[15%]
            text-4xl
            animate-[foodFloat_5s_ease-in-out_infinite_reverse]
          "
        >
          🍔
        </div>

        <div
          className="
            absolute
            top-[30%]
            left-[4%]
            w-4
            h-4
            rounded-full
            bg-orange-400
            animate-ping
          "
        />

        <div
          className="
            absolute
            bottom-[30%]
            right-[5%]
            w-5
            h-5
            rounded-full
            bg-yellow-400
            animate-bounce
          "
        />

        <Sparkles
          className="
            absolute
            top-[10%]
            right-[30%]
            text-orange-400
            animate-pulse
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
          max-w-[1150px]
          min-h-[680px]
          bg-white/90
          backdrop-blur-3xl
          rounded-[42px]
          border
          border-white
          shadow-[0_40px_100px_rgba(120,70,20,0.16)]
          overflow-hidden
          grid
          lg:grid-cols-2
          animate-[enter_0.8s_ease-out]
        "
      >

        {/* ========================================
            CANTEEN CHARACTER AREA
        ========================================= */}

        <div
          className="
            hidden
            lg:flex
            relative
            items-center
            justify-center
            bg-gradient-to-br
            from-[#fff3dc]
            via-[#fffaf0]
            to-[#ffe9d0]
            overflow-hidden
          "
        >

          {/* ======================================
              CANTEEN DECORATION
          ======================================= */}

          <div
            className="
              absolute
              top-8
              left-8
              right-8
              h-14
              rounded-2xl
              bg-white/70
              border
              border-orange-100
              flex
              items-center
              justify-center
              gap-3
              shadow-sm
            "
          >
            <Utensils
              size={20}
              className="text-orange-500"
            />

            <span
              className="
                text-orange-700
                font-black
                tracking-widest
                uppercase
                text-sm
              "
            >
              Madina Canteen
            </span>

            <Coffee
              size={20}
              className="text-orange-500"
            />
          </div>


          {/* ======================================
              FOOD ORBITS
          ======================================= */}

          <div
            className="
              absolute
              w-[430px]
              h-[430px]
              rounded-full
              border
              border-orange-200/60
              animate-[spin_35s_linear_infinite]
            "
          />

          <div
            className="
              absolute
              w-[350px]
              h-[350px]
              rounded-full
              border
              border-dashed
              border-yellow-300/60
              animate-[spin_25s_linear_infinite_reverse]
            "
          />


          {/* floating food */}

          <div
            className="
              absolute
              left-[14%]
              top-[32%]
              text-3xl
              animate-[foodFloat_4s_ease-in-out_infinite]
            "
          >
            🍚
          </div>

          <div
            className="
              absolute
              right-[15%]
              top-[38%]
              text-3xl
              animate-[foodFloat_4.5s_ease-in-out_infinite_reverse]
            "
          >
            🍗
          </div>

          <div
            className="
              absolute
              left-[20%]
              bottom-[25%]
              text-2xl
              animate-[foodFloat_5s_ease-in-out_infinite]
            "
          >
            🥘
          </div>

          <div
            className="
              absolute
              right-[20%]
              bottom-[25%]
              text-2xl
              animate-[foodFloat_4s_ease-in-out_infinite_reverse]
            "
          >
            ☕
          </div>


          {/* ======================================
              SPEECH BUBBLE
          ======================================= */}

          <div
            className={`
              absolute
              top-24
              right-16
              z-30
              px-5
              py-3
              bg-white
              rounded-2xl
              shadow-xl
              border
              border-orange-100
              font-bold
              text-gray-700
              transition-all
              duration-300
              ${
                character === "success"
                  ? "scale-110 rotate-2"
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
              SUCCESS FOOD CONFETTI
          ======================================= */}

          {character === "success" && (
            <div
              className="
                absolute
                inset-0
                pointer-events-none
                z-40
              "
            >
              {[
                "🍚",
                "🍛",
                "🥤",
                "🍗",
                "☕",
                "🥘",
                "🍔",
                "✨",
                "⭐",
                "🎉",
                "🍴",
                "❤️",
              ].map((item, i) => (
                <span
                  key={i}
                  className="
                    absolute
                    text-2xl
                    animate-[foodConfetti_1.8s_ease-out_forwards]
                  "
                  style={{
                    left: `${8 + i * 7}%`,
                    top: `${5 + (i % 4) * 5}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}


          {/* ======================================
              CHEF CHARACTER
          ======================================= */}

          <div
            ref={characterRef}
            className={`
              relative
              w-[330px]
              h-[450px]
              z-20
              transition-all
              duration-500
              ${
                character === "success"
                  ? "animate-[chefCelebrate_0.55s_ease-in-out_infinite]"
                  : character === "error"
                  ? "animate-[chefShake_0.35s_ease-in-out_infinite]"
                  : character === "thinking"
                  ? "animate-[chefThinking_1s_ease-in-out_infinite]"
                  : character === "loading"
                  ? "animate-[chefLoading_0.8s_ease-in-out_infinite]"
                  : "animate-[chefFloat_4s_ease-in-out_infinite]"
              }
            `}
          >

            {/* ground shadow */}

            <div
              className="
                absolute
                bottom-1
                left-1/2
                -translate-x-1/2
                w-48
                h-8
                rounded-full
                bg-orange-900/15
                blur-xl
              "
            />


            {/* ==================================
                BODY / UNIFORM
            ================================== */}

            <div
              className="
                absolute
                bottom-14
                left-1/2
                -translate-x-1/2
                w-[230px]
                h-[220px]
                rounded-[35%]
                bg-gradient-to-br
                from-[#f97316]
                via-[#ea580c]
                to-[#9a3412]
                shadow-[inset_-18px_-20px_30px_rgba(0,0,0,.2),inset_15px_10px_25px_rgba(255,255,255,.25),0_25px_45px_rgba(154,52,18,.25)]
              "
            >

              {/* uniform center */}

              <div
                className="
                  absolute
                  top-7
                  left-1/2
                  -translate-x-1/2
                  w-[150px]
                  h-[165px]
                  rounded-[35%]
                  bg-[#fff7ed]
                  shadow-inner
                "
              />

              {/* buttons */}

              <div
                className="
                  absolute
                  top-12
                  left-1/2
                  -translate-x-1/2
                  space-y-5
                "
              >
                <div className="w-3 h-3 rounded-full bg-orange-600" />
                <div className="w-3 h-3 rounded-full bg-orange-600" />
                <div className="w-3 h-3 rounded-full bg-orange-600" />
              </div>


              {/* =================================
                  LEFT ARM
              ================================= */}

              <div
                className={`
                  absolute
                  -left-10
                  top-16
                  w-16
                  h-24
                  rounded-full
                  bg-gradient-to-br
                  from-[#f97316]
                  to-[#9a3412]
                  origin-top-right
                  transition-all
                  duration-500
                  ${
                    character === "hiding"
                      ? "translate-x-10 -rotate-[55deg]"
                      : character === "success"
                      ? "-rotate-[35deg]"
                      : ""
                  }
                `}
              />


              {/* =================================
                  RIGHT ARM
              ================================= */}

              <div
                className={`
                  absolute
                  -right-10
                  top-16
                  w-16
                  h-24
                  rounded-full
                  bg-gradient-to-br
                  from-[#f97316]
                  to-[#9a3412]
                  origin-top-left
                  transition-all
                  duration-500
                  ${
                    character === "hiding"
                      ? "-translate-x-10 rotate-[55deg]"
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
                from-[#fbbf8b]
                via-[#f59e6b]
                to-[#c2410c]
                shadow-[inset_-15px_-18px_30px_rgba(0,0,0,.18),inset_15px_10px_25px_rgba(255,255,255,.35),0_20px_35px_rgba(154,52,18,.2)]
              "
            >

              {/* =================================
                  CHEF HAT
              ================================== */}

              <div
                className="
                  absolute
                  -top-20
                  left-1/2
                  -translate-x-1/2
                  w-[180px]
                  h-[95px]
                  bg-white
                  rounded-t-[55%]
                  rounded-b-[25px]
                  shadow-[0_10px_20px_rgba(0,0,0,.12)]
                "
              >

                <div
                  className="
                    absolute
                    -top-8
                    left-5
                    w-14
                    h-16
                    bg-white
                    rounded-full
                  "
                />

                <div
                  className="
                    absolute
                    -top-10
                    left-1/2
                    -translate-x-1/2
                    w-16
                    h-20
                    bg-white
                    rounded-full
                  "
                />

                <div
                  className="
                    absolute
                    -top-7
                    right-5
                    w-14
                    h-16
                    bg-white
                    rounded-full
                  "
                />

                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-7
                    bg-[#fff7ed]
                    rounded-b-xl
                    border-t
                    border-orange-100
                  "
                />

              </div>


              {/* =================================
                  EYE 1
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
                        bg-gray-900
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


              {/* =================================
                  EYE 2
              ================================== */}

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
                        bg-gray-900
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


              {/* =================================
                  ERROR EYES
              ================================== */}

              {character === "error" && (
                <>
                  <div
                    className="
                      absolute
                      top-[96px]
                      left-[43px]
                      w-11
                      h-2
                      bg-red-700
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
                      bg-red-700
                      rotate-[-25deg]
                      rounded-full
                    "
                  />
                </>
              )}


              {/* =================================
                  SUCCESS EYES
              ================================== */}

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
                      border-gray-800
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
                      border-gray-800
                      rounded-full
                    "
                  />
                </>
              )}


              {/* =================================
                  MOUTH
              ================================== */}

              <div
                className={`
                  absolute
                  bottom-7
                  left-1/2
                  -translate-x-1/2
                  border-gray-800
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
                FOOD TRAY
            ================================== */}

            <div
              className={`
                absolute
                bottom-[28px]
                left-1/2
                -translate-x-1/2
                z-30
                transition-all
                duration-500
                ${
                  character === "success"
                    ? "translate-y-[-15px] scale-110"
                    : character === "loading"
                    ? "rotate-[-3deg]"
                    : ""
                }
              `}
            >

              {/* food */}

              <div
                className="
                  absolute
                  -top-11
                  left-1/2
                  -translate-x-1/2
                  flex
                  items-end
                  gap-1
                "
              >
                <span className="text-3xl">
                  🍚
                </span>

                <span className="text-2xl">
                  🍗
                </span>

                <span className="text-2xl">
                  🥗
                </span>
              </div>

              {/* tray */}

              <div
                className="
                  w-[175px]
                  h-[25px]
                  rounded-full
                  bg-gradient-to-b
                  from-gray-300
                  to-gray-500
                  border-4
                  border-gray-400
                  shadow-lg
                "
              />

              <div
                className="
                  absolute
                  top-[8px]
                  left-1/2
                  -translate-x-1/2
                  w-[120px]
                  h-3
                  bg-gray-700/40
                  rounded-full
                "
              />

            </div>

          </div>


          {/* ======================================
              CHARACTER FOOTER
          ======================================= */}

          <div
            className="
              absolute
              bottom-7
              left-0
              right-0
              text-center
              z-30
            "
          >

            <h2
              className="
                text-xl
                font-black
                text-gray-800
              "
            >
              {character === "success"
                ? "Enjoy your meal! 🍛"
                : "Fresh food, happy people ❤️"}
            </h2>

            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              {character === "error"
                ? "Let's try your credentials again."
                : "Your friendly canteen assistant is ready."}
            </p>

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
            p-8
            sm:p-14
          "
        >

          <div
            className="
              w-full
              max-w-[390px]
            "
          >

            {/* mobile logo */}

            <div
              className="
                lg:hidden
                flex
                justify-center
                mb-8
              "
            >

              <div
                className="
                  relative
                  w-20
                  h-20
                  rounded-3xl
                  bg-gradient-to-br
                  from-orange-500
                  to-red-500
                  flex
                  items-center
                  justify-center
                  text-white
                  text-4xl
                  shadow-xl
                "
              >
                👨‍🍳

                <span
                  className="
                    absolute
                    -right-2
                    -bottom-2
                    text-2xl
                  "
                >
                  🍛
                </span>

              </div>

            </div>


            {/* title */}

            <div className="mb-9">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  bg-orange-50
                  text-orange-600
                  text-xs
                  font-bold
                  mb-4
                "
              >
                <Utensils size={14} />

                Canteen Portal
              </div>


              <h1
                className="
                  text-4xl
                  font-black
                  text-gray-900
                "
              >
                Welcome
                <span
                  className="
                    text-orange-500
                    ml-2
                  "
                >
                  back!
                </span>
              </h1>


              <p
                className="
                  text-gray-500
                  mt-3
                "
              >
                Sign in to continue to your
                canteen dashboard.
              </p>

            </div>


            {/* error */}

            {error && (
              <div
                className="
                  mb-5
                  p-4
                  rounded-2xl
                  bg-red-50
                  border
                  border-red-100
                  text-red-500
                  text-sm
                  font-medium
                  animate-[chefShake_0.4s_ease-in-out]
                "
              >
                😵 {error}
              </div>
            )}


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
                    font-bold
                    text-gray-700
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
                      text-gray-400
                    "
                  />

                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleEmailChange}
                    className="
                      w-full
                      pl-12
                      pr-4
                      py-4
                      rounded-2xl
                      bg-gray-50
                      border
                      border-gray-200
                      outline-none
                      transition-all
                      focus:bg-white
                      focus:border-orange-400
                      focus:ring-4
                      focus:ring-orange-100
                    "
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <div
                  className="
                    flex
                    justify-between
                    mb-2
                  "
                >

                  <label
                    className="
                      text-sm
                      font-bold
                      text-gray-700
                    "
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="
                      text-xs
                      font-bold
                      text-orange-500
                      hover:text-red-500
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
                      text-gray-400
                    "
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    placeholder="Your password"
                    value={form.password}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                    className="
                      w-full
                      pl-12
                      pr-12
                      py-4
                      rounded-2xl
                      bg-gray-50
                      border
                      border-gray-200
                      outline-none
                      transition-all
                      focus:bg-white
                      focus:border-orange-400
                      focus:ring-4
                      focus:ring-orange-100
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
                      text-gray-400
                      hover:text-orange-500
                      transition
                    "
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  relative
                  w-full
                  py-4
                  rounded-2xl
                  bg-gray-950
                  text-white
                  font-black
                  overflow-hidden
                  shadow-xl
                  hover:-translate-y-1
                  hover:shadow-2xl
                  transition-all
                  duration-300
                  disabled:opacity-60
                "
              >

                <span
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-orange-500
                    via-red-500
                    to-yellow-500
                    translate-y-full
                    group-hover:translate-y-0
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

                      Preparing...
                    </>
                  ) : character === "success" ? (
                    <>
                      Order Ready!
                      🎉
                    </>
                  ) : (
                    <>
                      Login
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


            {/* register */}

            <div
              className="
                mt-8
                text-center
              "
            >

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                Don't have an account?
              </p>

              <Link
                to="/register"
                className="
                  inline-block
                  mt-2
                  font-black
                  text-orange-500
                  hover:text-red-500
                  transition
                "
              >
                Create account →
              </Link>

            </div>


            {/* security */}

            <div
              className="
                mt-8
                text-center
                text-xs
                text-gray-400
              "
            >
              🔒 Your information is securely encrypted
            </div>

          </div>

        </div>

      </div>


      {/* ============================================
          GLOBAL ANIMATIONS
      ============================================= */}

      <style>
        {`

          /* ========================================
             CARD ENTER
          ======================================== */

          @keyframes enter {

            from {
              opacity: 0;
              transform:
                translateY(35px)
                scale(.96);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }

          }


          /* ========================================
             CHEF FLOAT
          ======================================== */

          @keyframes chefFloat {

            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg);
            }

            50% {
              transform:
                translateY(-13px)
                rotate(1deg);
            }

          }


          /* ========================================
             FOOD FLOAT
          ======================================== */

          @keyframes foodFloat {

            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg);
            }

            50% {
              transform:
                translateY(-18px)
                rotate(8deg);
            }

          }


          /* ========================================
             THINKING
          ======================================== */

          @keyframes chefThinking {

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


          /* ========================================
             LOADING
          ======================================== */

          @keyframes chefLoading {

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


          /* ========================================
             ERROR
          ======================================== */

          @keyframes chefShake {

            0%, 100% {
              transform:
                translateX(0)
                rotate(0deg);
            }

            20% {
              transform:
                translateX(-10px)
                rotate(-2deg);
            }

            40% {
              transform:
                translateX(10px)
                rotate(2deg);
            }

            60% {
              transform:
                translateX(-8px)
                rotate(-2deg);
            }

            80% {
              transform:
                translateX(8px)
                rotate(2deg);
            }

          }


          /* ========================================
             SUCCESS
          ======================================== */

          @keyframes chefCelebrate {

            0%, 100% {
              transform:
                translateY(0)
                rotate(0deg)
                scale(1);
            }

            25% {
              transform:
                translateY(-25px)
                rotate(-5deg)
                scale(1.05);
            }

            50% {
              transform:
                translateY(-35px)
                rotate(0deg)
                scale(1.08);
            }

            75% {
              transform:
                translateY(-25px)
                rotate(5deg)
                scale(1.05);
            }

          }


          /* ========================================
             FOOD CONFETTI
          ======================================== */

          @keyframes foodConfetti {

            0% {
              transform:
                translateY(-20px)
                rotate(0deg)
                scale(.5);

              opacity: 0;
            }

            20% {
              opacity: 1;
            }

            100% {
              transform:
                translateY(600px)
                rotate(540deg)
                scale(1);

              opacity: 0;
            }

          }

        `}
      </style>

    </div>
  );
}