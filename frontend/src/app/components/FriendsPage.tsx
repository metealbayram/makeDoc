import { useEffect, useState } from "react"
import api from "../services/api"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

interface Friend {
  _id: string
  name: string
  email: string
  profileImage?: string
  job?: string
}

interface FriendRequest {
  _id: string
  sender: Friend
  receiver: string
  status: string
}

interface SentFriendRequest {
  receiver?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }

  return fallback
}

const loadFriendsPageData = async () => {
  const [friendsRes, requestsRes, sentRes] = await Promise.all([
    api.get("/friends"),
    api.get("/friends/requests"),
    api.get("/friends/requests/sent"),
  ])

  return {
    friendsData: friendsRes.data.data || friendsRes.data || [],
    requestsData: requestsRes.data.data || requestsRes.data || [],
    sentData: sentRes.data.data || sentRes.data || [],
  }
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [friendEmail, setFriendEmail] = useState("")
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const [userName, setUserName] = useState("")
  const [userJob, setUserJob] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedImage = localStorage.getItem("userProfileImage")
    const storedJob = localStorage.getItem("userJob")

    if (storedName) setUserName(storedName)
    if (storedJob) setUserJob(storedJob)

    if (storedImage) {
      setUserProfileImage(
        storedImage.startsWith("http")
          ? storedImage
          : `http://localhost:5000${storedImage}`,
      )
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { friendsData, requestsData, sentData } = await loadFriendsPageData()

      setFriends(Array.isArray(friendsData) ? friendsData : [])
      setRequests(Array.isArray(requestsData) ? requestsData : [])
      setSentRequests(
        Array.isArray(sentData)
          ? sentData
              .map((request: SentFriendRequest) => request.receiver)
              .filter((receiver): receiver is string => Boolean(receiver))
          : [],
      )
    } catch (error) {
      console.error("Failed to fetch friends data:", error)
      showToast("Failed to load friends data", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      try {
        const { friendsData, requestsData, sentData } =
          await loadFriendsPageData()

        setFriends(Array.isArray(friendsData) ? friendsData : [])
        setRequests(Array.isArray(requestsData) ? requestsData : [])
        setSentRequests(
          Array.isArray(sentData)
            ? sentData
                .map((request: SentFriendRequest) => request.receiver)
                .filter((receiver): receiver is string => Boolean(receiver))
            : [],
        )
      } catch (error) {
        console.error("Failed to fetch friends data:", error)
        showToast("Failed to load friends data", "error")
      } finally {
        setLoading(false)
      }
    }

    void initializePage()
  }, [])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredFriends = normalizedSearch
    ? friends.filter((friend) =>
        `${friend.name} ${friend.email} ${friend.job || ""}`
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : friends

  const handleSendRequest = async () => {
    const normalizedEmail = friendEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      showToast("Please enter an email address", "error")
      return
    }

    setSendingRequest(true)
    try {
      await api.post("/friends/request", { email: normalizedEmail })
      setFriendEmail("")
      showToast("Friend request sent!", "success")
      fetchData()
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "Failed to send friend request"), "error")
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.post("/friends/accept", { requestId })
      showToast("Request accepted", "success")
      await fetchData()
    } catch {
      showToast("Failed to accept request", "error")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.post("/friends/reject", { requestId })
      showToast("Request rejected", "success")
      await fetchData()
    } catch {
      showToast("Failed to reject request", "error")
    }
  }

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size must be less than 10MB", "error")
        return
      }

      const formData = new FormData()
      formData.append("profileImage", file)

      try {
        const response = await api.put("/users/profile/image", formData)
        if (response.data.success) {
          const newImagePath = response.data.data.profileImage
          localStorage.setItem("userProfileImage", newImagePath)
          setUserProfileImage(`http://localhost:5000${newImagePath}`)
        }
      } catch (error) {
        console.error("Failed to update profile image:", error)
        showToast("Failed to update profile image", "error")
      }
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface antialiased dark:bg-[#111621] dark:text-white">
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

      <main className="ml-72 min-h-screen px-12 pb-12 pt-28">
        <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
              Friends & Connections
            </h1>
            <p className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-primary">
                group
              </span>
              Add people to your workspace by email first.
            </p>
          </div>

          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-72 rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:ring-4 focus:ring-primary/10 dark:border-[#2e3645] dark:bg-[#1e2532]"
              placeholder="Search friends..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </header>

        <div className="max-w-[1400px] space-y-10">
          <section className="grid grid-cols-12 gap-8">
            <div className="col-span-12 rounded-lg border border-slate-100 bg-white p-8 shadow-[0_20px_40px_rgba(36,49,86,0.04)] dark:border-slate-800 dark:bg-[#1e2532] xl:col-span-7">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface dark:text-white">
                    Add Friend by Email
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant dark:text-slate-400">
                    Send a friend request directly to a registered MakeDoc user.
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Fast invite
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#111621]">
                <label
                  htmlFor="friend-email"
                  className="mb-3 block text-sm font-semibold text-on-surface dark:text-white"
                >
                  Friend email address
                </label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    id="friend-email"
                    type="email"
                    value={friendEmail}
                    onChange={(event) => setFriendEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleSendRequest()
                      }
                    }}
                    placeholder="name@example.com"
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-[#2e3645] dark:bg-[#1e2532]"
                  />
                  <button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={sendingRequest}
                    className="rounded-2xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-[#2b67e8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendingRequest ? "Sending..." : "Send Request"}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  The email must belong to an existing account. You cannot send a
                  request to yourself or to someone already in your friends list.
                </p>
              </div>
            </div>

            <aside className="col-span-12 space-y-8 xl:col-span-5">
              <section className="rounded-lg border border-primary/10 bg-primary-container/10 p-8 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 font-headline text-xl font-extrabold tracking-tight text-primary">
                  <span className="material-symbols-outlined">pending</span>
                  Pending Requests ({requests.length})
                </h2>
                <div className="space-y-6">
                  {requests.length === 0 ? (
                    <p className="text-sm italic text-on-surface-variant dark:text-slate-400">
                      No pending requests at the moment.
                    </p>
                  ) : (
                    requests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white font-bold text-primary shadow-sm dark:bg-[#1e2532]">
                            {req.sender.profileImage ? (
                              <img
                                src={`http://localhost:5000${req.sender.profileImage}`}
                                className="h-full w-full object-cover"
                                alt={req.sender.name}
                              />
                            ) : (
                              req.sender.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-on-surface dark:text-white">
                              {req.sender.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {req.sender.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20 transition-colors hover:bg-[#2b67e8]"
                          >
                            <span className="material-symbols-outlined text-sm">
                              check
                            </span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-on-surface-variant transition-colors hover:bg-slate-50 dark:border-[#2e3645] dark:bg-[#1e2532] dark:text-slate-400"
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

              <div className="group relative overflow-hidden rounded-lg bg-slate-900 p-8 shadow-2xl dark:bg-[#1e2532]">
                <div className="relative z-10 text-white">
                  <span className="font-headline text-4xl font-black italic text-primary/40">
                    {friends.length < 10 ? `0${friends.length}` : friends.length}
                  </span>
                  <h4 className="mt-2 font-headline font-bold text-white">
                    Professional Connections
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {sentRequests.length} outgoing request
                    {sentRequests.length === 1 ? "" : "s"} waiting for response.
                  </p>

                  <div className="mt-6 flex -space-x-3 overflow-hidden">
                    {friends.slice(0, 5).map((friend) => (
                      <div
                        key={friend._id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold ring-2 ring-slate-900 dark:bg-[#111621]"
                      >
                        {friend.profileImage ? (
                          <img
                            src={`http://localhost:5000${friend.profileImage}`}
                            className="h-full w-full rounded-full object-cover"
                            alt={friend.name}
                          />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-white opacity-10 transition-transform duration-700 group-hover:scale-110">
                  <span className="material-symbols-outlined text-[120px]">
                    hub
                  </span>
                </div>
              </div>
            </aside>
          </section>

          <section className="rounded-lg border border-slate-100 bg-white p-8 shadow-[0_20px_40px_rgba(36,49,86,0.04)] dark:border-slate-800 dark:bg-[#1e2532]">
            <div className="mb-8 flex items-center justify-between gap-6">
              <div>
                <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface dark:text-white">
                  My Friends
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant dark:text-slate-400">
                  Active professional connections ({filteredFriends.length})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="py-10 text-center italic text-on-surface-variant dark:text-slate-400">
                  Loading friends...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="py-10 text-center italic text-on-surface-variant dark:text-slate-400">
                  {searchTerm
                    ? "No friends match your search."
                    : "No professional connections yet."}
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="group flex items-center justify-between rounded-xl p-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary-container/20 font-headline font-bold text-primary shadow-sm">
                        {friend.profileImage ? (
                          <img
                            src={`http://localhost:5000${friend.profileImage}`}
                            className="h-full w-full object-cover"
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
                        <p className="text-sm text-on-surface-variant dark:text-slate-400">
                          {friend.email}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          {friend.job || "Legal Professional"}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="rounded-lg p-2 text-on-surface-variant shadow-sm transition-colors hover:bg-white hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800">
                        <span className="material-symbols-outlined">
                          chat_bubble
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {toast && (
        <div
          className={`animate-in fade-in slide-in-from-bottom-5 fixed bottom-10 right-10 z-[100] flex w-80 items-center gap-3 rounded-xl border p-4 shadow-2xl ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/40 dark:text-red-400"
              : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
          }`}
        >
          <span className="material-symbols-outlined shrink-0 text-[24px]">
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          <p className="text-sm font-semibold leading-snug">{toast.message}</p>
        </div>
      )}
    </div>
  )
}
