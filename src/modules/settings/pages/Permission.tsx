import { Bell, Search, User, ChevronDown, Settings, LogOut, UserCircle, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../auth/services/authService";
import SideNav from "../../dashboard/components/side-nav";
import api from "../../../services/api";
import TopNav from "../../dashboard/components/top-nav";

interface Permission { id:number; name:string; }

export default function PermissionPage(){
  const [openProfile,setOpenProfile]=useState(false);
  const [openSettings,setOpenSettings]=useState(false);
  const [openSidebar,setOpenSidebar]=useState(false);
  const profileRef=useRef<HTMLDivElement>(null);
  const navigate=useNavigate();
  const [permissions,setPermissions]=useState<Permission[]>([]);
  const [name,setName]=useState("");
  const [editId,setEditId]=useState<number|null>(null);

  const handleLogout=()=>{ logout(); navigate("/login"); };

  useEffect(()=>{
    const handleClickOutside=(e:MouseEvent)=>{
      if(profileRef.current && !profileRef.current.contains(e.target as Node)){ setOpenProfile(false); setOpenSettings(false); }
    };
    document.addEventListener("mousedown",handleClickOutside);
    return()=>document.removeEventListener("mousedown",handleClickOutside);
  },[]);

  const loadPermission=async()=>{ const res=await api.get("/permissions"); setPermissions(res.data); };
  useEffect(()=>{ loadPermission(); },[]);

  const savePermission=async()=>{
    editId ? await api.put(`/permissions/${editId}`,{name}) : await api.post("/permissions",{name});
    setName(""); setEditId(null); loadPermission();
  };

  const editPermission=(item:Permission)=>{ setName(item.name); setEditId(item.id); };
  const deletePermission=async(id:number)=>{ await api.delete(`/permissions/${id}`); loadPermission(); };

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar}/>
      <main className="flex-1">
        
        <TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Permission Management</h2>
            <p className="text-gray-500 mt-1">Create and manage system permissions</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Create Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="bg-indigo-100 p-3 rounded-2xl w-fit"><ShieldCheck className="text-indigo-600"/></div>
              <h3 className="text-xl font-bold mt-5">{editId?"Update Permission":"Create Permission"}</h3>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Permission name" className="mt-5 w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"/>
              <button onClick={savePermission} className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700"><Plus size={18} className="inline"/> Save</button>
            </div>
            {/* List */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-5">Permission List</h3>
              <div className="space-y-3">
                {permissions.map(item=>(
                  <div key={item.id} className="bg-gray-50 rounded-xl p-2 flex justify-between items-center">
                    <p className="font-semibold">{item.name}</p>
                    <div className="flex gap-2">
                      <button onClick={()=>editPermission(item)} className="bg-blue-100 p-2 rounded-lg text-blue-600"><Edit size={18}/></button>
                      <button onClick={()=>deletePermission(item.id)} className="bg-red-100 p-2 rounded-lg text-red-600"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}