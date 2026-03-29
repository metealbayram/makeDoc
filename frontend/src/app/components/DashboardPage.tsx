import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface Document {
  _id: string;
  title: string;
  createdAt: string;
  status?: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  type: "meeting" | "court" | "deadline" | "internal" | "document";
  description?: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Chat state
  const [selectedFriendChat, setSelectedFriendChat] = useState<any | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessageText, setChatMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    let interval: any;
    const fetchMessagesForSelectedFriend = async () => {
      if (!selectedFriendChat) return;
      try {
        const res = await api.get(`/messages/${selectedFriendChat._id}`);
        setChatMessages(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    if (selectedFriendChat) {
      fetchMessagesForSelectedFriend();
      interval = setInterval(fetchMessagesForSelectedFriend, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedFriendChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const docUrl = searchTerm
          ? `/documents?search=${encodeURIComponent(searchTerm)}`
          : "/documents";
        const docResponse = await api.get(docUrl);
        setDocuments(docResponse.data.data || []);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfWeek = new Date();
        endOfWeek.setDate(startOfDay.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        const eventResponse = await api.get("/events", {
          params: {
            start: startOfDay.toISOString(),
            end: endOfWeek.toISOString(),
          },
        });
        setAgendaEvents(eventResponse.data.data || []);

        const friendsResponse = await api.get("/friends");
        setFriends(friendsResponse.data.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setDocuments([]);
        setAgendaEvents([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);



  const handleViewDocument = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: "blob",
      });
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await api.get(`/documents/${doc._id}/download`, {
        responseType: "blob",
      });
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const confirmDeleteDocument = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const handleDeleteDocument = async () => {
    if (!deleteConfirmationId) return;
    try {
      await api.delete(`/documents/${deleteConfirmationId}`);
      setDocuments(documents.filter((doc) => doc._id !== deleteConfirmationId));
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  const handleApproveDocument = async (id: string) => {
    try {
      const response = await api.put(`/documents/${id}/status`, {
        status: "Approved",
      });
      if (response.data.success) {
        setDocuments(
          documents.map((doc) =>
            doc._id === id ? { ...doc, status: "Approved" } : doc,
          ),
        );
      }
    } catch (error) {
      console.error("Error approving document:", error);
    }
  };

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
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

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim() || !selectedFriendChat) return;

    try {
      const res = await api.post("/messages", {
        receiverId: selectedFriendChat._id,
        content: chatMessageText,
      });
      setChatMessages((prev) => [...prev, res.data.data]);
      setChatMessageText("");
    } catch (error: any) {
      console.error("Failed to send message", error);
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
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
              Welcome back, {userName}.
            </h1>
            <p className="text-on-surface-variant flex items-center gap-2 dark:text-slate-400">
              <span className="material-symbols-outlined text-primary">
                event
              </span>
              You have {agendaEvents.length} upcoming{" "}
              {agendaEvents.length === 1 ? "event" : "events"} today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined">add_box</span>
              New Case
            </button>
            <button
              onClick={() => navigate("/create-document")}
              className="flex items-center gap-2 px-8 py-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container-high active:scale-95 transition-all dark:text-white"
            >
              <span className="material-symbols-outlined">description</span>
              Create Doc
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-8 max-w-xl">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm dark:bg-[#1e2532] dark:border-[#2e3645]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bento Layout Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] group hover:translate-y-[-4px] transition-transform duration-300 dark:bg-[#1e2532]">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <p className="text-on-surface-variant font-medium text-sm dark:text-slate-400">
                      Total Documents
                    </p>
                    <h3 className="text-5xl font-black text-on-surface dark:text-white">
                      {documents.length}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">
                      folder_open
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] group hover:translate-y-[-4px] transition-transform duration-300 dark:bg-[#1e2532]">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <p className="text-on-surface-variant font-medium text-sm dark:text-slate-400">
                      Pending Tasks
                    </p>
                    <h3 className="text-5xl font-black text-on-surface dark:text-white">
                      {agendaEvents.length}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-secondary-container/30 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">
                      assignment_late
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Documents Table */}
            <section className="bg-white rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(36,49,86,0.04)] dark:bg-[#1e2532]">
              <div className="p-8 border-b border-surface-container-low flex justify-between items-center">
                <h2 className="text-xl font-extrabold font-headline">
                  Recent Documents
                </h2>
                <button
                  className="text-primary font-bold text-sm hover:underline"
                  onClick={() => navigate("/documents")}
                >
                  View All
                </button>
              </div>
              <div className="w-full">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-[#111621]">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
                        Document Name
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
                        Date
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
                        Status
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-20 text-center text-on-surface-variant font-medium italic dark:text-slate-400"
                        >
                          Loading workspace...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-3xl">
                                search_off
                              </span>
                            </div>
                            <p className="text-on-surface-variant font-medium italic dark:text-slate-400">
                              No documents found.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      documents.slice(0, 5).map((doc) => (
                        <tr
                          key={doc._id}
                          className="border-b border-surface-container-low/50 hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors">
                                description
                              </span>
                              <span className="font-bold text-on-surface dark:text-white">
                                {doc.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-on-surface-variant dark:text-slate-400">
                            {new Date(doc.createdAt).toLocaleDateString(
                              "tr-TR",
                            )}
                          </td>
                          <td className="px-8 py-4">
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${doc.status === "Approved" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                            >
                              {doc.status || "Draft"}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDocument(doc._id)}
                                className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>
                              {doc.status !== "Approved" && (
                                <button
                                  onClick={() => handleApproveDocument(doc._id)}
                                  className="p-2 hover:bg-green-100 rounded-full text-green-600 transition-colors"
                                  title="Approve Document"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    check_circle
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  download
                                </span>
                              </button>
                              <button
                                onClick={() => confirmDeleteDocument(doc._id)}
                                className="p-2 hover:bg-red-100 rounded-full text-red-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Agenda Widget */}
            <section className="bg-white p-8 rounded-lg shadow-[0_20px_40px_rgba(36,49,86,0.04)] border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold font-headline">Agenda</h2>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-on-surface dark:bg-[#111621] dark:text-white">
                  <span className="material-symbols-outlined">
                    calendar_today
                  </span>
                </div>
              </div>
              <div className="py-4 flex flex-col gap-4 overflow-y-auto max-h-[300px] custom-scrollbar">
                {agendaEvents.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary/40">
                        event_busy
                      </span>
                    </div>
                    <p className="text-on-surface-variant font-medium dark:text-slate-400">
                      No upcoming events this week
                    </p>
                  </div>
                ) : (
                  agendaEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex gap-4 p-4 rounded-xl bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="text-center min-w-[50px]">
                        <p className="text-[10px] font-black uppercase text-primary">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </p>
                        <p className="text-lg font-black">
                          {new Date(event.date).getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{event.title}</p>
                        <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                          {new Date(event.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <a
                className="w-full mt-4 inline-flex items-center justify-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
                href="/calendar"
              >
                View Full Calendar{" "}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </a>
            </section>

            {/* Team/Friends Widget */}
            <section className="bg-white p-8 rounded-lg shadow-[0_20px_40px_rgba(36,49,86,0.04)] dark:bg-[#1e2532]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold font-headline">Team</h2>
                <button
                  className="text-primary font-bold text-sm hover:underline"
                  onClick={() => navigate("/friends")}
                >
                  View All
                </button>
              </div>
              <ul className="space-y-6">
                {friends.slice(0, 3).map((friend) => (
                  <li
                    key={friend._id}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => setSelectedFriendChat(friend)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-primary">
                          {friend.profileImage ? (
                            <img
                              src={`http://localhost:5000${friend.profileImage}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            friend.name.charAt(0)
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors dark:text-white">
                          {friend.name}
                        </p>
                        <p className="text-xs text-on-surface-variant font-medium dark:text-slate-400">
                          {friend.job || "Legal Advisor"}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors dark:text-slate-400">
                      <span className="material-symbols-outlined">
                        chat_bubble
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Status Card */}
            <div className="bg-slate-900 p-8 rounded-lg text-white shadow-2xl relative overflow-hidden group dark:bg-[#1e2532]">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2 font-headline">
                  Cloud Workspace
                </h4>
                <p className="text-slate-400 text-sm mb-6">
                  Securing all legal documents with 256-bit encryption.
                </p>
                <div className="h-1.5 w-full bg-white/10 rounded-full mb-6">
                  <div className="h-full w-[45%] bg-primary rounded-full shadow-[0_0_10px_#0053dc]"></div>
                </div>
                <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-opacity-90 transition-all dark:bg-[#1e2532] dark:text-white">
                  Manage License
                </button>
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 dark:bg-[#1e2532]">
              <h3 className="text-xl font-black mb-2 font-headline">
                Delete Doc?
              </h3>
              <p className="text-sm text-on-surface-variant mb-8 dark:text-slate-400">
                This action is permanent and cannot be reversed.
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors dark:border-[#2e3645]"
                  onClick={() => setDeleteConfirmationId(null)}
                >
                  Keep it
                </button>
                <button
                  className="flex-1 py-3 font-bold bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:opacity-90 transition-all"
                  onClick={handleDeleteDocument}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Overlay */}
        {selectedFriendChat && (
          <div className="fixed bottom-8 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[60] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 dark:bg-[#1e2532] dark:border-[#2e3645]">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center dark:bg-[#1e2532]">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                          {selectedFriendChat.name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{selectedFriendChat.name}</span>
                  </div>
                  <button onClick={() => setSelectedFriendChat(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              </div>
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#111621]">
                  {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === selectedFriendChat._id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === selectedFriendChat._id ? 'bg-white text-slate-900 rounded-tl-none shadow-sm' : 'bg-primary text-white rounded-tr-none shadow-md'} dark:text-white`}>
                              {msg.content}
                          </div>
                      </div>
                  ))}
                  <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 dark:bg-[#1e2532] dark:border-slate-800">
                  <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 text-sm bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 dark:bg-[#111621]"
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                  />
                  <button type="submit" className="p-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                      <span className="material-symbols-outlined text-sm">send</span>
                  </button>
              </form>
          </div>
        )}
      </main>
    </div>
  );
}
