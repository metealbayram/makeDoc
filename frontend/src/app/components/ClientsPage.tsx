import { useEffect, useState } from "react";

import api from "../services/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export default function ClientsPage() {

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    tcNo: "",
    phone: "",
    address: "",
    email: "",
  });
  const [userName, setUserName] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedImage = localStorage.getItem("userProfileImage");
    if (storedName) setUserName(storedName);
    if (storedImage) setUserProfileImage(`http://localhost:5000${storedImage}`);

    const fetchClients = async () => {
      try {
        const res = await api.get("/clients");
        setClients(res.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/clients", newClient);
      setClients([res.data.data, ...clients]);
      setIsClientModalOpen(false);
      setNewClient({ name: "", tcNo: "", phone: "", address: "", email: "" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create client");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter((c) => c._id !== id));
    } catch (err) {
      alert("Failed to delete client");
    }
  };



  const filteredClients = clients.filter(c => 
     c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.tcNo.includes(searchTerm)
  );

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar userName={userName} userProfileImage={userProfileImage} />
      <Sidebar userName={userName} userProfileImage={userProfileImage} />
      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Clients</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and monitor your professional relationships.</p>
            </div>
            <button 
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.2)] hover:scale-[1.02] active:scale-95 transition-all w-fit"
            >
                <span className="material-symbols-outlined">person_add</span>
                Add Client
            </button>
        </div>

        {/* Toolbar / Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
            <div className="flex-1 min-w-[300px] relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/15 shadow-sm transition-all outline-none" 
                    placeholder="Search by name, tc number..." 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <select className="appearance-none pl-6 pr-12 py-4 bg-slate-100/50 dark:bg-slate-800 border-none rounded-2xl text-slate-600 dark:text-slate-300 font-semibold focus:ring-0 cursor-pointer outline-none">
                        <option>Status: All</option>
                        <option>Active</option>
                        <option>In Review</option>
                        <option>Archived</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                </div>
                <div className="relative">
                    <select className="appearance-none pl-6 pr-12 py-4 bg-slate-100/50 dark:bg-slate-800 border-none rounded-2xl text-slate-600 dark:text-slate-300 font-semibold focus:ring-0 cursor-pointer outline-none">
                        <option>Sort: Newest</option>
                        <option>A - Z</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">sort</span>
                </div>
            </div>
        </div>

        {/* Client Grid (Asymmetric Bento Style) */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            
            {filteredClients.map((client, index) => {
                const colors = [
                    "from-blue-600 to-indigo-600",
                    "from-emerald-500 to-teal-600",
                    "from-purple-500 to-fuchsia-600",
                    "from-orange-500 to-rose-600"
                ];
                const color = colors[index % colors.length];

                return (
                    <div key={client._id} className="group bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-700/30 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start mb-6 relative">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-bold font-headline ring-4 ring-white dark:ring-slate-800 shadow-sm`}>
                                {client.name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">Active</span>
                        </div>
                        <div className="mb-8 relative z-10">
                            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">{client.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">TC: {client.tcNo}</p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700 relative z-10">
                            <div className="flex flex-col gap-1">
                                {client.phone && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-[14px]">call</span>
                                        {client.phone}
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        <span className="truncate max-w-[120px]" title={client.address}>{client.address}</span>
                                    </div>
                                )}
                                {!client.phone && !client.address && (
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Client Profile</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteClient(client._id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0" 
                                    title="Delete Client">
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
             })}

             {/* Add Suggestion / Empty State Card */}
             <div onClick={() => setIsClientModalOpen(true)} className="border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer min-h-[280px]">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 transition-all">
                    <span className="material-symbols-outlined text-3xl">person_add</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Expand Network</h3>
                <p className="text-sm text-slate-500 px-6 dark:text-slate-400">Click to invite a new client to your workspace.</p>
             </div>
             
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0 px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Register New Client</h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-700/50 p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="flex flex-col gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 dark:text-slate-400">Full Name</label>
                 <input
                    className="w-full p-3.5 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="E.g. John Doe / Lumina Agency"
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    required
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 dark:text-slate-400">TC Identity No</label>
                 <input
                    className="w-full p-3.5 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="11-digit identification"
                    type="text"
                    value={newClient.tcNo}
                    onChange={(e) => setNewClient({ ...newClient, tcNo: e.target.value })}
                    required
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 dark:text-slate-400">Phone Number</label>
                 <input
                    className="w-full p-3.5 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="+90 555 123 4567"
                    type="text"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 dark:text-slate-400">Address</label>
                 <input
                    className="w-full p-3.5 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="Full registered address"
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                 />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setIsClientModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
