
import React, { useState } from 'react';
import { Model, ModelVersion, ServerProfile, BenchmarkResult } from '../types';
import { GitBranch, Box, FileCode, Tag, ExternalLink, Cpu, Terminal, Scale, X, BarChart2, Filter, Check, Server, FileText, Activity, Plus, RefreshCw, Trash2, Layers, Zap, Merge, Scissors, User, FlaskConical, Beaker, Database } from 'lucide-react';

interface ModelsProps {
  models: Model[];
  servers: ServerProfile[];
  benchmarks: BenchmarkResult[];
}

type ModelCategory = 'All' | 'Base' | 'Fine-Tuned' | 'Distilled' | 'Merged' | 'Custom';

export const Models: React.FC<ModelsProps> = ({ models, servers, benchmarks }) => {
  // Local state for models allows us to add tags dynamically in the UI
  const [localModels, setLocalModels] = useState<Model[]>(models);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'versions' | 'docs' | 'benchmarks' | 'engineering'>('overview');
  const [newTag, setNewTag] = useState('');

  // View Category State
  const [viewCategory, setViewCategory] = useState<ModelCategory>('All');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>('All');
  const [filterFamily, setFilterFamily] = useState<string>('All');
  const [filterTensor, setFilterTensor] = useState<string>('All');
  const [filterTag, setFilterTag] = useState<string>('All');

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

  const handleAddTag = () => {
      if (!newTag.trim() || !selectedModel) return;
      const tag = newTag.trim();
      
      // Update local models state
      const updatedModels = localModels.map(m => 
          m.id === selectedModel.id 
          ? { ...m, tags: [...m.tags, tag] } 
          : m
      );
      setLocalModels(updatedModels);
      
      // Update currently selected model to reflect change immediately
      setSelectedModel({
          ...selectedModel,
          tags: [...selectedModel.tags, tag]
      });
      setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
      if (!selectedModel) return;
      
      const updatedModels = localModels.map(m => 
          m.id === selectedModel.id 
          ? { ...m, tags: m.tags.filter(t => t !== tagToRemove) } 
          : m
      );
      setLocalModels(updatedModels);
      
      setSelectedModel({
          ...selectedModel,
          tags: selectedModel.tags.filter(t => t !== tagToRemove)
      });
  };

  const clearFilters = () => {
      setSearchQuery('');
      setFilterProvider('All');
      setFilterFamily('All');
      setFilterTensor('All');
      setFilterTag('All');
  };

  // Derived filter options from LOCAL models to include new tags
  const providers = ['All', ...Array.from(new Set(localModels.map(m => m.provider)))];
  const families = ['All', ...Array.from(new Set(localModels.map(m => m.family)))];
  const tensors = ['All', ...Array.from(new Set(localModels.map(m => m.tensorType)))];
  const availableTags = ['All', ...Array.from(new Set(localModels.flatMap(m => m.tags)))];

  const filteredModels = localModels.filter(m => {
      // 1. Category Filter
      let categoryMatch = true;
      if (viewCategory === 'Base') categoryMatch = m.tags.includes('Base');
      else if (viewCategory === 'Fine-Tuned') categoryMatch = m.tags.some(t => ['Fine-Tuned', 'SFT', 'LoRA'].includes(t));
      else if (viewCategory === 'Distilled') categoryMatch = m.tags.some(t => ['Distilled', 'Distill'].includes(t));
      else if (viewCategory === 'Merged') categoryMatch = m.tags.some(t => ['Merged', 'Fusion'].includes(t));
      else if (viewCategory === 'Custom') categoryMatch = m.tags.includes('Custom');
      
      if (!categoryMatch) return false;

      // 2. Standard Filters
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterProvider !== 'All' && m.provider !== filterProvider) return false;
      if (filterFamily !== 'All' && m.family !== filterFamily) return false;
      if (filterTensor !== 'All' && m.tensorType !== filterTensor) return false;
      if (filterTag !== 'All' && !m.tags.includes(filterTag)) return false;
      return true;
  });

  const getCompatibleServers = (modelId: string) => {
      return servers.filter(s => s.compatibleModels.includes(modelId));
  };

  const getModelBenchmarks = (modelId: string) => {
      return benchmarks.filter(b => b.modelId === modelId);
  };

  const getCategoryIcon = (cat: ModelCategory) => {
      switch(cat) {
          case 'Base': return <Box size={14} />;
          case 'Fine-Tuned': return <Zap size={14} />;
          case 'Distilled': return <Scissors size={14} />;
          case 'Merged': return <Merge size={14} />;
          case 'Custom': return <User size={14} />;
          default: return <Layers size={14} />;
      }
  };

  return (
    <div className="h-full flex flex-col relative animate-fade-in p-space-lg">
      <div className="flex flex-col gap-space-md mb-space-md shrink-0">
        <div className="flex items-center gap-space-md">
            <h2 className="text-type-heading-lg font-bold">🤖 Model Registry</h2>
            <span className="text-type-tiny bg-nebula-900 text-gray-400 px-2 py-1 rounded border border-nebula-800">
                Showing {filteredModels.length} of {localModels.length}
            </span>
            {/* Import HF Button - Subtler */}
            <button className="text-type-tiny bg-nebula-900 hover:bg-nebula-800 text-purple-400 border border-nebula-700 hover:border-purple-500/50 px-3 py-1 rounded flex items-center gap-1 transition-all shadow-sm ml-auto">
                <Plus size={12} /> Import HF
            </button>
        </div>

        {/* Combined Row: Tabs + Search */}
        <div className="flex flex-wrap items-center gap-space-md border-b border-nebula-800 pb-4">
            {/* View Category Tabs */}
            <div className="flex gap-1 bg-nebula-900 p-1 rounded-lg border border-nebula-700 overflow-x-auto">
                {(['All', 'Base', 'Fine-Tuned', 'Distilled', 'Merged', 'Custom'] as ModelCategory[]).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setViewCategory(cat)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-type-caption font-medium transition-all whitespace-nowrap h-9 ${
                            viewCategory === cat 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'text-gray-400 hover:text-white hover:bg-nebula-800'
                        }`}
                    >
                        {getCategoryIcon(cat)}
                        {cat}
                    </button>
                ))}
            </div>
            
            {/* Search & Filter Bar */}
            <div className="flex gap-2 ml-auto flex-1 md:flex-none md:w-auto min-w-[200px]">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder={`Search ${viewCategory === 'All' ? '' : viewCategory} models...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 bg-nebula-900 border border-nebula-700 rounded-lg pl-4 pr-10 text-type-caption outline-none text-white focus:border-purple-500" 
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-9 px-4 rounded-lg text-type-caption border transition-colors flex items-center gap-2 ${showFilters ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-nebula-900 border-nebula-700 text-gray-400 hover:text-white'}`}
                >
                    <Filter size={14} /> Filters
                </button>
            </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 grid grid-cols-4 gap-4 animate-fade-in relative">
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Provider</label>
                    <select 
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Family</label>
                    <select 
                        value={filterFamily}
                        onChange={(e) => setFilterFamily(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {families.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Tensor Type</label>
                    <select 
                        value={filterTensor}
                        onChange={(e) => setFilterTensor(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {tensors.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Tags</label>
                    <select 
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                
                {/* Clear Button */}
                {(filterProvider !== 'All' || filterFamily !== 'All' || filterTensor !== 'All' || filterTag !== 'All' || searchQuery) && (
                    <button 
                        onClick={clearFilters}
                        className="absolute -top-3 -right-3 bg-nebula-800 text-gray-400 hover:text-white p-1.5 rounded-full border border-nebula-700 shadow-lg"
                        title="Clear all filters"
                    >
                        <RefreshCw size={12} />
                    </button>
                )}
            </div>
        )}
      </div>

      <div className="flex gap-space-lg flex-1 min-h-0 overflow-hidden">
        {/* Model List/Grid - Compact Mode */}
        <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${selectedModel ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md pb-6">
                {filteredModels.map(model => (
                    <div 
                        key={model.id} 
                        onClick={() => { setSelectedModel(model); setSelectedVersionIds(new Set()); setShowComparison(false); setDetailTab('overview'); }}
                        className={`bg-nebula-900 border ${selectedModel?.id === model.id ? 'border-purple-500 bg-purple-900/10' : 'border-nebula-700'} rounded-xl p-space-md hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col`}
                    >
                        {/* New Header Layout: Provider Badge + Name on one line */}
                        <div className="flex items-center gap-space-sm mb-2">
                            <span className="text-[10px] bg-nebula-800 text-purple-300 px-1.5 py-0.5 rounded border border-nebula-700 shrink-0">{model.provider}</span>
                            <h3 className="text-type-body font-bold text-white truncate" title={model.name}>{model.name}</h3>
                            <span className="text-gray-500 text-[10px] font-mono ml-auto shrink-0">{model.versions.length} ver</span>
                        </div>
                        
                        <p className="text-type-tiny text-gray-400 mb-3 line-clamp-2 leading-relaxed">{model.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                            {model.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-nebula-950 border border-nebula-800 text-gray-500">
                                    {tag}
                                </span>
                            ))}
                            {model.tags.length > 4 && <span className="text-[9px] text-gray-600">+{model.tags.length - 4}</span>}
                        </div>

                        {/* Footer Row */}
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-3 border-t border-nebula-800/50 mt-auto">
                             <div className="flex items-center gap-1" title="Parameter Count">
                                <Scale size={10} /> {model.params}
                             </div>
                             <div className="flex items-center gap-1" title="Tensor Type">
                                <Cpu size={10} /> {model.tensorType}
                             </div>
                             <div className="flex items-center gap-1" title="Format">
                                <GitBranch size={10} />
                                {model.versions[0]?.format || '?'}
                             </div>
                             <div className="flex items-center gap-1" title="Size">
                                <Box size={10} />
                                {model.versions[0]?.size || '?'}
                             </div>
                        </div>
                    </div>
                ))}
                
                 {/* Add New Placeholder */}
                <div className="border-2 border-dashed border-nebula-800 rounded-xl p-3 flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer min-h-[160px]">
                    <span className="text-2xl mb-1">+</span>
                    <span className="font-medium text-xs">Connect Repo</span>
                </div>
             </div>
        </div>

        {/* Model Detail & Versions View */}
        {selectedModel && (
            <div className="w-full lg:w-1/2 bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden animate-fade-in relative shadow-2xl">
                <div className="p-space-lg border-b border-nebula-800 bg-nebula-950/30">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-type-heading-md font-bold text-white">{selectedModel.name}</h2>
                            <p className="text-purple-400 text-type-caption mt-1">{selectedModel.provider} • {selectedModel.family}</p>
                        </div>
                        <button onClick={() => setSelectedModel(null)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-nebula-800 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-2 border-b border-nebula-800 overflow-x-auto">
                        <button 
                            onClick={() => setDetailTab('overview')}
                            className={`px-4 py-2 text-type-caption font-bold border-b-2 transition-colors whitespace-nowrap ${detailTab === 'overview' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setDetailTab('versions')}
                            className={`px-4 py-2 text-type-caption font-bold border-b-2 transition-colors whitespace-nowrap ${detailTab === 'versions' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Versions <span className="text-[10px] bg-nebula-800 px-1.5 rounded-full ml-1">{selectedModel.versions.length}</span>
                        </button>
                        <button 
                            onClick={() => setDetailTab('benchmarks')}
                            className={`px-4 py-2 text-type-caption font-bold border-b-2 transition-colors whitespace-nowrap ${detailTab === 'benchmarks' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Benchmarks
                        </button>
                        <button 
                            onClick={() => setDetailTab('engineering')}
                            className={`px-4 py-2 text-type-caption font-bold border-b-2 transition-colors whitespace-nowrap ${detailTab === 'engineering' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Engineering
                        </button>
                        <button 
                            onClick={() => setDetailTab('docs')}
                            className={`px-4 py-2 text-type-caption font-bold border-b-2 transition-colors whitespace-nowrap ${detailTab === 'docs' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Documentation
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-space-lg pb-20 bg-nebula-900 custom-scrollbar">
                    {detailTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                             <div className="flex gap-4 text-type-body text-gray-300">
                                <div className="flex flex-col bg-nebula-950/50 p-3 rounded border border-nebula-800 flex-1">
                                    <span className="text-type-tiny text-gray-500 uppercase font-bold">Params</span>
                                    <span className="font-mono font-bold text-white">{selectedModel.params}</span>
                                </div>
                                <div className="flex flex-col bg-nebula-950/50 p-3 rounded border border-nebula-800 flex-1">
                                    <span className="text-type-tiny text-gray-500 uppercase font-bold">Tensor</span>
                                    <span className="font-mono font-bold text-white">{selectedModel.tensorType}</span>
                                </div>
                                <div className="flex flex-col bg-nebula-950/50 p-3 rounded border border-nebula-800 flex-1">
                                    <span className="text-type-tiny text-gray-500 uppercase font-bold">Last Used</span>
                                    <span className="font-mono font-bold text-white">{selectedModel.lastUsed}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2">Description</h4>
                                <p className="text-gray-300 text-type-body leading-relaxed bg-nebula-950/30 p-4 rounded border border-nebula-800/50">{selectedModel.description}</p>
                            </div>

                            {/* Tag Management */}
                            <div>
                                <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Tag size={12}/> Custom Tags</h4>
                                <div className="flex flex-wrap gap-2 items-center bg-nebula-950 border border-nebula-800 p-3 rounded-lg">
                                    {selectedModel.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-nebula-800 border border-nebula-700 text-gray-300 flex items-center gap-1 group">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1 bg-nebula-900 border border-nebula-800 rounded px-2 py-1 focus-within:border-purple-500 transition-colors">
                                        <Plus size={12} className="text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder="Add tag..." 
                                            className="bg-transparent border-none outline-none text-xs text-white w-20"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2">External Links</h4>
                                {selectedModel.links.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {selectedModel.links.map((link, i) => (
                                            <a 
                                                key={i} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-nebula-800 hover:bg-nebula-700 border border-nebula-700 px-3 py-2 rounded-md text-sm transition-colors text-purple-300 hover:text-white"
                                            >
                                                <ExternalLink size={14} />
                                                {link.type}
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-nebula-800 rounded-lg p-6 flex flex-col items-center justify-center text-gray-600">
                                        <ExternalLink size={24} className="mb-2 opacity-50" />
                                        <p className="text-type-caption">No external repositories linked.</p>
                                        <p className="text-type-tiny mt-1">Connect GitHub or HuggingFace to view resources.</p>
                                    </div>
                                )}
                            </div>

                            {/* Compatible Servers Section */}
                            <div>
                                <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2">Compatible Servers</h4>
                                <div className="bg-nebula-950 border border-nebula-800 rounded-lg p-3">
                                    <div className="flex flex-wrap gap-2">
                                        {getCompatibleServers(selectedModel.id).length > 0 ? (
                                            getCompatibleServers(selectedModel.id).map(srv => (
                                                <div key={srv.id} className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs font-bold">
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
                        </div>
                    )}

                    {detailTab === 'benchmarks' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-400">
                                    <Activity size={16} />
                                    Performance History
                                </h3>
                            </div>
                            
                            {getModelBenchmarks(selectedModel.id).length > 0 ? (
                                <div className="bg-nebula-950 border border-nebula-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-nebula-900 text-gray-500 font-bold uppercase">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">Version</th>
                                                <th className="px-4 py-3 text-left">Dataset</th>
                                                <th className="px-4 py-3 text-left">Metric</th>
                                                <th className="px-4 py-3 text-right">Score</th>
                                                <th className="px-4 py-3 text-right">Latency</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-nebula-800 text-gray-300">
                                            {getModelBenchmarks(selectedModel.id).map(bench => (
                                                <tr key={bench.id} className="hover:bg-nebula-900/50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-gray-500">{bench.date}</td>
                                                    <td className="px-4 py-3">{bench.versionId}</td>
                                                    <td className="px-4 py-3">{bench.dataset}</td>
                                                    <td className="px-4 py-3 text-purple-300">{bench.metric}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-400">{bench.score}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-blue-300">{bench.latency}ms</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-nebula-800 rounded-lg text-gray-600">
                                    <Activity size={32} className="mb-2 opacity-50" />
                                    <p>No benchmark results found for this model.</p>
                                    <button className="mt-4 text-purple-400 text-xs font-bold hover:text-purple-300">RUN BENCHMARK</button>
                                </div>
                            )}
                        </div>
                    )}

                    {detailTab === 'engineering' && (
                        <div className="space-y-space-lg animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-400">
                                    <FlaskConical size={16} />
                                    Laboratory & Engineering Assets
                                </h3>
                            </div>

                            {/* Section: Fine-Tunes */}
                            <div className="space-y-space-sm">
                                <h4 className="text-type-tiny font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2"><Zap size={12}/> Associated Fine-Tunes</h4>
                                <div className="grid grid-cols-1 gap-space-sm">
                                    <div className="bg-nebula-950 border border-nebula-800 p-space-md rounded-lg flex justify-between items-center group cursor-pointer hover:border-purple-500/50">
                                        <div className="flex items-center gap-space-md">
                                            <div className="p-2 bg-purple-900/20 text-purple-400 rounded"><Database size={16}/></div>
                                            <div>
                                                <div className="text-type-body font-bold text-white group-hover:text-purple-300 transition-colors">Legal-SFT-v3</div>
                                                <div className="text-type-tiny text-gray-500">Created 2 days ago • Dataset: Legal-FLSA</div>
                                            </div>
                                        </div>
                                        <span className="text-type-tiny bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-900/30">Ready</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Adapters */}
                            <div className="space-y-space-sm">
                                <h4 className="text-type-tiny font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2"><Layers size={12}/> LoRA Adapters</h4>
                                <div className="bg-nebula-950 border border-nebula-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-type-tiny">
                                        <thead className="bg-nebula-900 text-gray-500 font-bold uppercase">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Adapter Name</th>
                                                <th className="px-4 py-2 text-left">Rank</th>
                                                <th className="px-4 py-2 text-right">Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-nebula-800 text-gray-300">
                                            <tr className="hover:bg-nebula-900/30">
                                                <td className="px-4 py-2 font-mono">finance-adapter-r16</td>
                                                <td className="px-4 py-2">16</td>
                                                <td className="px-4 py-2 text-right text-gray-500">45MB</td>
                                            </tr>
                                            <tr className="hover:bg-nebula-900/30">
                                                <td className="px-4 py-2 font-mono">chat-dpo-r32</td>
                                                <td className="px-4 py-2">32</td>
                                                <td className="px-4 py-2 text-right text-gray-500">92MB</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section: Experiments */}
                            <div className="space-y-space-sm">
                                <h4 className="text-type-tiny font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2"><Beaker size={12}/> Active Experiments</h4>
                                <div className="bg-nebula-950/50 border border-dashed border-nebula-800 p-4 rounded-lg flex flex-col items-center justify-center text-gray-600">
                                    <p className="text-type-body font-medium">No active training jobs linked.</p>
                                    <button className="mt-2 text-type-tiny bg-nebula-900 hover:bg-nebula-800 text-purple-400 px-3 py-1 rounded transition-colors">Start New Experiment</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailTab === 'versions' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-400">
                                    <GitBranch size={16} />
                                    Available Checkpoints
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

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-400 bg-nebula-900/50 p-3 rounded mb-3">
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
                                                    <span className="block text-gray-600">Speed</span>
                                                    <span className="font-mono text-blue-400 font-bold">{ver.metrics.tokensPerSecond ? `${ver.metrics.tokensPerSecond} t/s` : '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-600">Latency (GPU)</span>
                                                    <span className="font-mono text-gray-300">{ver.metrics.latencyMs} ms</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-600">VRAM</span>
                                                    <span className="font-mono text-gray-300">{ver.metrics.vramGB} GB</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-600">Perplexity</span>
                                                    <span className="font-mono text-gray-300">{ver.metrics.perplexity || '-'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className="flex-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 py-1.5 rounded text-xs transition-colors"
                                        >
                                            Load to Server
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {detailTab === 'docs' && (
                        <div className="space-y-4 animate-fade-in h-full flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-400">
                                    <FileText size={16} />
                                    Model Documentation
                                </h3>
                                <button className="text-xs bg-nebula-800 hover:bg-nebula-700 px-3 py-1.5 rounded text-gray-300 border border-nebula-700">
                                    Edit Markdown
                                </button>
                            </div>
                            
                            <div className="flex-1 bg-nebula-950 border border-nebula-800 rounded-lg p-6 overflow-y-auto">
                                {selectedModel.documentation ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: selectedModel.documentation.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1 class="text-xl font-bold mb-4 text-purple-300">$1</h1>').replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-4 mb-2 text-purple-200">$1</h2>').replace(/```python([\s\S]*?)```/g, '<pre class="bg-gray-900 p-3 rounded my-2 text-xs font-mono text-green-400">$1</pre>') }} />
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                                        <FileText size={48} className="mb-4" />
                                        <p>No documentation available for this model.</p>
                                        <button className="mt-4 text-purple-400 hover:text-purple-300 text-sm underline">Add README</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Token Speed (t/s)</td>
                                                {getSelectedVersions().map(v => (
                                                    <td key={v.id} className="px-4 py-3 border-l border-nebula-800 font-mono font-bold text-blue-400">
                                                        {v.metrics?.tokensPerSecond ? v.metrics.tokensPerSecond.toFixed(1) : '-'}
                                                    </td>
                                                ))}
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
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Perplexity</td>
                                                {getSelectedVersions().map(v => (
                                                    <td key={v.id} className="px-4 py-3 border-l border-nebula-800 font-mono">
                                                        {v.metrics?.perplexity ? v.metrics.perplexity.toFixed(2) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium bg-nebula-950/50">Accuracy (MMLU)</td>
                                                {getSelectedVersions().map(v => (
                                                    <td key={v.id} className="px-4 py-3 border-l border-nebula-800 font-mono">
                                                        {v.metrics?.accuracy ? `${v.metrics.accuracy}%` : '-'}
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
