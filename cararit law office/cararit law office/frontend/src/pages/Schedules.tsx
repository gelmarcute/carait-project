"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { addLog } from "@/lib/logService";
import { lagunaData } from "@/lib/locations"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Archive, Pencil, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, CheckCircle2, AlertTriangle, Info, Calendar as CalendarIcon, CalendarClock, Filter } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  userId: string;
  title: string;
  eventType?: string; 
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "upcoming" | "completed" | "archived";
  createdBy: string;
  updatedAt: string;
}

const API_URL = "http://localhost:3000/api/schedules";

const formatDateInWords = (dateString: string) => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)} ${parts[0]}`;
};

const formatTimeWithAMPM = (timeStr: string) => {
  if (!timeStr) return "";
  const [hourString, minute] = timeStr.split(":");
  if (!hourString || !minute) return timeStr;
  let hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; 
  return `${hour}:${minute} ${ampm}`;
};

const getDaysUntil = (dateString: string) => {
  if (!dateString) return null;
  const targetDate = new Date(`${dateString}T00:00:00`); 
  targetDate.setHours(0, 0, 0, 0); 
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
};

const getEventColorStyle = (type: string | undefined, title: string, isApproaching: boolean, status: string) => {
  if (status === "archived" || status === "completed") {
    return "bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700/50 opacity-80 grayscale hover:grayscale-0 transition-all"; 
  }

  const searchStr = (type || title || "").toLowerCase();
  let baseStyle = "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"; 
  
  if (searchStr.includes("caravan")) {
    baseStyle = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30"; 
  } else if (searchStr.includes("meeting")) {
    baseStyle = "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border-blue-200 dark:border-blue-500/30"; 
  } else if (searchStr.includes("session") || searchStr.includes("hearing")) {
    baseStyle = "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border-violet-200 dark:border-violet-500/30"; 
  }

  if (isApproaching) {
    return `${baseStyle} border-l-[3px] border-l-amber-400 dark:border-l-amber-500/70 border-y border-r shadow-sm`;
  }
  return `${baseStyle} border-l-[2px] border-y border-r`;
};

const Schedules = () => {
  const { user } = useAuth();
  
  const canEdit = user?.role === "admin" || user?.role === "scheduler";

  const [items, setItems] = useState<Schedule[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [viewItem, setViewItem] = useState<Schedule | null>(null);
  
  // 🌟 Pinalitan ang default na filter
  const [filter, setFilter] = useState<string>("all"); 
  
  const [form, setForm] = useState({ 
    title: "", eventType: "other", date: "", startTime: "", endTime: "", 
    venue: "", district: "", barangay: "" 
  });
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchSchedules = async () => {
    if (!user) return; 
    try {
      const response = await fetch(`${API_URL}?userId=${user.id}&role=${user.role}`);
      if (!response.ok) throw new Error("Failed to connect to backend database.");
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        setItems([]);
        return;
      }

      const now = new Date();
      
      const updatedData = await Promise.all(data.map(async (rawSchedule: any) => {
        let cleanDate = rawSchedule.date || "";
        if (cleanDate.includes("T")) {
            cleanDate = cleanDate.split("T")[0]; 
        } else if (cleanDate.length > 10) {
            cleanDate = cleanDate.substring(0, 10);
        }

        const schedule: Schedule = { ...rawSchedule, date: cleanDate };

        if (schedule.status === "upcoming") {
          const timeToCompare = schedule.endTime || schedule.startTime || "23:59";
          const scheduleDateTime = new Date(`${schedule.date}T${timeToCompare}:00`);
          
          if (scheduleDateTime < now) {
            try {
                await fetch(`${API_URL}/${schedule.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    ...schedule, 
                    status: "archived",
                    requesterId: user!.id,
                    requesterRole: user!.role,
                    userName: user!.name 
                  })
                });
                return { ...schedule, status: "archived" as const };
            } catch (archiveError) {
                console.error("Failed to auto-archive, continuing...", archiveError);
            }
          } 
        }
        return schedule;
      }));
      setItems(updatedData);
    } catch (error) {
      toast.error("Failed to fetch schedules.");
      setItems([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sorted = items
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.startTime || "00:00"}:00`).getTime();
      const timeB = new Date(`${b.date}T${b.startTime || "00:00"}:00`).getTime();
      return timeA - timeB;
    });

  const handleSave = async () => {
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      return toast.error("Please fill in all required fields.");
    }

    const locationParts = [form.venue, form.barangay, form.district].filter(Boolean);
    const finalLocation = locationParts.join(", ");

    if (!finalLocation) {
        return toast.error("Please provide a location.");
    }

    const now = new Date();
    const timeToCompare = form.endTime || form.startTime || "23:59";
    const scheduleDateTime = new Date(`${form.date}T${timeToCompare}:00`);
    const newStatus = scheduleDateTime < now ? "archived" : "upcoming";
    
    const payload = {
        title: form.title,
        eventType: form.eventType,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: finalLocation, 
    };

    try {
      if (editing) {
        const response = await fetch(`${API_URL}/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...payload, 
            status: editing.status === "completed" ? "completed" : newStatus,
            requesterId: user?.id || null,
            requesterRole: user?.role || 'User',
            userName: user?.name || user?.role || 'System'
          })
        });

        if (!response.ok) return toast.error(`Update Error. Check console.`);
        toast.success("Schedule updated successfully.");
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...payload, 
            status: newStatus, 
            createdBy: user?.name || user?.role || "System", 
            userId: user?.id || null 
          })
        });
        
        if (!response.ok) return toast.error("Database Error: Unable to reach backend.");
        toast.success("Schedule created successfully.");
      }
      
      fetchSchedules();
      setOpen(false);
      setEditing(null);
      setFilter("all"); 
    } catch (error) {
      toast.error("Network Error.");
    }
  };

  const handleArchive = async (s: Schedule) => {
    const response = await fetch(`${API_URL}/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...s, 
        status: "archived",
        requesterId: user!.id,
        requesterRole: user!.role,
        userName: user!.name
      })
    });
    if (response.ok) {
      fetchSchedules();
      toast.success("Schedule archived.");
    } else {
      toast.error("Failed to archive schedule.");
    }
  };

  const handleDelete = async (s: Schedule) => {
    if (!window.confirm("Are you sure you want to permanently delete this schedule?")) return;
    const response = await fetch(`${API_URL}/${s.id}?requesterId=${user!.id}&requesterRole=${user!.role}&userName=${user!.name}`, { 
      method: 'DELETE' 
    });
    if (response.ok) {
      fetchSchedules();
      toast.success("Schedule permanently deleted.");
    } else {
      toast.error("Failed to delete schedule.");
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  // Minimalist Status Badge
  const getStatusStyle = (status: string) => {
    if (status === "upcoming") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20";
    if (status === "completed") return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20";
    return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  };

  // 🌟 TABLE RENDERER PARA SA COMPLETED / ARCHIVED
  const renderTable = () => {
    if (sorted.length === 0) return null;
    return (
      <div className="hidden md:block overflow-x-auto w-full mt-4">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-4 px-4 font-bold tracking-wide text-xs uppercase">Event Title</th>
              <th className="py-4 px-4 font-bold tracking-wide text-xs uppercase">Schedule</th>
              <th className="py-4 px-4 font-bold tracking-wide text-xs uppercase">Location</th>
              <th className="py-4 px-4 font-bold tracking-wide text-xs uppercase">Status</th>
              {canEdit && <th className="py-4 px-4 font-bold tracking-wide text-xs uppercase text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {sorted.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors opacity-80 grayscale hover:grayscale-0">
                <td className="py-4 px-4 align-middle">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {s.title}
                  </p>
                </td>
                <td className="py-4 px-4 align-middle">
                  <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                    {formatDateInWords(s.date)}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-[10px] mt-0.5">
                    {formatTimeWithAMPM(s.startTime)} - {formatTimeWithAMPM(s.endTime)}
                  </p>
                </td>
                <td className="py-4 px-4 align-middle">
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    {s.location}
                  </p>
                </td>
                <td className="py-4 px-4 align-middle">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(s.status)}`}>
                    {s.status}
                  </span>
                </td>
                {canEdit && (
                  <td className="py-4 px-4 align-middle text-right">
                    <div className="flex justify-end gap-1">
                      {s.status !== "archived" && (
                        <Button 
                          onClick={() => handleArchive(s)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                          title="Move to Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {s.status === "archived" && (
                        <Button 
                          onClick={() => handleDelete(s)}
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <PageLayout title="📅 Schedules">
      
      {/* MINIMALIST HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        
        {/* Subtle Select Filter */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full md:w-[220px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium shadow-none focus:ring-0 focus:border-slate-400">
            <Filter className="w-3.5 h-3.5 mr-2 opacity-70" />
            <SelectValue placeholder="View Schedules" />
          </SelectTrigger>
          <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800 shadow-lg">
            <SelectItem value="all">All Schedules</SelectItem>
            <SelectItem value="upcoming">Upcoming Schedules</SelectItem>
            <SelectItem value="completed">Completed History</SelectItem>
            <SelectItem value="archived">Archived / Past</SelectItem>
          </SelectContent>
        </Select>
        
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { 
              setOpen(v); 
              if (!v) { 
                  setEditing(null); 
                  setForm({ title: "", eventType: "other", date: "", startTime: "", endTime: "", venue: "", district: "", barangay: "" }); 
              } 
          }}>
            <DialogTrigger asChild>
              {/* SOLID BLACK BUTTON */}
              <Button className="h-10 rounded-full font-medium text-xs px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm w-full md:w-auto transition-all border-none">
                <Plus className="h-4 w-4 mr-1.5" /> Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {editing ? "Edit Schedule" : "New Schedule"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title *</Label>
                  <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Barangay Assembly" />
                </div>
                
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Type</Label>
                  <Select value={form.eventType || undefined} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                    <SelectTrigger className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200">
                      <SelectValue placeholder="Select Event Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <SelectItem value="caravan">Caravan</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="session">Session / Hearing</SelectItem>
                      <SelectItem value="other">Other Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date *</Label>
                    <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="flex flex-row gap-2">
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start *</Label>
                      <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End *</Label>
                      <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <Label className="text-slate-400 dark:text-slate-500 mb-3 block font-bold uppercase tracking-widest text-[10px]">Location Details</Label>
                  <div className="space-y-4">
                      <div>
                          <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Specific Venue</Label>
                          <Input className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g., Covered Court" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City / Municipality</Label>
                              <Select value={form.district || undefined} onValueChange={(val) => setForm({ ...form, district: val, barangay: "" })}>
                              <SelectTrigger className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200"><SelectValue placeholder="Select City" /></SelectTrigger>
                              <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                                  {Object.keys(lagunaData).map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                              </SelectContent>
                              </Select>
                          </div>
                          <div>
                              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Barangay</Label>
                              <Select disabled={!form.district} value={form.barangay || undefined} onValueChange={(val) => setForm({ ...form, barangay: val })}>
                              <SelectTrigger className="h-11 mt-1.5 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-none border-slate-200"><SelectValue placeholder={form.district ? "Select Barangay" : "City First"} /></SelectTrigger>
                              <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
                                  {form.district && lagunaData[form.district]?.map((brgy) => (<SelectItem key={brgy} value={brgy}>{brgy}</SelectItem>))}
                              </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </div>
                </div>
                {/* SOLID BLACK BUTTON */}
                <Button className="w-full h-11 text-sm font-bold mt-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 border-none shadow-sm transition-all" onClick={handleSave}>
                  SAVE SCHEDULE
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={!!viewItem} onOpenChange={(v) => { if (!v) setViewItem(null); }}>
        <DialogContent className="sm:max-w-sm w-[90vw] rounded-2xl p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg border-b border-slate-100 dark:border-slate-800 pb-3 font-bold dark:text-slate-100">Event Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 pt-1">
              <p className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">{viewItem.title}</p>
              
              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" /> 
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">{viewItem.location}</span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                <p className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400 opacity-70" /> 
                  {formatDateInWords(viewItem.date)}
                </p>
                <p className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400 opacity-70" /> 
                  {formatTimeWithAMPM(viewItem.startTime)} - {formatTimeWithAMPM(viewItem.endTime)}
                </p>
              </div>
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(viewItem.status)}`}>
                  {viewItem.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 📱 CALENDAR & LEGEND */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        
        {/* COMPACT LEGEND */}
        <Card className="shadow-sm w-full md:w-56 shrink-0 h-fit border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl overflow-hidden">
          <CardHeader className="py-3 px-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Info className="h-3.5 w-3.5" /> Legend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-wrap md:flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Caravan</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Meeting</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-violet-500"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Session/Hearing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Other</span>
            </div>
            <div className="flex items-center gap-2.5 w-full md:w-auto md:pt-3 md:border-t border-slate-100 dark:border-slate-800/60">
              <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Archived/Past</span>
            </div>
          </CardContent>
        </Card>

        {/* CALENDAR */}
        <Card className="shadow-sm flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
          <CardContent className="p-3 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 ml-1">{monthName}</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="w-full grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-2 text-center text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-white dark:bg-slate-950 min-h-[60px] md:min-h-[90px]" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                // 🌟 IBINALIK: Pinapayagan na ang lahat ng status (kasama archived) na mag-show sa calendar!
                const dayEvents = items.filter(item => item.date === dateStr); 
                
                return (
                  <div 
                    key={dayNum} 
                    className="bg-white dark:bg-slate-950 min-h-[60px] md:min-h-[90px] p-1.5 border-t border-l border-slate-100 dark:border-slate-800/60 flex flex-col hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <span className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 ml-0.5">{dayNum}</span>
                    <div className="flex flex-col gap-1 w-full">
                      {dayEvents.map(event => {
                        const daysUntil = getDaysUntil(event.date);
                        const isApproaching = event.status === "upcoming" && daysUntil !== null && daysUntil >= 0 && daysUntil <= 10;
                        const eventStyle = getEventColorStyle(event.eventType, event.title, isApproaching, event.status);

                        return (
                          <div 
                            key={event.id} 
                            className={`px-1.5 py-1 rounded-md text-[9px] md:text-[10px] cursor-pointer transition-all hover:brightness-95 ${eventStyle}`} 
                            onClick={(e) => { e.stopPropagation(); setViewItem(event); }}
                          >
                            <div className="truncate font-medium tracking-tight">
                              <span className="hidden md:inline opacity-70 mr-1">{formatTimeWithAMPM(event.startTime)}</span>
                              {event.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📱 SCHEDULE LIST & TABLE VIEW */}
      <div className="space-y-4 mt-8">
        
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-transparent border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
              <CalendarClock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No schedules found.</p>
          </div>
        ) : (
          <>
            {/* If Filter is ALL or UPCOMING -> SHOW LIST CARDS */}
            {(filter === "all" || filter === "upcoming") && (
              <div className="flex flex-col gap-3">
                {sorted.map((s) => {
                  const daysUntil = getDaysUntil(s.date);
                  const isApproaching = s.status === "upcoming" && daysUntil !== null && daysUntil >= 0 && daysUntil <= 10;
                  const isArchived = s.status === "archived";

                  return (
                    <div 
                      key={s.id} 
                      className={`group relative overflow-hidden bg-transparent border rounded-xl p-4 md:p-5 flex flex-col gap-3 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${
                        isArchived ? "opacity-60 grayscale border-slate-200 dark:border-slate-800/50" : (isApproaching ? 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400' : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700')
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 leading-tight truncate flex items-center gap-2">
                            {s.title}
                            {s.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                            {isApproaching && (
                              <span title={`Approaching! ${daysUntil === 0 ? "Today" : `${daysUntil}d`}`}>
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </h3>
                          <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1.5 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 opacity-70" /> {formatDateInWords(s.date)} <span className="hidden md:inline text-slate-300 dark:text-slate-600 px-0.5">•</span> {formatTimeWithAMPM(s.startTime)} - {formatTimeWithAMPM(s.endTime)}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 opacity-70 shrink-0" /> <span className="truncate">{s.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs mt-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>

                        {canEdit && (
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                              onClick={() => { 
                                setEditing(s); 
                                setForm({ ...s, eventType: s.eventType || "other", venue: s.location, district: "", barangay: "" }); 
                                setOpen(true); 
                              }}
                              title="Edit Schedule"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            
                            {s.status !== "archived" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                                onClick={() => handleArchive(s)} 
                                title="Archive"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            
                            {s.status === "archived" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors" 
                                onClick={() => handleDelete(s)} 
                                title="Delete Permanently"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* If Filter is COMPLETED or ARCHIVED -> SHOW MINIMAL TABLE */}
            {(filter === "completed" || filter === "archived") && renderTable()}
            
            {/* Mobile View fallback for the table */}
            {(filter === "completed" || filter === "archived") && (
              <div className="md:hidden flex flex-col gap-2">
                {sorted.map((s) => (
                  <div key={s.id} className="bg-transparent border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex justify-between items-center opacity-70 grayscale">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{s.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateInWords(s.date)}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        {s.status !== "archived" && (
                          <Button onClick={() => handleArchive(s)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 shrink-0">
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        {s.status === "archived" && (
                          <Button onClick={() => handleDelete(s)} variant="ghost" size="icon" className="h-8 w-8 text-rose-400 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Schedules;