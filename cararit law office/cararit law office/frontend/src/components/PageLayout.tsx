import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, CalendarDays, ClipboardList } from "lucide-react";
import { ModeToggle } from "@/components/Modetoggle";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

// FORMAT PARA SA PINAGSAMANG NOTIFICATIONS (Schedules + Tasks)
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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)} ${parts[0]}`;
};

const PageLayout = ({ title, children }: PageLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // KUKUNIN NITO ANG SCHEDULES AT TASKS MULA SA DATABASE (WITH LIVE UPDATE)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Gumamit ng Environment Variable para sa live backend URL, fallback sa localhost kung local
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

        // ==========================================
        // THE FIX: ADDED CREDENTIALS (credentials: "include")
        // ==========================================

        // 1. FETCH SCHEDULES
        const schedRes = await fetch(`${API_URL}/api/schedules`, {
          credentials: "include" // 👈 ITO ANG IMPORTANTE!
        });
        const rawSchedData = schedRes.ok ? await schedRes.json() : [];
        const schedData = Array.isArray(rawSchedData) ? rawSchedData : rawSchedData.data || rawSchedData.schedules || [];

        // 2. FETCH TASKS
        const taskRes = await fetch(`${API_URL}/api/tasks`, {
          credentials: "include" // 👈 ITO ANG IMPORTANTE!
        });
        const rawTaskData = taskRes.ok ? await taskRes.json() : [];
        const taskData = Array.isArray(rawTaskData) ? rawTaskData : rawTaskData.data || rawTaskData.tasks || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 3. I-FILTER ANG UPCOMING SCHEDULES (10 days or less)
        const upcomingSchedules = schedData
          .filter((s: any) => (s?.status || "").toLowerCase() === "upcoming")
          .map((s: any) => {
            const cleanDate = s.date ? s.date.substring(0, 10) : "";
            const sDate = new Date(cleanDate);
            sDate.setHours(0, 0, 0, 0);
            const diffTime = sDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              id: `sched-${s.id}`,
              title: s.title,
              cleanDate: formatDateInWords(cleanDate),
              diffDays,
              hasDeadline: true,
              type: "schedule",
              path: "/schedules"
            };
          })
          .filter((s: any) => s.diffDays >= 0 && s.diffDays <= 10);

        // 4. I-FILTER ANG PENDING TASKS NA NAKA-ASSIGN SA NAKALOGIN NA USER
        const pendingTasks = taskData
          .filter((t: any) => {
            const isCompleted = t?.completed === 1 || t?.completed === true || String(t?.completed) === "1";
            const isArchived = t?.archived === 1 || t?.archived === true || String(t?.archived) === "1";
            const isPending = !isCompleted && !isArchived;

            // 🌟 SMART NAME MATCHING LOGIC
            const assignedValue = String(t?.assignedTo || "").toLowerCase().trim();
            const currentUser: any = user || {};
            const myName = String(currentUser?.name || "").toLowerCase().trim();
            const myFullName = String(currentUser?.fullName || "").toLowerCase().trim();
            const myUsername = String(currentUser?.username || "").toLowerCase().trim();

            const isAssignedToMe = (assignedValue !== "" && assignedValue === myName) ||
                                   (assignedValue !== "" && assignedValue === myFullName) ||
                                   (assignedValue !== "" && assignedValue === myUsername) ||
                                   (myName !== "" && assignedValue.includes(myName)) ||
                                   (myFullName !== "" && assignedValue.includes(myFullName));

            return isPending && isAssignedToMe;
          })
          .map((t: any) => {
            return {
              id: `task-${t?.id || Math.random().toString()}`,
              title: t?.title || "Untitled Task",
              cleanDate: "Pending Assignment",
              diffDays: 0,
              hasDeadline: false,
              type: "task",
              path: "/tasks"
            };
          });

        // 5. PAGSAMAHIN AT I-SORT (Mauuna yung mga palapit na schedules)
        const combinedNotifs = [...upcomingSchedules, ...pendingTasks]
          .sort((a: any, b: any) => {
            const aDays = a.hasDeadline ? a.diffDays : Number.MAX_SAFE_INTEGER;
            const bDays = b.hasDeadline ? b.diffDays : Number.MAX_SAFE_INTEGER;
            return aDays - bDays;
          });

        // 🌟 SMART RED DOT LOGIC
        setNotifs((prevNotifs) => {
          // Magiging Red Dot lang ulit kung may literal na BAGONG task/schedule na pumasok
          if (combinedNotifs.length > prevNotifs.length && combinedNotifs.length > 0) {
            setTimeout(() => setHasUnread(true), 0); // Use setTimeout to prevent React side-effect error
          }
          return combinedNotifs as NotificationItem[];
        });

      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    if (user) {
      // Kunin agad pagka-load ng page
      fetchNotifications();
      // 🌟 LIVE POLLING every 10 seconds (increased from 3s to save local server resources)
      const intervalId = setInterval(fetchNotifications, 10000);
      // Linisin ang interval kapag umalis sa page para hindi bumigat ang system
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Function kapag kinlik ang bell icon
  const handleBellClick = () => {
    setShowNotifs(!showNotifs);
    if (hasUnread) setHasUnread(false); // Mawawala ang red dot pag binuksan
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col relative font-sans">
      {/* HEADER */}
      <header className="bg-primary px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-md relative z-50 gap-4 md:gap-0">
        {/* Left Side: Back Button & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-white/20 hover:bg-white/30 text-white border-none transition-colors shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">{title}</h1>
        </div>

        {/* Right Side: Icons (Notifications & Dark Mode) */}
        <div className="flex items-center justify-center gap-3 w-full md:w-auto">
          {/* Notification System */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-11 md:w-11 rounded-xl relative hover:bg-white/90 transition-colors bg-white text-primary shadow-sm"
              onClick={handleBellClick}
            >
              <Bell className="h-5 w-5" />
              {/* Red Dot Indicator (Pumu-pulse kapag may bago) */}
              {hasUnread && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse"></span>
              )}
            </Button>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                {/* Dropdown Box */}
                <div className="absolute right-0 md:-right-4 top-14 w-[calc(100vw-2rem)] md:w-96 max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-slate-800 animate-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <h3 className="font-bold text-base dark:text-slate-100">Notifications</h3>
                    <Badge variant="secondary" className="text-[10px]">{notifs.length} items</Badge>
                  </div>

                  {/* List of upcoming events & pending tasks */}
                  <div className="max-h-[60vh] overflow-y-auto flex flex-col p-2 space-y-1 custom-scrollbar">
                    {notifs.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                          <Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">All caught up!</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">No pending tasks or upcoming events.</p>
                      </div>
                    ) : (
                      notifs.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                          onClick={() => {
                            setShowNotifs(false);
                            navigate(notif.path);
                          }}
                        >
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.type === 'task' ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                            {notif.type === 'task' ? (
                              <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            ) : (
                              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="flex flex-col text-left w-full">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">{notif.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.cleanDate}</span>
                            <span className="text-[11px] font-bold mt-1.5 inline-block w-fit px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                              {!notif.hasDeadline ? (
                                <span className="text-slate-600 dark:text-slate-400">📌 Action Required</span>
                              ) : notif.diffDays < 0 ? (
                                <span className="text-rose-600 dark:text-rose-400">⚠️ Overdue by {Math.abs(notif.diffDays)} days</span>
                              ) : notif.diffDays === 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 animate-pulse">🚨 Due today!</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-500">⏳ {notif.diffDays} days left</span>
                              )}
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

          {/* Dark Mode Toggle */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center h-10 w-10 md:h-11 md:w-11">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
};

// Internal Badge Component
function Badge({ children, className, variant = "default" }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-primary text-primary-foreground'} ${className}`}>
      {children}
    </span>
  );
}

export default PageLayout;