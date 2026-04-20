import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ModeToggle } from "./mode-toggle"
import api from "../services/api"

interface NavbarProps {
  userName: string
  userProfileImage?: string | null
  onProfileImageUpdate?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface NavbarMessageNotification {
  _id?: string
  content?: string
  sender?: {
    _id?: string
    name?: string
  }
}

interface NavbarFriendRequest {
  _id: string
  sender?: {
    name?: string
  }
}

export function Navbar({ userName, userProfileImage, onProfileImageUpdate }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState<NavbarMessageNotification[]>([])
  const [friendRequests, setFriendRequests] = useState<NavbarFriendRequest[]>([])
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const totalNotifications = unreadMessages.length + friendRequests.length

  const navLinks = [
    { name: "Documents", href: "/documents" },
    { name: "Friends", href: "/friends" },
    { name: "Groups", href: "/groups" },
    { name: "Calendar", href: "/calendar" },
    { name: "Profile", href: "/profile/edit" },
  ]

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const [messagesRes, requestsRes] = await Promise.all([
          api.get("/messages/unread"),
          api.get("/friends/requests")
        ])

        setUnreadMessages(messagesRes.data.data || [])
        setFriendRequests(requestsRes.data.data || [])
      } catch (error) {
        console.error("Failed to fetch navbar notifications:", error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#111621]/80 backdrop-blur-xl flex justify-between items-center h-20 px-12 shadow-[0_4px_30px_rgba(36,49,86,0.06)] border-b border-slate-200/50 dark:border-[#2e3645]/50">
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                location.pathname === link.href
                  ? "text-primary bg-primary/5 dark:bg-primary/20"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/70"
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-all dark:text-slate-400"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>

            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalNotifications > 99 ? "99+" : totalNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 max-h-[420px] overflow-y-auto bg-white dark:bg-[#1b2230] border border-slate-200 dark:border-[#2e3645] rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                <span className="text-xs text-slate-500">
                  {totalNotifications} total
                </span>
              </div>

              {friendRequests.length === 0 && unreadMessages.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-2">
                  {friendRequests.length > 0 && (
                    <>
                      <div className="px-2 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Friend Requests
                      </div>

                      {friendRequests.map((req) => (
                        <button
                          key={req._id}
                          onClick={() => {
                            setShowNotifications(false)
                            navigate("/friends")
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#243044] transition-colors"
                        >
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {req.sender?.name || "Someone"} sent you a friend request
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Go to Friends page to accept or reject
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {unreadMessages.length > 0 && (
                    <>
                      <div className="px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Messages
                      </div>

                      {unreadMessages.slice(0, 8).map((msg, index) => (
                        <button
                          key={msg._id || index}
                          onClick={() => {
                            setShowNotifications(false)
                            navigate(`/messages?user_id=${msg.sender?._id}`)
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#243044] transition-colors"
                        >
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {msg.sender?.name || "New message"}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {msg.content}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
          onClick={() => navigate("/profile/edit")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#2e3645] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="material-symbols-outlined text-[18px]">
            manage_accounts
          </span>
          Edit Profile
        </button>

        <button
          onClick={() => navigate("/create-document")}
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          New Doc
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </nav>
  )
}
