import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../services/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await api.post("auth/sign-in", { email, password })
      const { token, user } = response.data.data
      localStorage.setItem("token", token)
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userJob", user.job || "Lawyer")
      
      if (user.profileImage) {
        localStorage.setItem("userProfileImage", user.profileImage)
      } else {
        localStorage.removeItem("userProfileImage")
      }

      navigate("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-display overflow-hidden text-[#0e121b] dark:text-white bg-surface-dark">
      
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-60 mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7La0jWU0BF3x6CwQqVgkt0dbMrpS1Yn8OhuULnawaCmjXhDKLwsljX6RXon3Wuy_wnBC-mVzMWBCkXAG0mx6JCVBY6T5z_LdIFgQHvuQbKw0hYF2Kibf_lv-CosN_YnTLZqWeApFePiTx9rH0cwbWM0gY4ERsg_HraCad_-pjPIj_9Vy7ArBzoHii6YO0wq516aHOrJGvBMnsDQudWMiB2U60P4Qk1cxI9Su5M7ra0qrn6AgbA1gaX1m4BTudyoUQf2G4MzMVmDQ")'
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-login-primary/90 to-background-dark/80"></div>

      <main className="relative z-10 w-full flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="h-20 w-20 bg-login-primary/15 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-white text-[55px]">description</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white shadow-sm">MakeDoc</h2>
          </div>

          {/* Auth Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl shadow-black/20 border border-white/20 dark:border-gray-800 overflow-hidden backdrop-blur-sm">
            <div className="p-8 sm:p-10 flex flex-col gap-6">
              
              {/* Heading */}
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-[#0e121b] dark:text-white">Sign in to your account</h1>
                <p className="text-[#4e6797] dark:text-gray-400 text-sm font-normal">
                  Welcome back, please enter your details.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px]">error</span>
                   {error}
                </div>
              )}

              {/* Form */}
              <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                
                {/* Email Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium leading-none text-[#0e121b] dark:text-gray-200" htmlFor="email">Email address</label>
                  <div className="relative">
                    <input 
                      className="form-input flex w-full rounded-lg border border-[#d0d7e7] dark:border-gray-600 bg-[#f8f9fc] dark:bg-gray-800/50 px-4 py-3 text-base text-[#0e121b] dark:text-white placeholder:text-[#4e6797] dark:placeholder:text-gray-500 focus:border-login-primary focus:ring-1 focus:ring-login-primary transition-all duration-200" 
                      id="email" 
                      placeholder="name@firm.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-[#0e121b] dark:text-gray-200" htmlFor="password">Password</label>
                  </div>
                  <div className="relative flex items-stretch">
                    <input 
                      className="form-input flex w-full rounded-l-lg rounded-r-none border border-r-0 border-[#d0d7e7] dark:border-gray-600 bg-[#f8f9fc] dark:bg-gray-800/50 px-4 py-3 text-base text-[#0e121b] dark:text-white placeholder:text-[#4e6797] dark:placeholder:text-gray-500 focus:border-login-primary focus:ring-1 focus:ring-login-primary focus:z-10 transition-all duration-200" 
                      id="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="flex items-center justify-center px-4 rounded-r-lg border border-l-0 border-[#d0d7e7] dark:border-gray-600 bg-[#f8f9fc] dark:bg-gray-800/50 text-[#4e6797] hover:text-login-primary transition-colors focus:z-10 focus:ring-1 focus:ring-login-primary focus:border-login-primary focus:outline-none" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Forgot Password & Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      className="rounded border-gray-300 text-login-primary focus:ring-login-primary h-4 w-4 cursor-pointer" 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-sm text-[#4e6797] dark:text-gray-400 group-hover:text-[#0e121b] dark:group-hover:text-gray-300 transition-colors">Remember me</span>
                  </label>
                  <a className="text-sm font-medium text-login-primary hover:text-login-primary/80 underline decoration-transparent hover:decoration-current transition-all" href="#">Forgot password?</a>
                </div>

                {/* Submit Button */}
                <button 
                  className="group relative flex w-full justify-center rounded-lg bg-login-primary py-3.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-login-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-login-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-white/60 text-[20px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-white/40 group-hover:text-white/60 transition-colors text-[20px]">lock</span>
                    )}
                  </span>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>

            {/* Footer area inside card */}
            <div className="bg-gray-50 dark:bg-gray-800/30 px-8 py-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-[#4e6797] dark:text-gray-400">
                Don't have an account? 
                <Link className="font-medium text-login-primary hover:text-login-primary/80 transition-colors ml-1" to="/sign-up">Sign up</Link>
              </p>
            </div>
          </div>

          {/* Bottom Footer */}
          <footer className="text-center mt-4">
            <p className="text-xs text-white/60">
              © 2024 Lawyer Management Systems. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center gap-4 text-xs text-white/60">
              <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
              <span>·</span>
              <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
            </div>
          </footer>

        </div>
      </main>
    </div>
  )
}
