
import React, { useState } from 'react';
import { Model, ModelVersion, ServerProfile } from '../types';
import { GitBranch, Box, FileCode, Tag, ExternalLink, Cpu, Terminal, Scale, X, BarChart2, Filter, Check, Server } from 'lucide-react';

interface ModelsProps {
  models: Model[];
  servers: ServerProfile[];
}

export const Models: React.FC<ModelsProps> = ({ models, servers }) => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>('All');
  const [filterFamily, setFilterFamily] = useState<string>('All');
  const [filterTensor, setFilterTensor] = useState<string>('All');

  const toggleVersionSelection = (id: string) => {
    const next = new Set(selectedVersionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedVersionIds(next);
  };

  const getSelectedVersions = () => {
    if (!selectedModel) return [];
    return selectedModel.versions.filter(v => selectedVersionIds.has(v.id));
  };

  // Derived filter options
  const providers = ['All', ...Array.from(new Set(models.map(m => m.provider)))];
  const families = ['All', ...Array.from(new Set(models.map(m => m.family)))];
  const tensors = ['All', ...Array.from(new Set(models.map(m => m.tensorType)))];

  const filteredModels = models.filter(m => {
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterProvider !== 'All' && m.provider !== filterProvider) return false;
      if (filterFamily !== 'All' && m.family !== filterFamily) return false;
      if (filterTensor !== 'All' && m.tensorType !== filterTensor) return false;
      return true;
  });

  const getCompatibleServers = (modelId: string) => {
      return servers.filter(s => s.compatibleModels.includes(modelId));
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🤖 Model Registry</h2>
            <div className="flex gap-2">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search models..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-nebula-900 border border-nebula-700 rounded-lg pl-4 pr-10 py-2 text-sm outline-none text-white focus:border-purple-500 min-w-[300px]" 
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${showFilters ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-900 border-nebula-700 text-gray-400 hover:text-white'}`}
                >
                    <Filter size={16} /> Filters
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-500 flex items-center gap-2">
                    <span>+</span> Import HF
                </button>
            </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 grid grid-cols-3 gap-4 animate-fade-in">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Provider</label>
                    <select 
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-gray-300 outline-none focus:border-purple-500"
                    >
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Family</label>
                    <select 
                        value={filterFamily}
                        onChange={(e) => setFilterFamily(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-gray-300 outline-none focus:border-purple-500"
                    >
                        {families.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Tensor Type</label>
                    <select 
                        value={filterTensor}
                        onChange={(e) => setFilterTensor(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-gray-300 outline-none focus:border-purple-500"
                    >
                        {tensors.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
        )}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Model List/Grid */}
        <div className={`flex-1 overflow-y-auto ${selectedModel ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModels.map(model => (
                    <div 
                        key={model.id} 
                        onClick={() => { setSelectedModel(model); setSelectedVersionIds(new Set()); setShowComparison(false); }}
                        className={`bg-nebula-900 border ${selectedModel?.id === model.id ? 'border-purple-500' : 'border-nebula-700'} rounded-xl p-5 hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs bg-nebula-800 text-purple-300 px-2 py-1 rounded border border-nebula-700">{model.provider}</span>
                            <span className="text-gray-500 text-xs font-mono">{model.versions.length} versions</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{model.name}</h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                             <span className="text-xs flex items-center gap-1 bg-nebula-950 px-2 py-0.5 rounded border border-nebula-800 text-gray-300" title="Parameter Count">
                                <Scale size={10} /> {model.params}
                             </span>
                             <span className="text-xs flex items-center gap-1 bg-nebula-950 px-2 py-0.5 rounded border border-nebula-800 text-gray-300" title="Tensor Type">
                                <Cpu size={10} /> {model.tensorType}
                             </span>
                        </div>

                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{model.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {model.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-nebula-950 border border-nebula-800 text-gray-400">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-nebula-800">
                             <div className="flex items-center gap-1">
                                <GitBranch size={14} />
                                {model.versions[0]?.format || 'Unknown'}
                             </div>
                             <div className="flex items-center gap-1">
                                <Box size={14} />
                                {model.versions[0]?.size || 'Unknown'}
                             </div>
                        </div>
                    </div>
                ))}
                
                 {/* Add New Placeholder */}
                <div className="border-2 border-dashed border-nebula-800 rounded-xl p-5 flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer min-h-[200px]">
                    <span className="text-4xl mb-2">+</span>
                    <span className="font-medium">Connect Repo</span>
                </div>
             </div>
        </div>

        {/* Model Detail & Versions View */}
        {selectedModel && (
            <div className="w-full lg:w-1/2 bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden animate-fade-in relative">
                <div className="p-6 border-b border-nebula-800 bg-nebula-950/30">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
                            <p className="text-purple-400 text-sm">{selectedModel.provider} • {selectedModel.family}</p>
                        </div>
                        <button onClick={() => setSelectedModel(null)} className="lg:hidden text-gray-400 hover:text-white">Close</button>
                    </div>
                    
                    <div className="flex gap-4 mb-4 text-sm text-gray-300">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase">Params</span>
                            <span className="font-mono">{selectedModel.params}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase">Tensor</span>
                            <span className="font-mono">{selectedModel.tensorType}</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase">Last Used</span>
                            <span className="font-mono">{selectedModel.lastUsed}</span>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">{selectedModel.description}</p>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                        {selectedModel.links.map((link, i) => (
                            <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-nebula-800 hover:bg-nebula-700 border border-nebula-700 px-3 py-1.5 rounded-md text-xs transition-colors"
                            >
                                <ExternalLink size={12} />
                                {link.type}
                            </a>
                        ))}
                    </div>

                    {/* Compatible Servers Section */}
                    <div className="bg-nebula-900 border border-nebula-800 rounded-lg p-3">
                         <div className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-2">
                             <Server size={12} /> Compatible Servers
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {getCompatibleServers(selectedModel.id).length > 0 ? (
                                 getCompatibleServers(selectedModel.id).map(srv => (
                                     <div key={srv.id} className="flex items-center gap-2 px-2 py-1 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                         {srv.name}
                                     </div>
                                 ))
                             ) : (
                                 <span className="text-xs text-gray-600 italic">No configured servers explicitly support this model.</span>
                             )}
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pb-20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <GitBranch size={18} className="text-purple-500" />
                            Version History
                        </h3>
                        
                        {selectedVersionIds.size > 1 && (
                             <button 
                                onClick={() => setShowComparison(true)}
                                className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold animate-fade-in"
                            >
                                <BarChart2 size={12} /> Compare ({selectedVersionIds.size})
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {selectedModel.versions.map((ver) => (
                            <div 
                                key={ver.id} 
                                onClick={() => toggleVersionSelection(ver.id)}
                                className={`bg-nebula-950 border rounded-lg p-4 transition-all cursor-pointer relative ${selectedVersionIds.has(ver.id) ? 'border-purple-500 bg-purple-900/10' : 'border-nebula-800 hover:border-purple-500/30'}`}
                            >
                                <div className="absolute top-4 right-4">
                                     <input 
                                        type="checkbox" 
                                        checked={selectedVersionIds.has(ver.id)} 
                                        onChange={() => {}}
                                        className="accent-purple-500 w-4 h-4 cursor-pointer" 
                                     />
                                </div>

                                <div className="flex justify-between items-start mb-3 pr-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-nebula-900 rounded text-purple-400">
                                            {ver.format === 'GGUF' ? <Box size={16} /> : ver.format === 'Ollama' ? <Terminal size={16} /> : <FileCode size={16} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-200">{ver.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono">{ver.id} • {ver.created}</p>
                                        </div>
                                    </div>
                                    <div className="text-right mr-6">
                                        <span className={`text-xs px-2 py-0.5 rounded ${ver.status === 'Ready' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {ver.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 bg-nebula-900/50 p-3 rounded mb-3">
                                    <div>
                                        <span className="block text-gray-600">Quantization</span>
                                        <span className="font-mono text-gray-300">{ver.quantization}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-600">Size</span>
                                        <span className="font-mono text-gray-300">{ver.size}</span>
                                    </div>
                                    {ver.metrics && (
                                        <>
                                            <div>
                                                <span className="block text-gray-600">Latency (GPU)</span>
                                                <span className="font-mono text-gray-300">{ver.metrics.latencyMs} ms</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-600">VRAM</span>
                                                <span className="font-mono text-gray-300">{ver.metrics.vramGB} GB</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="flex-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 py-1.5 rounded text-xs transition-colors"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison Overlay */}
                {showComparison && (
                    <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-sm z-20 flex flex-col animate-fade-in">
                        <div className="p-4 border-b border-nebula-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart2 className="text-purple-500" /> Compare Versions</h3>
                            <button onClick={() => setShowComparison(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="flex-1 p-6 overflow-x-auto">
                            <div className="min-w-full inline-block align-middle">
                                <div className="bg-nebula-900 border border-nebula-700 rounded-xl overflow-hidden">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-nebula-950 text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Metric</th>
                                                {getSelectedVersions().map(v => (
                                                    <th key={v.id} className="px-4 py-3 text-left font-mono text-purple-300 border-l border-nebula-800">{v.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-nebula-800 text-gray-300">
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Format</td>
                                                {getSelectedVersions().map(v => <td key={v.id} className="px-4 py-3 border-l border-nebula-800">{v.format}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Quantization</td>
                                                {getSelectedVersions().map(v => <td key={v.id} className="px-4 py-3 border-l border-nebula-800 font-mono">{v.quantization}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Size</td>
                                                {getSelectedVersions().map(v => <td key={v.id} className="px-4 py-3 border-l border-nebula-800 font-mono">{v.size}</td>)}
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">VRAM Usage</td>
                                                {getSelectedVersions().map(v => (
                                                    <td key={v.id} className={`px-4 py-3 border-l border-nebula-800 font-mono ${v.metrics?.vramGB && v.metrics.vramGB < 4 ? 'text-green-400' : ''}`}>
                                                        {v.metrics?.vramGB ? `${v.metrics.vramGB} GB` : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Latency (Est.)</td>
                                                {getSelectedVersions().map(v => (
                                                    <td key={v.id} className={`px-4 py-3 border-l border-nebula-800 font-mono ${v.metrics?.latencyMs && v.metrics.latencyMs < 500 ? 'text-green-400' : ''}`}>
                                                        {v.metrics?.latencyMs ? `${v.metrics.latencyMs} ms` : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
