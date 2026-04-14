import { useEffect, useState } from "react";
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

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [filter, setFilter] = useState<"all" | "drafts" | "archived">("all");

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
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const url = searchTerm
          ? `/documents?search=${encodeURIComponent(searchTerm)}`
          : "/documents";
        const response = await api.get(url);
        setDocuments(response.data.data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDocuments();
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

  const filteredDocuments = documents.filter((doc) => {
    if (filter === "drafts") return !doc.status || doc.status === "Draft";
    if (filter === "archived") return doc.status === "Archived";
    return true;
  });

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen dark:bg-[#111621] dark:text-white">
      {/* Delete Confirmation Modal */}
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
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 font-sans dark:bg-[#1e2532]">
            <h3 className="text-xl font-black mb-2 font-headline">
              Delete Doc?
            </h3>
            <p className="text-sm text-on-surface-variant mb-8 dark:text-slate-400">
              This action is permanent and cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 font-bold border border-outline rounded-xl hover:bg-surface-container-low transition-colors"
                onClick={() => setDeleteConfirmationId(null)}
              >
                Keep it
              </button>
              <button
                className="flex-1 py-3 font-bold bg-error text-on-error rounded-xl shadow-lg shadow-error/20 hover:opacity-90 transition-all"
                onClick={handleDeleteDocument}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Main Content */}
      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2 dark:text-slate-400">
                <span>Workspace</span>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-primary font-bold">Documents</span>
              </nav>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline dark:text-white">
                Documents
              </h1>
            </div>
            <button
              onClick={() => navigate("/create-document")}
              className="bg-gradient-to-br from-primary to-primary-dim text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/10 hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">note_add</span>
              Create Document
            </button>
          </div>

          <div className="space-y-8 font-sans">
            {/* Filters & Search Bar Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit dark:bg-slate-800">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === "all" ? "bg-white text-primary shadow-sm dark:bg-[#1e2532] dark:text-blue-400" : "text-on-surface-variant hover:text-on-surface dark:text-slate-400 dark:hover:text-white"}`}
                >
                  All Documents
                </button>
                <button
                  onClick={() => setFilter("drafts")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === "drafts" ? "bg-white text-primary shadow-sm dark:bg-[#1e2532] dark:text-blue-400" : "text-on-surface-variant hover:text-on-surface dark:text-slate-400 dark:hover:text-white"}`}
                >
                  Drafts
                </button>
                <button
                  onClick={() => setFilter("archived")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === "archived" ? "bg-white text-primary shadow-sm dark:bg-[#1e2532] dark:text-blue-400" : "text-on-surface-variant hover:text-on-surface dark:text-slate-400 dark:hover:text-white"}`}
                >
                  Archived
                </button>
              </div>
              <div className="relative w-full md:w-[400px]">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400">
                  search
                </span>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 shadow-sm placeholder:text-outline transition-all dark:bg-[#1e2532] dark:border-[#2e3645]"
                  placeholder="Search by name, type, or case ref..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-[0_20px_40px_rgba(36,49,86,0.04)] overflow-hidden dark:bg-[#1e2532]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="py-5 px-6 w-12">
                      <input
                        className="rounded-sm border-slate-300 text-primary focus:ring-primary/20 dark:border-slate-700"
                        type="checkbox"
                      />
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                      Name
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                      Case Reference
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                      Type
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                      Date Added
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider dark:text-slate-400">
                      Status
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-on-surface-variant uppercase tracking-wider text-right dark:text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-20 text-center text-on-surface-variant italic dark:text-slate-400"
                      >
                        Loading documents...
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 dark:bg-[#111621]">
                            <span className="material-symbols-outlined text-4xl">
                              folder_open
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-on-surface dark:text-white">
                            No documents found
                          </h3>
                          <p className="text-on-surface-variant max-w-xs dark:text-slate-400">
                            You haven't uploaded any documents yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <tr
                        key={doc._id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-5 px-6">
                          <input
                            className="rounded-sm border-slate-300 text-primary focus:ring-primary/20 dark:border-slate-700"
                            type="checkbox"
                          />
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                              <span className="material-symbols-outlined">
                                picture_as_pdf
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-on-surface dark:text-white">
                                {doc.title}
                              </p>
                              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                                2.4 MB
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="px-3 py-1 bg-blue-50 text-primary rounded-full text-xs font-bold font-mono dark:bg-blue-500/10 dark:text-blue-400">
                            #CASE-{doc._id.substring(0, 6).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
                            Legal File
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm text-on-surface-variant dark:text-slate-400">
                            {new Date(doc.createdAt).toLocaleDateString(
                              "tr-TR",
                            )}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${doc.status === "Approved" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${doc.status === "Approved" ? "bg-green-500" : "bg-yellow-500"}`}
                            ></span>
                            {doc.status || "Draft"}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.status !== "Approved" && (
                              <button
                                onClick={() => handleApproveDocument(doc._id)}
                                className="p-2 hover:bg-white rounded-lg text-green-600 hover:text-green-700 transition-colors"
                                title="Approve"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  check_circle
                                </span>
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDocument(doc._id)}
                              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-primary transition-colors dark:text-slate-400"
                              title="View"
                            >
                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-primary transition-colors dark:text-slate-400"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-lg">
                                download
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/edit-document/${doc._id}`)
                              }
                              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-primary transition-colors dark:text-slate-400"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() => confirmDeleteDocument(doc._id)}
                              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-error transition-colors dark:text-slate-400"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-lg">
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
              <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-on-surface-variant dark:text-slate-400">
                  Showing <span className="font-bold text-on-surface dark:text-white">1</span>{" "}
                  to{" "}
                  <span className="font-bold text-on-surface dark:text-white">
                    {filteredDocuments.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-on-surface dark:text-white">
                    {filteredDocuments.length}
                  </span>{" "}
                  results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30"
                    disabled
                  >
                    <span className="material-symbols-outlined">
                      chevron_left
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                      1
                    </button>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    disabled
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between dark:bg-[#1e2532] dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    cloud_upload
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1 font-headline">
                    Storage Usage
                  </h3>
                  <div className="w-full bg-slate-100 h-2 rounded-full mb-3 overflow-hidden">
                    <div className="bg-primary h-full w-[65%] rounded-full"></div>
                  </div>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400">
                    6.2 GB of 10 GB used (65%)
                  </p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 dark:bg-[#1e2532] dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                  </div>
                  <span className="text-xs font-bold text-secondary px-2 py-1 bg-secondary/10 rounded-full">
                    Trending
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1 font-headline">
                  Most Viewed
                </h3>
                <p className="text-sm text-on-surface-variant mb-4 dark:text-slate-400">
                  Dökümanlarınız bu hafta toplam 142 kez görüntülendi.
                </p>
                <a
                  className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline"
                  href="#"
                >
                  View details{" "}
                  <span className="material-symbols-outlined text-xs">
                    arrow_forward
                  </span>
                </a>
              </div>
              <div className="bg-slate-900 p-8 rounded-lg shadow-2xl relative overflow-hidden group dark:bg-[#1e2532]">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2 font-headline">
                    Need more space?
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Upgrade to Enterprise for unlimited storage and advanced
                    AI-powered document analysis.
                  </p>
                  <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform dark:bg-[#1e2532] dark:text-white">
                    Explore Plans
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
