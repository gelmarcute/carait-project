import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { addLog } from "@/lib/logService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, MinusCircle, History, ArrowDownRight, ArrowUpRight, RefreshCw, XCircle, Filter, PackageOpen } from "lucide-react"; 
import { toast } from "sonner";

interface InventoryItem {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  updatedBy: string;
  updatedAt: string;
}

interface TransactionItem {
  id: number;
  item_name: string;
  transaction_type: string;
  quantity_change: number;
  remarks: string;
  transacted_by: string;
  transaction_date: string;
}

const API_URL = "http://localhost:3000/api/inventory";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString(); 
};

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", quantity: 0, unit: "pcs", category: "" });

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [itemToRelease, setItemToRelease] = useState<InventoryItem | null>(null);
  const [releaseForm, setReleaseForm] = useState({ quantityToRelease: 1, basis: "" });

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const [txnFilter, setTxnFilter] = useState("all");

  const fetchInventory = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory from the database.");
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transaction history.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const sorted = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredTransactions = transactions.filter((txn) => {
    if (txnFilter === "all") return true;
    if (txnFilter === "in") return txn.transaction_type.includes("IN");
    if (txnFilter === "out") return txn.transaction_type.includes("OUT");
    if (txnFilter === "adjust") return txn.transaction_type.includes("ADJUST");
    return true;
  });

  const handleSave = async () => {
    if (!form.name) return toast.error("Please fill in the item name.");
    
    try {
      if (editing) {
        await fetch(`${API_URL}/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, updatedBy: user!.name })
        });
        addLog(`Updated inventory: ${form.name} (qty: ${form.quantity})`, user!.name);
        toast.success("Item updated successfully.");
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, updatedBy: user!.name })
        });
        addLog(`Added inventory: ${form.name} (qty: ${form.quantity})`, user!.name);
        toast.success("Item added successfully.");
      }

      fetchInventory();
      setOpen(false);
      setEditing(null);
      setForm({ name: "", quantity: 0, unit: "pcs", category: "" });
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to save inventory item.");
    }
  };

  const handleRelease = async () => {
    if (!itemToRelease) return;
    if (releaseForm.quantityToRelease <= 0) return toast.error("Quantity must be greater than 0.");
    if (releaseForm.quantityToRelease > itemToRelease.quantity) return toast.error(`Not enough stock. Only ${itemToRelease.quantity} available.`);
    if (!releaseForm.basis.trim()) return toast.error("Please provide a basis or reason for the release.");

    try {
      await fetch(`${API_URL}/${itemToRelease.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_name: itemToRelease.name,
          quantity: releaseForm.quantityToRelease,
          basis: releaseForm.basis,
          released_by: user!.name 
        })
      });

      addLog(`Released ${releaseForm.quantityToRelease} ${itemToRelease.unit} of ${itemToRelease.name}. Basis: ${releaseForm.basis}`, user!.name);
      toast.success("Item released successfully.");
      
      fetchInventory();
      setReleaseOpen(false);
      setItemToRelease(null);
      setReleaseForm({ quantityToRelease: 1, basis: "" });

    } catch (error) {
      console.error(error);
      toast.error("Failed to release item.");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      await fetch(`${API_URL}/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: item.name, deleted_by: user!.name })
      });
      
      fetchInventory();
      addLog(`Deleted inventory item: ${item.name}`, user!.name);
      toast.success("Item deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item.");
    }
  };

  const getTransactionStyle = (type: string) => {
    if (type.includes('IN')) return { icon: <ArrowDownRight className="text-emerald-600 dark:text-emerald-400 h-5 w-5"/>, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' };
    if (type.includes('OUT')) return { icon: <ArrowUpRight className="text-rose-600 dark:text-rose-400 h-5 w-5"/>, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20' };
    if (type.includes('ADJUST')) return { icon: <RefreshCw className="text-blue-600 dark:text-blue-400 h-5 w-5"/>, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20' };
    return { icon: <XCircle className="text-slate-500 dark:text-slate-400 h-5 w-5"/>, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
  };

  return (
    <PageLayout title="📦 Inventory Management">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input 
            className="h-11 md:h-12 text-sm md:text-base pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm rounded-xl focus-visible:ring-blue-500" 
            placeholder="Search items or categories..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="h-11 md:h-12 flex-1 md:flex-none text-sm md:text-base font-semibold gap-2 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
            onClick={() => { fetchTransactions(); setTxnFilter("all"); setHistoryOpen(true); }}
          >
            <History className="h-4 w-4 md:h-5 md:w-5 text-slate-500 dark:text-slate-400" /> 
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">History</span>
          </Button>

          {/* ADD ITEM DIALOG */}
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ name: "", quantity: 0, unit: "pcs", category: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="!bg-blue-600 dark:!bg-blue-500 !text-white hover:!bg-blue-700 dark:hover:!bg-blue-600 border-none h-11 md:h-12 flex-1 md:flex-none text-sm md:text-base font-semibold gap-2 rounded-xl shadow-sm">
                <Plus className="h-4 w-4 md:h-5 md:w-5" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {editing ? "Edit Item Details" : "Add New Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Item Name *</Label>
                  <Input className="h-11 mt-1 rounded-lg focus-visible:ring-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" placeholder="e.g., Bond Paper A4" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity *</Label>
                    <Input type="number" min="0" className="h-11 mt-1 rounded-lg focus-visible:ring-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unit</Label>
                    <Input className="h-11 mt-1 rounded-lg focus-visible:ring-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" placeholder="e.g., pcs, reams, boxes" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category / Remarks</Label>
                  <Input className="h-11 mt-1 rounded-lg focus-visible:ring-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" placeholder="e.g., Office Supplies" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <Button className="w-full h-12 text-base font-bold rounded-xl mt-4 !bg-blue-600 dark:!bg-blue-500 !text-white hover:!bg-blue-700 dark:hover:!bg-blue-600 border-none" onClick={handleSave}>
                  {editing ? "Save Changes" : "Save Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TRANSACTION HISTORY DIALOG */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-4 md:p-6 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">
              <History className="h-6 w-6 text-blue-600 dark:text-blue-500" /> Inventory Ledger
            </DialogTitle>
          </DialogHeader>
          
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Records:
            </span>
            <Select value={txnFilter} onValueChange={setTxnFilter}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 h-10 rounded-lg focus:ring-blue-500">
                <SelectValue placeholder="Filter Transactions" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="in">Stock IN (Added)</SelectItem>
                <SelectItem value="out">Stock OUT (Released)</SelectItem>
                <SelectItem value="adjust">Stock ADJUST (Updated)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 py-4 custom-scrollbar">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <PackageOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No transactions match this filter.</p>
              </div>
            ) : (
              filteredTransactions.map((txn) => {
                const style = getTransactionStyle(txn.transaction_type);
                return (
                  <div key={txn.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-4 bg-white dark:bg-slate-900 hover:shadow-sm transition-all">
                    <div className={`p-2.5 rounded-full shrink-0 ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                        <p className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight truncate">{txn.item_name}</p>
                        <span className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0 w-fit">
                          {formatDate(txn.transaction_date)}
                        </span>
                      </div>
                      <p className={`text-sm font-bold ${style.color}`}>
                        {txn.transaction_type} {txn.quantity_change > 0 ? `(${txn.quantity_change} items)` : ''}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Remarks:</span> {txn.remarks || "No remarks provided."}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                        Transacted by: <span className="font-medium text-slate-600 dark:text-slate-400">{txn.transacted_by}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <Button className="w-full sm:w-auto h-11 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900" variant="outline" onClick={() => setHistoryOpen(false)}>Close Ledger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RELEASE ITEM DIALOG */}
      <Dialog open={releaseOpen} onOpenChange={(v) => { setReleaseOpen(v); if (!v) { setItemToRelease(null); setReleaseForm({ quantityToRelease: 1, basis: "" }); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-500 text-xl font-bold">
              <MinusCircle className="h-6 w-6" /> Release Item
            </DialogTitle>
          </DialogHeader>
          {itemToRelease && (
            <div className="space-y-5 mt-2">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{itemToRelease.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Current Stock:</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md">
                    {itemToRelease.quantity} {itemToRelease.unit}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity to Release *</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max={itemToRelease.quantity}
                  className="h-11 mt-1 rounded-lg text-base focus-visible:ring-rose-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" 
                  value={releaseForm.quantityToRelease} 
                  onChange={(e) => setReleaseForm({ ...releaseForm, quantityToRelease: Number(e.target.value) })} 
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Basis / Reason *</Label>
                <Input 
                  className="h-11 mt-1 rounded-lg focus-visible:ring-rose-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" 
                  placeholder="e.g., Requested by the Mayor's Office"
                  value={releaseForm.basis} 
                  onChange={(e) => setReleaseForm({ ...releaseForm, basis: e.target.value })} 
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="ghost" className="h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setReleaseOpen(false)}>Cancel</Button>
                <Button className="!bg-rose-600 dark:!bg-rose-500 !text-white hover:!bg-rose-700 dark:hover:!bg-rose-600 border-none h-11 rounded-xl font-bold" onClick={handleRelease}>Confirm Release</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EMPTY STATE */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <PackageOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">No items found</p>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-center">Try adjusting your search or add a new item to your inventory.</p>
        </div>
      )}
      
      {/* INVENTORY ITEM CARDS (Grid Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sorted.map((item) => (
          <Card key={item.id} className="group overflow-hidden shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/50 transition-all duration-200 bg-white dark:bg-slate-900 rounded-2xl">
            <CardContent className="p-0">
              {/* Top Accent Bar based on quantity */}
              <div className={`h-1.5 w-full ${item.quantity <= 5 ? "bg-rose-500 dark:bg-rose-600" : "bg-emerald-500 dark:bg-emerald-600"}`}></div>
              
              <div className="p-5">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight truncate" title={item.name}>
                    {item.name}
                  </h3>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.quantity <= 5 
                      ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30" 
                      : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                  }`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                
                <div className="space-y-1.5 mb-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Category:</span> 
                    {item.category || <span className="italic opacity-60">Uncategorized</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    Last updated by <span className="font-medium text-slate-500 dark:text-slate-400">{item.updatedBy}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl transition-colors font-semibold bg-white dark:bg-slate-950"
                    onClick={() => { setItemToRelease(item); setReleaseOpen(true); }}
                    disabled={item.quantity <= 0}
                  >
                    <MinusCircle className="h-4 w-4 mr-1.5" /> Release
                  </Button>
                  
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors bg-white dark:bg-slate-950" 
                    onClick={() => { setEditing(item); setForm({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category }); setOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-10 w-10 shrink-0 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors bg-transparent" 
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
};

export default Inventory;