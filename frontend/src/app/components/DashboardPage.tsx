import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

import { ModeToggle } from "./mode-toggle"

interface Document {
  _id: string
  title: string
  createdAt: string
  status?: string // Backend might not send this yet, optional
}

interface Event {
    _id: string
    title: string
    date: string
    type: 'meeting' | 'court' | 'deadline' | 'internal' | 'document'
    description?: string
  }
  
  export default function DashboardPage() {
    const navigate = useNavigate()
    const [documents, setDocuments] = useState<Document[]>([])
    const [agendaEvents, setAgendaEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
  
    const [userProfileImage, setUserProfileImage] = useState<string | null>(null)
    const [userName, setUserName] = useState("")
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
  
    useEffect(() => {
      const storedName = localStorage.getItem("userName")
      const storedImage = localStorage.getItem("userProfileImage")
      if (storedName) setUserName(storedName)
      if (storedImage) setUserProfileImage(`http://192.168.1.152:5000${storedImage}`)
    }, [])
  
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                // Fetch Documents
                const docUrl = searchTerm ? `/documents?search=${encodeURIComponent(searchTerm)}` : "/documents"
                const docResponse = await api.get(docUrl)
                setDocuments(docResponse.data.data || [])

                // Fetch Agenda Events (Next 7 Days)
                const startOfDay = new Date()
                startOfDay.setHours(0, 0, 0, 0)
                
                const endOfWeek = new Date()
                endOfWeek.setDate(startOfDay.getDate() + 7)
                endOfWeek.setHours(23, 59, 59, 999)
                
                const eventResponse = await api.get('/events', { 
                    params: { 
                        start: startOfDay.toISOString(), 
                        end: endOfWeek.toISOString() 
                    } 
                })
                setAgendaEvents(eventResponse.data.data || [])

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
                setDocuments([])
                setAgendaEvents([])
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchDashboardData()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])
    
    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("userName")
        localStorage.removeItem("userProfileImage")
        navigate("/login")
    }

    const handleViewDocument = async (id: string) => {
        try {
            const response = await api.get(`/documents/${id}/download`, {
                responseType: 'blob'
            });
            
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error viewing document:", error);
            alert("Could not load document.");
        }
    }

    const handleDownloadDocument = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc._id}/download`, {
                responseType: 'blob'
            });
            
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = `${doc.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (error) {
            console.error("Error downloading document:", error);
            alert("Could not download document.");
        }
    }

    const confirmDeleteDocument = (id: string) => {
        setDeleteConfirmationId(id)
    }

    const handleDeleteDocument = async () => {
        if (!deleteConfirmationId) return;

        try {
            await api.delete(`/documents/${deleteConfirmationId}`);
            // Remove from local state
            setDocuments(documents.filter(doc => doc._id !== deleteConfirmationId));
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document");
        } finally {
            setDeleteConfirmationId(null);
        }
    }

    const handleApproveDocument = async (id: string) => {
        try {
            const response = await api.put(`/documents/${id}/status`, { status: "Approved" });
            if (response.data.success) {
                setDocuments(documents.map(doc => 
                    doc._id === id ? { ...doc, status: "Approved" } : doc
                ));
            }
        } catch (error) {
            console.error("Error approving document:", error);
            alert("Failed to approve document");
        }
    }

    const handleProfileImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (file.size > 10 * 1024 * 1024) {
                 alert("File size must be less than 10MB");
                 return;
            }

            const formData = new FormData();
            formData.append('profileImage', file);

            try {
                const response = await api.put("/users/profile/image", formData);
                
                if (response.data.success) {
                    const newImagePath = response.data.data.profileImage;
                    localStorage.setItem("userProfileImage", newImagePath);
                    setUserProfileImage(`http://192.168.1.152:5000${newImagePath}`);
                }
            } catch (error) {
                console.error("Failed to update profile image:", error);
                alert("Failed to update profile image");
            }
        }
    }

    // (Helper for event colors)
    const getEventColor = (type: string) => {
        switch(type) {
            case 'meeting': return 'bg-primary ring-primary/20 text-primary';
            case 'court': return 'bg-orange-500 ring-orange-500/20 text-orange-500';
            case 'deadline': return 'bg-red-500 ring-red-500/20 text-red-500';
            case 'document': return 'bg-purple-500 ring-purple-500/20 text-purple-500';
            default: return 'bg-green-500 ring-green-500/20 text-green-500';
        }
    }

    // Calculate today's events count
    const todayCount = agendaEvents.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark antialiased selection:bg-primary/20 flex min-h-screen w-full flex-col">
          
          {/* Delete Confirmation Modal */}
          {deleteConfirmationId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0">
              <div className="w-full max-w-md mx-4 bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark p-6 animate-in zoom-in-95">
                 <h3 className="text-lg font-bold mb-2">Confirm Deletion</h3>
                 <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                    Are you sure you want to delete this document? This action cannot be undone.
                 </p>
                 <div className="flex justify-end gap-2">
                     <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors" onClick={() => setDeleteConfirmationId(null)}>Cancel</button>
                     <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={handleDeleteDocument}>Delete</button>
                 </div>
              </div>
            </div>
          )}
    
          {/* Top Navigation */}
          <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark px-6 py-3 shadow-sm">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded bg-login-primary text-white">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-text-main-light dark:text-white">MakeDoc</h2>
                </div>
                {/* Search Bar */}
                <div className="hidden md:flex relative w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark material-symbols-outlined text-[20px]">search</span>
                    <input 
                        className="h-10 w-full rounded-lg border-none bg-background-light dark:bg-background-dark pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark outline-none" 
                        placeholder="Search docs..." 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-6">
                <nav className="hidden lg:flex items-center gap-6">
                    <a className="text-sm font-semibold text-primary" href="/dashboard">Dashboard</a>
                    <a className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-white transition-colors" href="/documents">Documents</a>
                    <a className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-white transition-colors" href="/calendar">Calendar</a>
                </nav>
                <div className="flex items-center gap-3">
                     <ModeToggle />
                     
                     <div className="relative group">
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-800 relative cursor-pointer">
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 z-20 cursor-pointer" 
                                accept="image/*"
                                onChange={handleProfileImageUpdate}
                            />
                            {userProfileImage ? (
                                <img alt={userName} className="h-full w-full object-cover" src={userProfileImage}/>
                            ) : (
                                 <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                 </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                <span className="material-symbols-outlined text-white text-[16px]">edit</span>
                            </div>
                        </div>
                    </div>
    
                     <button onClick={handleLogout} className="flex size-10 items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors" title="Logout">
                        <span className="material-symbols-outlined">logout</span>
                     </button>
                </div>
            </div>
          </header>
    
          {/* Main Content */}
          <main className="flex-1 px-6 py-8 md:px-10 lg:px-20 mx-auto w-full max-w-[1400px]">
            {/* Page Heading */}
            <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-main-light dark:text-white mb-2">Dashboard</h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">Welcome back, {userName}. You have <span className="font-bold text-primary">{todayCount} upcoming {todayCount === 1 ? 'event' : 'events'}</span> today.</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button className="flex items-center gap-2 rounded-lg bg-login-primary px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-primary-dark transition-colors">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Case
                    </button>
                    <button onClick={() => navigate("/create-document")} className="flex items-center gap-2 rounded-lg bg-white dark:bg-card-dark border border-border-light dark:border-border-dark px-4 py-2 text-sm font-bold text-text-main-light dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        Create Doc
                    </button>
                </div>
            </div>
    
            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stat Card 1 */}
                <div className="group relative overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined">folder_open</span>
                        </div>
                                            </div>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Total Documents</p>
                    <p className="text-2xl font-bold text-text-main-light dark:text-white mt-1">{documents.length}</p>
                </div>
                {/* Stat Card 2 */}
                
                {/* Stat Card 3 */}
                <div className="group relative overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                            <span className="material-symbols-outlined">assignment_late</span>
                        </div>
                        
                    </div>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Pending Tasks</p>
                    <p className="text-2xl font-bold text-text-main-light dark:text-white mt-1">{todayCount}</p>
                </div>
                {/* Stat Card 4 */}
                
            </div>
    
            {/* Content Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column (Wide) */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    {/* Recent Documents Table */}
                    <div className="flex flex-col rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white">Recent Documents</h3>
                            <a className="text-sm font-semibold text-primary hover:underline" href="/documents">View All</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-background-light dark:bg-background-dark/50 text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Document Name</th>
                                        <th className="px-6 py-3 font-semibold">Date</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : documents.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                                No documents found.
                                            </td>
                                        </tr>
                                    ) : (
                                        documents.map((doc) => (
                                            <tr key={doc._id} className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                            <span className="material-symbols-outlined text-lg">description</span>
                                                        </div>
                                                        <span className="font-medium text-text-main-light dark:text-white">{doc.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                                    {new Date(doc.createdAt).toLocaleDateString("tr-TR")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        doc.status === 'Approved' 
                                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                                    }`}>
                                                        {doc.status || "Draft"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {(!doc.status || doc.status === 'Draft') && (
                                                            <button 
                                                                onClick={() => handleApproveDocument(doc._id)} 
                                                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" 
                                                                title="Approve"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleViewDocument(doc._id)} className="text-text-secondary-light hover:text-primary dark:text-text-secondary-dark dark:hover:text-white" title="View">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                        <button onClick={() => handleDownloadDocument(doc)} className="text-text-secondary-light hover:text-primary dark:text-text-secondary-dark dark:hover:text-white" title="Download">
                                                            <span className="material-symbols-outlined text-[20px]">download</span>
                                                        </button>
                                                        <button onClick={() => confirmDeleteDocument(doc._id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
    
                    {/* Client Invoices (Static) */}
                    <div className="flex flex-col rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white">Pending Invoices</h3>
                            <button className="text-text-secondary-light hover:text-primary dark:text-text-secondary-dark dark:hover:text-white">
                                <span className="material-symbols-outlined">refresh</span>
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-background-light dark:bg-background-dark">
                                <span className="material-symbols-outlined text-3xl text-text-secondary-light dark:text-text-secondary-dark">inbox</span>
                            </div>
                            <h4 className="text-base font-semibold text-text-main-light dark:text-white">All caught up!</h4>
                            <p className="mt-1 max-w-xs text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                There are no pending invoices to review at this time.
                            </p>
                            <button className="mt-6 text-sm font-bold text-primary hover:text-primary-dark">
                                View Past Invoices
                            </button>
                        </div>
                    </div>
                </div>
    
                {/* Right Column (Narrow) */}
                <div className="flex flex-col gap-8">
                    {/* Agenda */}
                    <div className="rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white">Agenda</h3>
                            <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark font-mono">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {(!agendaEvents || agendaEvents.length === 0) ? (
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">No upcoming events this week.</p>
                            ) : (
                                agendaEvents.map((event, index) => {
                                    const colorClass = getEventColor(event.type);
                                    const isLast = index === agendaEvents.length - 1;
                                    const eventDate = new Date(event.date);
                                    
                                    return (
                                        <div key={event._id} className={`relative flex gap-4 ${!isLast ? 'pb-6' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <div className={`size-3 rounded-full ${colorClass.split(' ')[0]} ring-4 ${colorClass.split(' ')[1]}`}></div>
                                                {!isLast && <div className="h-full w-0.5 bg-border-light dark:bg-border-dark mt-2"></div>}
                                            </div>
                                            <div className={`flex-1 ${!isLast ? 'pb-2' : ''}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`text-xs font-semibold ${colorClass.split(' ')[2]}`}>
                                                        {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-text-secondary-light dark:text-text-secondary-dark bg-background-light dark:bg-background-dark px-2 py-0.5 rounded-full border border-border-light dark:border-border-dark">
                                                        {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-background-light dark:bg-background-dark p-3">
                                                    <p className="font-semibold text-sm text-text-main-light dark:text-white">{event.title}</p>
                                                    {event.description && <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 line-clamp-2">{event.description}</p>}
                                                    <p className="text-[10px] uppercase font-bold text-text-secondary-light/70 dark:text-text-secondary-dark/70 mt-1">{event.type}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <div className="border-t border-border-light dark:border-border-dark p-3">
                            <button onClick={() => navigate('/calendar')} className="w-full rounded-lg py-2 text-sm font-semibold text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark transition-colors">
                                View Full Calendar
                            </button>
                        </div>
                    </div>
    
                    {/* Recent Contacts (Static) */}
                    <div className="rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-white">Recent Contacts</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-colors">
                                <div className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBW3ekANB9cCAjEPq8VVWrS0oZkhXCXMJiHR7yz77dTYwyXiRzatlNKLqFY-CLoDz8O0leQJGpvcVbPyxHw9Ds8N5kI5Wl0pwm5HtEhZEONhkjjujDi5tg0SD8WdD7UXyREj4YTOLETLK6SuWKYjTkzetT877Z1dM5kb_Te6xoZqnZ84MUt5AgKASurUik4uGpQLbXqzq0r8sbfbXW0z6N_wEEW12EwGQp81EUCMhRGRy4pN-bKiaQcSphFLIxf0boQ8SVZCuSAxo0')" }}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-main-light dark:text-white truncate">Sarah Jenkins</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">Client - Estate Case</p>
                                </div>
                                <button className="text-text-secondary-light hover:text-primary dark:text-text-secondary-dark">
                                    <span className="material-symbols-outlined text-lg">mail</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-colors">
                                <div className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-Ky6Lzs3xHZQICWf8kbHDupmFWTKQbybDReExYSKpjZEz9TuBWzgJOZTVB_EUYfpY-mX21r7tUHzwWyUXCGAcPdkDjdYhisIG33Oizg8P-4YwogBbW-j9EcZCU3XIJ5HU5gLge1hk_5F3l8f69GA78k_3j21f4gvVA9qpxrmde1mGyIZTmYVPdBmukOqsGKPzcMaIpftH-kO2tif-S79LbhyAB0xBgYIgcHIFTuxHvzlW6UbXtT3eElRDo7iyT8rgsMcpYV0vkco')" }}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-main-light dark:text-white truncate">Michael Ross</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">Associate Partner</p>
                                </div>
                                <button className="text-text-secondary-light hover:text-primary dark:text-text-secondary-dark">
                                    <span className="material-symbols-outlined text-lg">mail</span>
                                </button>
                            </div>
                        </div>
                    </div>
    
                </div>
            </div>
    
          </main>
        </div>
      )
}
