import { useEffect, useState } from "react";
import api from "../services/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  creator: User;
  members: User[];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Side Panel state
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "manage">("create");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);

  // User details
  const [userName, setUserName] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedImage = localStorage.getItem("userProfileImage");
    if (storedName) setUserName(storedName);
    if (storedImage) {
      if (storedImage.startsWith('http')) {
          setUserProfileImage(storedImage);
      } else {
          setUserProfileImage(`http://localhost:5000${storedImage}`);
      }
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, friendsRes] = await Promise.all([
        api.get("/groups"),
        api.get("/friends"),
      ]);

      // Hem data hem de data.data ihtimallerini kontrol et (Garantici yaklaşım)
      const groupsData = groupsRes.data.data || groupsRes.data || [];
      const friendsData = friendsRes.data.data || friendsRes.data || [];

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setFriends(Array.isArray(friendsData) ? friendsData : []);

      console.log("Friends loaded:", friendsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.post("/groups", {
        name: newGroupName,
        description: newGroupDesc,
        initialMembers: selectedFriends.map((f) => f._id),
      });
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedFriends([]);
      setIsSidePanelOpen(false);
      fetchData();
    } catch (error) {
      alert("Failed to create group");
    }
  };

  const handleAddMember = async (groupId: string, memberId: string) => {
    try {
      await api.post(`/groups/${groupId}/add-member`, { memberId });
      // Update local state smoothly
      const updatedGroup = await api.get(`/groups/${groupId}`);
      const freshGroup = updatedGroup.data.data;
      setSelectedGroup(freshGroup);
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? freshGroup : g)),
      );
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      await api.delete(`/groups/${groupId}/remove-member/${memberId}`);
      const updatedGroup = await api.get(`/groups/${groupId}`);
      const freshGroup = updatedGroup.data.data;
      setSelectedGroup(freshGroup);
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? freshGroup : g)),
      );
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete group");
    }
  };

  const openCreatePanel = () => {
    setPanelMode("create");
    setSelectedGroup(null);
    setSelectedFriends([]);
    setIsSidePanelOpen(false); // trigger redraw
    setTimeout(() => setIsSidePanelOpen(true), 10);
  };

  const openManagePanel = (group: Group) => {
    setPanelMode("manage");
    setSelectedGroup(group);
    setIsSidePanelOpen(true);
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "Active") return matchesSearch && g.members.length > 0;
    if (activeTab === "Archived")
      return matchesSearch && g.members.length === 0;
    return matchesSearch;
  });

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar userName={userName} userProfileImage={userProfileImage} />
      <Sidebar userName={userName} userProfileImage={userProfileImage} />

      <div className="ml-72 pt-20 flex overflow-hidden relative min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 md:px-11 min-h-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
            <div>
              <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">
                <span>Dashboard</span>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-blue-600 dark:text-blue-400">Groups</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-slate-900 dark:text-white tracking-tight">
                Groups
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Manage cross-functional teams, track members, and streamline
                collaboration workspaces.
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="px-5 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-full hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2 text-sm shadow-sm">
                <span className="material-symbols-outlined text-xl">
                  filter_list
                </span>
                Filter
              </button>
              <button
                onClick={openCreatePanel}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-xl">
                  add_circle
                </span>
                New Group
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-8 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex-1 relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-11 pr-6 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm transition-all"
                placeholder="Search by group name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {["All", "Active", "Archived"].map((tab) => (
                <span
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer transition-colors border ${activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                >
                  {tab === "All" ? "All Groups" : tab}
                </span>
              ))}
            </div>
          </div>

          {/* Groups Grid (Bento Style Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10 flex-grow content-start">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined animate-spin text-4xl mb-2">
                  progress_activity
                </span>
                <p>Loading groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    search_off
                  </span>
                </div>
                <p className="font-semibold text-lg">No groups found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredGroups.map((group, index) => {
                // Determine some varied styles based on index to replicate the colorful HTML
                const isFirst = index % 3 === 0;
                const isSecond = index % 3 === 1;

                const iconBgClass = isFirst
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  : isSecond
                    ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";

                const badgeClass = isFirst
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : isSecond
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";

                const iconName = isFirst
                  ? "rocket_launch"
                  : isSecond
                    ? "developer_board"
                    : "engineering";

                return (
                  <div
                    key={group._id}
                    onClick={() => openManagePanel(group)}
                    className="bg-white/80 dark:bg-slate-800 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-[0_10px_30px_rgba(36,49,86,0.04)] dark:shadow-none hover:shadow-[0_20px_40px_rgba(36,49,86,0.08)] transition-all duration-300 group relative overflow-hidden border border-slate-100 dark:border-slate-700/50 cursor-pointer"
                  >
                    {/* Hover Quick Actions */}
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openManagePanel(group);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteGroup(e, group._id)}
                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                      </button>
                    </div>

                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgClass}`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {iconName}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${badgeClass}`}
                      >
                        Active
                      </span>
                    </div>

                    <h3 className="text-xl font-headline font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                      {group.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                      {group.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="flex -space-x-3">
                        {group.members.slice(0, 3).map((member) => (
                          <div
                            key={member._id}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden shrink-0 shadow-sm"
                            title={member.name}
                          >
                            {member.profileImage ? (
                              <img
                                src={`http://localhost:5000${member.profileImage}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                        {group.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-sm z-10">
                            +{group.members.length - 3}
                          </div>
                        )}
                        {group.members.length === 0 && (
                          <div className="text-xs text-slate-400 font-medium pl-3 h-8 flex items-center">
                            No members
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          group
                        </span>
                        {group.members.length} Users
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Empty State Illustration / Create Group Placeholder */}
            {!loading && (
              <div
                onClick={openCreatePanel}
                className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all group min-h-[250px]"
              >
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                  <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-500 transition-colors">
                    group_add
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Looking for more?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 mb-6 max-w-[200px]">
                  Create a new group to start collaborating with your team
                  members.
                </p>
                <div className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 font-bold rounded-full group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-all text-sm shadow-sm">
                  Create Group
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Side Panel Overlay & Modal */}
      {isSidePanelOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[55] transition-opacity"
            onClick={() => setIsSidePanelOpen(false)}
          ></div>

          {/* Panel Form */}
          <div className="fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-white dark:bg-slate-900 z-[60] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out border-l border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="p-8 md:p-10 flex-shrink-0 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-headline font-extrabold text-slate-900 dark:text-white">
                {panelMode === "create" ? "New Group" : "Manage Group"}
              </h2>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 md:px-10 py-8 custom-scrollbar space-y-8">
              {panelMode === "create" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                      Group Name
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-shadow"
                      placeholder="e.g. Creative Engineering"
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-shadow"
                      placeholder="Describe the purpose of this group..."
                      rows={4}
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                      Invite Friends
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        person_add
                      </span>
                      <select
                        value=""
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white transition-shadow cursor-pointer"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const f = friends.find(
                            (fr) => fr._id === e.target.value,
                          );
                          if (
                            f &&
                            !selectedFriends.find((sel) => sel._id === f._id)
                          ) {
                            setSelectedFriends([...selectedFriends, f]);
                          }
                        }}
                      >
                        <option
                          value=""
                          disabled
                          className="text-slate-500 font-medium dark:text-slate-400"
                        >
                          Select a friend to invite...
                        </option>
                        {friends
                          .filter(
                            (f) =>
                              !selectedFriends.find((sel) => sel._id === f._id),
                          )
                          .map((f) => (
                            <option
                              key={f._id}
                              value={f._id}
                              className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 py-2"
                            >
                              {f.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    {selectedFriends.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map((f) => (
                          <div
                            key={f._id}
                            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-full border border-blue-200 dark:border-blue-800/50"
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-700 font-bold text-[10px] text-blue-700 dark:text-blue-200 flex items-center justify-center overflow-hidden shrink-0">
                              {f.profileImage ? (
                                <img
                                  src={`http://localhost:5000${f.profileImage}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                f.name.charAt(0)
                              )}
                            </div>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              {f.name}
                            </span>
                            <span
                              className="material-symbols-outlined text-[14px] cursor-pointer text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 transition-colors p-0.5"
                              onClick={() =>
                                setSelectedFriends(
                                  selectedFriends.filter(
                                    (sf) => sf._id !== f._id,
                                  ),
                                )
                              }
                            >
                              close
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                      Privacy Settings
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex gap-4">
                          <span className="material-symbols-outlined text-blue-600">
                            public
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              Public Group
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                              Anyone in the organization can join
                            </p>
                          </div>
                        </div>
                        <input
                          defaultChecked
                          className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                          name="privacy"
                          type="radio"
                        />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                selectedGroup && (
                  <>
                    <div className="space-y-2 mb-8">
                      <h3 className="text-xl font-bold font-headline mb-1">
                        {selectedGroup.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedGroup.description}
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-2">
                        Created by {selectedGroup.creator?.name}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Members ({selectedGroup.members.length})</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedGroup.members.map((member) => (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                              {member.profileImage ? (
                                <img
                                  src={`http://localhost:5000${member.profileImage}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                member.name.charAt(0)
                              )}
                            </div>
                            <span className="text-sm font-semibold truncate dark:text-slate-200">
                              {member.name}
                            </span>

                            {/* Remove Member Button */}
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  selectedGroup._id,
                                  member._id,
                                )
                              }
                              className="ml-auto w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center shrink-0"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                person_remove
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                        Invite Friends
                      </label>
                      <div className="flex flex-col gap-3">
                        {friends
                          .filter(
                            (f) =>
                              !selectedGroup.members.find(
                                (m) => m._id === f._id,
                              ),
                          )
                          .map((friend) => (
                            <div
                              key={friend._id}
                              className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 rounded-xl transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                  {friend.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium dark:text-slate-300">
                                  {friend.name}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleAddMember(selectedGroup._id, friend._id)
                                }
                                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  person_add
                                </span>
                              </button>
                            </div>
                          ))}
                        {friends.filter(
                          (f) =>
                            !selectedGroup.members.find((m) => m._id === f._id),
                        ).length === 0 && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              All your friends are already in this group.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )
              )}
            </div>

            <div className="mt-auto p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4 shrink-0">
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              {panelMode === "create" && (
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  Create Group
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
