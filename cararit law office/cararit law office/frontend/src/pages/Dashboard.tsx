import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/Modetoggle"; 
import { CalendarDays, Package, FileText, ListChecks, History, Users, LogOut, Bell, ClipboardList, ChevronRight } from "lucide-react";

// Format for each notification
interface NotificationItem {
  id: string;
  title: string;
  cleanDate: string;
  diffDays: number;
  hasDeadline: boolean;
  type: "schedule" | "task";
  path: string;
}

const formatDateInWords = (dateString: string) => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)} ${parts[0]}`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const schedRes = await fetch("http://localhost:3000/api/schedules");
        const rawSchedData = schedRes.ok ? await schedRes.json() : [];
        const schedData = Array.isArray(rawSchedData) ? rawSchedData : rawSchedData.data || rawSchedData.schedules || [];

        const taskRes = await fetch("http://localhost:3000/api/tasks");
        const rawTaskData = taskRes.ok ? await taskRes.json() : [];
        const taskData = Array.isArray(rawTaskData) ? rawTaskData : rawTaskData.data || rawTaskData.tasks || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingSchedules = schedData
          .filter((s: any) => (s?.status || "").toLowerCase() === "upcoming")
          .map((s: any) => {
            const cleanDate = s.date ? s.date.substring(0, 10) : "";
            const sDate = new Date(cleanDate);
            sDate.setHours(0, 0, 0, 0);
            const diffTime = sDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              ...s,
              cleanDate: formatDateInWords(cleanDate),
              diffDays,
              hasDeadline: true,
              type: "schedule",
              path: "/schedules"
            };
          })
          .filter((s: any) => s.diffDays >= 0 && s.diffDays <= 10);

        const pendingTasks = taskData
          .filter((t: any) => {
            const isCompleted = t?.completed === 1 || t?.completed === true || String(t?.completed) === "1";
            const isPending = !isCompleted;
            const assignedValue = String(t?.assignedTo || "").toLowerCase().trim();
            const currentUser: any = user || {};
            const myName = String(currentUser?.name || "").toLowerCase().trim();
            const myFullName = String(currentUser?.fullName || "").toLowerCase().trim();
            const myId = String(currentUser?.id || "").toLowerCase().trim();

            const isAssignedToMe = (assignedValue !== "" && assignedValue === myName) ||
                                   (assignedValue !== "" && assignedValue === myFullName) ||
                                   (assignedValue !== "" && assignedValue === myId);

            return isPending && isAssignedToMe;
          })
          .map((t: any) => {
            return {
              id: t?.id || Math.random().toString(),
              title: `Task: ${t?.title || "Untitled"}`,
              cleanDate: "Pending Task",
              diffDays: 0,
              hasDeadline: false,
              type: "task",
              path: "/tasks"
            };
          });

        const combinedNotifs = [...upcomingSchedules, ...pendingTasks]
          .sort((a: any, b: any) => {
            const aDays = a.hasDeadline ? a.diffDays : Number.MAX_SAFE_INTEGER;
            const bDays = b.hasDeadline ? b.diffDays : Number.MAX_SAFE_INTEGER;
            return aDays - bDays;
          });

        setNotifs(combinedNotifs);
        if (combinedNotifs.length > 0) {
          setHasUnread(true);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const toggleNotifs = () => {
    setShowNotifs(!showNotifs);
    if (hasUnread) setHasUnread(false);
  };

  if (!user) return null;

  const menuItems = [
    { label: "Schedules", description: "View or add upcoming events and appointments.", icon: CalendarDays, path: "/schedules", iconColor: "text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400", roles: ["admin", "scheduler"] },
    { label: "Inventory", description: "Manage office equipment, supplies, and stocks.", icon: Package, path: "/inventory", iconColor: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400", roles: ["admin", "inventory_staff"] },
    { label: "Solicitation", description: "Track incoming requests and solicitation letters.", icon: FileText, path: "/solicitation", iconColor: "text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400", roles: ["admin", "scheduler", "inventory_staff"] },
    { label: "My Tasks", description: "Check and manage tasks assigned to you.", icon: ListChecks, path: "/tasks", iconColor: "text-violet-600 bg-violet-100 dark:bg-violet-500/20 dark:text-violet-400", roles: ["admin", "scheduler", "inventory_staff"] },
    { label: "Activity Logs", description: "Monitor system history and user actions.", icon: History, path: "/logs", iconColor: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400", roles: ["admin"] },
    { label: "Manage Users", description: "Add, edit, or remove system user accounts.", icon: Users, path: "/users", iconColor: "text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400", roles: ["admin"] },
  ];

  const currentUserRole = user?.role || "";
  const visibleItems = menuItems.filter((item) => item.roles.includes(currentUserRole));

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    scheduler: "Scheduler",
    inventory_staff: "Inventory Staff",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 relative font-sans">
      
      {/* 🌟 BAGONG WHITE HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-sm relative z-50 gap-4 md:gap-0">
        
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <div className="shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="Carait Logo" className="h-10 w-auto md:h-12 object-contain drop-shadow-sm" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Carait Management System</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {roleLabel[currentUserRole] || "Staff"} Account
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Notifications, Dark Mode, and Logout */}
        <div className="flex items-center justify-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-11 md:w-11 rounded-xl relative bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              onClick={toggleNotifs}
            >
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </Button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                <div className="absolute right-0 md:-right-4 top-14 w-[calc(100vw-2rem)] md:w-96 max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-slate-800 animate-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <h3 className="font-bold text-base dark:text-slate-100">Notifications</h3>
                    <Badge variant="secondary" className="text-[10px]">{notifs.length} items</Badge>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto flex flex-col p-2 space-y-1 custom-scrollbar">
                    {notifs.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3"><Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" /></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">All caught up!</p>
                      </div>
                    ) : (
                      notifs.map((notif) => (
                        <div key={notif.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800" onClick={() => { setShowNotifs(false); navigate(notif.path); }}>
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.type === 'task' ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                            {notif.type === 'task' ? <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" /> : <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <div className="flex flex-col text-left w-full">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight">{notif.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.cleanDate}</span>
                            <span className="text-[11px] font-bold mt-1.5 inline-block w-fit px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                              {!notif.hasDeadline ? <span className="text-slate-600 dark:text-slate-400">📌 Action Required</span> : notif.diffDays < 0 ? <span className="text-rose-600 dark:text-rose-400">⚠️ Overdue by {Math.abs(notif.diffDays)} days</span> : notif.diffDays === 0 ? <span className="text-rose-600 dark:text-rose-400 animate-pulse">🚨 Due today!</span> : <span className="text-amber-600 dark:text-amber-500">⏳ {notif.diffDays} days left</span>}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center h-10 w-10 md:h-11 md:w-11">
            <ModeToggle />
          </div>

          <Button
            variant="ghost"
            className="h-10 md:h-11 px-4 md:px-5 text-sm font-bold gap-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-300 dark:hover:bg-rose-950/30 transition-colors"
            onClick={() => { logout(); navigate("/"); }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">LOGOUT</span>
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-10 flex flex-col max-w-6xl mx-auto w-full mt-4 md:mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {visibleItems.map((item) => (
            <button key={item.path} className="group flex flex-col items-start p-5 md:p-6 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2" onClick={() => navigate(item.path)}>
              <div className="flex items-center justify-between w-full mb-3 md:mb-4">
                <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm ${item.iconColor}`}>
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{item.label}</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

function Badge({ children, className, variant = "default" }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-primary text-primary-foreground'} ${className}`}>
      {children}
    </span>
  );
}

export default Dashboard;