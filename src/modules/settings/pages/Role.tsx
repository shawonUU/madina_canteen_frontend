import { Bell, Search, User, ChevronDown, Settings, LogOut, UserCircle, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../auth/services/authService";
import SideNav from "../../dashboard/components/side-nav";
import TopNav from "../../dashboard/components/top-nav";
import api from "../../../services/api";

interface Permission { id:number; name:string; }
interface Role { id:number; name:string; permissions:Permission[]; }

export default function RolePage(){
  const navigate=useNavigate();
  const [openProfile,setOpenProfile]=useState(false);
  const [openSidebar,setOpenSidebar]=useState(false);
  const profileRef=useRef<HTMLDivElement>(null);
  const [roles,setRoles]=useState<Role[]>([]);
  const [permissions,setPermissions]=useState<Permission[]>([]);
  const [openModal,setOpenModal]=useState(false);
  const [name,setName]=useState("");
  const [editId,setEditId]=useState<number|null>(null);
  const [selectedPermissions,setSelectedPermissions]=useState<number[]>([]);

  const handleLogout=()=>{ logout(); navigate("/login"); };

  useEffect(()=>{
    const handleClickOutside=(e:MouseEvent)=>{
      if(profileRef.current && !profileRef.current.contains(e.target as Node)) setOpenProfile(false);
    };
    document.addEventListener("mousedown",handleClickOutside);
    return()=>document.removeEventListener("mousedown",handleClickOutside);
  },[]);

  const loadRoles=async()=>{ const res=await api.get("/roles"); setRoles(res.data); };
  const loadPermissions=async()=>{ const res=await api.get("/permissions"); setPermissions(res.data); };
  useEffect(()=>{ loadRoles(); loadPermissions(); },[]);

  const saveRole=async()=>{
    const data={name,permissions:selectedPermissions};
    editId ? await api.put(`/roles/${editId}`,data) : await api.post("/roles",data);
    setName(""); setSelectedPermissions([]); setEditId(null); setOpenModal(false); loadRoles();
  };

  const editRole=(role:Role)=>{ setEditId(role.id); setName(role.name); setSelectedPermissions(role.permissions.map(p=>p.id)); setOpenModal(true); };
  const deleteRole=async(id:number)=>{ await api.delete(`/roles/${id}`); loadRoles(); };
  const permissionToggle=(id:number)=> setSelectedPermissions(selectedPermissions.includes(id)?selectedPermissions.filter(item=>item!==id):[...selectedPermissions,id]);

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex">
      <SideNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar}/>
      <main className="flex-1">
        {/* Navbar */}
       <TopNav openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />

        <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Role Management</h2>
              <p className="text-gray-500">Create roles and assign permissions</p>
            </div>
            <button onClick={()=>{setEditId(null);setName("");setSelectedPermissions([]);setOpenModal(true);}} className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2">
              <Plus size={18}/> Add Role
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-5">Role List</h3>
            <div className="space-y-4">
              {roles.map(role=>(
                <div key={role.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">{role.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {role.permissions.map(p=><span key={p.id} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{p.name}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>editRole(role)} className="bg-blue-100 p-2 rounded-lg text-blue-600"><Edit size={18}/></button>
                    <button onClick={()=>deleteRole(role.id)} className="bg-red-100 p-2 rounded-lg text-red-600"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {openModal&&<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-indigo-100 p-3 rounded-xl"><ShieldCheck className="text-indigo-600"/></div>
              <h2 className="text-2xl font-bold">{editId?"Update Role":"Create Role"}</h2>
            </div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Role name" className="w-full border rounded-xl px-4 py-3 mb-5"/>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {permissions.map(p=>(
                <label key={p.id} className="bg-gray-50 p-3 rounded-xl flex gap-2 items-center">
                  <input type="checkbox" checked={selectedPermissions.includes(p.id)} onChange={()=>permissionToggle(p.id)}/>
                  {p.name}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpenModal(false)} className="px-5 py-3 bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={saveRole} className="px-5 py-3 bg-indigo-600 text-white rounded-xl">Save</button>
            </div>
          </div>
        </div>}
      </main>
    </div>
  );
}
