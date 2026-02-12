
import React, { useState, useMemo } from 'react';
import { Model, LabArtifact } from '../types';
import { FlaskConical, Dna, Merge, Scissors, Zap, Box, Save, Plus, Trash2, CheckCircle, Loader2, TrendingDown, Activity, Settings, X, FileText, Info, Layers, GitBranch, Calculator, ShieldAlert, Target, Sparkles, Wand2, Download, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LaboratoryProps {
  models: Model[];
}

type LabMode = 'merge' | 'extract' | 'medusa';
type MergeMethod = 'linear' | 'slerp' | 'task_arithmetic' | 'ties' | 'dare_linear' | 'dare_ties' | 'passthrough' | 'model_stock';
type MergeBackend = 'mergekit' | 'mergekit-pytorch';

const MOCK_INVENTORY: LabArtifact[] = [
    { 
        id: 'a1', 
        type: 'Tokenizer', 
        name: 'Llama-3-Special-Tok', 
        sourceModel: 'Llama-3-8b', 
        size: '12MB', 
        created: '2023-10-25',
        description: 'Modified tokenizer with added special tokens for function calling and structured JSON output.',
        usage: 'Use this tokenizer when fine-tuning Llama-3 models for agentic workflows.'
    },
    { 
        id: 'a2', 
        type: 'Adapter', 
        name: 'LFM-Reasoning-LoRA', 
        sourceModel: 'LFM-2.5', 
        size: '150MB', 
        created: '2023-10-26',
        description: 'LoRA adapter trained on a high-quality CoT dataset (GSM8K + Math) to improve reasoning capabilities.',
        usage: 'Load with LFM-2.5-1.2B base model. Recommended alpha=32.'
    },
    { 
        id: 'a3', 
        type: 'MedusaHead', 
        name: 'Medusa-Draft-v1', 
        sourceModel: 'Mistral-7b', 
        size: '450MB', 
        created: '2023-10-27',
        description: 'Experimental Medusa heads (4 heads) for speculative decoding acceleration on Mistral 7B.',
        usage: 'Compatible with any Mistral-7B-v0.1 derived model. Expect 1.8x - 2.2x speedup.'
    },
];

const MOCK_LOSS_DATA = [
    { step: 10, loss: 2.8 }, { step: 20, loss: 2.5 }, { step: 30, loss: 2.3 }, 
    { step: 40, loss: 2.1 }, { step: 50, loss: 1.9 }, { step: 60, loss: 1.85 },
    { step: 70, loss: 1.8 }, { step: 80, loss: 1.75 }, { step: 90, loss: 1.72 },
    { step: 100, loss: 1.68 }, { step: 110, loss: 1.65 }, { step: 120, loss: 1.62 }
];

export const Laboratory: React.FC<LaboratoryProps> = ({ models }) => {
  const [mode, setMode] = useState<LabMode>('merge');
  const [mergeMethod, setMergeMethod] = useState<MergeMethod>('linear');
  const [backend, setBackend] = useState<MergeBackend>('mergekit');
  const [inventory, setInventory] = useState<LabArtifact[]>(MOCK_INVENTORY);
  const [selectedArtifact, setSelectedArtifact] = useState<LabArtifact | null>(null);
  
  // MergeKit State
  const [inputModels, setInputModels] = useState<{id: number, modelId: string, weight: number}[]>([
      { id: 1, modelId: '', weight: 0.5 },
      { id: 2, modelId: '', weight: 0.5 }
  ]);
  const [mergeConfig, setMergeConfig] = useState({
      normalize: true,
      int8_mask: false,
      density: 0.5,
      t: 0.5,
      epsilon: 0.01,
      vocabRepair: false
  });

  // Medusa State
  const [medusaConfig, setMedusaConfig] = useState({
      lr: 0.001,
      decay: 0.01,
      scheduler: 'Cosine',
      heads: 4,
      backbone: ''
  });

  // Extraction State
  const [extractionConfig, setExtractionConfig] = useState({
      ftModel: '',
      baseModel: '',
      rank: 32,
      epsilon: 0.001,
      sourceModel: ''
  });
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Logic Helpers
  const addInputModel = () => {
      setInputModels([...inputModels, { id: Date.now(), modelId: '', weight: 0.0 }]);
  };

  const removeInputModel = (id: number) => {
      if (inputModels.length > 1) {
          setInputModels(inputModels.filter(m => m.id !== id));
      }
  };

  const updateInputModel = (id: number, field: 'modelId' | 'weight', value: any) => {
      setInputModels(inputModels.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const normalizeWeights = () => {
      const total = inputModels.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
      if (total === 0) return;
      setInputModels(inputModels.map(m => ({
          ...m,
          weight: parseFloat(((Number(m.weight) || 0) / total).toFixed(4))
      })));
  };

  const importWeightsFromRegistry = (modelId: string, id: number) => {
      const model = models.find(m => m.id === modelId);
      if (model) {
          updateInputModel(id, 'weight', 0.5);
      }
  };

  const totalMergeWeight = useMemo(() => {
      return inputModels.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
  }, [inputModels]);

  const handleExtraction = () => {
      if (!extractionConfig.ftModel || !extractionConfig.baseModel) return;
      setExtractionStatus('processing');
      setTimeout(() => {
          setExtractionStatus('success');
          setTimeout(() => setExtractionStatus('idle'), 3000);
      }, 2000);
  };

  const handleDeleteArtifact = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Erase this artifact from memory?')) {
          setInventory(inventory.filter(item => item.id !== id));
          if (selectedArtifact?.id === id) setSelectedArtifact(null);
      }
  };

  const getMergeMethodInfo = (m: MergeMethod) => {
      switch(m) {
          case 'linear': return { label: 'Linear', desc: 'Arithmetic average of parameters.', base: 'Opt' };
          case 'slerp': return { label: 'SLERP', desc: 'Spherical interpolation for manifolds.', base: 'N/A' };
          case 'task_arithmetic': return { label: 'Task Vector', desc: 'Combine fine-tuned deltas.', base: 'Req' };
          case 'ties': return { label: 'TIES', desc: 'Trim and Elect sign merging.', base: 'Req' };
          case 'dare_linear': return { label: 'DARE-L', desc: 'Drop and Rescale linear fusion.', base: 'Req' };
          case 'dare_ties': return { label: 'DARE-T', desc: 'Drop and Rescale TIES fusion.', base: 'Req' };
          case 'model_stock': return { label: 'Stock', desc: 'Geometric center approximation.', base: 'Req' };
          case 'passthrough': return { label: 'Franken', desc: 'Sequential block concatenation.', base: 'N/A' };
      }
  };

  return (
    <div className="flex h-full gap-space-lg text-nebula-100 font-sans overflow-hidden p-space-lg relative">
        <div className="flex-1 flex flex-col gap-space-lg min-w-0 h-full overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
                <div>
                     <h2 className="text-type-heading-lg font-black flex items-center gap-space-sm uppercase tracking-tight">
                        <FlaskConical className="text-purple-500" size={28} /> Experimental Wing
                     </h2>
                     <p className="text-type-body text-gray-500 mt-1 uppercase tracking-widest font-bold text-[10px]">Synthesis // Extraction // Speculative Decoding</p>
                </div>
                
                <div className="flex bg-nebula-900 rounded p-1.5 border border-nebula-700 shadow-inner">
                    <button 
                        onClick={() => setMode('merge')}
                        className={`px-6 py-2.5 rounded text-type-tiny font-black uppercase tracking-widest transition-all flex items-center gap-space-sm ${mode === 'merge' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Merge size={14} /> MergeKit
                    </button>
                    <button 
                         onClick={() => setMode('extract')}
                         className={`px-6 py-2.5 rounded text-type-tiny font-black uppercase tracking-widest transition-all flex items-center gap-space-sm ${mode === 'extract' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Scissors size={14} /> Extract
                    </button>
                    <button 
                         onClick={() => setMode('medusa')}
                         className={`px-6 py-2.5 rounded text-type-tiny font-black uppercase tracking-widest transition-all flex items-center gap-space-sm ${mode === 'medusa' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Dna size={14} /> Medusa
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-space-lg relative overflow-hidden flex flex-col min-h-0 shadow-2xl">
                {/* Visual Accent */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>

                {mode === 'merge' && (
                    <div className="relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar flex flex-col h-full">
                        <div className="grid grid-cols-2 gap-space-xl flex-1 overflow-visible">
                            {/* Algorithm Column */}
                            <div className="space-y-space-lg flex flex-col">
                                <label className="text-purple-400 text-type-tiny font-black uppercase tracking-[0.2em] block">Fusion Topology</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-nebula-950 rounded border border-nebula-800">
                                    {(['linear', 'slerp', 'task_arithmetic', 'ties', 'dare_linear', 'dare_ties', 'model_stock', 'passthrough'] as MergeMethod[]).map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setMergeMethod(m)}
                                            className={`p-4 rounded border text-left transition-all relative overflow-hidden group ${mergeMethod === m ? 'bg-purple-900/40 border-purple-500 text-white shadow-inner' : 'bg-nebula-900 border-nebula-800 text-gray-500 hover:border-purple-500/40 hover:text-gray-300'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-black text-xs uppercase tracking-tight">{getMergeMethodInfo(m).label}</span>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase ${getMergeMethodInfo(m).base === 'Req' ? 'border-purple-500/50 text-purple-400' : 'border-gray-800 text-gray-700'}`}>{getMergeMethodInfo(m).base}</span>
                                            </div>
                                            <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest leading-tight">{getMergeMethodInfo(m).desc}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 bg-nebula-950/80 border border-nebula-800 rounded shadow-inner space-y-6">
                                    <h4 className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Settings size={14} className="text-purple-400" /> Hyper-Parameters
                                    </h4>
                                    
                                    <div className="space-y-8">
                                        {(['ties', 'dare_linear', 'dare_ties'].includes(mergeMethod)) && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Global Density</span>
                                                    <span className="font-mono text-purple-400 font-black text-xs">{mergeConfig.density}</span>
                                                </div>
                                                <input type="range" min="0" max="1" step="0.01" value={mergeConfig.density} onChange={(e) => setMergeConfig({...mergeConfig, density: parseFloat(e.target.value)})} className="w-full h-1.5 bg-nebula-800 rounded-full accent-purple-500 appearance-none cursor-pointer" />
                                            </div>
                                        )}
                                        {mergeMethod === 'slerp' && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Weighting Factor (t)</span>
                                                    <span className="font-mono text-purple-400 font-black text-xs">{mergeConfig.t}</span>
                                                </div>
                                                <input type="range" min="0" max="1" step="0.01" value={mergeConfig.t} onChange={(e) => setMergeConfig({...mergeConfig, t: parseFloat(e.target.value)})} className="w-full h-1.5 bg-nebula-800 rounded-full accent-purple-500 appearance-none cursor-pointer" />
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setMergeConfig({...mergeConfig, normalize: !mergeConfig.normalize})} className={`p-3 rounded border text-[9px] font-black uppercase tracking-widest transition-all ${mergeConfig.normalize ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-nebula-900 border-nebula-800 text-gray-600'}`}>Normalize Weights</button>
                                            <button onClick={() => setMergeConfig({...mergeConfig, int8_mask: !mergeConfig.int8_mask})} className={`p-3 rounded border text-[9px] font-black uppercase tracking-widest transition-all ${mergeConfig.int8_mask ? 'bg-orange-900/30 border-orange-500 text-white' : 'bg-nebula-900 border-nebula-800 text-gray-600'}`}>Int8 Layer Mask</button>
                                            <button onClick={() => setMergeConfig({...mergeConfig, vocabRepair: !mergeConfig.vocabRepair})} className={`col-span-2 p-3 rounded border text-[9px] font-black uppercase tracking-widest transition-all ${mergeConfig.vocabRepair ? 'bg-blue-900/30 border-blue-500 text-white' : 'bg-nebula-900 border-nebula-800 text-gray-600'}`}>Vocab Alignment Surge</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selection Column */}
                            <div className="space-y-space-lg flex flex-col min-h-0">
                                <div className="space-y-3">
                                    <label className="text-purple-400 text-type-tiny font-black uppercase tracking-[0.2em]">Deployment Path</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 bg-nebula-950 border border-nebula-800 rounded p-4 text-gray-200 font-mono focus:border-purple-500 outline-none text-xs shadow-inner" placeholder="chimera-fusion-v1" />
                                        <button className="px-4 bg-nebula-950 border border-nebula-800 rounded text-gray-600 hover:text-white transition-colors"><Save size={18}/></button>
                                    </div>
                                </div>

                                <div className="p-6 bg-nebula-950/80 border border-nebula-800 rounded flex-1 flex flex-col min-h-0 shadow-inner overflow-hidden">
                                    <div className="flex justify-between items-center mb-6 shrink-0">
                                        <h4 className="text-gray-100 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><Layers size={14} className="text-purple-500"/> Genomic Sources</h4>
                                        <button onClick={normalizeWeights} className="text-[8px] bg-nebula-900 hover:bg-nebula-800 border border-nebula-700 text-purple-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all flex items-center gap-2"><Calculator size={10} /> Auto-Balance</button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {inputModels.map((im, index) => (
                                            <div key={im.id} className="flex gap-3 animate-fade-in items-center group/item p-3 bg-nebula-900/40 rounded border border-nebula-800/50 hover:border-purple-500/30 transition-all">
                                                <div className="w-6 h-6 rounded bg-nebula-950 border border-nebula-800 flex items-center justify-center text-[9px] font-black text-gray-700">{index + 1}</div>
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <select 
                                                        value={im.modelId}
                                                        onChange={(e) => {
                                                            updateInputModel(im.id, 'modelId', e.target.value);
                                                            importWeightsFromRegistry(e.target.value, im.id);
                                                        }}
                                                        className="w-full bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-gray-300 text-[10px] font-black uppercase tracking-tight focus:border-purple-500 outline-none transition-colors appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select Prototype...</option>
                                                        {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                                    </select>
                                                </div>
                                                <div className="relative w-28 group/weight">
                                                    <input 
                                                        type="number" 
                                                        value={im.weight}
                                                        step="0.0001"
                                                        onChange={(e) => updateInputModel(im.id, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        className="w-full bg-nebula-950 border border-nebula-800 rounded px-4 py-2 text-white text-xs font-mono font-black focus:border-purple-500 outline-none transition-colors pr-10 appearance-none text-right" 
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-600 font-black">FLOAT</span>
                                                </div>
                                                <button onClick={() => removeInputModel(im.id)} className="p-2 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100" disabled={inputModels.length <= 1}><X size={14}/></button>
                                            </div>
                                        ))}
                                        <button onClick={addInputModel} className="w-full py-4 border-2 border-dashed border-nebula-800 text-gray-700 text-[9px] font-black uppercase tracking-[0.3em] hover:text-purple-500 hover:border-purple-500/50 rounded transition-all flex items-center justify-center gap-3 bg-nebula-950/30"><Plus size={14}/> Sequence Extension</button>
                                    </div>

                                    <div className="mt-6 p-5 bg-nebula-950 rounded border border-nebula-800 shadow-inner shrink-0">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <ShieldAlert size={16} className={Math.abs(totalMergeWeight - 1) < 0.001 ? "text-green-500" : "text-yellow-500 animate-pulse"} />
                                                <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Genomic Integrity Check</span>
                                            </div>
                                            <span className={`font-mono text-lg font-black ${Math.abs(totalMergeWeight - 1) < 0.001 ? "text-green-400" : "text-yellow-400"}`}>
                                                Σ {totalMergeWeight.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 shrink-0">
                            <button disabled={totalMergeWeight === 0} className="group relative px-12 py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.3em] rounded shadow-[0_20px_40px_-15px_rgba(139,92,246,0.4)] transition-all flex items-center gap-4 border-t border-white/20 active:scale-95">
                                <Zap className="group-hover:animate-pulse" size={18} />
                                Begin Fusion Protocol
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'extract' && (
                     <div className="space-y-space-xl relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-space-xl">
                             <div className="p-8 bg-nebula-950 border border-nebula-800 rounded relative shadow-inner">
                                <h3 className="text-xl font-black text-purple-400 mb-6 flex items-center gap-3 uppercase tracking-tight"><Scissors size={24}/> Weight Extraction</h3>
                                <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest font-bold">Derive low-rank approximations from fine-tuned specimens.</p>
                                
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Fine-Tuned Target</label>
                                        <select 
                                            value={extractionConfig.ftModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, ftModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-gray-200 outline-none focus:border-purple-500 text-xs font-black uppercase tracking-tight cursor-pointer"
                                        >
                                            <option value="">Select Checkpoint...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Base Reference</label>
                                        <select 
                                            value={extractionConfig.baseModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, baseModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-gray-200 outline-none focus:border-purple-500 text-xs font-black uppercase tracking-tight cursor-pointer"
                                        >
                                            <option value="">Select Prototype...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                            <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">LoRA Rank (r)</label>
                                            <input type="number" value={extractionConfig.rank} onChange={(e) => setExtractionConfig({...extractionConfig, rank: parseInt(e.target.value)})} className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-white outline-none focus:border-purple-500 text-xs font-black font-mono" />
                                        </div>
                                         <div className="space-y-2">
                                            <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">SV Threshold</label>
                                            <input type="number" step={0.001} value={extractionConfig.epsilon} onChange={(e) => setExtractionConfig({...extractionConfig, epsilon: parseFloat(e.target.value)})} className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-white outline-none focus:border-purple-500 text-xs font-black font-mono" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleExtraction}
                                        disabled={!extractionConfig.ftModel || !extractionConfig.baseModel || extractionStatus === 'processing'}
                                        className={`w-full py-5 border transition-all rounded font-black uppercase text-xs tracking-[0.2em] mt-6 flex justify-center items-center gap-4 ${
                                            extractionStatus === 'success' 
                                            ? 'bg-green-950 border-green-500 text-green-400' 
                                            : extractionStatus === 'processing'
                                            ? 'bg-purple-900/20 border-purple-500 text-purple-300 opacity-80'
                                            : 'bg-purple-600 border-t border-white/20 text-white shadow-xl shadow-purple-500/20 hover:bg-purple-500'
                                        }`}
                                    >
                                        {extractionStatus === 'processing' ? <Loader2 className="animate-spin" size={18} /> : 
                                         extractionStatus === 'success' ? <CheckCircle size={18} /> : <Wand2 size={18} />}
                                        {extractionStatus === 'processing' ? 'Harvesting...' : 
                                         extractionStatus === 'success' ? 'Protocol Success' : 'Initialize Harvest'}
                                    </button>
                                </div>
                             </div>

                             <div className="p-8 bg-nebula-950 border border-nebula-800 rounded relative shadow-inner flex flex-col">
                                <h3 className="text-xl font-black text-blue-400 mb-6 flex items-center gap-3 uppercase tracking-tight"><Scissors size={24}/> Token Surgeon</h3>
                                <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest font-bold">Vocab alignment via tokenizer transplantation.</p>
                                <div className="space-y-6 flex-1">
                                     <div className="space-y-2">
                                        <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Source Vocab Specimen</label>
                                        <select className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-gray-200 outline-none focus:border-blue-500 text-xs font-black uppercase tracking-tight cursor-pointer">
                                            <option value="">Select Donor...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="mt-auto pt-8 border-t border-nebula-800">
                                        <button className="w-full py-5 bg-blue-900/20 border border-blue-500/50 text-blue-300 hover:bg-blue-600 hover:text-white transition-all rounded font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 text-xs shadow-lg shadow-blue-500/10">
                                            <Download size={18} /> Run Transplant
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                     </div>
                )}

                {mode === 'medusa' && (
                    <div className="space-y-space-lg relative z-10 animate-fade-in flex flex-col h-full overflow-hidden">
                        <div className="flex items-start gap-space-xl flex-1 min-h-0">
                            <div className="w-1/2 space-y-space-lg overflow-y-auto h-full pr-4 custom-scrollbar">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter uppercase"><Dna size={28} className="text-purple-500"/> Multi-Head Synthesis</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold leading-relaxed">Training lightweight draft heads on frozen backbones.</p>
                                </div>
                                
                                <div className="bg-nebula-950 border border-nebula-800 rounded p-8 space-y-8 shadow-inner">
                                     <div className="space-y-3">
                                        <label className="text-[10px] uppercase text-gray-500 font-black tracking-[0.2em] flex items-center gap-2">
                                            <Target size={14} className="text-purple-400" /> Host Specimen (Backbone)
                                        </label>
                                        <select 
                                            value={medusaConfig.backbone}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, backbone: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-gray-100 outline-none focus:border-purple-500 text-xs font-black uppercase tracking-tight transition-all"
                                        >
                                            <option value="">Identify Base backbone...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                         <div className="space-y-3">
                                            <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Draft Heads</label>
                                            <div className="flex items-center gap-4 bg-nebula-900 border border-nebula-800 rounded p-2 px-4 shadow-inner">
                                                <input type="number" value={medusaConfig.heads} onChange={(e) => setMedusaConfig({...medusaConfig, heads: parseInt(e.target.value)})} className="w-full bg-transparent p-2 text-white outline-none font-black font-mono text-base" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">LR Decay Profile</label>
                                            <select 
                                                value={medusaConfig.scheduler}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, scheduler: e.target.value})}
                                                className="w-full bg-nebula-900 border border-nebula-800 rounded p-4 text-xs font-black uppercase tracking-widest text-purple-400 outline-none focus:border-purple-500 cursor-pointer shadow-inner"
                                            >
                                                <option>Cosine</option>
                                                <option>Linear</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button className="group w-full py-6 bg-purple-600 hover:bg-purple-500 text-white font-black rounded shadow-[0_30px_60px_-15px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-4 text-xs tracking-[0.3em] border-t border-white/20 active:scale-95">
                                        <Wand2 className="group-hover:rotate-12 transition-transform" size={18} />
                                        Initialize Synthesis Protocol
                                    </button>
                                </div>
                            </div>
                            
                            {/* Telemetry Panel */}
                            <div className="w-1/2 flex flex-col h-full gap-space-lg">
                                <div className="flex-1 bg-nebula-950 border border-nebula-800 rounded p-8 flex flex-col min-h-0 shadow-2xl relative overflow-hidden">
                                    <div className="grid grid-cols-3 gap-6 mb-10 shrink-0">
                                        <div className="bg-nebula-900 border border-nebula-800 p-6 rounded text-center relative overflow-hidden group shadow-lg">
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500/40"></div>
                                            <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Entropy Loss</div>
                                            <div className="text-3xl font-black text-white font-mono tracking-tighter">1.624</div>
                                        </div>
                                        <div className="bg-nebula-900 border border-nebula-800 p-6 rounded text-center relative overflow-hidden group shadow-lg">
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500/40"></div>
                                            <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Top-K Accuracy</div>
                                            <div className="text-3xl font-black text-white font-mono tracking-tighter">88.2%</div>
                                        </div>
                                        <div className="bg-nebula-900 border border-nebula-800 p-6 rounded text-center relative overflow-hidden group shadow-lg">
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500/40"></div>
                                            <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">ETC Horizon</div>
                                            <div className="text-3xl font-black text-yellow-500 font-mono tracking-tighter">02:14</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0 bg-nebula-900/30 rounded border border-nebula-800/40 p-8 relative shadow-inner">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={MOCK_LOSS_DATA}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#272730" vertical={false} />
                                                <XAxis dataKey="step" stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} tick={{fontWeight: 'black'}} />
                                                <YAxis stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} tick={{fontWeight: 'black'}} />
                                                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #272730', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }} />
                                                <Line type="monotone" dataKey="loss" stroke="#8b5cf6" strokeWidth={5} dot={false} animationDuration={2000} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Artifact Vault */}
        <div className="w-72 flex flex-col gap-space-md bg-nebula-900 border-l border-nebula-700 p-space-md shadow-2xl z-20 shrink-0 h-full overflow-hidden">
             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                 {inventory.map(item => (
                     <div key={item.id} onClick={() => setSelectedArtifact(item)} className={`p-4 bg-nebula-950 border rounded transition-all cursor-pointer group relative shadow-md ${selectedArtifact?.id === item.id ? 'border-purple-500 bg-purple-900/10' : 'border-nebula-800 hover:border-purple-500/40'}`}>
                         <div className="font-black text-[11px] text-gray-200 uppercase tracking-tight mb-2 truncate pr-4">{item.name}</div>
                         <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest space-y-1">
                             <div className="flex justify-between"><span>Genotype:</span> <span className="text-gray-400">{item.sourceModel}</span></div>
                             <div className="flex justify-between"><span>Size:</span> <span className="text-gray-400">{item.size}</span></div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    </div>
  );
};
