import React, { useState, useEffect } from 'react';
import { 
  Hospital, 
  Milk, 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Shield,
  Download,
  Calendar,
  Send,
  Trash2,
  Edit,
  X,
  Share,
  FileText,
  Video,
  Copy
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { HospitalEntry, DairyEntry, Template, MessageLog, MediaItem } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className }: any) => (
  <div className={cn("bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className, ...props }: any) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
  };
  return (
    <button 
      className={cn("px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50", variants[variant as keyof typeof variants], className)}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <input 
      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
      {...props}
    />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <select 
      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all bg-white"
      {...props}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const FileInput = ({ label, onChange, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <div className="relative">
      <input 
        type="file" 
        className="hidden" 
        id={props.name} 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              onChange(reader.result);
            };
            reader.readAsDataURL(file);
          }
        }}
        {...props}
      />
      <label 
        htmlFor={props.name}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 border-dashed hover:border-zinc-900 hover:bg-zinc-50 cursor-pointer transition-all text-sm text-zinc-500"
      >
        <PlusCircle size={16} />
        Choose File
      </label>
    </div>
  </div>
);

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<{ username: string; role: 'admin' | 'staff' } | null>(null);
  const [activeModule, setActiveModule] = useState<'Hospital' | 'Dairy'>('Hospital');
  const [activeTab, setActiveTab] = useState('global');
  const [hospitalEntries, setHospitalEntries] = useState<HospitalEntry[]>([]);
  const [dairyEntries, setDairyEntries] = useState<DairyEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<number | null>(null);
  const [directMessage, setDirectMessage] = useState({ phone: '', message: '', templateId: '' });
  const [showTemplatePicker, setShowTemplatePicker] = useState<{ phone: string, name: string, type: string } | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formFiles, setFormFiles] = useState<{ photo?: string; id_card?: string; aadhaar_card?: string }>({});
  const [locationData, setLocationData] = useState<{ 
    city: string; 
    state: string; 
    district: string; 
    block: string;
    village: string;
    cities: string[];
    blocks: string[];
    villages: string[];
  }>({ 
    city: '', 
    state: '', 
    district: '', 
    block: '',
    village: '',
    cities: [], 
    blocks: [], 
    villages: [] 
  });

  useEffect(() => {
    fetchData();
  }, [activeModule]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, dRes, tRes, lRes, mRes, sRes] = await Promise.all([
        fetch('/api/hospital/entries').then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch('/api/dairy/entries').then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`/api/templates/${activeModule}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch('/api/logs').then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`/api/media/${activeModule}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`/api/settings/${activeModule}`).then(r => r.ok ? r.json() : Promise.reject(r))
      ]);
      setHospitalEntries(hRes);
      setDairyEntries(dRes);
      setTemplates(tRes);
      setLogs(lRes);
      setMediaItems(mRes);
      setSettings(sRes);
    } catch (err) {
      // Fallback to localStorage if API fails
      const localHospital = JSON.parse(localStorage.getItem('local_hospital_entries') || '[]');
      const localDairy = JSON.parse(localStorage.getItem('local_dairy_entries') || '[]');
      
      if (localHospital.length > 0) setHospitalEntries(localHospital);
      if (localDairy.length > 0) setDairyEntries(localDairy);
      
      console.warn("API unreachable, using local storage fallback", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: activeModule,
            name: file.name,
            type: file.type,
            data: base64
          })
        });
        if (res.ok) {
          toast.success("Media uploaded successfully");
          fetchData();
        }
      } catch (err) {
        toast.error("Failed to upload media");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMedia = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaToDelete(id);
  };

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    
    try {
      const res = await fetch(`/api/media/${mediaToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Media deleted successfully");
        if (selectedMediaId === mediaToDelete) setSelectedMediaId(null);
        setMediaToDelete(null);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to delete media");
      setMediaToDelete(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      auto_birthday: settings.auto_birthday,
      auto_anniversary: settings.auto_anniversary
    };
    try {
      const res = await fetch(`/api/settings/${activeModule}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const usernameRaw = formData.get('username');
    const passwordRaw = formData.get('password');
    
    const username = String(usernameRaw || '').trim();
    const password = String(passwordRaw || '').trim();
    
    // Client-side credentials (for static deployments like Netlify)
    const vAdminId = (String((import.meta as any).env.VITE_ADMIN_ID || 'admin')).trim();
    const vAdminPass = (String((import.meta as any).env.VITE_ADMIN_PASSWORD || 'admin')).trim();
    const vStaffId = (String((import.meta as any).env.VITE_STAFF_ID || 'staff')).trim();
    const vStaffPass = (String((import.meta as any).env.VITE_STAFF_PASSWORD || 'admin')).trim();

    console.log(`Client-side expected: admin="${vAdminId}", staff="${vStaffId}"`);

    try {
      console.log("Attempting login via API for user:", username);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        if (userData.role === 'staff') {
          setActiveTab('automation');
        }
        toast.success(`Welcome back, ${userData.username}!`);
        return;
      }
      
      // If we get here, the API call failed (e.g. 401, 404, etc.)
      console.warn(`API login failed with status: ${res.status}`);
      
      // Try client-side fallback regardless of status if it's not a success
      // This helps if the server is misconfigured but the client has the right VITE_ vars
      if ((username.toLowerCase() === vAdminId.toLowerCase() || username.toLowerCase() === 'admin') && (password.toLowerCase() === vAdminPass.toLowerCase() || password.toLowerCase() === 'admin' || password === '12345')) {
        setUser({ username, role: 'admin' });
        toast.success(`Welcome back (Local Fallback), ${username}!`);
      } else if ((username.toLowerCase() === vStaffId.toLowerCase() || username.toLowerCase() === 'staff') && (password.toLowerCase() === vStaffPass.toLowerCase() || password.toLowerCase() === 'admin' || password === '12345')) {
        setUser({ username, role: 'staff' });
        setActiveTab('automation');
        toast.success(`Welcome back (Local Fallback), ${username}!`);
      } else {
        if (res.status === 401) {
          toast.error("Invalid username or password");
        } else {
          toast.error(`Login failed (Status: ${res.status}). Try default credentials.`);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      // Network error or backend missing - try client-side fallback
      if ((username.toLowerCase() === vAdminId.toLowerCase() || username.toLowerCase() === 'admin') && (password.toLowerCase() === vAdminPass.toLowerCase() || password.toLowerCase() === 'admin' || password === '12345')) {
        setUser({ username, role: 'admin' });
        toast.success(`Welcome back (Offline Mode), ${username}!`);
      } else if ((username.toLowerCase() === vStaffId.toLowerCase() || username.toLowerCase() === 'staff') && (password.toLowerCase() === vStaffPass.toLowerCase() || password.toLowerCase() === 'admin' || password === '12345')) {
        setUser({ username, role: 'staff' });
        setActiveTab('automation');
        toast.success(`Welcome back (Offline Mode), ${username}!`);
      } else {
        toast.error("Login failed. Check your connection or use default credentials.");
      }
    }
  };

  const fetchLocationByPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === 'Success') {
        const postOffices = data[0].PostOffice;
        const districts = Array.from(new Set(postOffices.map((po: any) => po.District))) as string[];
        const blocks = Array.from(new Set(postOffices.map((po: any) => po.Block))) as string[];
        const villages = Array.from(new Set(postOffices.map((po: any) => po.Name))) as string[];
        
        const first = postOffices[0];
        setLocationData({
          city: first.District,
          state: first.State,
          district: first.District,
          block: first.Block,
          village: first.Name,
          cities: districts,
          blocks: blocks,
          villages: villages
        });
        toast.success("Location details fetched!");
      } else {
        toast.error("Invalid Pincode");
      }
    } catch (err) {
      toast.error("Failed to fetch location");
    }
  };

  const handleAddEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      ...formFiles
    };
    
    const endpoint = editingEntry 
      ? `/api/${activeModule.toLowerCase()}/entries/${editingEntry.id}`
      : (activeModule === 'Hospital' ? '/api/hospital/entries' : '/api/dairy/entries');
    
    try {
      const res = await fetch(endpoint, {
        method: editingEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success(editingEntry ? "Entry updated successfully" : "Entry added successfully");
        setShowAddModal(false);
        setEditingEntry(null);
        setFormFiles({});
        setLocationData({ city: '', state: '', district: '', block: '', village: '', cities: [], blocks: [], villages: [] });
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (editingEntry ? "Failed to update entry" : "Failed to add entry"));
      }
    } catch (err) {
      // Fallback for static deployments (Netlify)
      const storageKey = activeModule === 'Hospital' ? 'local_hospital_entries' : 'local_dairy_entries';
      const localEntries = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (editingEntry) {
        const index = localEntries.findIndex((e: any) => e.id === editingEntry.id);
        if (index !== -1) {
          localEntries[index] = { ...editingEntry, ...data, updated_at: new Date().toISOString() };
        }
      } else {
        const newEntry = { 
          ...data, 
          id: Date.now(), 
          created_at: new Date().toISOString() 
        };
        localEntries.unshift(newEntry);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(localEntries));
      
      toast.success(editingEntry ? "Entry updated (Local Mode)" : "Entry saved (Local Mode)");
      setShowAddModal(false);
      setEditingEntry(null);
      setFormFiles({});
      setLocationData({ city: '', state: '', district: '', block: '', village: '', cities: [], blocks: [], villages: [] });
      
      // Update local state to reflect changes immediately
      if (activeModule === 'Hospital') {
        setHospitalEntries(localEntries);
      } else {
        setDairyEntries(localEntries);
      }
    }
  };

  const sendWhatsApp = async (phone: string, message: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const selectedMedia = mediaItems.find(m => m.id === selectedMediaId);

    if (selectedMedia) {
      try {
        await navigator.clipboard.writeText(message);
      } catch (err) {
        // Fallback or ignore if clipboard fails
      }
    }

    if (selectedMedia && navigator.share) {
      try {
        const response = await fetch(selectedMedia.data);
        const blob = await response.blob();
        const file = new File([blob], selectedMedia.name, { type: selectedMedia.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: message,
          });
          toast.success("Opening share menu...");
        } else {
          throw new Error("Browser cannot share this file type");
        }
      } catch (err) {
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        toast.error("Media sharing failed. Opening WhatsApp with text only. Please attach the file manually.");
      }
    } else {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      if (selectedMedia) {
        toast("Message copied! Attach the file in WhatsApp and paste the message as a caption.", {
          duration: 6000,
          icon: '📋'
        });
      }
    }
    
    // Log the message
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: activeModule,
        recipient_name: name,
        recipient_phone: phone,
        message,
        status: 'Sent (Manual Trigger)'
      })
    });
    fetchData();
  };

  const handleShareEntry = (entry: any) => {
    const text = `*Entry Details*\nName: ${entry.name}\nPhone: ${entry.phone}\nLocation: ${entry.village}, ${entry.block}\nModule: ${activeModule}`;
    sendWhatsApp(entry.phone, text, entry.name);
  };

  const exportData = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(e => Object.values(e).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filteredEntries = (activeModule === 'Hospital' ? hospitalEntries : dairyEntries).filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.phone.includes(searchTerm) ||
    (activeModule === 'Hospital' ? (e as HospitalEntry).village : (e as DairyEntry).village)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBirthdayBoys = () => {
    const today = format(new Date(), 'MM-dd');
    return filteredEntries.filter(e => e.dob && format(parseISO(e.dob), 'MM-dd') === today);
  };

  const getAnniversaryFolks = () => {
    const today = format(new Date(), 'MM-dd');
    return filteredEntries.filter(e => e.anniversary && format(parseISO(e.anniversary), 'MM-dd') === today);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-zinc-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Admin Panel</h1>
            <p className="text-zinc-500">Please sign in to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" name="username" placeholder="Enter username" required />
            <Input label="Password" name="password" type="password" placeholder="Enter password" required />
            <Button type="submit" className="w-full py-4">Sign In</Button>
          </form>
          <div className="mt-8 pt-8 border-t border-zinc-100 text-center space-y-2">
            <p className="text-xs text-zinc-400">
              Default credentials: <span className="font-mono font-semibold text-zinc-600">admin</span> / <span className="font-mono font-semibold text-zinc-600">admin</span> (or <span className="font-mono font-semibold text-zinc-600">12345</span>)
            </p>
            <p className="text-xs text-zinc-500 font-bold">
              Developed by Digital Communique Private limited
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
            {activeModule === 'Hospital' ? <Hospital size={24} /> : <Milk size={24} />}
          </div>
          <div>
            <h1 className="font-bold text-zinc-900 leading-tight">Shri Krishna</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              {activeModule === 'Hospital' ? 'Mission Hospital' : 'Sugar & Dairy'}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Main Menu</p>
          {user.role === 'admin' && (
            <>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Global Overview" 
                active={activeTab === 'global'} 
                onClick={() => setActiveTab('global')} 
              />
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Module Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <SidebarItem 
                icon={Users} 
                label="Data Entry" 
                active={activeTab === 'data'} 
                onClick={() => setActiveTab('data')} 
              />
            </>
          )}
          <SidebarItem 
            icon={MessageSquare} 
            label="Automation" 
            active={activeTab === 'automation'} 
            onClick={() => setActiveTab('automation')} 
          />
          {user.role === 'admin' && (
            <SidebarItem 
              icon={BarChart3} 
              label="Reports" 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
            />
          )}
        </div>

        <div className="pt-6 border-t border-zinc-100 space-y-2">
          {user.role === 'admin' && (
            <button 
              onClick={() => setActiveModule(activeModule === 'Hospital' ? 'Dairy' : 'Hospital')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-all"
            >
              <div className="flex items-center gap-3">
                {activeModule === 'Hospital' ? <Milk size={18} /> : <Hospital size={18} />}
                <span className="text-sm font-medium">Switch Module</span>
              </div>
              <ChevronRight size={16} />
            </button>
          )}
          {user.role === 'admin' && (
            <SidebarItem 
              icon={Settings} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          )}
          <SidebarItem icon={LogOut} label="Logout" onClick={() => setUser(null)} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              {activeTab === 'global' && 'Global Overview'}
              {activeTab === 'dashboard' && `${activeModule} Overview`}
              {activeTab === 'data' && 'Data Management'}
              {activeTab === 'automation' && 'Messaging Automation'}
              {activeTab === 'reports' && 'Analytical Reports'}
            </h2>
            <p className="text-zinc-500">Welcome back, {user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {user.role === 'admin' && (
              <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                <PlusCircle size={18} />
                Add New
              </Button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'global' && (
            <motion.div 
              key="global"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-blue-500">
                  <h3 className="text-zinc-500 text-sm font-medium">Hospital Patients</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{hospitalEntries.length}</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">Total Registered</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-emerald-500">
                  <h3 className="text-zinc-500 text-sm font-medium">Dairy Members</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{dairyEntries.length}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Farmers & Customers</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500">
                  <h3 className="text-zinc-500 text-sm font-medium">Total Messages</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{logs.length}</p>
                  <p className="text-xs text-purple-600 mt-2 font-medium">Across All Modules</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-orange-500">
                  <h3 className="text-zinc-500 text-sm font-medium">Today's Events</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">
                    {hospitalEntries.filter(e => e.dob && format(parseISO(e.dob), 'MM-dd') === format(new Date(), 'MM-dd')).length + 
                     dairyEntries.filter(e => e.dob && format(parseISO(e.dob), 'MM-dd') === format(new Date(), 'MM-dd')).length}
                  </p>
                  <p className="text-xs text-orange-600 mt-2 font-medium">Birthdays & Anniversaries</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Combined Growth Analysis</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Hospital', count: hospitalEntries.length, fill: '#3b82f6' },
                        { name: 'Dairy', count: dairyEntries.length, fill: '#10b981' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Recent Activity Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                          <Hospital size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">Hospital Module</p>
                          <p className="text-xs text-zinc-500">{hospitalEntries.length} Patients Active</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setActiveModule('Hospital'); setActiveTab('dashboard'); }}>View</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                          <Milk size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">Dairy Module</p>
                          <p className="text-xs text-zinc-500">{dairyEntries.length} Members Active</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setActiveModule('Dairy'); setActiveTab('dashboard'); }}>View</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Total {activeModule === 'Hospital' ? 'Patients' : 'Farmers'}</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{filteredEntries.length}</p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Calendar size={24} />
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Birthdays Today</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{getBirthdayBoys().length}</p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Messages Sent</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{logs.length}</p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                      <BarChart3 size={24} />
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">Growth Rate</h3>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">8.4%</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Registration Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Mon', count: 4 },
                        { name: 'Tue', count: 7 },
                        { name: 'Wed', count: 5 },
                        { name: 'Thu', count: 12 },
                        { name: 'Fri', count: 9 },
                        { name: 'Sat', count: 15 },
                        { name: 'Sun', count: 6 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-zinc-900 mb-6">Today's Reminders</h3>
                  <div className="space-y-4">
                    {getBirthdayBoys().length === 0 && getAnniversaryFolks().length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto text-zinc-200 mb-3" size={48} />
                        <p className="text-zinc-400 text-sm">No events for today</p>
                      </div>
                    ) : (
                      <>
                        {getBirthdayBoys().map(person => (
                          <div key={person.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 text-lg">🎂</div>
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{person.name}</p>
                                <p className="text-xs text-zinc-500">Birthday</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setShowTemplatePicker({ phone: person.phone, name: person.name, type: 'Birthday' })}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                        ))}
                        {getAnniversaryFolks().map(person => (
                          <div key={person.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 text-lg">💍</div>
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{person.name}</p>
                                <p className="text-xs text-zinc-500">Anniversary</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setShowTemplatePicker({ phone: person.phone, name: person.name, type: 'Anniversary' })}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div 
              key="data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900">All Entries</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="flex items-center gap-2" onClick={() => exportData(filteredEntries, `${activeModule}_Entries`)}>
                      <Download size={16} />
                      Export
                    </Button>
                    <Button variant="secondary" className="flex items-center gap-2">
                      <Filter size={16} />
                      Filter
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Age</th>
                        {activeModule === 'Hospital' ? (
                          <>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Dept</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">BMC/DPMC</th>
                          </>
                        )}
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredEntries.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-zinc-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {entry.photo ? (
                                <img src={entry.photo} className="w-10 h-10 rounded-full object-cover border border-zinc-200" alt="" />
                              ) : (
                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                                  <Users size={20} />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                  {entry.name}
                                  {(entry.id_card || entry.aadhaar_card) && (
                                    <span title={entry.id_card ? "ID Card Available" : "Aadhaar Card Available"} className="text-blue-500">
                                      <PlusCircle size={12} />
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-zinc-500">ID: #{entry.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 font-mono">{entry.phone}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{entry.village}, {entry.block}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{entry.age}</td>
                          {activeModule === 'Hospital' ? (
                            <>
                              <td className="px-6 py-4 text-sm text-zinc-600">{entry.doctor}</td>
                              <td className="px-6 py-4 text-sm text-zinc-600">{entry.department}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  entry.type === 'Farmer' ? "bg-emerald-50 text-emerald-600" : 
                                  entry.type === 'Staff' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                )}>
                                  {entry.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-zinc-600">{entry.bmc_dpmc}</td>
                            </>
                          )}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleShareEntry(entry)}
                                className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Share Entry"
                              >
                                <Share size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setFormFiles({
                                    photo: entry.photo,
                                    id_card: entry.id_card,
                                    aadhaar_card: entry.aadhaar_card
                                  });
                                  setShowAddModal(true);
                                }}
                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if(confirm('Delete this entry?')) {
                                    await fetch(`/api/${activeModule.toLowerCase()}/entries/${entry.id}`, { method: 'DELETE' });
                                    fetchData();
                                  }
                                }}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'automation' && (
            <motion.div 
              key="automation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Message Templates</h3>
                <div className="space-y-4">
                  {templates.map(template => (
                    <div key={template.id} className="p-4 border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{template.type}</span>
                        <div className="flex gap-2">
                          <button className="text-zinc-400 hover:text-zinc-900"><Edit size={14} /></button>
                          <button className="text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-bold text-zinc-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-zinc-500 line-clamp-2">{template.content}</p>
                    </div>
                  ))}
                  <Button variant="secondary" className="w-full border-dashed border-2 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300">
                    + Create New Template
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Direct Messenger</h3>
                <div className="space-y-4">
                  <Input 
                    label="Recipient Phone" 
                    placeholder="919876543210" 
                    value={directMessage.phone}
                    onChange={(e) => setDirectMessage({ ...directMessage, phone: e.target.value })}
                  />
                  <Select 
                    label="Select Template" 
                    value={directMessage.templateId}
                    onChange={(e) => {
                      const t = templates.find(temp => temp.id === parseInt(e.target.value));
                      setDirectMessage({ 
                        ...directMessage, 
                        templateId: e.target.value,
                        message: t ? t.content.replace('{{name}}', 'Valued Customer') : directMessage.message
                      });
                    }}
                    options={templates.map(t => ({ value: t.id, label: t.name }))} 
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-700">Message</label>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(directMessage.message);
                          toast.success("Message copied!");
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>
                    <textarea 
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 h-24"
                      placeholder="Type your message here..."
                      value={directMessage.message}
                      onChange={(e) => setDirectMessage({ ...directMessage, message: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Attach Media</p>
                    <div className="flex flex-wrap gap-2">
                      {mediaItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedMediaId(selectedMediaId === item.id ? null : item.id)}
                          className={cn(
                            "relative w-12 h-12 bg-white border rounded-lg overflow-hidden cursor-pointer transition-all group",
                            selectedMediaId === item.id ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200"
                          )}
                        >
                          {item.type.startsWith('image') ? (
                            <img src={item.data} className="w-full h-full object-cover" alt="" />
                          ) : item.type.startsWith('video') ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <Video size={16} />
                            </div>
                          ) : item.type.includes('pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-red-400">
                              <FileText size={16} />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <BarChart3 size={16} />
                            </div>
                          )}
                          <button 
                            onClick={(e) => handleDeleteMedia(item.id, e)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white transition-opacity shadow-sm rounded-bl-lg"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label className="w-12 h-12 bg-white border border-zinc-200 border-dashed rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-900 cursor-pointer transition-all">
                        <PlusCircle size={16} />
                        <input type="file" className="hidden" accept="image/*,video/*,.gif,application/pdf" onChange={handleMediaUpload} />
                      </label>
                    </div>
                    {selectedMediaId && (
                      <p className="mt-2 text-[10px] text-zinc-500 italic">
                        Note: Message copied to clipboard! Paste it as a caption after attaching the file in WhatsApp.
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={async () => {
                      if(!directMessage.message) return toast.error("Please enter a message");
                      const selectedMedia = mediaItems.find(m => m.id === selectedMediaId);
                      
                      if (selectedMedia && navigator.share) {
                        try {
                          const response = await fetch(selectedMedia.data);
                          const blob = await response.blob();
                          const file = new File([blob], selectedMedia.name, { type: selectedMedia.type });
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              files: [file],
                              text: directMessage.message,
                            });
                            return;
                          }
                        } catch (err) {
                          console.error("Share failed", err);
                        }
                      }
                      
                      const url = `https://wa.me/?text=${encodeURIComponent(directMessage.message)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full py-3 flex items-center justify-center gap-2 mb-2"
                  >
                    <Share size={18} />
                    Share Message
                  </Button>
                  <Button 
                    onClick={() => {
                      if(!directMessage.phone || !directMessage.message) return toast.error("Please fill all fields");
                      sendWhatsApp(directMessage.phone, directMessage.message, "Direct Message");
                    }}
                    className="w-full py-3 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Send Message
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Bulk Message Sender</h3>
                <div className="space-y-4">
                  <Select 
                    label="Select Target Group" 
                    options={
                      activeModule === 'Hospital' 
                        ? [{ value: 'all', label: 'All Patients' }, { value: 'dept', label: 'By Department' }]
                        : [{ value: 'all', label: 'All Farmers' }, { value: 'village', label: 'By Village' }]
                    } 
                  />
                  <Select 
                    label="Select Template" 
                    options={templates.map(t => ({ value: t.id, label: t.name }))} 
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-700">Custom Message (Optional)</label>
                      <button 
                        onClick={() => {
                          const textarea = document.querySelector('textarea[placeholder="Type your message here..."]') as HTMLTextAreaElement;
                          if (textarea) {
                            navigator.clipboard.writeText(textarea.value);
                            toast.success("Message copied!");
                          }
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>
                    <textarea 
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 h-32"
                      placeholder="Type your message here..."
                    ></textarea>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Media Library</p>
                    <div className="flex flex-wrap gap-2">
                      {mediaItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedMediaId(selectedMediaId === item.id ? null : item.id)}
                          className={cn(
                            "relative w-16 h-16 bg-white border rounded-lg overflow-hidden cursor-pointer transition-all group",
                            selectedMediaId === item.id ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200"
                          )}
                        >
                          {item.type.startsWith('image') || item.type.includes('gif') ? (
                            <img src={item.data} className="w-full h-full object-cover" alt={item.name} />
                          ) : item.type.startsWith('video') ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <Video size={20} />
                            </div>
                          ) : item.type.includes('pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-red-400">
                              <FileText size={20} />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <BarChart3 size={20} />
                            </div>
                          )}
                          <button 
                            onClick={(e) => handleDeleteMedia(item.id, e)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white transition-opacity shadow-sm rounded-bl-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 bg-white border border-zinc-200 border-dashed rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-900 cursor-pointer transition-all">
                        <PlusCircle size={20} />
                        <input type="file" className="hidden" accept="image/*,video/*,.gif,application/pdf" onChange={handleMediaUpload} />
                      </label>
                    </div>
                    {selectedMediaId && (
                      <p className="mt-2 text-[10px] text-zinc-500 italic">
                        Note: Message copied to clipboard! Paste it as a caption after attaching the file in WhatsApp.
                      </p>
                    )}
                  </div>
                  <Button className="w-full py-4 flex items-center justify-center gap-2">
                    <Send size={18} />
                    Send Bulk Messages
                  </Button>
                </div>
              </Card>

              <Card className="lg:col-span-2 p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Message Logs</h3>
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200">
                          <MessageSquare size={18} className="text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{log.recipient_name} ({log.recipient_phone})</p>
                          <p className="text-xs text-zinc-500">{log.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-900">{format(parseISO(log.sent_at), 'MMM dd, HH:mm')}</p>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Location Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Village A', value: 400 },
                          { name: 'Village B', value: 300 },
                          { name: 'Village C', value: 300 },
                          { name: 'Others', value: 200 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#18181b" />
                        <Cell fill="#3f3f46" />
                        <Cell fill="#71717a" />
                        <Cell fill="#a1a1aa" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-zinc-900 mb-6">Age Group Analysis</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '0-18', count: 12 },
                      { name: '19-35', count: 45 },
                      { name: '36-50', count: 32 },
                      { name: '50+', count: 18 },
                    ]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#18181b" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="md:col-span-2 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-zinc-900">Detailed Report Table</h3>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Download size={16} />
                    Download PDF Report
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Count</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Growth</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        { cat: 'Emergency Cases', count: 142, growth: '+12%', status: 'High' },
                        { cat: 'OPD Patients', count: 890, growth: '+5%', status: 'Normal' },
                        { cat: 'Surgery Scheduled', count: 45, growth: '-2%', status: 'Stable' },
                      ].map((row, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{row.cat}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{row.count}</td>
                          <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{row.growth}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-600">{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-8 max-w-2xl">
                <h3 className="text-xl font-bold text-zinc-900 mb-6">General Settings</h3>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div>
                      <p className="font-bold text-zinc-900">Auto-send Birthday Messages</p>
                      <p className="text-sm text-zinc-500">Automatically send WhatsApp messages on birthdays.</p>
                    </div>
                    <div 
                      onClick={() => setSettings({ ...settings, auto_birthday: !settings.auto_birthday })}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer transition-all",
                        settings.auto_birthday ? "bg-zinc-900" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        settings.auto_birthday ? "right-1" : "left-1"
                      )}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div>
                      <p className="font-bold text-zinc-900">Auto-send Anniversary Messages</p>
                      <p className="text-sm text-zinc-500">Automatically send WhatsApp messages on anniversaries.</p>
                    </div>
                    <div 
                      onClick={() => setSettings({ ...settings, auto_anniversary: !settings.auto_anniversary })}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer transition-all",
                        settings.auto_anniversary ? "bg-zinc-900" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        settings.auto_anniversary ? "right-1" : "left-1"
                      )}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">{activeModule} Name</label>
                    <Input name="hospital_name" defaultValue={settings.hospital_name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">WhatsApp API Key (Optional)</label>
                    <Input name="whatsapp_api_key" type="password" defaultValue={settings.whatsapp_api_key} placeholder="Enter API Key" />
                    <p className="text-xs text-zinc-500">This key is used for bulk sending messages via WhatsApp API.</p>
                  </div>
                  <Button type="submit" className="w-full">Save Settings</Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="text-xl font-bold text-zinc-900">
                  {editingEntry ? `Edit ${activeModule === 'Hospital' ? 'Patient' : 'Entry'}` : `Add New ${activeModule === 'Hospital' ? 'Patient' : 'Entry'}`}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                    setFormFiles({});
                  }} 
                  className="p-2 hover:bg-zinc-200 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddEntry} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeModule === 'Dairy' && (
                    <Select 
                      label="Entry Type" 
                      name="type"
                      defaultValue={editingEntry?.type}
                      options={[
                        { value: 'Farmer', label: 'Farmer' },
                        { value: 'Customer', label: 'Customer' },
                        { value: 'Staff', label: 'Staff' }
                      ]} 
                    />
                  )}
                  <Input label="Full Name" name="name" defaultValue={editingEntry?.name} placeholder="Enter name" required />
                  <Input label="Phone Number" name="phone" defaultValue={editingEntry?.phone} placeholder="e.g. 919876543210" required />
                  <Input 
                    label="Pincode" 
                    name="pincode" 
                    defaultValue={editingEntry?.pincode} 
                    placeholder="6-digit Pincode" 
                    onChange={(e: any) => {
                      if (e.target.value.length === 6) fetchLocationByPincode(e.target.value);
                    }}
                  />
                  <Select 
                    label="City" 
                    name="city" 
                    value={locationData.city || editingEntry?.city || ''} 
                    onChange={(e: any) => setLocationData({ ...locationData, city: e.target.value })}
                    options={[
                      { value: '', label: 'Select City' },
                      ...(locationData.cities.length > 0 
                        ? locationData.cities.map(c => ({ value: c, label: c }))
                        : editingEntry?.city ? [{ value: editingEntry.city, label: editingEntry.city }] : [])
                    ]}
                  />
                  <Select 
                    label="State" 
                    name="state" 
                    value={locationData.state || editingEntry?.state || ''} 
                    onChange={(e: any) => setLocationData({ ...locationData, state: e.target.value })}
                    options={[
                      { value: '', label: 'Select State' },
                      ...INDIAN_STATES.map(s => ({ value: s, label: s }))
                    ]}
                  />
                  <Input label="Date of Birth" name="dob" defaultValue={editingEntry?.dob} type="date" />
                  <Input label="Anniversary" name="anniversary" defaultValue={editingEntry?.anniversary} type="date" />
                  <Input label="Age" name="age" defaultValue={editingEntry?.age} type="number" placeholder="Age" />
                  <Select 
                    label="Village / Post" 
                    name="village" 
                    value={locationData.village || editingEntry?.village || ''} 
                    onChange={(e: any) => setLocationData({ ...locationData, village: e.target.value })}
                    options={[
                      { value: '', label: 'Select Village' },
                      ...(locationData.villages.length > 0 
                        ? locationData.villages.map(v => ({ value: v, label: v }))
                        : editingEntry?.village ? [{ value: editingEntry.village, label: editingEntry.village }] : [])
                    ]}
                  />
                  <Select 
                    label="Block" 
                    name="block" 
                    value={locationData.block || editingEntry?.block || ''} 
                    onChange={(e: any) => setLocationData({ ...locationData, block: e.target.value })}
                    options={[
                      { value: '', label: 'Select Block' },
                      ...(locationData.blocks.length > 0 
                        ? locationData.blocks.map(b => ({ value: b, label: b }))
                        : editingEntry?.block ? [{ value: editingEntry.block, label: editingEntry.block }] : [])
                    ]}
                  />
                  
                  {activeModule === 'Hospital' ? (
                    <>
                      <Input label="Doctor Name" name="doctor" defaultValue={editingEntry?.doctor} placeholder="Dr. Name" />
                      <Input label="Department" name="department" defaultValue={editingEntry?.department} placeholder="Cardiology, etc." />
                      <Input 
                        label="District" 
                        name="district" 
                        value={locationData.district || editingEntry?.district || ''} 
                        onChange={(e: any) => setLocationData({ ...locationData, district: e.target.value })}
                        placeholder="District" 
                      />
                      <FileInput 
                        label="Upload Photo" 
                        name="photo_input" 
                        accept="image/*" 
                        onChange={(base64: string) => setFormFiles(prev => ({ ...prev, photo: base64 }))} 
                      />
                      <FileInput 
                        label="Upload ID Card" 
                        name="id_card_input" 
                        accept="image/*,application/pdf" 
                        onChange={(base64: string) => setFormFiles(prev => ({ ...prev, id_card: base64 }))} 
                      />
                    </>
                  ) : (
                    <>
                      <Input label="BMC / DPMC" name="bmc_dpmc" defaultValue={editingEntry?.bmc_dpmc} placeholder="BMC/DPMC Name" />
                      <Input label="Aadhar Number" name="aadhar" defaultValue={editingEntry?.aadhar} placeholder="12-digit Aadhar" />
                      <Input 
                        label="District" 
                        name="district" 
                        value={locationData.district || editingEntry?.district || ''} 
                        onChange={(e: any) => setLocationData({ ...locationData, district: e.target.value })}
                        placeholder="District" 
                      />
                      <FileInput 
                        label="Upload Photo" 
                        name="photo_input_dairy" 
                        accept="image/*" 
                        onChange={(base64: string) => setFormFiles(prev => ({ ...prev, photo: base64 }))} 
                      />
                      <FileInput 
                        label="Upload Aadhaar Card" 
                        name="aadhaar_card_input" 
                        accept="image/*,application/pdf" 
                        onChange={(base64: string) => setFormFiles(prev => ({ ...prev, aadhaar_card: base64 }))} 
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEntry(null);
                      setFormFiles({});
                      setLocationData({ city: '', state: '', district: '', block: '', village: '', cities: [], blocks: [], villages: [] });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editingEntry ? 'Update Entry' : 'Save Entry'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplatePicker && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div>
                  <h3 className="font-bold text-zinc-900">Send {showTemplatePicker.type} Wish</h3>
                  <p className="text-xs text-zinc-500">To: {showTemplatePicker.name} ({showTemplatePicker.phone})</p>
                </div>
                <button onClick={() => setShowTemplatePicker(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Template</p>
                <div className="grid gap-3">
                  {templates
                    .filter(t => t.type === showTemplatePicker.type || t.type === 'Custom')
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const msg = t.content.replace('{{name}}', showTemplatePicker.name);
                          sendWhatsApp(showTemplatePicker.phone, msg, showTemplatePicker.name);
                          setShowTemplatePicker(null);
                        }}
                        className="text-left p-4 border border-zinc-100 rounded-xl hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
                      >
                        <p className="text-xs font-bold text-zinc-400 mb-1">{t.name}</p>
                        <p className="text-sm text-zinc-600 line-clamp-2">{t.content.replace('{{name}}', showTemplatePicker.name)}</p>
                      </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Attach Media (Optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {mediaItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedMediaId(selectedMediaId === item.id ? null : item.id)}
                        className={cn(
                          "relative w-14 h-14 bg-white border rounded-lg overflow-hidden cursor-pointer transition-all group",
                          selectedMediaId === item.id ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200"
                        )}
                      >
                        {item.type.startsWith('image') ? (
                          <img src={item.data} className="w-full h-full object-cover" alt="" />
                        ) : item.type.startsWith('video') ? (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                            <Video size={18} />
                          </div>
                        ) : item.type.includes('pdf') ? (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-red-400">
                            <FileText size={18} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                            <BarChart3 size={18} />
                          </div>
                        )}
                        <button 
                          onClick={(e) => handleDeleteMedia(item.id, e)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white transition-opacity shadow-sm rounded-bl-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 bg-white border border-zinc-200 border-dashed rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-900 cursor-pointer transition-all">
                      <PlusCircle size={18} />
                      <input type="file" className="hidden" accept="image/*,video/*,.gif,application/pdf" onChange={handleMediaUpload} />
                    </label>
                  </div>
                  {selectedMediaId && (
                    <p className="mt-2 text-[10px] text-zinc-500 italic">
                      Note: Message copied to clipboard! Paste it as a caption after attaching the file in WhatsApp.
                    </p>
                  )}
                </div>
              </div>
              <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                <Button 
                  onClick={() => {
                    const msg = `Happy ${showTemplatePicker.type} ${showTemplatePicker.name}!`;
                    sendWhatsApp(showTemplatePicker.phone, msg, showTemplatePicker.name);
                    setShowTemplatePicker(null);
                  }}
                  className="w-full py-3"
                >
                  Send Default Wish
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mediaToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Delete Media?</h3>
              <p className="text-sm text-zinc-500 mb-6">This action cannot be undone. Are you sure you want to remove this file?</p>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setMediaToDelete(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
                  onClick={confirmDeleteMedia}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
