import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface Friend {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const location = useLocation();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedJob = localStorage.getItem("userJob") || "Lawyer";
    const storedImage = localStorage.getItem("userProfileImage");
    if (storedName) setUserName(storedName);
    setUserJob(storedJob);
    if (storedImage) {
      if (storedImage.startsWith('http')) {
          setUserProfileImage(storedImage);
      } else {
          setUserProfileImage(`http://localhost:5000${storedImage}`);
      }
    }
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const res = await api.get("/friends");
        const fetchedFriends = res.data.data || [];
        setFriends(fetchedFriends);

        const params = new URLSearchParams(location.search);
        const userIdFromUrl = params.get("user_id");
        if (userIdFromUrl) {
          const friendToSelect = fetchedFriends.find(
            (f: Friend) => f._id === userIdFromUrl
          );
          if (friendToSelect) {
            setSelectedFriend(friendToSelect);
          }
        }
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [location.search]);

  const fetchMessages = async (friendId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${friendId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend._id);
      const interval = setInterval(() => {
        fetchMessages(selectedFriend._id);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedFriend) return;

    try {
      const res = await api.post("/messages", {
        receiverId: selectedFriend._id,
        content: messageText,
      });
      setMessages((prev) => [...prev, res.data.data]);
      setMessageText("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to send message");
    }
  };


  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col h-screen max-h-screen overflow-hidden dark:bg-[#111621] dark:text-white">
      <Navbar userName={userName} userProfileImage={userProfileImage} />
      <Sidebar userName={userName} userJob={userJob} userProfileImage={userProfileImage} />

      <div className="ml-72 pt-20 flex overflow-hidden flex-1">
        {/* Left Column: Conversations List */}
        <section className="w-full md:w-[400px] flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold font-headline text-slate-900 dark:text-white mb-6">
              Messages
            </h1>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 shadow-sm transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="Search conversations..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-4 space-y-1 pb-10 custom-scrollbar">
            {loadingFriends ? (
              <p className="text-center text-sm text-slate-500 p-4 dark:text-slate-400">
                Loading friends...
              </p>
            ) : filteredFriends.length === 0 ? (
              <p className="text-center text-sm text-slate-400 p-4">
                No friends found.
              </p>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend._id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border-l-4 ${ selectedFriend?._id === friend._id ? "bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border-blue-600" : "hover:bg-white/50 dark:hover:bg-slate-800/40 border-transparent" }`}
                >
                  <div className="relative shrink-0">
                    {friend.profileImage ? (
                      <img
                        className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-700"
                        src={`http://localhost:5000${friend.profileImage}`}
                        alt={friend.name}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                        {friend.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3
                        className={`font-semibold text-slate-900 dark:text-white truncate ${ selectedFriend?._id === friend._id ? "font-bold" : "" }`}
                      >
                        {friend.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">RECENT</span>
                    </div>
                    <p
                      className={`text-xs truncate ${ selectedFriend?._id === friend._id ? "text-slate-700 dark:text-slate-300 font-semibold" : "text-slate-500 dark:text-slate-400" }`}
                    >
                      {selectedFriend?._id === friend._id
                        ? "Active conversation"
                        : "Click to view chat history"}
                    </p>
                  </div>
                  {selectedFriend?._id === friend._id && (
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Active Chat View */}
        <section className="flex-grow flex flex-col bg-white dark:bg-slate-900 relative">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <header className="h-20 flex items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800/50 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {selectedFriend.profileImage ? (
                      <img
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                        src={`http://localhost:5000${selectedFriend.profileImage}`}
                        alt={selectedFriend.name}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {selectedFriend.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white font-headline leading-none mb-0.5">
                      {selectedFriend.name}
                    </h2>
                    <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold tracking-wide">
                      Online now
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined">videocam</span>
                  </button>
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </header>

              {/* Conversation Area */}
              <div className="flex-grow overflow-y-auto px-6 md:px-10 py-6 space-y-6 bg-slate-50/50 dark:bg-background-dark custom-scrollbar">
                {/* Date Separator */}
                <div className="flex items-center gap-4 py-4">
                  <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700/50"></div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Chat History
                  </span>
                  <div className="h-px flex-grow bg-slate-200 dark:bg-slate-700/50"></div>
                </div>

                {loadingMessages ? (
                  <p className="text-center text-sm text-slate-500 mt-10 dark:text-slate-400">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-center flex flex-col items-center gap-2 text-slate-400 py-10">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      waving_hand
                    </span>
                    <p className="text-sm font-medium">Be the first to say hi!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender !== selectedFriend._id;
                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex gap-4 max-w-[80%] ${ isMine ? "flex-row-reverse ml-auto" : "" }`}
                      >
                        {!isMine && (
                          <div className="shrink-0 mt-1 hidden md:block">
                            {selectedFriend.profileImage ? (
                              <img
                                src={`http://localhost:5000${selectedFriend.profileImage}`}
                                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                                alt={selectedFriend.name}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                {selectedFriend.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`space-y-1 flex flex-col ${ isMine ? "items-end" : "items-start" }`}
                        >
                          <div
                            className={`p-4 rounded-2xl shadow-sm ${ isMine ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none shadow-md shadow-blue-500/10" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]" }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${ isMine ? "mr-1" : "ml-1" }`}
                          >
                            <span className="text-[10px] font-semibold text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && (
                              <span
                                className="material-symbols-outlined text-[14px] text-blue-500"
                                title={msg.isRead ? "Read" : "Sent"}
                              >
                                {msg.isRead ? "done_all" : "check"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl p-2 flex items-center gap-2 shadow-inner"
                >
                  <button
                    type="button"
                    className="p-3 text-slate-400 hover:text-blue-500 transition-colors hidden sm:block"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                  <button
                    type="button"
                    className="p-3 text-slate-400 hover:text-blue-500 transition-colors hidden sm:block"
                  >
                    <span className="material-symbols-outlined">image</span>
                  </button>

                  <input
                    type="text"
                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-3 px-2 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />

                  <button
                    type="button"
                    className="p-3 text-slate-400 hover:text-yellow-500 transition-colors block sm:hidden"
                  >
                    <span className="material-symbols-outlined">
                      sentiment_satisfied
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none transition-all shrink-0"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      send
                    </span>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-blue-500/50">
                  chat
                </span>
              </div>
              <p className="font-semibold text-lg text-slate-600 dark:text-slate-300">
                Messages
              </p>
              <p className="text-sm text-slate-400 max-w-sm text-center">
                Select a friend from the sidebar to chat, or search for a past
                conversation.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
