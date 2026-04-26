import { useState, useEffect } from "react";
import axios from "axios";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCircle, Edit, Users, ShieldAlert } from "lucide-react"; 
import { toast } from "sonner";

const USERS_API = "http://localhost:3000/api/users";

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "scheduler" });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, fullName: "", email: "", password: "", role: "" });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(USERS_API);
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!form.fullName || !form.email || !form.password) {
      return toast.error("Please fill in all required fields");
    }
    try {
      await axios.post(USERS_API, {
        ...form,
        adminUser: user?.name || user?.username || "Admin"
      });
      toast.success("User successfully added");
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "scheduler" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add user");
    }
  };

  const handleEditClick = (u: any) => {
    setEditForm({
      id: u.id,
      fullName: u.fullName || u.name,
      email: u.email,
      password: "", 
      role: u.role
    });
    setEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editForm.fullName || !editForm.email) {
      return toast.error("Name and Email are required");
    }
    try {
      await axios.put(`${USERS_API}/${editForm.id}`, {
        ...editForm,
        adminUser: user?.name || user?.username || "Admin"
      });
      toast.success("User successfully updated");
      setEditOpen(false);
      fetchUsers(); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await axios.delete(`${USERS_API}/${id}`, {
        data: { adminUser: user?.name || user?.username || "Admin" }
      });
      toast.success("User deleted");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    }
  };

  // Helper for styling Minimalist Role Badges
  const getRoleStyle = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin': return 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
      case 'scheduler': return 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'inventory_staff': return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      default: return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <PageLayout title="System Users">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage roles and permissions for system access.</p>
        </div>

        {/* CREATE USER DIALOG */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setForm({ fullName: "", email: "", password: "", role: "scheduler" }); }}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-full font-medium text-xs px-5 !bg-slate-900 !text-white hover:!bg-slate-800 dark:!bg-white dark:!text-slate-900 dark:hover:!bg-slate-200 shadow-sm transition-all w-full sm:w-auto border-none">
              <Plus className="h-4 w-4 mr-1.5" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</Label>
                <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} placeholder="e.g. Juan Dela Cruz" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
                <Input type="email" className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="juan@email.com" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</Label>
                <Input type="text" className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Set a strong password" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</Label>
                <Select value={form.role} onValueChange={(val) => setForm({...form, role: val})}>
                  <SelectTrigger className="h-11 mt-1.5 rounded-lg focus:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="scheduler">Scheduler</SelectItem>
                    <SelectItem value="inventory_staff">Inventory Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full h-11 text-sm font-bold mt-2 rounded-lg !bg-slate-900 !text-white hover:!bg-slate-800 dark:!bg-white dark:!text-slate-900 dark:hover:!bg-slate-200 border-none shadow-sm transition-all" onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* EDIT USER DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit User Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</Label>
              <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
              <Input type="email" className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                New Password <span className="opacity-60 lowercase font-normal">(Optional)</span>
              </Label>
              <Input type="text" className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} placeholder="Leave blank to keep current password" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="h-11 mt-1.5 rounded-lg focus:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="scheduler">Scheduler</SelectItem>
                  <SelectItem value="inventory_staff">Inventory Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-11 text-sm font-bold mt-2 rounded-lg !bg-slate-900 !text-white hover:!bg-slate-800 dark:!bg-white dark:!text-slate-900 dark:hover:!bg-slate-200 border-none shadow-sm transition-all" onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* UNIFIED USER LIST (Responsive for both Mobile & Desktop) */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-transparent border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mt-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4">
            <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No users found</p>
        </div>
      ) : (
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          {users.map((u, index) => (
            <div 
              key={u.id} 
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/30 ${index !== users.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}`}
            >
              
              {/* User Info & Avatar */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 mt-0.5 sm:mt-0">
                  {u.role === 'admin' ? (
                    <ShieldAlert className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                  ) : (
                    <UserCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug truncate">
                    {u.fullName || u.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {u.email}
                  </p>
                </div>
              </div>
              
              {/* Role Badge & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 border-t border-slate-100 dark:border-slate-800 sm:border-none pt-3 sm:pt-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleStyle(u.role)}`}>
                  {u.role.replace('_', ' ')}
                </span>

                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    onClick={() => handleEditClick(u)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="Edit User"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {u.role !== 'admin' ? (
                    <Button 
                      onClick={() => handleDeleteUser(u.id, u.fullName)}
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-300 dark:text-slate-600" title="Protected Account">Prot</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default UserManagement;