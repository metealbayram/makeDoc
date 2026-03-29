import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function GlobalNotification() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Create a ref to track the previously known length of unread messages across renders
    const previousUnreadsLength = useRef(0);
    const [showPopup, setShowPopup] = useState(false);
    const [latestMessage, setLatestMessage] = useState<any>(null);

    useEffect(() => {
        const fetchUnread = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            // If we are on the messages page right now, we can still get notifications 
            // from OTHER friends. The currently active friend's messages are instantly 
            // marked as read by the backend anyway, but there might be a split-second race condition.
            const urlParams = new URLSearchParams(location.search);
            const activeChatUserId = location.pathname === "/messages" ? urlParams.get("user_id") : null;

            try {
                const res = await api.get("/messages/unread");
                const currentUnread = res.data.data || [];
                
                // If the number of unread messages today is strictly greater than the previous check
                if (currentUnread.length > previousUnreadsLength.current && currentUnread.length > 0) {
                     // Get the absolute newest unread message
                     const newest = currentUnread[0];
                     
                     // Only notify if it's not the user we are currently chatting with
                     if (newest.sender?._id !== activeChatUserId) {
                         setLatestMessage(newest);
                         setShowPopup(true);
                         setTimeout(() => setShowPopup(false), 5000);
                     }
                }
                
                previousUnreadsLength.current = currentUnread.length;

            } catch (error) {
                console.error("Failed to fetch notifications");
            }
        };

        // Fetch immediately and then every 3.5 seconds
        fetchUnread();
        const interval = setInterval(fetchUnread, 3500); 
        return () => clearInterval(interval);
    }, [location.pathname]);

    if (!showPopup || !latestMessage) return null;

    return (
        <div 
            onClick={() => {
                setShowPopup(false);
                navigate(`/messages?user_id=${latestMessage.sender?._id}`);
            }}
            className="fixed bottom-6 right-6 z-[100] w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-4 shrink-0 animate-in slide-in-from-bottom-5 fade-in-10 cursor-pointer hover:scale-105 transition-transform"
        >
            <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                    {latestMessage.sender?.profileImage ? (
                        <img src={`http://localhost:5000${latestMessage.sender.profileImage}`} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Sender Profile" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-200 dark:border-blue-800">
                            {latestMessage.sender?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {latestMessage.sender?.name || 'New Message'}
                        </p>
                        <span className="text-[10px] font-bold text-blue-500 uppercase">Now</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {latestMessage.content}
                    </p>
                </div>

                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowPopup(false); 
                    }} 
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>
        </div>
    );
}
