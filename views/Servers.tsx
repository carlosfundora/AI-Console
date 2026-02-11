
import React, { useState } from 'react';
import { ServerProfile, Model } from '../types';
import { Server, Terminal, Monitor, Command, Play, Square, Plus, X, Check, Package, Layers, Cpu, Zap, Settings } from 'lucide-react';

interface ServersProps {
    servers: ServerProfile[];
    models: Model[];
    onUpdateServer: (server: ServerProfile) => void;
    onDeleteServer: (id: string) => void;
    onAddServer: (server: ServerProfile) => void;
}

const EMPTY_SERVER: ServerProfile = {
    id: '',
    name: 'New Server',
    type: 'Venv',
    path: '',
    host: '127.0.0.1',
    port: 8080,
    os: 'Ubuntu',
    acceleration: 'CUDA',
    startupFlags: '',
    packages: [],
    compatibleModels: [],
    status: 'Offline'
};

export const Servers: React.FC<ServersProps> = ({ servers, models, onUpdateServer, onDeleteServer, onAddServer }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ServerProfile>(EMPTY_SERVER);

    const handleEdit = (server: ServerProfile) => {
        setEditingId(server.id);
        setEditForm({ ...server });
    };

    const handleCreate = () => {
        const newServer = { ...EMPTY_SERVER, id: `srv-${Date.now()}` };
        setEditForm(newServer);
        setEditingId(newServer.id);
    };

    const handleSave = () => {
        if (servers.find(s => s.id === editForm.id)) {
            onUpdateServer(editForm);
        } else {
            onAddServer(editForm);
        }
        setEditingId(null);
    };

    const toggleCompatibleModel = (modelId: string) => {
        const current = new Set(editForm.compatibleModels);
        if (current.has(modelId)) current.delete(modelId);
        else current.add(modelId);
        setEditForm({ ...editForm, compatibleModels: Array.from(current) });
    };

    const handleAddPackage = () => {
        const pkg = prompt("Enter package string (e.g. 'torch==2.1.0'):");
        if (pkg) {
            setEditForm({ ...editForm, packages: [...editForm.packages, pkg] });
        }
    };

    const removePackage = (pkg: string) => {
        setEditForm({ ...editForm, packages: editForm.packages.filter(p => p !== pkg) });
    };

    const getOsIcon = (os: string) => {
        switch (os) {
            case 'Windows': return <Monitor size={16} className="text-blue-400" />;
            case 'MacOS': return <Command size={16} className="text-gray-200" />;
            default: return <Terminal size={16} className="text-orange-400" />;
        }
    };

    const getAccelColor = (accel: string) => {
        switch (accel) {
            case 'ROCm': return 'bg-red-900/30 text-red-400 border-red-500/30';
            case 'CUDA': return 'bg-green-900/30 text-green-400 border-green-500/30';
            case 'Vulkan': return 'bg-red-900/30 text-orange-400 border-orange-500/30';
            case 'HYPR-RX': return 'bg-purple-900/30 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
             <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="text-purple-500" /> Server Configurations
                     </h2>
                     <p className="text-sm text-gray-400 mt-1">Manage Python venvs, Llama.cpp instances, and inference endpoints.</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
                >
                    <Plus size={16} /> New Server
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10">
                {/* Edit Form Card */}
                {editingId && (
                    <div className="md:col-span-2 xl:col-span-3 bg-nebula-900 border border-purple-500 rounded-xl p-6 relative animate-fade-in shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                        <div className="flex justify-between items-center mb-6 border-b border-nebula-800 pb-4">
                            <h3 className="text-lg font-bold text-white">
                                {servers.find(s => s.id === editingId) ? 'Edit Server' : 'New Server'}
                            </h3>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Server Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 focus:border-purple-500 outline-none" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Type</label>
                                        <select 
                                            value={editForm.type}
                                            onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                                            className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 outline-none"
                                        >
                                            <option>Venv</option>
                                            <option>Llama.cpp</option>
                                            <option>Ollama</option>
                                            <option>TGI</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">OS Platform</label>
                                        <select 
                                            value={editForm.os}
                                            onChange={e => setEditForm({...editForm, os: e.target.value as any})}
                                            className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 outline-none"
                                        >
                                            <option>Ubuntu</option>
                                            <option>Windows</option>
                                            <option>MacOS</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Executable / Activate Path</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={editForm.path} 
                                            onChange={e => setEditForm({...editForm, path: e.target.value})}
                                            className="flex-1 bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 font-mono text-xs focus:border-purple-500 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Host</label>
                                        <input 
                                            type="text" 
                                            value={editForm.host} 
                                            onChange={e => setEditForm({...editForm, host: e.target.value})}
                                            className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 font-mono focus:border-purple-500 outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Port</label>
                                        <input 
                                            type="number" 
                                            value={editForm.port} 
                                            onChange={e => setEditForm({...editForm, port: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 font-mono focus:border-purple-500 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Acceleration</label>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                        {['ROCm', 'CUDA', 'Vulkan', 'HYPR-RX', 'CPU'].map(acc => (
                                            <button 
                                                key={acc}
                                                onClick={() => setEditForm({...editForm, acceleration: acc as any})}
                                                className={`px-3 py-1 rounded text-xs border transition-all ${editForm.acceleration === acc ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-950 border-nebula-800 text-gray-400'}`}
                                            >
                                                {acc}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                 <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Installed Packages</label>
                                    <div className="bg-nebula-950 border border-nebula-800 rounded p-2 mt-1 min-h-[80px] flex flex-wrap gap-2">
                                        {editForm.packages.map(pkg => (
                                            <span key={pkg} className="px-2 py-1 bg-nebula-900 border border-nebula-700 rounded text-xs text-gray-300 flex items-center gap-1">
                                                {pkg}
                                                <X size={10} className="cursor-pointer hover:text-red-400" onClick={() => removePackage(pkg)} />
                                            </span>
                                        ))}
                                        <button onClick={handleAddPackage} className="px-2 py-1 bg-nebula-900 border border-nebula-700 border-dashed rounded text-xs text-gray-500 hover:text-white flex items-center gap-1">
                                            <Plus size={10} /> Add
                                        </button>
                                    </div>
                                </div>
                                 <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Startup Flags / Code</label>
                                    <textarea 
                                        value={editForm.startupFlags}
                                        onChange={e => setEditForm({...editForm, startupFlags: e.target.value})}
                                        className="w-full h-20 bg-nebula-950 border border-nebula-800 rounded p-2 text-white mt-1 font-mono text-xs focus:border-purple-500 outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Compatible Models</label>
                                    <div className="max-h-[150px] overflow-y-auto bg-nebula-950 border border-nebula-800 rounded p-2 mt-1 space-y-1">
                                        {models.map(m => (
                                            <div 
                                                key={m.id} 
                                                onClick={() => toggleCompatibleModel(m.id)}
                                                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${editForm.compatibleModels.includes(m.id) ? 'bg-purple-900/30 text-purple-300' : 'hover:bg-nebula-900 text-gray-400'}`}
                                            >
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${editForm.compatibleModels.includes(m.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>
                                                    {editForm.compatibleModels.includes(m.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs">{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-nebula-800">
                             <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                             <button onClick={handleSave} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm shadow-lg flex items-center gap-2">
                                <Check size={16} /> Save Server
                             </button>
                        </div>
                    </div>
                )}

                {/* Server List */}
                {servers.map(server => (
                    <div key={server.id} className="bg-nebula-900 border border-nebula-700 rounded-xl p-5 hover:border-purple-500/50 transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                 <div className="p-3 bg-nebula-950 rounded-lg border border-nebula-800 text-gray-300">
                                     {getOsIcon(server.os)}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-200">{server.name}</h3>
                                     <div className="flex items-center gap-2 mt-1">
                                         <span className={`w-2 h-2 rounded-full ${server.status === 'Online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`}></span>
                                         <span className="text-xs text-gray-500">{server.status}</span>
                                         <span className="text-xs text-gray-600">•</span>
                                         <span className="text-xs text-gray-500">{server.host}:{server.port}</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(server)} className="p-1.5 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Settings size={14}/></button>
                                <button onClick={() => onDeleteServer(server.id)} className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"><X size={14}/></button>
                             </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                             <span className="px-2 py-1 bg-nebula-950 border border-nebula-800 rounded text-xs text-gray-400 font-mono flex items-center gap-1">
                                 {server.type === 'Venv' ? <Package size={10} /> : <Terminal size={10} />}
                                 {server.type}
                             </span>
                             <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getAccelColor(server.acceleration)}`}>
                                 <Zap size={10} /> {server.acceleration}
                             </span>
                        </div>

                        <div className="bg-nebula-950/50 rounded-lg p-3 text-xs font-mono text-gray-500 mb-4 overflow-hidden text-ellipsis whitespace-nowrap border border-nebula-800/50">
                            {server.path || "No path configured"}
                        </div>

                        <div className="flex-1">
                             <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1"><Layers size={10} /> Configured Models</div>
                             <div className="flex flex-wrap gap-1">
                                {server.compatibleModels.length > 0 ? (
                                    server.compatibleModels.slice(0, 3).map(mid => {
                                        const m = models.find(mod => mod.id === mid);
                                        return (
                                            <span key={mid} className="px-2 py-0.5 bg-nebula-800 rounded text-[10px] text-gray-300 border border-nebula-700">
                                                {m?.name || mid}
                                            </span>
                                        );
                                    })
                                ) : (
                                    <span className="text-[10px] text-gray-600 italic">No specific models linked</span>
                                )}
                                {server.compatibleModels.length > 3 && (
                                    <span className="px-2 py-0.5 bg-nebula-800 rounded text-[10px] text-gray-500 border border-nebula-700">+{server.compatibleModels.length - 3}</span>
                                )}
                             </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-nebula-800 flex gap-2">
                             <button className="flex-1 py-1.5 bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-900/30 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                 <Play size={12} /> Start
                             </button>
                             <button className="flex-1 py-1.5 bg-nebula-800 border border-nebula-700 text-gray-300 hover:bg-nebula-700 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                 <Square size={12} fill="currentColor" /> Stop
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
