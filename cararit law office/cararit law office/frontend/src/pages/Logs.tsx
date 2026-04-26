import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Search, History, ListTodo, CalendarDays, Mail, Package, Users, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LogEntry {
  id: number;
  action: string;
  user: string;
  timestamp: string;
}

const getLogCategory = (action: string) => {
  const text = action.toLowerCase();
  if (text.includes("task")) return "tasks";
  if (text.includes("schedule")) return "schedules";
  if (text.includes("solicitation") || text.includes("medical") || text.includes("request")) return "solicitations";
  if (text.includes("user")) return "users";
  if (text.includes("inventory") || text.includes("item")) return "inventory";
  return "other";
};

// Helper for assigning icons based on category
const CategoryIcon = ({ category }: { category: string }) => {
  const iconClass = "h-4 w-4 shrink-0";
  switch (category) {
    case "tasks": return <ListTodo className={`${iconClass} text-blue-500`} />;
    case "schedules": return <CalendarDays className={`${iconClass} text-violet-500`} />;
    case "solicitations": return <Mail className={`${iconClass} text-amber-500`} />;
    case "inventory": return <Package className={`${iconClass} text-emerald-500`} />;
    case "users": return <Users className={`${iconClass} text-rose-500`} />;
    default: return <Activity className={`${iconClass} text-slate-400`} />;
  }
};

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/logs");
        if (response.ok) {
          const data = await response.json();
          setLogs(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch logs");
        }
      } catch (error) {
        console.error("Network error fetching logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const actionText = l.action ? l.action.toLowerCase() : "";
    const userText = l.user ? l.user.toLowerCase() : "";
    
    const matchesSearch = actionText.includes(search.toLowerCase()) || userText.includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || getLogCategory(actionText) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <PageLayout title="Activity Logs">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">System Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review all recent activities and changes made by users.</p>
        </div>

        {/* MINIMALIST FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="h-10 text-sm pl-9 rounded-full bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 shadow-none"
              placeholder="Search logs or users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[180px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium shadow-none focus:ring-0 focus:border-slate-400">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800 shadow-lg">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="schedules">Schedules</SelectItem>
              <SelectItem value="solicitations">Requests</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* STATES */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 dark:border-slate-200 mb-4"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading system logs...</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-transparent border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4">
            <History className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No activity logs found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or category filter.</p>
        </div>
      )}

      {/* LOGS LIST */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          {filtered.map((log, index) => {
            const category = getLogCategory(log.action);
            return (
              <div 
                key={log.id} 
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/30 ${index !== filtered.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  
                  {/* Category Icon */}
                  <div className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 mt-0.5 sm:mt-0">
                    <CategoryIcon category={category} />
                  </div>
                  
                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {log.action}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 sm:mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span>by <span className="text-slate-700 dark:text-slate-300">{log.user}</span></span>
                      {/* Mobile timestamp (hidden on PC) */}
                      <span className="sm:hidden text-slate-300 dark:text-slate-600">•</span>
                      <span className="sm:hidden font-mono text-[10px] opacity-80">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>

                </div>

                {/* PC timestamp (hidden on Mobile) */}
                <div className="hidden sm:block shrink-0 text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {formatDate(log.timestamp)}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}
      
    </PageLayout>
  );
};

export default Logs;