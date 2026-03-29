import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB")
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!termsAccepted) {
      setError("You must accept the Terms of Service and Privacy Policy")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("email", email)
      formData.append("password", password)
      if (profileImage) {
        formData.append("profileImage", profileImage)
      }

      const response = await api.post("auth/sign-up", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.data && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token)
        localStorage.setItem("userName", response.data.data.user.name)
        localStorage.setItem("userJob", response.data.data.user.job || "Lawyer")
        if (response.data.data.user.profileImage) {
          localStorage.setItem("userProfileImage", response.data.data.user.profileImage)
        } else {
            localStorage.removeItem("userProfileImage")
        }
        navigate("/dashboard")
      } else {
        navigate("/login")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  // Password strength visual logic (simple version)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0
    if (pass.length < 6) return 1
    if (pass.length < 10) return 2
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return 3
    if (pass.match(/[^a-zA-Z0-9]/)) return 4
    return 2 // default medium for decent length
  }
  
  const strength = getPasswordStrength(password)
  const strengthColor = strength < 2 ? "bg-red-500" : strength < 4 ? "bg-yellow-500" : "bg-green-500"
  const strengthText = strength < 2 ? "Weak" : strength < 4 ? "Medium" : "Strong"
  const strengthTextColor = strength < 2 ? "text-red-600" : strength < 4 ? "text-yellow-600" : "text-green-600"

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased transition-colors duration-200">
      <div className="flex min-h-screen w-full flex-row overflow-hidden">
        {/* Left Side: Branding/Image Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dark items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-60 mix-blend-overlay"
            data-alt="Abstract view of modern courthouse architecture with pillars"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7La0jWU0BF3x6CwQqVgkt0dbMrpS1Yn8OhuULnawaCmjXhDKLwsljX6RXon3Wuy_wnBC-mVzMWBCkXAG0mx6JCVBY6T5z_LdIFgQHvuQbKw0hYF2Kibf_lv-CosN_YnTLZqWeApFePiTx9rH0cwbWM0gY4ERsg_HraCad_-pjPIj_9Vy7ArBzoHii6YO0wq516aHOrJGvBMnsDQudWMiB2U60P4Qk1cxI9Su5M7ra0qrn6AgbA1gaX1m4BTudyoUQf2G4MzMVmDQ")',
            }}
          ></div>
          {/* Dark Overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-background-dark/80 z-10"></div>
          {/* Content */}
          <div className="relative z-20 max-w-lg px-12 text-center flex flex-col items-center gap-8">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-2xl">
              <span className="material-symbols-outlined text-white text-3xl">description</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Streamline Your Practice</h2>
              <p className="text-white/80 text-lg font-light leading-relaxed">
                Join thousands of legal professionals who trust our system to manage cases, secure documents, and communicate with
                clients efficiently.
              </p>
            </div>
            {/* Trust Indicators */}
            <div className="flex gap-6 mt-4 pt-8 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">10k+</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Lawyers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">99.9%</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Uptime</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">Secure</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark relative">
          <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create your account</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link className="font-medium text-primary hover:text-blue-700 transition-colors" to="/login">
                    Sign in
                  </Link>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                {/* Profile Photo Upload */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-2">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById("profile-upload")?.click()}>
                    <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-surface-dark border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl group-hover:text-primary transition-colors">
                          add_a_photo
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-lg border-2 border-white dark:border-background-dark flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-center sm:text-left pt-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Profile Photo</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Accepts JPG, PNG or GIF. Max size of 2MB.</span>
                    <button
                      className="mt-2 text-xs font-medium text-primary hover:text-blue-700 self-center sm:self-start"
                      type="button"
                      onClick={() => document.getElementById("profile-upload")?.click()}
                    >
                      Upload
                    </button>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200" htmlFor="name">
                      Full Legal Name
                    </label>
                    <div className="mt-2 relative">
                      <input
                        autoComplete="name"
                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-border-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-shadow"
                        id="name"
                        name="name"
                        placeholder="Jane Doe"
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                    </div>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200" htmlFor="email">
                      Work Email
                    </label>
                    <div className="mt-2 relative">
                      <input
                        autoComplete="email"
                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-border-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-shadow"
                        id="email"
                        name="email"
                        placeholder="jane@lawfirm.com"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                    </div>
                  </div>
                  {/* Password Group */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200" htmlFor="password">
                        Password
                      </label>
                      <div className="mt-2 relative">
                        <input
                          className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-border-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-shadow"
                          id="password"
                          name="password"
                          placeholder="••••••••"
                          required
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200"
                        htmlFor="confirm-password"
                      >
                        Confirm Password
                      </label>
                      <div className="mt-2 relative">
                        <input
                          className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-border-dark placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-shadow"
                          id="confirm-password"
                          name="confirm-password"
                          placeholder="••••••••"
                          required
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Password Strength Visual (Dynamic) */}
                  <div className="flex gap-1 h-1 w-full mt-1">
                    <div className={`h-full w-1/4 rounded-full transition-colors ${strength >= 1 ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}></div>
                    <div className={`h-full w-1/4 rounded-full transition-colors ${strength >= 2 ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}></div>
                    <div className={`h-full w-1/4 rounded-full transition-colors ${strength >= 3 ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}></div>
                    <div className={`h-full w-1/4 rounded-full transition-colors ${strength >= 4 ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}></div>
                  </div>
                   <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Password strength: <span className={`${strengthTextColor} font-medium`}>{strengthText}</span></p>

                  {/* Terms */}
                  <div className="flex items-start pt-2">
                    <div className="flex h-6 items-center">
                      <input
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-transparent cursor-pointer"
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor="terms">
                        I agree to the <a className="text-primary hover:text-blue-700" href="#">Terms of Service</a> and{" "}
                        <a className="text-primary hover:text-blue-700" href="#">Privacy Policy</a>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    className="flex w-full justify-center rounded-lg bg-primary px-3 py-4 text-sm font-semibold leading-6 text-white dark:text-black shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                  >
                     {loading ? (
                        <>
                         <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                         Creating Account...
                        </>
                     ) : (
                        <>
                        <span className="group-hover:opacity-100 transition-opacity">Create Account</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                        </span>
                        </>
                     )}
                  </button>
                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link className="font-medium text-primary hover:text-blue-700 transition-colors" to="/login">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
                  <span>© 2023 LawyerMS Inc.</span>
                  <div className="flex gap-4">
                    <a className="hover:text-slate-600 dark:hover:text-slate-200" href="#">
                      Help
                    </a>
                    <a className="hover:text-slate-600 dark:hover:text-slate-200" href="#">
                      Privacy
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
