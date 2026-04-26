import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Archive, Trash2, Check, X, Stethoscope, Mail, Image as ImageIcon, Filter, ExternalLink, Paperclip } from "lucide-react";
import { toast } from "sonner";

const lagunaData: Record<string, string[]> = {
  "Biñan City": ["San Antonio", "San Vicente", "Tubigan", "Platero", "Sto. Tomas"],
  "Santa Rosa City": ["Balibago", "Dita", "Macabling", "Tagapo", "Sinalhan"],
  "San Pedro City": ["Cuyab", "Estrella", "Landayan", "Nueva", "San Antonio"],
  "Cabuyao City": ["Banay-banay", "Diezmo", "Gulod", "Mamatid", "Pulo"],
  "Calamba City": ["Canlubang", "Mayapa", "Parian", "Real", "Turbina"],
  "Santa Cruz": ["Pagsawitan", "Poblacion", "Gatid", "Santisima Cruz"],
};

const addLog = (action: string, userName: string) => {
  const logs = JSON.parse(localStorage.getItem("brgy_logs") || "[]");
  logs.unshift({ id: Date.now().toString(), action, user: userName, timestamp: new Date().toISOString() });
  localStorage.setItem("brgy_logs", JSON.stringify(logs.slice(0, 500)));
};

interface SolicitationRequest {
  id: string; userId: string; event: string; date: string; request: string;
  venue: string; note: string; remarks: string; filledOutBy: string;
  requisitorDistrict: string; requisitorBarangay: string; requisitorName: string;
  contactNo: string; status: "pending" | "approved" | "denied" | "archived";
  createdAt: string; documentImageUrl?: string; personImageUrl?: string;
}

interface MedicalRequest {
  id: string; userId: string; patientName: string; medicalIssue: string;
  requestType: string; date: string; contactNo: string; remarks: string; note: string;
  status: "pending" | "approved" | "denied" | "archived"; createdAt: string;
  documentImageUrl?: string; personImageUrl?: string;
}

const API_URL = "http://localhost:3000/api/solicitations";
const MED_API_URL = "http://localhost:3000/api/solicitations/medical-requests";

const initialSolForm = {
  event: "", date: "", request: "", venue: "", note: "", remarks: "",
  filledOutBy: "", requisitorDistrict: "", requisitorBarangay: "",
  requisitorName: "", contactNo: "",
};

const initialMedForm = {
  patientName: "", medicalIssue: "", requestType: "", date: "",
  contactNo: "", remarks: "", note: ""
};

// 🌟 MINIMALIST STATUS DOT COMPONENT
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    denied: "bg-rose-500",
    archived: "bg-slate-400"
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm capitalize">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[status] || "bg-slate-500"}`}></span>
      {status}
    </span>
  );
};

const Solicitation = () => {
  const auth = useAuth();
  const user = auth?.user || null;
  
  const [activeTab, setActiveTab] = useState("solicitations");
  const [viewFilter, setViewFilter] = useState("pending"); 
  
  const [items, setItems] = useState<SolicitationRequest[]>([]);
  const [solOpen, setSolOpen] = useState(false);
  const [solForm, setSolForm] = useState(initialSolForm);
  const [solFiles, setSolFiles] = useState<{ documentImage: File | null; personImage: File | null }>({ documentImage: null, personImage: null });

  const [medItems, setMedItems] = useState<MedicalRequest[]>([]);
  const [medOpen, setMedOpen] = useState(false);
  const [medForm, setMedForm] = useState(initialMedForm);
  const [medFiles, setMedFiles] = useState<{ documentImage: File | null; personImage: File | null }>({ documentImage: null, personImage: null });

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [itemToApprove, setItemToApprove] = useState<any | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approveType, setApproveType] = useState<"solicitation" | "medical" | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const [viewDetail, setViewDetail] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: "", content: "" });
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; title: string; url: string }>({ isOpen: false, title: "", url: "" });

  const fetchData = async () => {
    if (!user) return;
    try {
      const solRes = await fetch(`${API_URL}?userId=${user.id}&role=${user.role}`);
      if (solRes.ok) {
         const solData = await solRes.json();
         setItems(solData.map((item: any) => ({ ...item, date: item.date ? item.date.substring(0, 10) : item.date })));
      }
      const medRes = await fetch(`${MED_API_URL}?userId=${user.id}&role=${user.role}`);
      if (medRes.ok) {
         const medData = await medRes.json();
         setMedItems(medData.map((item: any) => ({ ...item, date: item.date ? item.date.substring(0, 10) : item.date })));
      }
    } catch (error) { console.error("Failed to fetch data:", error); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateSol = async () => {
    const { event, date, request, venue, requisitorDistrict, requisitorBarangay, requisitorName, contactNo } = solForm;
    if (!event || !date || !request || !venue || !requisitorDistrict || !requisitorBarangay || !requisitorName || !contactNo) return toast.error("Please fill out all required fields.");

    const formData = new FormData();
    Object.entries(solForm).forEach(([key, value]) => formData.append(key, value));
    formData.append("userId", user!.id);
    if (solFiles.documentImage) formData.append("documentImage", solFiles.documentImage);
    if (solFiles.personImage) formData.append("personImage", solFiles.personImage);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Solicitation request submitted!");
        addLog(`Created solicitation: ${solForm.event}`, user!.name);
        fetchData(); setSolOpen(false); setSolForm(initialSolForm); setSolFiles({ documentImage: null, personImage: null }); setViewFilter("pending"); 
      } else {
        const errorData = await res.json(); toast.error(`Error: ${errorData.error}`);
      }
    } catch (err) { toast.error("Server error."); }
  };

  const handleCreateMed = async () => {
    const { patientName, requestType, date } = medForm;
    if (!patientName || !requestType || !date) return toast.error("Patient Name, Request Type, and Date are required.");

    const formData = new FormData();
    Object.entries(medForm).forEach(([key, value]) => formData.append(key, value));
    formData.append("userId", user!.id);
    if (medFiles.documentImage) formData.append("documentImage", medFiles.documentImage);
    if (medFiles.personImage) formData.append("personImage", medFiles.personImage);

    try {
      const res = await fetch(MED_API_URL, { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Medical request submitted!");
        addLog(`Created medical request for: ${medForm.patientName}`, user!.name);
        fetchData(); setMedOpen(false); setMedForm(initialMedForm); setMedFiles({ documentImage: null, personImage: null }); setViewFilter("pending"); 
      } else {
        const errorData = await res.json(); toast.error(`Error: ${errorData.error || "Failed to submit"}`);
      }
    } catch (err) { toast.error("Server error."); }
  };

  const handleApproveConfirm = async () => {
    if (!itemToApprove || !approveType) return;
    setIsApproving(true);

    const url = approveType === "solicitation" ? `${API_URL}/${itemToApprove.id}/status` : `${MED_API_URL}/${itemToApprove.id}/status`;

    try {
      const res = await fetch(url, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", note: approvalNote, user: user?.name }),
      });
      if (res.ok) {
        toast.success(`${approveType === 'medical' ? 'Medical' : 'Solicitation'} Request approved!`);
        addLog(`Approved ${approveType}: ${itemToApprove.event || itemToApprove.patientName}`, user!.name);
        fetchData(); setApproveModalOpen(false); setItemToApprove(null); setApprovalNote("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Error: ${errorData.error || errorData.message || "Failed to approve"}`);
      }
    } catch (err) { 
        toast.error("Network or Server error. Check your console."); 
    } finally {
        setIsApproving(false);
    }
  };

  const handleStatusChange = async (item: any, status: "denied" | "archived", type: "solicitation" | "medical") => {
    const url = type === "solicitation" ? `${API_URL}/${item.id}/status` : `${MED_API_URL}/${item.id}/status`;
    try {
      const res = await fetch(url, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, user: user?.name }),
      });
      if (res.ok) {
        toast.success(`Request ${status === 'archived' ? 'archived' : 'updated'}`);
        addLog(`${status === 'archived' ? 'Archived' : 'Updated'} ${type}: ${item.event || item.patientName}`, user!.name);
        fetchData();
      }
    } catch (err) { toast.error("Error updating status."); }
  };

  const handleDelete = async (item: any, type: "solicitation" | "medical") => {
    const url = type === "solicitation" ? `${API_URL}/${item.id}` : `${MED_API_URL}/${item.id}`;
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    try {
      const res = await fetch(url, { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: user?.name }) 
      });
      if (res.ok) {
        toast.success("Request permanently deleted");
        addLog(`Deleted ${type}: ${item.event || item.patientName}`, user!.name);
        fetchData();
      }
    } catch (err) { toast.error("Error deleting request."); }
  };

  // 🌟 MINIMALIST TABLE RENDERER
  const renderTable = (data: any[], type: "solicitation" | "medical") => {
    const isArchived = viewFilter === "archived";
    const filteredData = data.filter(item => item.status === viewFilter);

    if (filteredData.length === 0) return <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-transparent">No records to display.</p>;

    return (
      <>
        {/* DESKTOP MINIMAL TABLE */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase">{type === "solicitation" ? "Event / Request" : "Patient / Issue"}</th>
                <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase">Details</th>
                <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase">Attachments</th>
                <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase">Date</th>
                <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase">Status</th>
                {(user?.role === "admin") && <th className="py-4 px-2 font-medium tracking-wide text-xs uppercase text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredData.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors ${isArchived ? "opacity-60 grayscale" : ""}`}>
                  <td className="py-4 px-2 align-top">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{type === "solicitation" ? item.event : item.patientName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{type === "solicitation" ? item.request : item.requestType}</p>
                  </td>
                  <td className="py-4 px-2 align-top">
                    <p className="text-slate-700 dark:text-slate-300">
                      {type === "solicitation" ? item.requisitorName : (item.medicalIssue || "—")}
                    </p>
                    {type === "solicitation" && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.requisitorBarangay}, {item.requisitorDistrict}</p>}
                  </td>
                  <td className="py-4 px-2 align-top">
                    <div className="flex gap-2">
                      {item.documentImageUrl && (
                        <button onClick={() => setImageViewer({ isOpen: true, title: "Document File", url: item.documentImageUrl })} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors" title="View Document">
                          <Paperclip className="h-4 w-4" />
                        </button>
                      )}
                      {item.personImageUrl && (
                        <button onClick={() => setImageViewer({ isOpen: true, title: "Person Picture", url: item.personImageUrl })} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors" title="View Picture">
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      )}
                      {!item.documentImageUrl && !item.personImageUrl && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="py-4 px-2 align-top text-slate-500 dark:text-slate-400 font-mono text-xs">{item.date}</td>
                  <td className="py-4 px-2 align-top">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={item.status} />
                      {item.note && <span className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer underline underline-offset-2 mt-1" onClick={() => setViewDetail({ isOpen: true, title: "Admin Note", content: item.note })}>Note</span>}
                    </div>
                  </td>
                  {(user?.role === "admin") && (
                    <td className="py-4 px-2 align-top text-right">
                      <div className="flex justify-end gap-1">
                        {item.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full" onClick={() => { setItemToApprove(item); setApproveType(type); setApprovalNote(item.note || ""); setApproveModalOpen(true); }} title="Approve"><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full" onClick={() => handleStatusChange(item, "denied", type)} title="Deny"><X className="h-4 w-4" /></Button>
                          </>
                        )}
                        {item.status !== "archived" && (
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full" onClick={() => handleStatusChange(item, "archived", type)} title="Archive"><Archive className="h-4 w-4" /></Button>
                        )}
                        {item.status === "archived" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full" onClick={() => handleDelete(item, type)} title="Delete Permanently"><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE MINIMAL LIST */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredData.map((item) => (
            <div key={item.id} className={`bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 ${isArchived ? "opacity-60 grayscale" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">{type === "solicitation" ? item.event : item.patientName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{type === "solicitation" ? item.request : item.requestType}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {type === "solicitation" ? (
                  <p>{item.requisitorName} <span className="text-xs text-slate-400 ml-1">({item.requisitorBarangay})</span></p>
                ) : ( <p>{item.medicalIssue || "—"}</p> )}
              </div>

              <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex gap-3 text-slate-400">
                  {item.documentImageUrl && <span onClick={() => setImageViewer({ isOpen: true, title: "Document", url: item.documentImageUrl })} className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"><Paperclip className="h-3 w-3" /> Doc</span>}
                  {item.personImageUrl && <span onClick={() => setImageViewer({ isOpen: true, title: "Picture", url: item.personImageUrl })} className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"><ImageIcon className="h-3 w-3" /> Pic</span>}
                </div>
                <span className="font-mono text-slate-400">{item.date}</span>
              </div>

              {(user?.role === "admin") && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {item.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-transparent dark:hover:bg-emerald-950/50 rounded-lg px-2 text-xs" onClick={() => { setItemToApprove(item); setApproveType(type); setApprovalNote(item.note || ""); setApproveModalOpen(true); }}>Approve</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-rose-600 bg-rose-50/50 hover:bg-rose-100 dark:bg-transparent dark:hover:bg-rose-950/50 rounded-lg px-2 text-xs" onClick={() => handleStatusChange(item, "denied", type)}>Deny</Button>
                    </>
                  )}
                  {item.status !== "archived" && <Button variant="ghost" size="sm" className="h-8 text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-lg px-2 text-xs" onClick={() => handleStatusChange(item, "archived", type)}>Archive</Button>}
                  {item.status === "archived" && <Button variant="ghost" size="sm" className="h-8 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-transparent dark:hover:bg-rose-950/50 rounded-lg px-2 text-xs" onClick={() => handleDelete(item, type)}>Delete</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <PageLayout title="📄 Requests Management">
      
      {/* MINIMAL TAB HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 w-full md:w-auto">
          <button onClick={() => setActiveTab("solicitations")} className={`pb-2 text-sm font-medium transition-colors ${activeTab === "solicitations" ? "border-b-2 border-blue-500 text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
             Solicitations
          </button>
          <button onClick={() => setActiveTab("medical")} className={`pb-2 text-sm font-medium transition-colors ${activeTab === "medical" ? "border-b-2 border-blue-500 text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
             Medical Requests
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="h-10 w-full md:w-[160px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-xl dark:bg-slate-950 dark:border-slate-800">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "solicitations" ? (
            <Dialog open={solOpen} onOpenChange={setSolOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-full font-medium text-xs px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 w-full md:w-auto"><Plus className="h-4 w-4 mr-1" /> New Solicitation</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl custom-scrollbar">
                <DialogHeader><DialogTitle className="text-xl font-bold dark:text-slate-100">New Solicitation Request</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div><Label className="dark:text-slate-300">Event *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.event} onChange={(e) => setSolForm({ ...solForm, event: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Date *</Label><Input type="date" className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.date} onChange={(e) => setSolForm({ ...solForm, date: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Request *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.request} onChange={(e) => setSolForm({ ...solForm, request: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Venue *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.venue} onChange={(e) => setSolForm({ ...solForm, venue: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Requisitor Name *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.requisitorName} onChange={(e) => setSolForm({ ...solForm, requisitorName: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Contact No *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.contactNo} onChange={(e) => setSolForm({ ...solForm, contactNo: e.target.value })} /></div>
                  
                  <div>
                    <Label className="dark:text-slate-300">Document Image</Label>
                    <div className="flex items-center justify-center w-full mt-1">
                      <label className="flex flex-col items-center justify-center w-full h-20 border border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{solFiles.documentImage ? solFiles.documentImage.name : "Click to upload image"}</p>
                        </div>
                        <Input type="file" accept="image/*" className="hidden" onChange={(e) => setSolFiles({ ...solFiles, documentImage: e.target.files?.[0] || null })} />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="dark:text-slate-300">Person Image</Label>
                    <div className="flex items-center justify-center w-full mt-1">
                      <label className="flex flex-col items-center justify-center w-full h-20 border border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{solFiles.personImage ? solFiles.personImage.name : "Click to upload image"}</p>
                        </div>
                        <Input type="file" accept="image/*" className="hidden" onChange={(e) => setSolFiles({ ...solFiles, personImage: e.target.files?.[0] || null })} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="dark:text-slate-300">City / Municipality *</Label>
                    <Select value={solForm.requisitorDistrict} onValueChange={(val) => setSolForm({ ...solForm, requisitorDistrict: val, requisitorBarangay: "" })}>
                      <SelectTrigger className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1"><SelectValue placeholder="Select City" /></SelectTrigger>
                      <SelectContent className="dark:bg-slate-950 dark:border-slate-800">{Object.keys(lagunaData).map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-slate-300">Barangay *</Label>
                    <Select value={solForm.requisitorBarangay} onValueChange={(val) => setSolForm({ ...solForm, requisitorBarangay: val })} disabled={!solForm.requisitorDistrict}>
                      <SelectTrigger className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1"><SelectValue placeholder={solForm.requisitorDistrict ? "Select Barangay" : "City First"} /></SelectTrigger>
                      <SelectContent className="dark:bg-slate-950 dark:border-slate-800">{solForm.requisitorDistrict && lagunaData[solForm.requisitorDistrict]?.map((brgy) => (<SelectItem key={brgy} value={brgy}>{brgy}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2"><Label className="dark:text-slate-300">Remarks</Label><Textarea className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={solForm.remarks} onChange={(e) => setSolForm({ ...solForm, remarks: e.target.value })} /></div>
                  <Button className="w-full md:col-span-2 h-12 mt-4 font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 border-none" onClick={handleCreateSol}>SUBMIT REQUEST</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={medOpen} onOpenChange={setMedOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-10 rounded-full font-medium text-xs px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"><Plus className="h-4 w-4 mr-1" /> New Medical</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl custom-scrollbar">
                <DialogHeader><DialogTitle className="text-xl font-bold dark:text-slate-100">New Medical Request</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div><Label className="dark:text-slate-300">Patient Name *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.patientName} onChange={(e) => setMedForm({ ...medForm, patientName: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Date of Request *</Label><Input type="date" className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.date} onChange={(e) => setMedForm({ ...medForm, date: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Request Type *</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.requestType} onChange={(e) => setMedForm({ ...medForm, requestType: e.target.value })} /></div>
                  <div><Label className="dark:text-slate-300">Medical Issue</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.medicalIssue} onChange={(e) => setMedForm({ ...medForm, medicalIssue: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label className="dark:text-slate-300">Contact No</Label><Input className="h-11 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.contactNo} onChange={(e) => setMedForm({ ...medForm, contactNo: e.target.value })} /></div>
                  
                  <div>
                    <Label className="dark:text-slate-300">Document Image (Prescription/Lab)</Label>
                    <div className="flex items-center justify-center w-full mt-1">
                      <label className="flex flex-col items-center justify-center w-full h-20 border border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{medFiles.documentImage ? medFiles.documentImage.name : "Click to upload image"}</p>
                        </div>
                        <Input type="file" accept="image/*" className="hidden" onChange={(e) => setMedFiles({ ...medFiles, documentImage: e.target.files?.[0] || null })} />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="dark:text-slate-300">Patient Image</Label>
                    <div className="flex items-center justify-center w-full mt-1">
                      <label className="flex flex-col items-center justify-center w-full h-20 border border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{medFiles.personImage ? medFiles.personImage.name : "Click to upload image"}</p>
                        </div>
                        <Input type="file" accept="image/*" className="hidden" onChange={(e) => setMedFiles({ ...medFiles, personImage: e.target.files?.[0] || null })} />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2"><Label className="dark:text-slate-300">Remarks (Optional)</Label><Textarea className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-lg mt-1" value={medForm.remarks} onChange={(e) => setMedForm({ ...medForm, remarks: e.target.value })} /></div>
                  <Button className="w-full md:col-span-2 h-12 mt-4 font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 border-none" onClick={handleCreateMed}>SUBMIT REQUEST</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeTab === "solicitations" && renderTable(items, "solicitation")}
      {activeTab === "medical" && renderTable(medItems, "medical")}

      {/* APPROVAL MODAL */}
      <Dialog open={approveModalOpen} onOpenChange={(isOpen) => { setApproveModalOpen(isOpen); if (!isOpen) setItemToApprove(null); }}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle className="text-lg font-bold dark:text-slate-100">Approve Request</DialogTitle></DialogHeader>
          {itemToApprove && (
            <div className="space-y-5 py-2">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200">{itemToApprove.event || itemToApprove.patientName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{itemToApprove.request || itemToApprove.requestType}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Admin Note (Optional)</Label>
                <Textarea className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-xl resize-none" placeholder="Add a note..." value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
              </div>
              <DialogFooter className="mt-2">
                <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-none" onClick={handleApproveConfirm} disabled={isApproving}>
                    {isApproving ? "Approving..." : "Confirm Approval"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* NOTE VIEWER MODAL */}
      <Dialog open={viewDetail.isOpen} onOpenChange={(isOpen) => setViewDetail({ ...viewDetail, isOpen })}>
        <DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">{viewDetail.title}</DialogTitle></DialogHeader>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {viewDetail.content}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setViewDetail({ ...viewDetail, isOpen: false })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMAGE VIEWER MODAL */}
      <Dialog open={imageViewer.isOpen} onOpenChange={(isOpen) => setImageViewer({ ...imageViewer, isOpen })}>
        <DialogContent className="max-w-4xl w-[95vw] p-2 sm:p-4 rounded-2xl bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-white text-base font-medium px-2">{imageViewer.title}</DialogTitle></DialogHeader>
          <div className="flex justify-center items-center overflow-hidden rounded-xl bg-black/50 min-h-[300px] my-2">
            {imageViewer.url ? <img src={imageViewer.url} alt={imageViewer.title} className="max-w-full max-h-[65vh] object-contain" /> : <p className="text-slate-500 text-sm">Image failed to load</p>}
          </div>
          <DialogFooter className="flex-row justify-between items-center mt-2 px-2 pb-1">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs" onClick={() => window.open(imageViewer.url, '_blank')}><ExternalLink className="w-3.5 h-3.5 mr-2" /> Open Original</Button>
            <Button variant="secondary" size="sm" className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-none rounded-lg text-xs" onClick={() => setImageViewer({ ...imageViewer, isOpen: false })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Solicitation;