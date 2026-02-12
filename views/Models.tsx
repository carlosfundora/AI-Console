import React, { useState } from 'react';
import { Model, ModelVersion, ServerProfile, BenchmarkResult } from '../types';
import { GitBranch, Box, FileCode, Tag, ExternalLink, Cpu, Terminal, Scale, X, BarChart2, Filter, Check, Server, FileText, Activity, Plus, RefreshCw, Trash2, Layers, Zap, Merge, Scissors, User, FlaskConical, Beaker, Database, ArrowLeftRight, TrendingUp, Play, Loader2, BrainCircuit, Eraser, HardDrive, LayoutTemplate, ScanLine, ArrowUp, ArrowDown, Minus, Settings } from 'lucide-react';

interface ModelsProps {
  models: Model[];
  servers: ServerProfile[];
  benchmarks: BenchmarkResult[];
  onAddBenchmark: (result: BenchmarkResult) => void;
}

type ModelCategory = 'All' | 'Base' | 'Fine-Tuned' | 'Distilled' | 'Merged' | 'Custom';

export const Models: React.FC<ModelsProps> = ({ models, servers, benchmarks, onAddBenchmark }) => {
  // Local state for models allows us to add tags dynamically in the UI
  const [localModels, setLocalModels] = useState<Model[]>(models);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'versions' | 'docs' | 'benchmarks' | 'engineering'>('overview');
  const [newTag, setNewTag] = useState('');
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Drag and Drop Comparison State
  const [draggingModelId, setDraggingModelId] = useState<string | null>(null);
  const [comparisonPair, setComparisonPair] = useState<[Model, Model] | null>(null);

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

  const handleRunBenchmark = () => {
      if (!selectedModel) return;
      setIsBenchmarking(true);
      
      // Simulate benchmark run
      setTimeout(() => {
          const newResult: BenchmarkResult = {
              id: `b-${Date.now()}`,
              modelId: selectedModel.id,
              versionId: selectedModel.versions[0]?.id || 'unknown',
              dataset: 'Standard-1K',
              score: Math.floor(Math.random() * 20) + 80, // 80-99
              latency: Math.floor(Math.random() * 50) + 20, // 20-70ms
              tokensPerSecond: Math.random() * 50 + 40, // 40-90 t/s
              hardware: 'GPU',
              hardwareName: 'Simulated GPU',
              date: new Date().toISOString().split('T')[0],
              metric: 'Throughput',
              type: 'Core',
              notes: 'Manual Run'
          };
          onAddBenchmark(newResult);
          setIsBenchmarking(false);
      }, 2000);
  };

  const handlePruneCheckpoints = () => {
      if (confirm("Are you sure you want to delete all intermediate checkpoints? This will keep only the best/final versions.")) {
          alert("Pruning process initiated. Reclaiming disk space...");
      }
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

  // Helper for Architecture display
  const getArchitecture = (family: string) => {
      if (family === 'Llama') return 'LlamaForCausalLM';
      if (family === 'Mistral') return 'MistralForCausalLM';
      if (family === 'Gemma') return 'GemmaForCausalLM';
      if (family === 'Bert') return 'BertModel';
      return 'Transformer (Decoder-Only)';
  };

  // Helper to estimate GPU layers based on params (heuristic)
  const estimateGpuLayers = (params: string) => {
      if (params.includes('70B')) return 80;
      if (params.includes('7B')) return 32;
      if (params.includes('13B')) return 40;
      if (params.includes('1.2B')) return 22;
      return 'N/A';
  };

  // --- Drag and Drop Logic ---
  const onDragStart = (e: React.DragEvent, modelId: string) => {
    setDraggingModelId(modelId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent, targetModelId: string) => {
    e.preventDefault();
    if (draggingModelId && draggingModelId !== targetModelId) {
      const modelA = localModels.find(m => m.id === draggingModelId);
      const modelB = localModels.find(m => m.id === targetModelId);
      if (modelA && modelB) {
        setComparisonPair([modelA, modelB]);
      }
    }
    setDraggingModelId(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // --- Comparison Helper ---
  const ComparisonMetric = ({ label, value, otherValue, unit, lowerIsBetter = false }: { label: string, value?: number, otherValue?: number, unit: string, lowerIsBetter?: boolean }) => {
      if (value === undefined) return <div><span className="text-gray-500 block">{label}</span><span className="text-gray-500">-</span></div>;
      
      let colorClass = 'text-white';
      let Icon = null;

      if (otherValue !== undefined) {
          const diff = value - otherValue;
          const isBetter = lowerIsBetter ? diff < 0 : diff > 0;
          const isTie = diff === 0;

          if (isTie) {
              colorClass = 'text-yellow-400';
              Icon = <Minus size={12} />;
          } else if (isBetter) {
              colorClass = 'text-green-400';
              Icon = lowerIsBetter ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
          } else {
              colorClass = 'text-red-400';
              Icon = lowerIsBetter ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
          }
      }

      return (
          <div>
              <span className="text-gray-500 block">{label}</span>
              <div className={`flex items-center gap-1 font-mono font-bold ${colorClass}`}>
                  {value} {unit}
                  {Icon}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col relative animate-fade-in p-space-lg">
      <div className="flex flex-col gap-space-md mb-space-md shrink-0">
        <div className="flex items-center gap-space-md">
            <h2 className="text-type-heading-lg font-bold text-white flex items-center gap-space-sm">
                <BrainCircuit className="text-purple-500" /> Model Registry
            </h2>
            <span className="text-type-tiny bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/5">
                Showing {filteredModels.length} of {localModels.length}
            </span>
            <div className="ml-4 text-type-tiny text-gray-500 italic hidden lg:block">
              Drag a model onto another to compare metrics side-by-side
            </div>
            <button className="text-type-tiny bg-nebula-900 hover:bg-nebula-800 text-purple-400 border border-nebula-700 hover:border-purple-500/50 px-3 py-1 rounded flex items-center gap-1 transition-all shadow-sm ml-auto">
                <Plus size={12} /> Import HF
            </button>
        </div>

        {/* Combined Row: Tabs + Search */}
        <div className="flex flex-wrap items-center gap-space-md border-b border-white/5 pb-4">
            {/* View Category Tabs */}
            <div className="flex gap-1 bg-nebula-900 p-1 rounded-lg border border-white/5 overflow-x-auto">
                {(['All', 'Base', 'Fine-Tuned', 'Distilled', 'Merged', 'Custom'] as ModelCategory[]).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setViewCategory(cat)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-type-caption font-medium transition-all whitespace-nowrap h-9 ${
                            viewCategory === cat 
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-inner' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                        className="w-full h-9 bg-nebula-900 border border-white/10 rounded-lg pl-4 pr-10 text-type-caption outline-none text-white focus:border-purple-500 placeholder-gray-600" 
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-9 px-4 rounded-lg text-type-caption border transition-colors flex items-center gap-2 ${showFilters ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-nebula-900 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <Filter size={14} /> Filters
                </button>
            </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 grid grid-cols-4 gap-4 animate-fade-in relative shadow-lg">
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Provider</label>
                    <select 
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Family</label>
                    <select 
                        value={filterFamily}
                        onChange={(e) => setFilterFamily(e.target.value)}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {families.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Tensor Type</label>
                    <select 
                        value={filterTensor}
                        onChange={(e) => setFilterTensor(e.target.value)}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        {tensors.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-type-tiny text-gray-500 uppercase font-bold block mb-1">Tags</label>
                    <select 
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-type-caption text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
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
        {/* Model List/Grid - Always Full Width */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar w-full">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md pb-6">
                {filteredModels.map(model => (
                    <div 
                        key={model.id} 
                        draggable
                        onDragStart={(e) => onDragStart(e, model.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, model.id)}
                        onClick={() => { setSelectedModel(model); setSelectedVersionIds(new Set()); setShowComparison(false); setDetailTab('overview'); }}
                        className={`bg-gradient-to-b from-nebula-900 to-nebula-950 border ${draggingModelId === model.id ? 'border-purple-500 opacity-50 scale-95' : 'border-white/5'} rounded-xl p-space-md hover:border-purple-500/40 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col shadow-lg hover:shadow-[0_0_15px_rgba(124,58,237,0.05)] h-full`}
                    >
                        {/* New Header Layout: Provider Badge + Name on one line */}
                        <div className="flex items-center gap-space-sm mb-2">
                            <span className="text-[10px] bg-white/5 text-purple-300 px-1.5 py-0.5 rounded border border-white/5 shrink-0 font-bold">{model.provider}</span>
                            <h3 className="text-type-body font-bold text-white truncate" title={model.name}>{model.name}</h3>
                            <span className="text-gray-500 text-[10px] font-mono ml-auto shrink-0">{model.versions.length} ver</span>
                        </div>
                        
                        <p className="text-type-tiny text-gray-400 mb-3 line-clamp-2 leading-relaxed">{model.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3 mt-auto">
                            {model.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-nebula-950 border border-white/5 text-gray-500">
                                    {tag}
                                </span>
                            ))}
                            {model.tags.length > 4 && <span className="text-[9px] text-gray-600">+{model.tags.length - 4}</span>}
                        </div>

                        {/* Footer Row */}
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-3 border-t border-white/5 mt-auto">
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
                <div className="border-2 border-dashed border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer min-h-[160px] bg-white/5 hover:bg-white/10">
                    <span className="text-2xl mb-1">+</span>
                    <span className="font-medium text-xs">Connect Repo</span>
                </div>
             </div>
        </div>

        {/* Model Detail Modal Overlay */}
        {selectedModel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-nebula-950/80 backdrop-blur-md p-space-lg animate-fade-in" onClick={() => setSelectedModel(null)}>
                <div 
                    className="w-full max-w-6xl h-[90vh] bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-space-lg border-b border-white/5 bg-nebula-950/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-type-heading-md font-bold text-white">{selectedModel.name}</h2>
                                <p className="text-purple-400 text-type-caption mt-1">{selectedModel.provider} • {selectedModel.family}</p>
                            </div>
                            <button onClick={() => setSelectedModel(null)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-2 border-b border-white/5 overflow-x-auto">
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
                                Versions <span className="text-[10px] bg-white/5 px-1.5 rounded-full ml-1">{selectedModel.versions.length}</span>
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
                                 {/* Detailed Metadata Grid */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-type-body text-gray-300">
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><Layers size={10}/> Family</span>
                                        <span className="font-mono font-bold text-white">{selectedModel.family}</span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><BrainCircuit size={10}/> Architecture</span>
                                        <span className="font-mono font-bold text-white truncate" title={getArchitecture(selectedModel.family)}>{getArchitecture(selectedModel.family)}</span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><Cpu size={10}/> Est. VRAM</span>
                                        <span className="font-mono font-bold text-white">
                                            {selectedModel.versions.length > 0 
                                             ? `${Math.min(...selectedModel.versions.map(v => v.metrics?.vramGB || 0).filter(v => v > 0))} - ${Math.max(...selectedModel.versions.map(v => v.metrics?.vramGB || 0))}`
                                             : '-'} GB
                                        </span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><HardDrive size={10}/> Disk Size</span>
                                        <span className="font-mono font-bold text-white">
                                            {selectedModel.versions.length > 0 
                                             ? selectedModel.versions[0].size 
                                             : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><Scale size={10}/> Model Size</span>
                                        <span className="font-mono font-bold text-white">{selectedModel.params} Params</span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold">Tensor</span>
                                        <span className="font-mono font-bold text-white">{selectedModel.tensorType}</span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold">Last Used</span>
                                        <span className="font-mono font-bold text-white">{selectedModel.lastUsed}</span>
                                    </div>
                                    <div className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold">Quantizations</span>
                                        <span className="font-mono font-bold text-white truncate" title={Array.from(new Set(selectedModel.versions.map(v => v.quantization))).join(', ')}>
                                            {selectedModel.versions.length > 0 ? Array.from(new Set(selectedModel.versions.map(v => v.quantization))).join(', ') : 'None'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-white/5 p-4 rounded border border-white/5 h-full">
                                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><LayoutTemplate size={16} /> Description</h4>
                                            <p className="text-gray-300 leading-relaxed text-sm">{selectedModel.description}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white/5 p-4 rounded border border-white/5 h-full">
                                            <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Box size={16} /> Available Registry Formats</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set(selectedModel.versions.map(v => v.format))).map(fmt => (
                                                    <div key={fmt} className="px-3 py-1.5 bg-nebula-950 border border-white/10 rounded-lg text-xs text-gray-300 flex items-center gap-2 font-mono">
                                                        <span className={`w-2 h-2 rounded-full ${fmt === 'GGUF' ? 'bg-orange-500' : fmt === 'Ollama' ? 'bg-white' : 'bg-blue-500'}`}></span>
                                                        {fmt}
                                                    </div>
                                                ))}
                                                {selectedModel.versions.length === 0 && <span className="text-sm text-gray-500 italic">No versions indexed.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Tag size={16} /> Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedModel.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-nebula-950 border border-white/10 rounded text-xs text-gray-400 flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-400"><X size={10} /></button>
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                                placeholder="Add tag..."
                                                className="bg-transparent border-b border-gray-600 text-xs text-white outline-none w-20 focus:border-purple-500"
                                            />
                                            <button onClick={handleAddTag} className="text-purple-400 hover:text-white"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {detailTab === 'versions' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-end mb-2">
                                    <button 
                                        onClick={handlePruneCheckpoints}
                                        className="text-[10px] bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/30 px-3 py-1.5 rounded flex items-center gap-2 transition-all font-bold uppercase tracking-wider"
                                    >
                                        <Eraser size={12} /> Prune Intermediates
                                    </button>
                                </div>
                                {selectedModel.versions.map(version => (
                                    <div key={version.id} className="bg-white/5 border border-white/5 rounded-lg p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                    {version.name}
                                                    <span className="text-xs font-normal text-gray-500 bg-black/20 px-2 py-0.5 rounded">{version.format}</span>
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">ID: {version.id} • Created: {version.created}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleVersionSelection(version.id)}
                                                className={`p-2 rounded border transition-colors ${selectedVersionIds.has(version.id) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                <Check size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                                            <div><span className="block text-gray-600 uppercase font-bold">Size</span> {version.size}</div>
                                            <div><span className="block text-gray-600 uppercase font-bold">Quant</span> {version.quantization}</div>
                                            <div><span className="block text-gray-600 uppercase font-bold">VRAM</span> {version.metrics?.vramGB || '-'} GB</div>
                                            <div><span className="block text-gray-600 uppercase font-bold">Latency</span> {version.metrics?.latencyMs || '-'} ms</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {detailTab === 'benchmarks' && (
                             <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-white">Performance Metrics</h3>
                                    <button 
                                        onClick={handleRunBenchmark}
                                        disabled={isBenchmarking}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isBenchmarking ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                        Run Benchmark
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {getModelBenchmarks(selectedModel.id).length > 0 ? getModelBenchmarks(selectedModel.id).map(bench => (
                                        <div key={bench.id} className="bg-white/5 border border-white/5 rounded p-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white">{bench.dataset}</div>
                                                <div className="text-xs text-gray-500">{bench.metric}: {bench.score} • {bench.date}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-green-400 font-mono font-bold">{bench.tokensPerSecond?.toFixed(1)} t/s</div>
                                                <div className="text-xs text-gray-500">{bench.latency}ms</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center text-gray-500 py-8 italic">No benchmarks recorded for this model.</div>
                                    )}
                                </div>
                             </div>
                        )}

                         {detailTab === 'docs' && (
                            <div className="prose prose-invert max-w-none animate-fade-in bg-white/5 p-6 rounded-lg border border-white/5">
                                {selectedModel.documentation ? (
                                    <pre className="whitespace-pre-wrap font-sans">{selectedModel.documentation}</pre>
                                ) : (
                                    <div className="text-gray-500 italic">No documentation available.</div>
                                )}
                            </div>
                        )}
                        
                        {detailTab === 'engineering' && (
                            <div className="animate-fade-in space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Active Operations Card */}
                                    <div className="bg-white/5 p-4 rounded border border-white/5 md:col-span-2">
                                        <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider"><Activity size={14}/> Active Operations</h4>
                                        <div className="space-y-2">
                                            {/* Mock Active Operation */}
                                            <div className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">SFT-Llama3-Reasoning-v2</div>
                                                        <div className="text-xs text-gray-500">Fine-Tuning • Step 450/1000</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-mono text-purple-400">45%</div>
                                                    <div className="text-[10px] text-gray-600">ETA: 4h 20m</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-500 text-center pt-1 italic">No other active experiments found.</div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider"><Cpu size={14}/> Inference Config</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-gray-500">Context Window</span>
                                                <span className="text-gray-300 font-mono">8192</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-gray-500">RoPE Scale</span>
                                                <span className="text-gray-300 font-mono">1.0</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-gray-500">GQA</span>
                                                <span className="text-gray-300 font-mono">Enabled (8kv)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Stop Strings</span>
                                                <span className="text-gray-300 font-mono text-xs">["&lt;|end|&gt;", "&lt;|user|&gt;"]</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enhanced Technical Details Section */}
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider"><Settings size={14}/> Technical Specs & Runtime</h4>
                                        <div className="space-y-2 mb-4">
                                            {selectedModel.versions.map(v => (
                                                <div key={v.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5 text-xs">
                                                    <div>
                                                        <span className="text-purple-300 font-bold">{v.name}</span>
                                                        <span className="text-gray-500 ml-2">({v.format})</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-gray-300"><span className="text-gray-500 uppercase font-bold text-[9px]">Quant:</span> {v.quantization}</div>
                                                        <div className="text-gray-300"><span className="text-gray-500 uppercase font-bold text-[9px]">GPU Layers:</span> {estimateGpuLayers(selectedModel.params)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Last Configured Startup Flags</div>
                                            <div className="font-mono text-[10px] text-green-400 bg-black/40 p-2 rounded border border-white/10 break-all">
                                                {getCompatibleServers(selectedModel.id)[0]?.startupFlags || "No specific flags recorded."}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider"><Server size={14}/> Server Compatibility</h4>
                                        <div className="space-y-2">
                                            {getCompatibleServers(selectedModel.id).map(srv => (
                                                <div key={srv.id} className="flex justify-between items-center bg-black/20 p-2 rounded">
                                                    <span className="text-xs text-gray-300">{srv.name}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${srv.status === 'Online' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{srv.status}</span>
                                                </div>
                                            ))}
                                            {getCompatibleServers(selectedModel.id).length === 0 && <div className="text-gray-500 italic text-xs">No compatible servers configured.</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Tokenizer Section */}
                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider"><ScanLine size={14}/> Tokenizer Artifacts</h4>
                                        <span className="text-[10px] bg-nebula-950 px-2 py-0.5 rounded text-gray-400 border border-white/10">Base Config</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-nebula-950 rounded border border-white/5 text-gray-400">
                                                <Scissors size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-300">Standard {selectedModel.family} Tokenizer</div>
                                                <div className="text-[10px] text-gray-500">Vocab Size: 32000 • Not Harvested</div>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 bg-purple-900/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded text-xs font-bold transition-all uppercase tracking-wider">
                                            Harvest in Lab
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider"><Terminal size={14}/> Prompt Template</h4>
                                    <div className="bg-black/40 p-3 rounded border border-white/10 font-mono text-xs text-gray-400 whitespace-pre-wrap">
                                        {selectedModel.family === 'Llama' ? (
                                            `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{{ system_prompt }}<|eot_id|>\n<|start_header_id|>user<|end_header_id|>\n\n{{ user_message }}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>`
                                        ) : selectedModel.family === 'Mistral' ? (
                                            `<s>[INST] {{ user_message }} [/INST]`
                                        ) : (
                                            `User: {{ user_message }}\nAssistant:`
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider"><FileText size={14}/> File System</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-black/20 p-2 rounded">
                                        <span className="text-purple-400">/data/models/{selectedModel.provider.toLowerCase()}/{selectedModel.id}/</span>
                                        <span className="ml-auto opacity-50">7.2 GB</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                    
                    {/* Comparison Footer */}
                    {selectedVersionIds.size > 1 && (
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-nebula-950 border-t border-purple-500/30 flex justify-between items-center animate-fade-in-up">
                            <div className="text-white font-bold">Comparing {selectedVersionIds.size} versions</div>
                            <button 
                                onClick={() => setShowComparison(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold shadow-lg"
                            >
                                Compare Metrics
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Drag & Drop Comparison Modal */}
        {comparisonPair && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setComparisonPair(null)}>
                 <div 
                    className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-nebula-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-sm">
                        <div>
                            <h2 className="text-type-heading-md font-bold text-white flex items-center gap-2">
                                <Scale className="text-purple-500" /> Model Comparison
                            </h2>
                            <p className="text-type-tiny text-gray-400 mt-1 uppercase tracking-widest">Head-to-Head Analysis</p>
                        </div>
                        <button 
                            onClick={() => setComparisonPair(null)}
                            className="p-2 bg-nebula-900 hover:bg-nebula-800 border border-nebula-700 hover:border-nebula-600 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-nebula-950 border-2 border-purple-500 flex items-center justify-center text-purple-500 font-black text-xl shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                            VS
                        </div>
                    </div>

                    <div className="grid grid-cols-2 h-full divide-x divide-white/5 relative">
                        {/* Model A */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-purple-900/5">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <div className="text-type-tiny text-purple-400 font-bold uppercase tracking-wider mb-1">Challenger A</div>
                                    <h3 className="text-2xl font-black text-white">{comparisonPair[0].name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-nebula-800 px-2 py-1 rounded border border-nebula-700 text-gray-300">{comparisonPair[0].provider}</span>
                                        <span className="text-xs bg-nebula-800 px-2 py-1 rounded border border-nebula-700 text-gray-300">{comparisonPair[0].family}</span>
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-nebula-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Parameters</div>
                                        <div className="text-lg font-mono text-white font-bold">{comparisonPair[0].params}</div>
                                    </div>
                                    <div className="bg-nebula-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tensor Type</div>
                                        <div className="text-lg font-mono text-white font-bold">{comparisonPair[0].tensorType}</div>
                                    </div>
                                </div>

                                <div className="bg-nebula-900/50 p-6 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-4 flex justify-between">
                                        <span>Performance Metrics</span>
                                        <span className="text-white">Active</span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                                        <ComparisonMetric 
                                            label="Latency" 
                                            value={comparisonPair[0].metrics?.latencyMs} 
                                            otherValue={comparisonPair[1].metrics?.latencyMs}
                                            unit="ms"
                                            lowerIsBetter={true}
                                        />
                                        <ComparisonMetric 
                                            label="Throughput" 
                                            value={comparisonPair[0].metrics?.tokensPerSecond} 
                                            otherValue={comparisonPair[1].metrics?.tokensPerSecond}
                                            unit="t/s"
                                            lowerIsBetter={false}
                                        />
                                        <ComparisonMetric 
                                            label="VRAM" 
                                            value={comparisonPair[0].metrics?.vramGB} 
                                            otherValue={comparisonPair[1].metrics?.vramGB}
                                            unit="GB"
                                            lowerIsBetter={true}
                                        />
                                        <ComparisonMetric 
                                            label="Perplexity" 
                                            value={comparisonPair[0].metrics?.perplexity} 
                                            otherValue={comparisonPair[1].metrics?.perplexity}
                                            unit=""
                                            lowerIsBetter={true}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-2">Capabilities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {comparisonPair[0].tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded bg-nebula-800 border border-nebula-700 text-gray-300">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Model B */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-blue-900/5">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <div className="text-type-tiny text-blue-400 font-bold uppercase tracking-wider mb-1">Challenger B</div>
                                    <h3 className="text-2xl font-black text-white">{comparisonPair[1].name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-nebula-800 px-2 py-1 rounded border border-nebula-700 text-gray-300">{comparisonPair[1].provider}</span>
                                        <span className="text-xs bg-nebula-800 px-2 py-1 rounded border border-nebula-700 text-gray-300">{comparisonPair[1].family}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-nebula-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Parameters</div>
                                        <div className="text-lg font-mono text-white font-bold">{comparisonPair[1].params}</div>
                                    </div>
                                    <div className="bg-nebula-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tensor Type</div>
                                        <div className="text-lg font-mono text-white font-bold">{comparisonPair[1].tensorType}</div>
                                    </div>
                                </div>

                                <div className="bg-nebula-900/50 p-6 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-4 flex justify-between">
                                        <span>Performance Metrics</span>
                                        <span className="text-white">Active</span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                                        <ComparisonMetric 
                                            label="Latency" 
                                            value={comparisonPair[1].metrics?.latencyMs} 
                                            otherValue={comparisonPair[0].metrics?.latencyMs}
                                            unit="ms"
                                            lowerIsBetter={true}
                                        />
                                        <ComparisonMetric 
                                            label="Throughput" 
                                            value={comparisonPair[1].metrics?.tokensPerSecond} 
                                            otherValue={comparisonPair[0].metrics?.tokensPerSecond}
                                            unit="t/s"
                                            lowerIsBetter={false}
                                        />
                                        <ComparisonMetric 
                                            label="VRAM" 
                                            value={comparisonPair[1].metrics?.vramGB} 
                                            otherValue={comparisonPair[0].metrics?.vramGB}
                                            unit="GB"
                                            lowerIsBetter={true}
                                        />
                                        <ComparisonMetric 
                                            label="Perplexity" 
                                            value={comparisonPair[1].metrics?.perplexity} 
                                            otherValue={comparisonPair[0].metrics?.perplexity}
                                            unit=""
                                            lowerIsBetter={true}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-2">Capabilities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {comparisonPair[1].tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded bg-nebula-800 border border-nebula-700 text-gray-300">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};