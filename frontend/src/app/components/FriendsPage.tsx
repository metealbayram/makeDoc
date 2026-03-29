import { useEffect, useState } from "react";
import api from "../services/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface Friend {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  job?: string;
}

interface FriendRequest {
  _id: string;
  sender: Friend;
  receiver: string;
  status: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [users, setUsers] = useState<Friend[]>([]); // For discovering people
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
  };

  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedImage = localStorage.getItem("userProfileImage");
    const storedJob = localStorage.getItem("userJob");
    if (storedName) setUserName(storedName);
    if (storedJob) setUserJob(storedJob);
    if (storedImage) {
      if (storedImage.startsWith("http")) {
        setUserProfileImage(storedImage);
      } else {
        setUserProfileImage(`http://localhost:5000${storedImage}`);
      }
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, usersRes, sentRes] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
        api.get("/users"), // get all to find new friends
        api.get("/friends/requests/sent"),
      ]);

      const friendsData = friendsRes.data.data || friendsRes.data || [];
      const requestsData = requestsRes.data.data || requestsRes.data || [];
      const usersData = usersRes.data.data || usersRes.data || [];
      const sentData = sentRes.data.data || sentRes.data || [];

      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setSentRequests(Array.isArray(sentData) ? sentData.map((r: any) => r.receiver) : []);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.post("/friends/request", { receiverId });
      setSentRequests((prev) => [...prev, receiverId]);
      showToast("Friend request sent!", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to send request", "error");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.post("/friends/accept", { requestId });
      showToast("Request accepted", "success");
      fetchData();
    } catch (error) {
      showToast("Failed to accept request", "error");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.post("/friends/reject", { requestId });
      showToast("Request rejected", "success");
      fetchData();
    } catch (error) {
      showToast("Failed to reject request", "error");
    }
  };

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size must be less than 10MB", "error");
        return;
      }
      const formData = new FormData();
      formData.append("profileImage", file);
      try {
        const response = await api.put("/users/profile/image", formData);
        if (response.data.success) {
          const newImagePath = response.data.data.profileImage;
          localStorage.setItem("userProfileImage", newImagePath);
          setUserProfileImage(`http://localhost:5000${newImagePath}`);
        }
      } catch (error) {
        console.error("Failed to update profile image:", error);
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar 
        userName={userName} 
        userProfileImage={userProfileImage} 
        onProfileImageUpdate={handleProfileImageUpdate} 
      />
      <Sidebar
        userName={userName}
        userJob={userJob}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      {/* Main Content */}
      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
              Friends & Connections
            </h1>
            <p className="text-on-surface-variant flex items-center gap-2 dark:text-slate-400">
              <span className="material-symbols-outlined text-primary">
                group
              </span>
              Manage your professional workspace connections.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full w-64 focus:ring-4 focus:ring-primary/10 transition-all text-sm shadow-sm dark:bg-[#1e2532] dark:border-[#2e3645]"
                placeholder="Search connections..."
                type="text"
              />
            </div>
          </div>
        </header>

        <div className="max-w-[1400px] space-y-10">
          {/* Upper Section: Bento Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* My Friends List Card */}
            <section className="col-span-12 lg:col-span-8 bg-white rounded-lg p-8 shadow-[0_20px_40px_rgba(36,49,86,0.04)] border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline dark:text-white">
                    My Friends
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1 dark:text-slate-400">
                    Manage your active professional connections (
                    {friends.length})
                  </p>
                </div>
                <button className="text-primary font-bold text-sm hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="py-10 text-center text-on-surface-variant italic dark:text-slate-400">
                    Loading friends...
                  </div>
                ) : friends.length === 0 ? (
                  <div className="py-10 text-center text-on-surface-variant italic dark:text-slate-400">
                    No professional connections yet.
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-container/20 flex items-center justify-center font-bold text-primary border-2 border-white shadow-sm font-headline">
                          {friend.profileImage ? (
                            <img
                              src={`http://localhost:5000${friend.profileImage}`}
                              className="w-full h-full object-cover"
                              alt={friend.name}
                            />
                          ) : (
                            friend.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface dark:text-white">
                            {friend.name}
                          </h3>
                          <p className="text-on-surface-variant text-sm dark:text-slate-400">
                            {friend.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-white rounded-lg shadow-sm dark:text-slate-400">
                          <span className="material-symbols-outlined">
                            chat_bubble
                          </span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-white rounded-lg shadow-sm dark:text-slate-400">
                          <span className="material-symbols-outlined">
                            person_remove
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Side Section: Requests & Stats */}
            <aside className="col-span-12 lg:col-span-4 space-y-8">
              {/* Pending Requests Section */}
              <section className="bg-primary-container/10 rounded-lg p-8 shadow-sm border border-primary/10">
                <h2 className="text-xl font-extrabold text-primary tracking-tight mb-6 flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined">pending</span>
                  Pending Requests ({requests.length})
                </h2>
                <div className="space-y-6">
                  {requests.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic dark:text-slate-400">
                      No pending requests at the moment.
                    </p>
                  ) : (
                    requests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center font-bold text-primary shadow-sm dark:bg-[#1e2532]">
                            {req.sender.profileImage ? (
                              <img
                                src={`http://localhost:5000${req.sender.profileImage}`}
                                className="w-full h-full object-cover"
                                alt={req.sender.name}
                              />
                            ) : (
                              req.sender.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-sm text-on-surface dark:text-white">
                            {req.sender.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center transition-transform active:scale-90 shadow-md shadow-primary/20 hover:opacity-90"
                          >
                            <span className="material-symbols-outlined text-sm">
                              check
                            </span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="w-8 h-8 rounded-full bg-white text-on-surface-variant flex items-center justify-center transition-transform active:scale-90 border border-slate-200 hover:bg-slate-50 dark:bg-[#1e2532] dark:text-slate-400 dark:border-[#2e3645]"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Connection Stats Card */}
              <div className="bg-slate-900 rounded-lg p-8 relative overflow-hidden group shadow-2xl dark:bg-[#1e2532]">
                <div className="relative z-10 text-white">
                  <span className="text-4xl font-black text-primary/40 font-headline italic">
                    {friends.length < 10
                      ? `0${friends.length}`
                      : friends.length}
                  </span>
                  <h4 className="font-bold text-white mt-2 font-headline">
                    Professional Connections
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Expanding your reach in the digital workspace.
                  </p>

                  <div className="mt-6 flex -space-x-3 overflow-hidden">
                    {friends.slice(0, 5).map((f) => (
                      <div
                        key={f._id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold dark:bg-[#1e2532]"
                      >
                        {f.profileImage ? (
                          <img
                            src={`http://localhost:5000${f.profileImage}`}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          f.name.charAt(0)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                  <span className="material-symbols-outlined text-[120px]">
                    hub
                  </span>
                </div>
              </div>
            </aside>
          </div>

          {/* Discover People Section: Horizontal Grid */}
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline dark:text-white">
                  Discover People
                </h2>
                <p className="text-on-surface-variant text-sm mt-1 dark:text-slate-400">
                  Suggested connections based on your network
                </p>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800">
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800">
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
              {users
                .filter(
                  (u) =>
                    u.name !== userName &&
                    !friends.find((f) => f._id === u._id),
                )
                .map((user) => (
                  <div
                    key={user._id}
                    className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col items-center text-center group dark:bg-[#1e2532] dark:border-slate-800"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-slate-50 p-1 group-hover:ring-primary/10 transition-all">
                      <div className="w-full h-full rounded-full bg-primary-container/10 flex items-center justify-center text-3xl font-black text-primary font-headline">
                        {user.profileImage ? (
                          <img
                            src={`http://localhost:5000${user.profileImage}`}
                            className="w-full h-full object-cover rounded-full"
                            alt={user.name}
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-on-surface font-headline dark:text-white">
                      {user.name}
                    </h3>
                    <p className="text-on-surface-variant text-xs mb-6 uppercase tracking-wider font-bold dark:text-slate-400">
                      {user.job || "Legal Professional"}
                    </p>

                    {sentRequests.includes(user._id) ? (
                        <button
                          disabled
                          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-not-allowed dark:text-slate-400"
                        >
                          <span className="material-symbols-outlined text-lg">
                            schedule
                          </span>
                          Pending
                        </button>
                    ) : (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          className="w-full bg-slate-50 text-slate-900 border border-slate-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95 dark:bg-[#111621] dark:text-white dark:border-[#2e3645]"
                        >
                          <span className="material-symbols-outlined text-lg">
                            person_add
                          </span>
                          Add Friend
                        </button>
                    )}
                  </div>
                ))}
              {users.length === 0 && (
                <div className="col-span-full py-10 text-center text-on-surface-variant italic dark:text-slate-400">
                  No new people found in the network.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-tr from-primary to-primary-dim rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40 active:scale-95 hover:scale-105 transition-all z-40">
        <span className="material-symbols-outlined text-3xl">add_comment</span>
      </button>

      {/* Toast Notification */}
      {toast && (
          <div className={`fixed bottom-24 right-10 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 w-80 ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
              <span className="material-symbols-outlined shrink-0 text-[24px]">
                  {toast.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <p className="text-sm font-semibold leading-snug">{toast.message}</p>
          </div>
      )}
    </div>
  );
}
