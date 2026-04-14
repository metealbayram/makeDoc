import { useNavigate, useLocation } from "react-router-dom";
import { ModeToggle } from "./mode-toggle";

interface SidebarProps {
  userName: string;
  userJob?: string;
  userProfileImage?: string | null;
  onProfileImageUpdate?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Sidebar({
  userName,
  userJob,
  userProfileImage,
  onProfileImageUpdate,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "grid_view" },
    { name: "Documents", href: "/documents", icon: "layers" },
    { name: "Verify File", href: "/verify-document", icon: "verified" },
    { name: "Clients", href: "/clients", icon: "assignment_ind" },
    { name: "Calendar", href: "/calendar", icon: "calendar_month" },
    { name: "Friends", href: "/friends", icon: "group" },
    { name: "Groups", href: "/groups", icon: "hub" },
    { name: "Messages", href: "/messages", icon: "chat" },
    { name: "Tools", href: "/tools", icon: "construction" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="h-screen w-72 fixed left-0 top-0 pt-24 bg-slate-50 flex flex-col gap-2 px-6 py-8 z-40 border-r border-slate-200/50 dark:bg-[#111621] dark:border-[#2e3645]/50">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-4 p-3 bg-white shadow-sm rounded-2xl relative group dark:bg-[#1e2532]">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-primary relative overflow-hidden">
            {userProfileImage ? (
              <img
                src={userProfileImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                {userName?.charAt(0) || "U"}
              </div>
            )}
            {onProfileImageUpdate && (
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={onProfileImageUpdate}
                accept="image/*"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate dark:text-white">
              {userName || "User"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold truncate dark:text-slate-400">
              {userJob || "Premium Tier"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body text-sm font-medium ${ isActive(item.href) ? "bg-white text-blue-600 shadow-sm translate-x-1 border-r-4 border-blue-600 dark:bg-[#1e2532] dark:text-blue-400 dark:border-blue-400" : "text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50" }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive(item.href)
                  ? '"FILL" 1'
                  : '"FILL" 0',
              }}
            >
              {item.icon}
            </span>
            {item.name}
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-slate-200/50 dark:border-[#2e3645]/50">
        <div className="flex items-center justify-between px-2 mb-2">
          <ModeToggle />
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
