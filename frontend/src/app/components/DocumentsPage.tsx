import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { ModeToggle } from "@/app/components/mode-toggle"

interface Document {
  _id: string
  title: string
  createdAt: string
  status?: string
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userName, setUserName] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'drafts' | 'archived'>('all')

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedImage = localStorage.getItem("userProfileImage")
    if (storedName) setUserName(storedName)
    if (storedImage) setUserProfileImage(`http://localhost:5000${storedImage}`)
  }, [])

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true)
      try {
        const url = searchTerm ? `/documents?search=${encodeURIComponent(searchTerm)}` : "/documents"
        const response = await api.get(url)
        setDocuments(response.data.data)
      } catch (error) {
        console.error("Failed to fetch documents:", error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
        fetchDocuments()
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
        if (file.size > 2 * 1024 * 1024) {
             alert("File size must be less than 2MB");
             return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await api.put("/users/profile/image", formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data'
                  }
            });
            
            if (response.data.success) {
                const newImagePath = response.data.data.profileImage;
                localStorage.setItem("userProfileImage", newImagePath);
                setUserProfileImage(`http://localhost:5000${newImagePath}`);
            }
        } catch (error) {
            console.error("Failed to update profile image:", error);
            alert("Failed to update profile image");
        }
    }
  }

  const filteredDocuments = documents.filter(doc => {
      if (filter === 'drafts') return (!doc.status || doc.status === 'Draft');
      if (filter === 'archived') return doc.status === 'Archived';
      return true;
  });

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen flex flex-col">
      
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

      {/* Top Navigation (Consistent with Dashboard) */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark px-6 py-3 shadow-sm">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded bg-login-primary text-white">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-text-main-light dark:text-white">MakeDoc</h2>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-6">
                <a className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-white transition-colors" href="/dashboard">Dashboard</a>
               
                <a className="text-sm font-semibold text-primary" href="/documents">Documents</a>
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
      <main className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <a className="hover:text-primary transition-colors flex items-center gap-1" href="/dashboard">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                Dashboard
            </a>
            <span className="material-symbols-outlined text-[16px] text-slate-300">chevron_right</span>
            <span className="font-medium text-slate-900 dark:text-white">Documents</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Documents</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Manage legal case files, contracts, and internal records securely.</p>
            </div>
            <button 
                onClick={() => navigate("/create-document")}
                className="shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium shadow-md transition-transform active:scale-95"
            >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create Document
            </button>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="mb-6 flex flex-col gap-4">
            {/* Search Bar */}
            <div className="w-full">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input 
                        className="block w-full pl-10 pr-3 py-3 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg leading-5 bg-surface-light dark:bg-surface-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm shadow-sm transition-all" 
                        placeholder="Search by document name, case reference, or type..." 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            {/* Filter Chips */}
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                <button 
                    onClick={() => setFilter('all')}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        filter === 'all' 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" 
                        : "bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                >
                    All Documents
                </button>
                
                
                <button 
                    onClick={() => setFilter('drafts')}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        filter === 'drafts' 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" 
                        : "bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                >
                    Drafts
                    <span className="flex h-2 w-2 rounded-full bg-yellow-500"></span>
                </button>
                <button 
                    onClick={() => setFilter('archived')}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        filter === 'archived' 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" 
                        : "bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                >
                    Archived
                </button>
            </div>
        </div>

        {/* Main Data Table Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden mb-12">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="p-4 w-12">
                                <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" type="checkbox"/>
                            </th>
                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Case Reference</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Added</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">Loading documents...</td>
                            </tr>
                        ) : filteredDocuments.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">folder_open</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No documents found</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                                            {filter === 'all' 
                                                ? "You haven't uploaded any documents yet. Get started by creating your first legal document." 
                                                : `No ${filter} documents found.`}
                                        </p>
                                        <button 
                                            onClick={() => navigate("/create-document")}
                                            className="shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium shadow-md transition-transform active:scale-95 "
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            Create Document
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <tr key={doc._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <input className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent opacity-0 group-hover:opacity-100 transition-opacity" type="checkbox"/>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                <span className="material-symbols-outlined">description</span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">{doc.title}</div>
                                                <div className="text-xs text-slate-500">1.2 MB</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                            #CASE-{doc._id.substring(0,6).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                        General
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                        {new Date(doc.createdAt).toLocaleDateString("tr-TR")}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            doc.status === 'Approved'
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800'
                                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            {doc.status || "Draft"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
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
                                            <button onClick={() => handleViewDocument(doc._id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="View">
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                            <button onClick={() => handleDownloadDocument(doc)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Download">
                                                <span className="material-symbols-outlined text-[20px]">download</span>
                                            </button>
                                            <button onClick={() => confirmDeleteDocument(doc._id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Delete">
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
            
            {/* Pagination (Static) */}
            {documents.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{documents.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{documents.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Previous
                        </button>
                        <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  )
}
