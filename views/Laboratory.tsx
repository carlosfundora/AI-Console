
import React, { useState } from 'react';
import { Model, LabArtifact } from '../types';
import { FlaskConical, Dna, Merge, Scissors, Zap, Box, Save, Plus, Trash2, CheckCircle, Loader2, BarChart2, TrendingDown, Activity, Settings, X, FileText, Info, Cpu, Layers, GitBranch } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LaboratoryProps {
  models: Model[];
}

type LabMode = 'merge' | 'extract' | 'medusa';
type MergeMethod = 'linear' | 'slerp' | 'task_arithmetic' | 'ties' | 'dare_linear' | 'dare_ties' | 'passthrough' | 'model_stock';
type MergeBackend = 'mergekit' | 'mergekit-pytorch';

// Mock Inventory Data
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
  const [inputModels, setInputModels] = useState<{id: number, modelId: string, weight: number}[]>([
      { id: 1, modelId: '', weight: 1.0 },
      { id: 2, modelId: '', weight: 1.0 }
  ]);
  
  // MergeKit Config
  const [mergeConfig, setMergeConfig] = useState({
      normalize: true,
      int8_mask: false,
      density: 0.5,
      t: 0.5, // For SLERP
      epsilon: 0.01,
      vocabRepair: false // mergekit-tokensurgeon
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

  const handleDeleteArtifact = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this artifact? This action cannot be undone.')) {
          setInventory(inventory.filter(item => item.id !== id));
          if (selectedArtifact?.id === id) {
              setSelectedArtifact(null);
          }
      }
  };

  const getMergeMethodInfo = (m: MergeMethod) => {
      switch(m) {
          case 'linear': return { label: 'Linear', desc: 'Weighted average of model parameters. Simple and effective for similar models.', base: 'Optional' };
          case 'slerp': return { label: 'SLERP', desc: 'Spherical Linear Interpolation. Better for preserving geometric properties in high-dim space.', base: 'N/A' };
          case 'task_arithmetic': return { label: 'Task Arithmetic', desc: 'Linearly combine task vectors (FineTune - Base).', base: 'Required' };
          case 'ties': return { label: 'TIES', desc: 'Trim, Elect Sign, & Merge. Reduces interference between models.', base: 'Required' };
          case 'dare_linear': return { label: 'DARE Linear', desc: 'Drop And REscale with Linear interpolation.', base: 'Required' };
          case 'dare_ties': return { label: 'DARE TIES', desc: 'Drop And REscale with TIES merging.', base: 'Required' };
          case 'model_stock': return { label: 'Model Stock', desc: 'Approximates the geometric center of models. Tuning-free.', base: 'Required' };
          case 'passthrough': return { label: 'Passthrough', desc: 'Directly copies tensors from input models (Frankenmerging).', base: 'N/A' };
      }
  };

  return (
    <div className="flex h-full gap-space-lg text-nebula-100 font-sans overflow-hidden p-space-lg relative">
        {/* Main Chamber */}
        <div className="flex-1 flex flex-col gap-space-lg min-w-0 h-full overflow-hidden">
            
            {/* Standard Header Style matching Benchmarks/Datasets */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                     <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm">
                        <FlaskConical className="text-purple-500" /> Laboratory
                     </h2>
                     <p className="text-type-body text-gray-400 mt-1">Experimental model synthesis, extraction, and surgery.</p>
                </div>
                
                <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
                    <button 
                        onClick={() => setMode('merge')}
                        className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'merge' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Merge size={16} /> MergeKit
                    </button>
                    <button 
                         onClick={() => setMode('extract')}
                         className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'extract' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Scissors size={16} /> Extraction
                    </button>
                    <button 
                         onClick={() => setMode('medusa')}
                         className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'medusa' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Dna size={16} /> Medusa
                    </button>
                </div>
            </div>

            {/* Workspace */}
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg relative overflow-hidden backdrop-blur-sm flex flex-col min-h-0">
                <div className="absolute top-0 right-0 p-space-2xl opacity-5 pointer-events-none">
                    <Zap size={200} />
                </div>

                {mode === 'merge' && (
                    <div className="space-y-space-xl relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-space-xl">
                            <div className="space-y-space-md">
                                <label className="text-purple-400 text-type-body font-bold uppercase block mb-2">Synthesis Method</label>
                                <div className="grid grid-cols-1 gap-space-sm border border-nebula-800/50 rounded-lg p-1">
                                    {(['linear', 'slerp', 'task_arithmetic', 'ties', 'dare_linear', 'dare_ties', 'model_stock', 'passthrough'] as MergeMethod[]).map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setMergeMethod(m)}
                                            className={`p-space-md rounded border text-left transition-all ${mergeMethod === m ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/50 hover:text-gray-200'}`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-bold text-type-body">{getMergeMethodInfo(m).label}</span>
                                                {getMergeMethodInfo(m).base === 'Required' && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-500/30">BASE REQ</span>}
                                            </div>
                                            <p className="text-type-tiny mt-1 opacity-70">{getMergeMethodInfo(m).desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Advanced Merge Config */}
                                <div className="mt-space-lg p-space-md bg-nebula-950/50 border border-nebula-800 rounded-xl">
                                    <h4 className="text-type-tiny text-gray-500 font-bold uppercase mb-4 flex items-center gap-space-sm">
                                        <Settings size={12} /> Algorithm Parameters
                                    </h4>
                                    
                                    <div className="space-y-space-md">
                                        {(mergeMethod === 'dare_linear' || mergeMethod === 'dare_ties' || mergeMethod === 'ties') && (
                                            <div>
                                                <div className="flex justify-between text-type-caption text-gray-400 mb-1">
                                                    <span>Density (Pruning)</span>
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

                                        {mergeMethod === 'slerp' && (
                                            <div>
                                                <div className="flex justify-between text-type-caption text-gray-400 mb-1">
                                                    <span>Interpolation Factor (t)</span>
                                                    <span>{mergeConfig.t}</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max="1" step="0.05"
                                                    value={mergeConfig.t}
                                                    onChange={(e) => setMergeConfig({...mergeConfig, t: parseFloat(e.target.value)})}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-space-sm">
                                            <input 
                                                type="checkbox" 
                                                id="normalize"
                                                checked={mergeConfig.normalize}
                                                onChange={(e) => setMergeConfig({...mergeConfig, normalize: e.target.checked})}
                                                className="accent-purple-500"
                                            />
                                            <label htmlFor="normalize" className="text-type-body text-gray-300">Normalize Weights</label>
                                        </div>

                                        <div className="flex items-center gap-space-sm">
                                            <input 
                                                type="checkbox" 
                                                id="int8_mask"
                                                checked={mergeConfig.int8_mask}
                                                onChange={(e) => setMergeConfig({...mergeConfig, int8_mask: e.target.checked})}
                                                className="accent-purple-500"
                                            />
                                            <label htmlFor="int8_mask" className="text-type-body text-gray-300">Int8 Mask (Memory Efficient)</label>
                                        </div>

                                        <div className="flex items-center gap-space-sm">
                                            <input 
                                                type="checkbox" 
                                                id="vocabRepair"
                                                checked={mergeConfig.vocabRepair}
                                                onChange={(e) => setMergeConfig({...mergeConfig, vocabRepair: e.target.checked})}
                                                className="accent-blue-500"
                                            />
                                            <label htmlFor="vocabRepair" className="text-type-body text-blue-300 font-medium flex items-center gap-2">
                                                <Scissors size={12} /> Run Token Surgeon (Vocab Alignment)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-space-lg">
                                
                                <div className="space-y-space-sm">
                                    <div className="flex justify-between items-center">
                                        <label className="text-purple-400 text-type-body font-bold uppercase">Target Output Path</label>
                                        <select 
                                            value={backend}
                                            onChange={(e) => setBackend(e.target.value as MergeBackend)}
                                            className="bg-nebula-900 border border-nebula-700 rounded px-2 py-1 text-type-tiny text-gray-300 outline-none focus:border-purple-500"
                                        >
                                            <option value="mergekit">Backend: MergeKit (Standard)</option>
                                            <option value="mergekit-pytorch">Backend: PyTorch (Legacy)</option>
                                        </select>
                                    </div>
                                    <input type="text" className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-gray-200 font-mono focus:border-purple-500 outline-none text-type-body" placeholder="./models/merged/chimera-v1" />
                                </div>

                                <div className="p-space-md bg-nebula-950/50 border border-nebula-800 rounded-lg">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-purple-400 font-bold flex items-center gap-space-sm text-type-body"><Merge size={16}/> Input Models</h4>
                                        <span className="text-type-tiny text-gray-500 uppercase tracking-wider">{inputModels.length} Layers</span>
                                    </div>
                                    <div className="space-y-space-sm">
                                        {inputModels.map((im, index) => (
                                            <div key={im.id} className="flex gap-space-sm animate-fade-in items-center group">
                                                <div className="text-type-tiny text-gray-600 font-mono w-4">{index + 1}</div>
                                                <select 
                                                    value={im.modelId}
                                                    onChange={(e) => updateInputModel(im.id, 'modelId', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 text-type-body focus:border-purple-500 outline-none transition-colors"
                                                >
                                                    <option value="">Select Model...</option>
                                                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                                <input 
                                                    type="number" 
                                                    value={im.weight}
                                                    onChange={(e) => updateInputModel(im.id, 'weight', parseFloat(e.target.value))}
                                                    placeholder="Weight" 
                                                    className="w-20 bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 text-type-body focus:border-purple-500 outline-none transition-colors" 
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
                                        className="w-full mt-3 py-2 border border-dashed border-nebula-700 text-gray-500 text-type-tiny hover:text-purple-400 hover:border-purple-500 rounded transition-all flex items-center justify-center gap-space-sm"
                                    >
                                        <Plus size={14} /> Add Layer Source
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-space-lg border-t border-nebula-800">
                            <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-space-sm">
                                <Zap className="animate-pulse" />
                                INITIATE FUSION
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'extract' && (
                     <div className="space-y-space-xl relative z-10 animate-fade-in overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-space-xl">
                             <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl relative">
                                <h3 className="text-type-heading-md font-bold text-purple-400 mb-space-md flex items-center gap-space-sm"><Scissors size={20}/> LoRA Extraction</h3>
                                <p className="text-type-caption text-gray-400 mb-space-lg">Extract PEFT-compatible low-rank approximations from fine-tuned models relative to a base.</p>
                                
                                <div className="space-y-space-md">
                                    <div>
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex gap-1">Fine-Tuned Model <span className="text-red-400" title="Required">*</span></label>
                                        <select 
                                            value={extractionConfig.ftModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, ftModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body"
                                        >
                                            <option value="">Select FT Checkpoint...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex gap-1">Base Model <span className="text-red-400" title="Required">*</span></label>
                                        <select 
                                            value={extractionConfig.baseModel}
                                            onChange={(e) => setExtractionConfig({...extractionConfig, baseModel: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body"
                                        >
                                            <option value="">Select Base Model...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-space-md">
                                         <div>
                                            <label className="text-type-tiny uppercase text-gray-500 font-bold">Max Rank</label>
                                            <input 
                                                type="number" 
                                                value={extractionConfig.rank}
                                                onChange={(e) => setExtractionConfig({...extractionConfig, rank: parseInt(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body" 
                                            />
                                        </div>
                                         <div>
                                            <label className="text-type-tiny uppercase text-gray-500 font-bold">SV Epsilon</label>
                                            <input 
                                                type="number" 
                                                step={0.001}
                                                value={extractionConfig.epsilon}
                                                onChange={(e) => setExtractionConfig({...extractionConfig, epsilon: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleExtraction}
                                        disabled={!extractionConfig.ftModel || !extractionConfig.baseModel || extractionStatus === 'processing'}
                                        className={`w-full py-2 border transition-all rounded font-bold mt-4 flex justify-center items-center gap-space-sm text-type-body ${
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

                             <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl">
                                <h3 className="text-type-heading-md font-bold text-purple-400 mb-space-md flex items-center gap-space-sm"><Scissors size={20}/> Token Surgeon</h3>
                                <p className="text-type-caption text-gray-400 mb-space-lg">Transplant tokenizers to align vocabulary for cross-model distillation.</p>
                                <div className="space-y-space-md">
                                     <div>
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex gap-1">Source Model <span className="text-red-400" title="Required">*</span></label>
                                        <select className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body">
                                            <option value="">Select Source...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <button className="w-full py-2 bg-purple-900/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white transition-all rounded font-bold mt-auto text-type-body">
                                        HARVEST TOKENIZER
                                    </button>
                                </div>
                             </div>
                        </div>
                     </div>
                )}

                {mode === 'medusa' && (
                    <div className="space-y-space-lg relative z-10 animate-fade-in flex flex-col h-full overflow-hidden">
                        <div className="flex items-start gap-space-lg flex-1 min-h-0">
                            <div className="w-1/2 space-y-space-md overflow-y-auto h-full pr-2 custom-scrollbar">
                                <h3 className="text-type-heading-md font-bold text-purple-400 mb-space-xs flex items-center gap-space-sm"><Dna size={20}/> Medusa Head Configuration</h3>
                                <p className="text-type-body text-gray-400">Train multiple lightweight heads on top of a frozen backbone to predict future tokens in parallel (Speculative Decoding).</p>
                                
                                <div className="grid grid-cols-2 gap-space-md mt-6">
                                     <div className="col-span-2">
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold">Backbone Model (Frozen)</label>
                                        <select 
                                            value={medusaConfig.backbone}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, backbone: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-3 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body"
                                        >
                                            <option value="">Select Backbone...</option>
                                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold">Number of Heads</label>
                                        <input 
                                            type="number" 
                                            value={medusaConfig.heads}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, heads: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-3 text-gray-300 mt-1 outline-none focus:border-purple-500 text-type-body" 
                                        />
                                    </div>
                                </div>

                                {/* Optimization Strategy Panel */}
                                <div className="p-space-md bg-purple-900/10 border border-purple-500/20 rounded-xl mt-4">
                                    <h4 className="text-purple-400 font-bold text-type-body mb-4 border-b border-purple-500/20 pb-2">Optimization Strategy</h4>
                                    <div className="grid grid-cols-2 gap-space-md">
                                        <div className="space-y-1">
                                            <label className="text-type-tiny text-gray-500 block font-bold">Learning Rate</label>
                                            <input 
                                                type="number" step={0.0001} 
                                                value={medusaConfig.lr}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, lr: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-type-body font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-type-tiny text-gray-500 block font-bold">Medusa Decay</label>
                                            <input 
                                                type="number" step={0.1} 
                                                value={medusaConfig.decay}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, decay: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-type-body font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1 col-span-2">
                                            <label className="text-type-tiny text-gray-500 block font-bold">Scheduler</label>
                                            <select 
                                                value={medusaConfig.scheduler}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, scheduler: e.target.value})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-type-body font-mono text-gray-300 outline-none focus:border-purple-500"
                                            >
                                                <option>Cosine</option>
                                                <option>Linear</option>
                                                <option>Constant</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-space-sm mt-6 text-type-body">
                                    <Dna className="animate-spin" />
                                    INITIATE HEAD TRAINING
                                </button>
                            </div>
                            
                            {/* Live Telemetry Panel */}
                            <div className="w-1/2 flex flex-col h-full gap-space-md">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-purple-400 font-bold text-type-body uppercase flex items-center gap-space-sm">
                                        <Activity size={16}/> Live Telemetry
                                    </h4>
                                    <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/30 px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Running
                                    </span>
                                </div>
                                
                                <div className="flex-1 bg-nebula-950 border border-nebula-800 rounded-xl p-space-md flex flex-col min-h-0">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-space-md mb-space-md">
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-type-tiny text-gray-500 uppercase font-bold">Current Loss</div>
                                            <div className="text-type-heading-md font-mono text-white font-bold">1.624</div>
                                            <div className="text-type-tiny text-green-400 flex items-center justify-center gap-1"><TrendingDown size={10}/> 0.4%</div>
                                        </div>
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-type-tiny text-gray-500 uppercase font-bold">Top-1 Acc</div>
                                            <div className="text-type-heading-md font-mono text-white font-bold">88.2%</div>
                                        </div>
                                        <div className="bg-nebula-900 p-3 rounded border border-nebula-800 text-center">
                                            <div className="text-type-tiny text-gray-500 uppercase font-bold">Est. Time</div>
                                            <div className="text-type-heading-md font-mono text-purple-300 font-bold">2h 14m</div>
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    <div className="flex-1 min-h-0 bg-nebula-900/50 rounded border border-nebula-800/50 p-2 relative">
                                        <div className="absolute top-2 left-2 text-type-tiny text-gray-500 font-bold uppercase z-10">Training Loss (Cross Entropy)</div>
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
                                    <div className="mt-4 pt-4 border-t border-nebula-800 flex justify-between items-center text-type-caption text-gray-500">
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
        <div className="w-72 flex flex-col gap-space-md bg-nebula-900 border-l border-nebula-700 p-space-md shadow-xl z-20 shrink-0 h-full overflow-hidden">
             <div className="flex items-center gap-space-sm text-purple-400 border-b border-nebula-800 pb-2 shrink-0">
                 <Box size={20} />
                 <h3 className="font-bold tracking-wider text-type-body">BIO-STORAGE</h3>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar pr-1">
                 {inventory.map(item => (
                     <div 
                        key={item.id} 
                        onClick={() => setSelectedArtifact(item)}
                        className={`p-space-sm bg-nebula-950/50 border rounded transition-all cursor-pointer group relative ${selectedArtifact?.id === item.id ? 'border-purple-500 bg-purple-900/10' : 'border-nebula-800 hover:border-purple-500/50 hover:bg-purple-900/10'}`}
                     >
                         <div className="flex justify-between items-start mb-1">
                             <span className="text-[10px] uppercase text-purple-400 font-bold border border-nebula-800 px-1 rounded bg-nebula-900">{item.type}</span>
                             <Save size={12} className="text-gray-600 group-hover:text-purple-400" />
                         </div>
                         <div className="font-bold text-type-body text-gray-200 truncate mb-1 pr-6">{item.name}</div>
                         <div className="text-[10px] text-gray-500 font-mono">
                             Src: {item.sourceModel} <br/>
                             Size: {item.size}
                         </div>
                         <button 
                            onClick={(e) => handleDeleteArtifact(item.id, e)}
                            className="absolute bottom-2 right-2 p-1.5 text-gray-600 hover:text-red-400 hover:bg-nebula-900 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Artifact"
                         >
                             <Trash2 size={12} />
                         </button>
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

        {/* Artifact Detail Modal */}
        {selectedArtifact && (
            <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-space-lg animate-fade-in" onClick={() => setSelectedArtifact(null)}>
                <div 
                    className="bg-nebula-900 border border-nebula-700 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-space-lg border-b border-nebula-800 bg-nebula-950/50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-space-sm mb-1">
                                <span className="text-[10px] uppercase text-purple-400 font-bold border border-nebula-800 px-2 py-0.5 rounded bg-nebula-900">{selectedArtifact.type}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{selectedArtifact.created}</span>
                            </div>
                            <h3 className="text-type-heading-md font-bold text-white">{selectedArtifact.name}</h3>
                        </div>
                        <button onClick={() => setSelectedArtifact(null)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-nebula-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-space-lg space-y-space-lg overflow-y-auto max-h-[60vh]">
                        <div className="grid grid-cols-2 gap-space-md">
                            <div className="bg-nebula-950 p-3 rounded border border-nebula-800">
                                <div className="text-type-tiny text-gray-500 uppercase font-bold">Source Model</div>
                                <div className="text-white font-mono text-type-body">{selectedArtifact.sourceModel}</div>
                            </div>
                            <div className="bg-nebula-950 p-3 rounded border border-nebula-800">
                                <div className="text-type-tiny text-gray-500 uppercase font-bold">Size</div>
                                <div className="text-white font-mono text-type-body">{selectedArtifact.size}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><FileText size={14}/> Description</h4>
                            <p className="text-gray-300 text-type-body leading-relaxed bg-nebula-950/30 p-3 rounded border border-nebula-800/50">
                                {selectedArtifact.description || "No description available for this artifact."}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-type-caption font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Info size={14}/> Usage Instructions</h4>
                            <p className="text-gray-300 text-type-body leading-relaxed bg-nebula-950/30 p-3 rounded border border-nebula-800/50">
                                {selectedArtifact.usage || "No specific usage instructions provided."}
                            </p>
                        </div>
                    </div>

                    <div className="p-space-md border-t border-nebula-800 bg-nebula-950/30 flex justify-end gap-space-md">
                        <button 
                            onClick={(e) => handleDeleteArtifact(selectedArtifact.id, e)}
                            className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded text-sm font-bold transition-colors border border-transparent hover:border-red-900/50"
                        >
                            Delete Artifact
                        </button>
                        <button onClick={() => setSelectedArtifact(null)} className="px-4 py-2 bg-nebula-800 hover:bg-nebula-700 text-white rounded text-sm font-bold transition-colors border border-nebula-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
