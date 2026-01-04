import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ModeToggle } from "@/app/components/mode-toggle"
import api from "../services/api"

interface Event {
  _id: string
  title: string
  date: string
  type: 'meeting' | 'court' | 'deadline' | 'internal' | 'document'
  description?: string
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)
  
  const [events, setEvents] = useState<Event[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({
      title: "",
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      type: "meeting",
      description: ""
  })

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedImage = localStorage.getItem("userProfileImage")
    if (storedName) setUserName(storedName)
    if (storedImage) setUserProfileImage(`http://localhost:5000${storedImage}`)
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
      try {
          const response = await api.get('/events')
          setEvents(response.data.data)
      } catch (error) {
          console.error("Failed to fetch events:", error)
      }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
          const dateTime = new Date(`${newEvent.date}T${newEvent.time}`)
          await api.post('/events', {
              title: newEvent.title,
              date: dateTime,
              type: newEvent.type,
              description: newEvent.description
          })
          setIsModalOpen(false)
          fetchEvents()
          setNewEvent({ ...newEvent, title: "", description: "" })
          // Optionally refresh dashboard by invalidating cache or relying on its own effect
      } catch (error) {
          console.error("Failed to create event:", error)
          alert("Failed to create event")
      }
  }

  const handleDeleteEvent = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteEventId(id);
  }

  const confirmDeleteEvent = async () => {
    if (!deleteEventId) return;
    try {
        await api.delete(`/events/${deleteEventId}`);
        setEvents(events.filter(ev => ev._id !== deleteEventId));
    } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event");
    } finally {
        setDeleteEventId(null);
    }
}

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userName")
    localStorage.removeItem("userProfileImage")
    navigate("/login")
  }

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const days = daysInMonth(year, month)
    const firstDay = firstDayOfMonth(year, month)
    let daysArray = []

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-32 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
        const dateObj = new Date(year, month, day)
        const dayEvents = events.filter(e => {
            const eventDate = new Date(e.date)
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === month && 
                   eventDate.getFullYear() === year
        })

        const isToday = new Date().toDateString() === dateObj.toDateString()

        daysArray.push(
            <div key={day} className={`h-32 border border-slate-100 dark:border-slate-800 p-2 relative group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isToday ? 'bg-primary/5 dark:bg-primary/10' : 'bg-surface-light dark:bg-surface-dark'}`}>
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white dark:text-black' : 'text-slate-700 dark:text-white '}`}>
                    {day}
                </span>
                <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map(event => (
                        <div key={event._id} className={`group/event flex items-center justify-between text-xs px-1.5 py-1 rounded border-l-2 cursor-pointer hover:opacity-100 hover:shadow-sm transition-all
                            ${event.type === 'meeting' ? 'bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300' : 
                              event.type === 'court' ? 'bg-orange-100 text-orange-700 border-orange-500 dark:bg-orange-900/30 dark:text-orange-300' :
                              event.type === 'deadline' ? 'bg-red-100 text-red-700 border-red-500 dark:bg-red-900/30 dark:text-red-300' :
                              event.type === 'document' ? 'bg-purple-100 text-purple-700 border-purple-500 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-slate-100 text-slate-700 border-slate-500 dark:bg-slate-800 dark:text-slate-300'}
                        `} title={event.title}>
                            <div className="flex-1 truncate">
                                <span className="font-semibold opacity-75 mr-1">{new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {event.title}
                            </div>
                            <button
                                onClick={(e) => handleDeleteEvent(e, event._id)}
                                className="hidden group-hover/event:flex shrink-0 items-center justify-center size-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => {
                      setNewEvent({...newEvent, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`})
                      setIsModalOpen(true)
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>
            </div>
        )
    }

    // Fill remaining cells
    const remainingCells = 42 - daysArray.length // 6 rows * 7 columns
    for (let i = 0; i < remainingCells; i++) {
        daysArray.push(<div key={`remaining-${i}`} className="h-32 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"></div>)
    }

    return daysArray
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen flex flex-col">
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
                <a className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-white transition-colors" href="/documents">Documents</a>
                <a className="text-sm font-semibold text-primary" href="/calendar">Calendar</a>
            </nav>
            <div className="flex items-center gap-3">
                 <ModeToggle />
                 <div className="relative group">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-800 relative cursor-pointer">
                        {userProfileImage ? (
                            <img alt={userName} className="h-full w-full object-cover" src={userProfileImage}/>
                        ) : (
                             <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                                {userName.charAt(0).toUpperCase()}
                             </div>
                        )}
                    </div>
                </div>
                 <button onClick={handleLogout} className="flex size-10 items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors" title="Logout">
                    <span className="material-symbols-outlined">logout</span>
                 </button>
            </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Calendar</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your hearings, client meetings, and deadlines.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <div className="font-semibold text-lg w-40 text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors mr-1">
                    Today
                </button>
            </div>
         </div>

         {/* Calendar Grid */}
         <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>
         </div>
      </main>

      {/* Event Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1e2532] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Event</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleCreateEvent} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                        <input 
                            required
                            type="text" 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                            placeholder="e.g. Client Meeting"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input 
                                required
                                type="date" 
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                            <input 
                                required
                                type="time" 
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                value={newEvent.time}
                                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                        <select 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            value={newEvent.type}
                            onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                        >
                            <option value="meeting">Meeting</option>
                            <option value="court">Court Hearing</option>
                            <option value="deadline">Deadline</option>
                            <option value="internal">Internal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                        <textarea 
                            className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                            placeholder="Add details..."
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                        >
                            Create Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteEventId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0">
          <div className="w-full max-w-md mx-4 bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark p-6 animate-in zoom-in-95">
             <h3 className="text-lg font-bold mb-2">Confirm Event Deletion</h3>
             <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
             </p>
             <div className="flex justify-end gap-2">
                 <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors" onClick={() => setDeleteEventId(null)}>Cancel</button>
                 <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={confirmDeleteEvent}>Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
