import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function GlobalNotification() {
    const navigate = useNavigate();
    const location = useLocation();

    const previousUnreadsLength = useRef(0);
    const previousRequestsLength = useRef(0);

    const [showPopup, setShowPopup] = useState(false);
    const [latestMessage, setLatestMessage] = useState<any>(null);

    const [showFriendPopup, setShowFriendPopup] = useState(false);
    const [latestFriendRequest, setLatestFriendRequest] = useState<any>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            const urlParams = new URLSearchParams(location.search);
            const activeChatUserId =
                location.pathname === "/messages" ? urlParams.get("user_id") : null;

            try {
                const [messagesRes, requestsRes] = await Promise.all([
                    api.get("/messages/unread"),
                    api.get("/friends/requests")
                ]);

                const currentUnread = messagesRes.data.data || [];
                const currentRequests = requestsRes.data.data || [];

                if (
                    currentUnread.length > previousUnreadsLength.current &&
                    currentUnread.length > 0
                ) {
                    const newest = currentUnread[0];

                    if (newest.sender?._id !== activeChatUserId) {
                        setLatestMessage(newest);
                        setShowPopup(true);

                        setTimeout(() => {
                            setShowPopup(false);
                        }, 5000);
                    }
                }

                if (
                    currentRequests.length > previousRequestsLength.current &&
                    currentRequests.length > 0
                ) {
                    const newestRequest = currentRequests[0];
                    setLatestFriendRequest(newestRequest);
                    setShowFriendPopup(true);

                    setTimeout(() => {
                        setShowFriendPopup(false);
                    }, 5000);
                }

                previousUnreadsLength.current = currentUnread.length;
                previousRequestsLength.current = currentRequests.length;
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 3500);

        return () => clearInterval(interval);
    }, [location.pathname, location.search]);

    return (
        <>
            {showPopup && latestMessage && (
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
                                <img
                                    src={`http://localhost:5000${latestMessage.sender.profileImage}`}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                                    alt="Sender Profile"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-200 dark:border-blue-800">
                                    {latestMessage.sender?.name?.charAt(0) || "U"}
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
                                    {latestMessage.sender?.name || "New Message"}
                                </p>
                                <span className="text-[10px] font-bold text-blue-500 uppercase">
                                    Now
                                </span>
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
                            <span className="material-symbols-outlined text-[16px]">
                                close
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {showFriendPopup && latestFriendRequest && (
                <div
                    onClick={() => {
                        setShowFriendPopup(false);
                        navigate("/friends");
                    }}
                    className="fixed bottom-28 right-6 z-[100] w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-4 shrink-0 animate-in slide-in-from-bottom-5 fade-in-10 cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            {latestFriendRequest.sender?.profileImage ? (
                                <img
                                    src={`http://localhost:5000${latestFriendRequest.sender.profileImage}`}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                                    alt="Sender Profile"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-200 dark:border-emerald-800">
                                    {latestFriendRequest.sender?.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    New Friend Request
                                </p>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                                    Now
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {latestFriendRequest.sender?.name || "Someone"} sent you a friend request.
                            </p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFriendPopup(false);
                            }}
                            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                close
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}