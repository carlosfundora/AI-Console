
import React, { useState } from 'react';
import { Model, LabArtifact } from '../types';
import { FlaskConical, Dna, Merge, Scissors, Zap, Box, Save, Plus, Trash2, CheckCircle, Loader2, BarChart2, TrendingDown, Activity, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LaboratoryProps {
  models: Model[];
}

type LabMode = 'merge' | 'extract' | 'medusa';
type MergeMethod = 'arcee_fusion' | 'passthrough' | 'task_arithmetic' | 'dare_linear' | 'dare_ties';

// Mock Inventory Data
const MOCK_INVENTORY: LabArtifact[] = [
    { id: 'a1', type: 'Tokenizer', name: 'Llama-3-Special-Tok', sourceModel: 'Llama-3-8b', size: '12MB', created: '2023-10-25' },
    { id: 'a2', type: 'Adapter', name: 'LFM-Reasoning-LoRA', sourceModel: 'LFM-2.5', size: '150MB', created: '2023-10-26' },
    { id: 'a3', type: 'MedusaHead', name: 'Medusa-Draft-v1', sourceModel: 'Mistral-7b', size: '450MB', created: '2023-10-27' },
];

const MOCK_LOSS_DATA = [
    { step: 10, loss: 2.8 }, { step: 20, loss: 2.5 }, { step: 30, loss: 2.3 }, 
    { step: 40, loss: 2.1 }, { step: 50, loss: 1.9 }, { step: 60, loss: 1.85 },
    { step: 70, loss: 1.8 }, { step: 80, loss: 1.75 }, { step: 90, loss: 1.72 },
    { step: 100, loss: 1.68 }, { step: 110, loss: 1.65 }, { step: 120, loss: 1.62 }
];

export const Laboratory: React.FC<LaboratoryProps> = ({ models }) => {
  const [mode, setMode] = useState<LabMode>('merge');
  const [mergeMethod, setMergeMethod] = useState<MergeMethod>('arcee_fusion');
  const [inventory, setInventory] = useState<LabArtifact[]>(MOCK_INVENTORY);
  const [inputModels, setInputModels] = useState<{id: number, modelId: string, weight: number}[]>([
      { id: 1, modelId: '', weight: 1.0 },
      { id: 2, modelId: '', weight: 1.0 }
  ]);
  
  // MergeKit Config
  const [mergeConfig, setMergeConfig] = useState({
      normalize: true,
      int8_mask: false,
      density: 0.5,
      epsilon: 0.01
  });

  // Medusa State
  const [medusaConfig, setMedusaConfig] = useState({
      lr: 0.001,
      decay: 0.0,
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

  const addInputModel = () => {
      setInputModels([...inputModels, { id: Date.now(), modelId: '', weight: 1.0 }]);
  };

  const removeInputModel = (id: number) => {
      if (inputModels.length > 1) {
          setInputModels(inputModels.filter(m => m.id !== id));
      }
  };

  const updateInputModel = (id: number, field: 'modelId' | 'weight', value: string | number) => {
      setInputModels(inputModels.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleExtraction = () => {
      if ((mode === 'extract' && !extractionConfig.ftModel) || (extractionConfig.ftModel && !extractionConfig.baseModel)) return;
      setExtractionStatus('processing');
      setTimeout(() => {
          setExtractionStatus('success');
          setTimeout(() => setExtractionStatus('idle'), 3000);
      }, 2000);
  };

  const getMergeMethodInfo = (m: MergeMethod) => {
      switch(m) {
          case 'arcee_fusion': return { label: 'Arcee Fusion', desc: 'Dynamic thresholding for fusing important changes.', base: 'Required' };
          case 'passthrough': return { label: 'Passthrough', desc: 'Directly copies tensors from input models (Frankenmerging).', base: 'N/A' };
          case 'task_arithmetic': return { label: 'Task Arithmetic', desc: 'Linearly combine task vectors from a base.', base: 'Required' };
          case 'dare_linear': return { label: 'DARE Linear', desc: 'Pruning & Rescaling with Linear interpolation.', base: 'Required' };
          case 'dare_ties': return { label: 'DARE Ties', desc: 'Pruning & Rescaling with TIES merging.', base: 'Required' };
      }
  };

  return (
    <div className="flex h-full gap-8 text-nebula-100 font-sans overflow-hidden">
        {/* Main Chamber */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
            
            {/* Standard Header Style matching Benchmarks/Datasets */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                     <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FlaskConical className="text-purple-500" /> Laboratory
                     </h2>
                     <p className="text-sm text-gray-400 mt-1">Experimental model synthesis, extraction, and surgery.</p>
                </div>
                
                <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
                    <button 
                        onClick={() => setMode('merge')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'merge' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Merge size={16} /> MergeKit
                    </button>
                    <button 
                         onClick={() => setMode('extract')}
                         className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'extract' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Scissors size={16} /> Extraction
                    </button>
                    <button 
                         onClick={() => setMode('medusa')}
                         className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'medusa' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Dna size={16} /> Medusa
                    </button>
                </div>
            </div>

            {/* Workspace */}
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm flex flex-col min-h-0">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Zap size={200} />
                </div>

                {mode === 'merge' && (
                    <div className="space-y-8 relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-purple-400 text-sm font-bold uppercase block mb-2">Synthesis Method</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {(['arcee_fusion', 'passthrough', 'task_arithmetic', 'dare_linear', 'dare_ties'] as MergeMethod[]).map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setMergeMethod(m)}
                                            className={`p-3 rounded border text-left transition-all ${mergeMethod === m ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/50 hover:text-gray-200'}`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-bold">{getMergeMethodInfo(m).label}</span>
                                                {getMergeMethodInfo(m).base === 'Required' && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-500/30">BASE REQ</span>}
                                            </div>
                                            <p className="text-xs mt-1 opacity-70">{getMergeMethodInfo(m).desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Advanced Merge Config */}
                                <div className="mt-6 p-4 bg-nebula-950/50 border border-nebula-800 rounded-xl">
                                    <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 flex items-center gap-2">
                                        <Settings size={12} /> Algorithm Parameters
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {(mergeMethod === 'dare_linear' || mergeMethod === 'dare_ties') && (
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Density</span>
                                                    <span>{mergeConfig.density}</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="1" step="0.05"
                                                    value={mergeConfig.density}
                                                    onChange={(e) => setMergeConfig({...mergeConfig, density: parseFloat(e.target.value)})}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="normalize"
                                                checked={mergeConfig.normalize}
                                                onChange={(e) => setMergeConfig({...mergeConfig, normalize: e.target.checked})}
                                                className="accent-purple-500"
                                            />
                                            <label htmlFor="normalize" className="text-sm text-gray-300">Normalize Weights</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="int8_mask"
                                                checked={mergeConfig.int8_mask}
                                                onChange={(e) => setMergeConfig({...mergeConfig, int8_mask: e.target.checked})}
                                                className="accent-purple-500"
                                            />
                                            <label htmlFor="int8_mask" className="text-sm text-gray-300">Int8 Mask (Memory Efficient)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-purple-400 text-sm font-bold uppercase">Target Output Path</label>
                                    <input type="text" className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-gray-200 font-mono focus:border-purple-500 outline-none" placeholder="./models/merged/chimera-v1" />
                                </div>

                                <div className="p-4 bg-nebula-950/50 border border-nebula-800 rounded-lg">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-purple-400 font-bold flex items-center gap-2"><Merge size={16}/> Input Models</h4>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{inputModels.length} Layers</span>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {inputModels.map((im, index) => (
                                            <div key={im.id} className="flex gap-2 animate-fade-in items-center group">
                                                <div className="text-xs text-gray-600 font-mono w-4">{index + 1}</div>
                                                <select 
                                                    value={im.modelId}
                                                    onChange={(e) => updateInputModel(im.id, 'modelId', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 text-sm focus:border-purple-500 outline-none transition-colors"
                                                >
                                                    <option value="">Select Model...</option>
                                                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                                <input 
                                                    type="number" 
                                                    value={im.weight}
                                                    onChange={(e) => updateInputModel(im.id, 'weight', parseFloat(e.target.value))}
                                                    placeholder="Weight" 
                                                    className="w-20 bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 text-sm focus:border-purple-500 outline-none transition-colors" 
                                                    step="0.1" 
                                                />
                                                <button 
                                                    onClick={() => removeInputModel(im.id)}
                                                    className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove Model"
                                                    disabled={inputModels.length <= 1}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={addInputModel}
                                        className="w-full mt-3 py-2 border border-dashed border-nebula-700 text-gray-500 text-xs hover:text-purple-400 hover:border-purple-500 rounded transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Add Layer Source
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-nebula-800">
                            <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-3">
                                <Zap className="animate-pulse" />
                                INITIATE FUSION
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'extract' && (
                     <div className="space-y-8 relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-8">
                             <div className="p-6 bg-nebula-950/50 border border-nebula-800 rounded-xl relative">
                                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><Scissors size={20}/> LoRA Extraction</h3>
                                <p className="text-xs text-gray-400 mb-6">Extract PEFT-compatible low-rank approximations from fine-tuned models relative to a base.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase text-gray-500 font-bold flex gap-1">Fine-Tuned Model <span className="text-red-400" title="Required">*</span></label>
                                        <select 
                                            value={extractionConfig.ftModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, ftModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500"
                                        >
                                            <option value="">Select FT Checkpoint...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase text-gray-500 font-bold flex gap-1">Base Model <span className="text-red-400" title="Required">*</span></label>
                                        <select 
                                            value={extractionConfig.baseModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, baseModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500"
                                        >
                                            <option value="">Select Base Model...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="text-xs uppercase text-gray-500 font-bold">Max Rank</label>
                                            <input 
                                                type="number" 
                                                value={extractionConfig.rank}
                                                onChange={(e) => setExtractionConfig({...extractionConfig, rank: parseInt(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div>
                                            <label className="text-xs uppercase text-gray-500 font-bold">SV Epsilon</label>
                                            <input 
                                                type="number" 
                                                step={0.001}
                                                value={extractionConfig.epsilon}
                                                onChange={(e) => setExtractionConfig({...extractionConfig, epsilon: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleExtraction}
                                        disabled={!extractionConfig.ftModel || !extractionConfig.baseModel || extractionStatus === 'processing'}
                                        className={`w-full py-2 border transition-all rounded font-bold mt-4 flex justify-center items-center gap-2 ${
                                            extractionStatus === 'success' 
                                            ? 'bg-green-900/40 border-green-500 text-green-400' 
                                            : extractionStatus === 'processing'
                                            ? 'bg-purple-900/20 border-purple-500 text-purple-300 opacity-80'
                                            : 'bg-purple-900/20 border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white'
                                        }`}
                                    >
                                        {extractionStatus === 'processing' ? <Loader2 className="animate-spin" size={16} /> : 
                                         extractionStatus === 'success' ? <CheckCircle size={16} /> : null}
                                        {extractionStatus === 'processing' ? 'EXTRACTING...' : 
                                         extractionStatus === 'success' ? 'EXTRACTION COMPLETE' : 'EXTRACT ADAPTER'}
                                    </button>
                                </div>
                             </div>

                             <div className="p-6 bg-nebula-950/50 border border-nebula-800 rounded-xl">
                                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><Scissors size={20}/> Token Surgeon</h3>
                                <p className="text-xs text-gray-400 mb-6">Transplant tokenizers to align vocabulary for cross-model distillation.</p>
                                <div className="space-y-4">
                                     <div>
                                        <label className="text-xs uppercase text-gray-500 font-bold flex gap-1">Source Model <span className="text-red-400" title="Required">*</span></label>
                                        <select className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500">
                                            <option value="">Select Source...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <button className="w-full py-2 bg-purple-900/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white transition-all rounded font-bold mt-auto">
                                        HARVEST TOKENIZER
                                    </button>
                                </div>
                             </div>
                        </div>
                     </div>
                )}

                {mode === 'medusa' && (
                    <div className="space-y-6 relative z-10 animate-fade-in flex flex-col h-full overflow-hidden">
                        <div className="flex items-start gap-6 flex-1 min-h-0">
                            <div className="w-1/2 space-y-4 overflow-y-auto h-full pr-2 custom-scrollbar">
                                <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2"><Dna size={20}/> Medusa Head Configuration</h3>
                                <p className="text-sm text-gray-400">Train multiple lightweight heads on top of a frozen backbone to predict future tokens in parallel (Speculative Decoding).</p>
                                
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                     <div className="col-span-2">
                                        <label className="text-xs uppercase text-gray-500 font-bold">Backbone Model (Frozen)</label>
                                        <select 
                                            value={medusaConfig.backbone}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, backbone: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-3 text-gray-300 mt-1 outline-none focus:border-purple-500"
                                        >
                                            <option value="">Select Backbone...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase text-gray-500 font-bold">Number of Heads</label>
                                        <input 
                                            type="number" 
                                            value={medusaConfig.heads}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, heads: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-3 text-gray-300 mt-1 outline-none focus:border-purple-500" 
                                        />
                                    </div>
                                </div>

                                {/* Optimization Strategy Panel */}
                                <div className="p-5 bg-purple-900/10 border border-purple-500/20 rounded-xl mt-4">
                                    <h4 className="text-purple-400 font-bold text-sm mb-4 border-b border-purple-500/20 pb-2">Optimization Strategy</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 block font-bold">Learning Rate</label>
                                            <input 
                                                type="number" step={0.0001} 
                                                value={medusaConfig.lr}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, lr: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-sm font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-xs text-gray-500 block font-bold">Medusa Decay</label>
                                            <input 
                                                type="number" step={0.1} 
                                                value={medusaConfig.decay}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, decay: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-sm font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1 col-span-2">
                                            <label className="text-xs text-gray-500 block font-bold">Scheduler</label>
                                            <select 
                                                value={medusaConfig.scheduler}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, scheduler: e.target.value})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-sm font-mono text-gray-300 outline-none focus:border-purple-500"
                                            >
                                                <option>Cosine</option>
                                                <option>Linear</option>
                                                <option>Constant</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-3 mt-6">
                                    <Dna className="animate-spin" />
                                    INITIATE HEAD TRAINING
                                </button>
                            </div>
                            
                            {/* Live Telemetry Panel */}
                            <div className="w-1/2 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-purple-400 font-bold text-sm uppercase flex items-center gap-2">
                                        <Activity size={16}/> Live Telemetry
                                    </h4>
                                    <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/30 px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Running
                                    </span>
                                </div>
                                
                                <div className="flex-1 bg-nebula-950 border border-nebula-800 rounded-xl p-4 flex flex-col min-h-0">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Current Loss</div>
                                            <div className="text-xl font-mono text-white font-bold">1.624</div>
                                            <div className="text-[10px] text-green-400 flex items-center justify-center gap-1"><TrendingDown size={10}/> 0.4%</div>
                                        </div>
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Top-1 Acc</div>
                                            <div className="text-xl font-mono text-white font-bold">88.2%</div>
                                        </div>
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Est. Time</div>
                                            <div className="text-xl font-mono text-purple-300 font-bold">2h 14m</div>
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    <div className="flex-1 min-h-0 bg-nebula-900/50 rounded border border-nebula-800/50 p-2 relative">
                                        <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-bold uppercase z-10">Training Loss (Cross Entropy)</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={MOCK_LOSS_DATA}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#272730" />
                                                <XAxis dataKey="step" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#121217', borderColor: '#272730', fontSize: '12px' }}
                                                    itemStyle={{ color: '#a78bfa' }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="loss" 
                                                    stroke="#8b5cf6" 
                                                    strokeWidth={2} 
                                                    dot={false}
                                                    activeDot={{ r: 4, fill: '#fff' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Active Specimen Info */}
                                    <div className="mt-4 pt-4 border-t border-nebula-800 flex justify-between items-center text-xs text-gray-500">
                                        <div>
                                            <span className="text-gray-300 font-bold">Medusa-Llama3-4Head</span>
                                            <span className="mx-2">•</span>
                                            <span>Epoch 2/5 (Step 120/500)</span>
                                        </div>
                                        <div className="w-32 h-2 bg-nebula-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 w-[24%] animate-[pulse_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bio-Storage (Inventory) */}
        <div className="w-72 flex flex-col gap-4 bg-nebula-900 border-l border-nebula-700 p-4 shadow-xl z-20 shrink-0 h-full overflow-hidden">
             <div className="flex items-center gap-2 text-purple-400 border-b border-nebula-800 pb-2 shrink-0">
                 <Box size={20} />
                 <h3 className="font-bold tracking-wider">BIO-STORAGE</h3>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                 {inventory.map(item => (
                     <div key={item.id} className="p-3 bg-nebula-950/50 border border-nebula-800 rounded hover:border-purple-500/50 hover:bg-purple-900/10 transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-1">
                             <span className="text-[10px] uppercase text-purple-400 font-bold border border-nebula-800 px-1 rounded bg-nebula-900">{item.type}</span>
                             <Save size={12} className="text-gray-600 group-hover:text-purple-400" />
                         </div>
                         <div className="font-bold text-sm text-gray-200 truncate mb-1">{item.name}</div>
                         <div className="text-[10px] text-gray-500 font-mono">
                             Src: {item.sourceModel} <br/>
                             Size: {item.size}
                         </div>
                     </div>
                 ))}
             </div>

             <div className="pt-4 border-t border-nebula-800 shrink-0">
                 <div className="text-[10px] text-gray-500 text-center uppercase">Storage Capacity: 12%</div>
                 <div className="w-full bg-nebula-800 h-1 mt-1 rounded-full overflow-hidden">
                     <div className="bg-purple-600 h-full w-[12%] shadow-[0_0_5px_#8b5cf6]"></div>
                 </div>
             </div>
        </div>
    </div>
  );
};
