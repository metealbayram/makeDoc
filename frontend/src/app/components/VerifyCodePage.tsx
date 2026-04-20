import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

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

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function VerifyCodePage() {
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem("pendingLoginEmail")
    if (!savedEmail) {
      navigate("/login")
      return
    }
    setEmail(savedEmail)
  }, [navigate])

  useEffect(() => {
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const response = await api.post("auth/verify-login-code", {
        email,
        code,
      })

      const { token, user } = response.data.data

      localStorage.setItem("token", token)
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userJob", user.job || "Lawyer")

      if (user.profileImage) {
        localStorage.setItem("userProfileImage", user.profileImage)
      } else {
        localStorage.removeItem("userProfileImage")
      }

      localStorage.removeItem("pendingLoginEmail")
      navigate("/dashboard")
    } catch (verifyError: unknown) {
      setError(getErrorMessage(verifyError, "Verification failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setMessage(null)
    setResendLoading(true)

    try {
      await api.post("auth/resend-login-code", { email })
      setTimeLeft(300)
      setMessage("Yeni doğrulama kodu e-posta adresinize gönderildi.")
    } catch (resendError: unknown) {
      setError(getErrorMessage(resendError, "Code could not be resent"))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#081120] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.30),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.18),transparent_22%),linear-gradient(160deg,#09111f_0%,#0d1728_38%,#101d34_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:54px_54px]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                <span className="material-symbols-outlined text-[18px]">
                  mark_email_read
                </span>
                Secure Verification
              </div>

              <h1 className="mt-8 max-w-lg text-5xl font-black leading-tight tracking-tight">
                E-posta doğrulamasını tamamlayıp hesabınıza güvenle giriş yapın.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Giriş işlemini korumak için size tek kullanımlık bir doğrulama kodu
                gönderdik. Kod sadece kısa süre boyunca geçerlidir ve yalnızca bu
                oturum için kullanılabilir.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">
                  Teslimat
                </p>
                <p className="mt-3 text-xl font-bold">E-posta</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">
                  Kod tipi
                </p>
                <p className="mt-3 text-xl font-bold">6 Haneli</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">
                  Geçerlilik
                </p>
                <p className="mt-3 text-xl font-bold">5 Dakika</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/95 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,8,23,0.45)] backdrop-blur-2xl dark:bg-[#0f172a]/95 dark:text-white sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
                    Email Verification
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    Kodu doğrula
                  </h2>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <span className="material-symbols-outlined text-[28px]">
                    shield_lock
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                  Gönderilen adres
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {email}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm dark:bg-slate-900">
                  <span className="text-slate-500 dark:text-slate-400">
                    Kodun bitmesine kalan süre
                  </span>
                  <span className="font-black text-blue-600 dark:text-blue-300">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {message}
                </div>
              )}

              <form onSubmit={handleVerify} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="verification-code"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    6 haneli doğrulama kodu
                  </label>
                  <input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-center text-3xl font-black tracking-[0.55em] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    required
                  />
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Kodu e-postadaki haliyle girin. Boşluk veya harf kullanmayın.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0 || code.length !== 6}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    verified_user
                  </span>
                  {loading ? "Doğrulanıyor..." : "Kodu Doğrula"}
                </button>
              </form>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || timeLeft > 0}
                  className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    refresh
                  </span>
                  {resendLoading ? "Gönderiliyor..." : "Kodu Yeniden Gönder"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_back
                  </span>
                  Girişe Dön
                </button>
              </div>

              <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-sm font-bold text-slate-900 dark:text-blue-100">
                  Güvenlik notu
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Bu doğrulama kodu yalnızca sizin giriş işleminiz için üretildi.
                  MakeDoc ekibi bu kodu sizden asla istemez.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
