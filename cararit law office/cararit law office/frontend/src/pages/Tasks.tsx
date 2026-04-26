import { useState, useEffect } from "react";
import axios from "axios";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCircle, AlignLeft, CalendarDays, CheckCircle2, Archive, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  archived: boolean;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
}

interface SystemUser {
  id: number;
  fullName: string;
  role: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Task[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]); 
  
  const [open, setOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"active" | "archived">("active"); 
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "" });

  const TASKS_API = "http://localhost:3000/api/tasks";
  const USERS_API = "http://localhost:3000/api/users"; 

  const fetchTasks = async () => {
    try {
      const response = await axios.get(TASKS_API);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks from the database.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(USERS_API);
      setSystemUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users for assignment.");
    }
  };

  useEffect(() => { 
    fetchTasks(); 
    fetchUsers(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTasksList = items
    .filter(task => !task.archived && !task.completed)
    .filter(task => userFilter === "all" || task.assignedTo === userFilter);

  const completedTasksList = items
    .filter(task => !task.archived && task.completed)
    .filter(task => userFilter === "all" || task.assignedTo === userFilter);

  const archivedTasksList = items
    .filter(task => task.archived)
    .filter(task => userFilter === "all" || task.assignedTo === userFilter);

  const handleCreate = async () => {
    if (!form.title) return toast.error("Please fill in the task title");
    
    try {
      const assignedTo = form.assignedTo || user!.name;
      
      await axios.post(TASKS_API, {
        title: form.title,
        description: form.description,
        assignedTo: assignedTo,
        createdBy: user!.name
      });

      toast.success("Task created and assigned successfully!");
      setOpen(false);
      setForm({ title: "", description: "", assignedTo: "" });
      fetchTasks();
      setViewMode("active"); 
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const markAsComplete = async (task: Task) => {
    if (task.completed) return; 
    
    try {
      setItems(items.map(i => i.id === task.id ? { ...i, completed: true } : i));

      await axios.put(`${TASKS_API}/${task.id}/status`, {
        completed: true,
        user: user!.name 
      });
      toast.success("Task marked as completed!");
    } catch (error) {
      toast.error("Failed to update task status");
      fetchTasks(); 
    }
  };

  const handleArchive = async (task: Task) => {
    try {
      setItems(items.map(i => i.id === task.id ? { ...i, archived: true } : i));
      
      await axios.put(`${TASKS_API}/${task.id}/archive`, {
        user: user!.name,
        role: user!.role
      });
      toast.success("Task moved to archives.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to archive task");
      fetchTasks(); 
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm("Are you sure you want to permanently delete this archived task?")) return;
    try {
      await axios.delete(`${TASKS_API}/${task.id}`, { 
        data: { user: user!.name, role: user!.role } 
      });
      toast.success("Task permanently deleted");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete task");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <PageLayout title="✅ Tasks & Assignments">
      
      {/* FILTER & ADD TASK BAR (One Line Minimalist Header) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        
        {/* Left Side: View & Assignee Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          <Select value={viewMode} onValueChange={(val: "active" | "archived") => setViewMode(val)}>
            <SelectTrigger className="h-10 w-full sm:w-[150px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium shadow-none focus:ring-0 focus:border-slate-400">
              <ListTodo className="w-3.5 h-3.5 mr-2 opacity-70" />
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
              <SelectItem value="active">Active Tasks</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[180px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium shadow-none focus:ring-0 focus:border-slate-400">
              <UserCircle className="w-3.5 h-3.5 mr-2 opacity-70" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800 shadow-lg">
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value={user?.name || "me"}>My Tasks ({user?.name})</SelectItem>
              {systemUsers.map((dbUser) => (
                 dbUser.fullName !== user?.name && (
                   <SelectItem key={dbUser.id} value={dbUser.fullName}>
                     {dbUser.fullName}'s Tasks
                   </SelectItem>
                 )
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* Right Side: Minimal Add Button */}
        {viewMode === "active" && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setForm({ title: "", description: "", assignedTo: "" }); }}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-full font-medium text-xs px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 w-full md:w-auto shadow-sm transition-all">
                <Plus className="h-4 w-4 mr-1.5" /> New Task
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Title</Label>
                  <Input 
                    className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" 
                    placeholder="What needs to be done?" 
                    value={form.title} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details (Optional)</Label>
                  <Textarea 
                    className="mt-1.5 resize-none rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" 
                    rows={3} 
                    placeholder="Add instructions or details here..." 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assign To</Label>
                  <Select value={form.assignedTo} onValueChange={(val) => setForm({ ...form, assignedTo: val })}>
                    <SelectTrigger className="h-11 mt-1.5 rounded-lg focus:ring-1 focus:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <SelectItem value={user?.name || "me"}>{user?.name} (Assign to myself)</SelectItem>
                      {systemUsers.map((dbUser) => (
                        dbUser.fullName !== user?.name && (
                          <SelectItem key={dbUser.id} value={dbUser.fullName}>
                            {dbUser.fullName}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full h-11 text-sm font-bold mt-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 border-none shadow-sm" onClick={handleCreate}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ARCHIVED TASKS VIEW */}
      {viewMode === "archived" ? (
        archivedTasksList.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-transparent border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mt-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4">
              <Archive className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Archive is empty</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Tasks that are moved to archive will be kept here.</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Task</th>
                  <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Assignee</th>
                  <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Date Created</th>
                  {(user?.role === "admin") && <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {archivedTasksList.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors opacity-70 grayscale">
                    <td className="py-3 px-2 align-middle">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                    </td>
                    <td className="py-3 px-2 align-middle text-slate-600 dark:text-slate-400">{task.assignedTo}</td>
                    <td className="py-3 px-2 align-middle text-slate-500 dark:text-slate-400 font-mono text-xs">{formatDate(task.createdAt)}</td>
                    {(user?.role === "admin") && (
                      <td className="py-3 px-2 align-middle text-right">
                        <Button onClick={() => handleDelete(task)} variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full" title="Delete Permanently">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ACTIVE TASKS VIEW */
        <>
          {activeTasksList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-transparent border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mb-8">
              <ListTodo className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No active tasks found. Enjoy your day!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-12">
              {activeTasksList.map((task) => (
                <div key={task.id} className="group relative overflow-hidden bg-transparent border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500/80 dark:bg-blue-500/60" />
                  
                  <div className="flex-1 min-w-0 w-full pl-2">
                    <div className="flex items-start gap-3">
                      <div onClick={() => markAsComplete(task)} className="mt-1 shrink-0 w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors" title="Mark as done" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium leading-tight text-slate-800 dark:text-slate-100">{task.title}</h3>
                        
                        {task.description && (
                          <div className="text-sm mt-1 flex items-start gap-2 text-slate-500 dark:text-slate-400 opacity-80">
                            <span className="leading-relaxed whitespace-pre-wrap">{task.description}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-2.5 font-medium opacity-70">
                          <span className="flex items-center gap-1.5"><UserCircle className="h-3.5 w-3.5" /> {task.assignedTo}</span>
                          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMPLETED TASKS HISTORY (TABLE) */}
          {completedTasksList.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 ml-1">Completed History</h3>
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Task</th>
                      <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Assignee</th>
                      <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase">Date Created</th>
                      {(user?.role === "admin") && <th className="py-3 px-2 font-medium tracking-wide text-xs uppercase text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {completedTasksList.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors opacity-70">
                        <td className="py-3 px-2 align-middle">
                          <p className="font-medium text-slate-800 dark:text-slate-200 line-through decoration-slate-400">{task.title}</p>
                        </td>
                        <td className="py-3 px-2 align-middle text-slate-600 dark:text-slate-400">{task.assignedTo}</td>
                        <td className="py-3 px-2 align-middle text-slate-500 dark:text-slate-400 font-mono text-xs">{formatDate(task.createdAt)}</td>
                        {(user?.role === "admin") && (
                          <td className="py-3 px-2 align-middle text-right">
                            <Button onClick={() => handleArchive(task)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" title="Move to Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View for Completed */}
              <div className="md:hidden flex flex-col gap-2">
                {completedTasksList.map((task) => (
                  <div key={task.id} className="bg-transparent border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex justify-between items-center opacity-70">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-through truncate">{task.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{task.assignedTo} • {formatDate(task.createdAt)}</p>
                    </div>
                    {(user?.role === "admin") && (
                      <Button onClick={() => handleArchive(task)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 shrink-0" title="Move to Archive">
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Tasks;