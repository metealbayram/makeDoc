import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import { ModeToggle } from "./mode-toggle"

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }

  return fallback
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      const response = await api.post("auth/sign-in", { email, password })
      localStorage.setItem("pendingLoginEmail", response.data.data.email)
      navigate("/verify-code")
    } catch (loginError: unknown) {
      setError(getErrorMessage(loginError, "Invalid email or password"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex items-center justify-center p-4 transition-colors dark:bg-background-dark dark:text-white">
      <main className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
              <Link to="/">
                  <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-white cursor-pointer">
                      MakeDoc
                  </h1>
              </Link>
          </div>
          <ModeToggle />
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-surface-dark dark:shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-headline text-2xl font-bold text-on-surface dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm font-body text-on-surface-variant dark:text-slate-400">
              Please enter your details to sign in.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              {info}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-on-surface font-label dark:text-slate-200"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-xl text-outline">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-lg border-0 bg-surface-container-lowest py-3 pl-10 pr-3 text-on-surface ring-1 ring-inset ring-outline-variant/30 transition-shadow placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-900/70 dark:text-white dark:ring-slate-700 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="block text-sm font-medium text-on-surface font-label dark:text-slate-200"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInfo("Şifre sıfırlama akışı henüz eklenmedi. İstersen bir sonraki adımda bunu da bağlayayım.")
                  }
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-xl text-outline">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-lg border-0 bg-surface-container-lowest py-3 pl-10 pr-10 text-on-surface ring-1 ring-inset ring-outline-variant/30 transition-shadow placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-900/70 dark:text-white dark:ring-slate-700 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline transition-colors hover:text-on-surface"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full rounded-xl border border-transparent bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#2b67e8] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container-highest" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface-container-lowest px-2 text-outline font-label dark:bg-surface-dark dark:text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              className="flex w-full items-center justify-center rounded-lg border-0 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              type="button"
              onClick={() => setInfo("Google ile giriş henüz aktif değil. İstersen bunu da gerçek OAuth akışına bağlayayım.")}
            >
              <img
                alt="Google logo"
                className="mr-2 h-5 w-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApX91a23_lbFkgrmKbbo4UNIT2jNbwLGWboQ2P3jE4OmhH_pemSXQa3Y6AWORJHvkbvd3MxkHxxPPzSTYynC0dFyew6zTHUrWVd9PZOQEUIFPJHrGZBLPFsGybUozzeEu91-wArPa0eydCcvurPQ-Gy0msURGwD_xdorJxvt_3Di7XhAIMM2zKc2x8PT0cphgSU7ZvqV1nNCxbCSPRDNoS1w97koAnrxnIrcT1naHxM7jWM3n7nbPRXQq_Cv_7td_oD_TnDs3MjAEM"
              />
              Google
            </button>

            <button
              className="flex w-full items-center justify-center rounded-lg border-0 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              type="button"
              onClick={() => setInfo("Apple ile giriş henüz aktif değil. İstersen bunu da gerçek OAuth akışına bağlayayım.")}
            >
              <span className="material-symbols-outlined mr-2 text-xl">
                ios
              </span>
              Apple
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            className="font-medium text-primary transition-colors hover:text-primary-container"
            to="/sign-up"
          >
            Sign up
          </Link>
        </p>
      </main>
    </div>
  )
}
