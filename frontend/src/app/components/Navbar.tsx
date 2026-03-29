import { useNavigate, useLocation } from "react-router-dom"
import { ModeToggle } from "./mode-toggle"

interface NavbarProps {
  userName: string
  userProfileImage?: string | null
  onProfileImageUpdate?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function Navbar({ userName, userProfileImage, onProfileImageUpdate }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: "Documents", href: "/documents" },
    { name: "Friends", href: "/friends" },
    { name: "Groups", href: "/groups" },
    { name: "Calendar", href: "/calendar" },
  ]

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center h-20 px-12 shadow-[0_4px_30px_rgba(36,49,86,0.06)] border-b border-slate-200/50 dark:border-[#2e3645]/50">
      <div className="flex items-center gap-12">
        <span
          className="text-2xl font-black text-slate-900 tracking-tighter cursor-pointer font-headline dark:text-white"
          onClick={() => navigate("/dashboard")}
        >
          MakeDoc
        </span>
        <div className="hidden md:flex gap-1 items-center">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${ location.pathname === link.href ? "text-primary bg-primary/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70" }`}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-all dark:text-slate-400">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 border-2 border-slate-200 relative cursor-pointer dark:border-[#2e3645]">
          {onProfileImageUpdate && (
            <input
              type="file"
              className="absolute inset-0 opacity-0 z-20 cursor-pointer"
              onChange={onProfileImageUpdate}
              accept="image/*"
            />
          )}
          {userProfileImage ? (
            <img alt={userName} className="h-full w-full object-cover" src={userProfileImage} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/create-document")}
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          New Doc
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100/70"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </nav>
  )
}
