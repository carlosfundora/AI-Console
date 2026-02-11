import React, { useState } from 'react';
import { Model, LabArtifact } from '../types';
import { FlaskConical, Dna, Merge, Scissors, Zap, Box, Save, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export const Laboratory: React.FC<LaboratoryProps> = ({ models }) => {
  const [mode, setMode] = useState<LabMode>('merge');
  const [mergeMethod, setMergeMethod] = useState<MergeMethod>('arcee_fusion');
  const [inventory, setInventory] = useState<LabArtifact[]>(MOCK_INVENTORY);
  const [inputModels, setInputModels] = useState<{id: number, modelId: string, weight: number}[]>([
      { id: 1, modelId: '', weight: 1.0 },
      { id: 2, modelId: '', weight: 1.0 }
  ]);

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
    <div className="flex h-full gap-8 text-nebula-100 font-sans">
        {/* Main Chamber */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
            
            {/* Standard Header Style matching Benchmarks/Datasets */}
            <div className="flex justify-between items-center">
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
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Zap size={200} />
                </div>

                {mode === 'merge' && (
                    <div className="space-y-8 relative z-10 animate-fade-in">
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
                     <div className="space-y-8 relative z-10 animate-fade-in">
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
                    <div className="space-y-6 relative z-10 animate-fade-in">
                        <div className="flex items-start gap-6">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2"><Dna size={20}/> Medusa Head Training</h3>
                                <p className="text-sm text-gray-400">Train multiple lightweight heads on top of a frozen backbone to predict future tokens in parallel (Speculative Decoding).</p>
                                
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                     <div>
                                        <label className="text-xs uppercase text-gray-500 font-bold">Backbone Model (Frozen)</label>
                                        <select 
                                            value={medusaConfig.backbone}
                                            onChange={(e) => setMedusaConfig({...medusaConfig, backbone: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500"
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
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 mt-1 outline-none focus:border-purple-500" 
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded mt-4">
                                    <h4 className="text-purple-400 font-bold text-sm mb-2">Training Configuration</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 block">Learning Rate</label>
                                            <input 
                                                type="number" step={0.0001} 
                                                value={medusaConfig.lr}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, lr: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-1 text-sm font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-xs text-gray-500 block">Medusa Decay</label>
                                            <input 
                                                type="number" step={0.1} 
                                                value={medusaConfig.decay}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, decay: parseFloat(e.target.value)})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-1 text-sm font-mono text-gray-300 outline-none focus:border-purple-500" 
                                            />
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-xs text-gray-500 block">Scheduler</label>
                                            <select 
                                                value={medusaConfig.scheduler}
                                                onChange={(e) => setMedusaConfig({...medusaConfig, scheduler: e.target.value})}
                                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-1 text-sm font-mono text-gray-300 outline-none focus:border-purple-500"
                                            >
                                                <option>Cosine</option>
                                                <option>Linear</option>
                                                <option>Constant</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-3 mt-6">
                                    <Dna className="animate-spin" />
                                    GROW HEADS
                                </button>
                            </div>
                            
                            <div className="w-1/3 p-4 border border-nebula-800 bg-nebula-950/50 rounded-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-purple-400 font-bold text-sm uppercase">Active Specimens</h4>
                                    <span className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">1 Running</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-3 bg-nebula-900 border border-purple-500/30 rounded shadow-lg opacity-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-purple-300 font-bold">Medusa-Llama3-4Head</div>
                                                <div className="text-[10px] text-gray-500 mt-1">Backbone: Llama-3-8b</div>
                                            </div>
                                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                                        </div>
                                        
                                        <div className="space-y-2 mt-3">
                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                <span>Epoch 2/5</span>
                                                <span>40%</span>
                                            </div>
                                            <div className="w-full h-1 bg-nebula-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 w-[40%] animate-pulse"></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 font-mono text-gray-500">
                                                <div>Loss: <span className="text-gray-300">1.402</span></div>
                                                <div>Acc: <span className="text-gray-300">88.2%</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Placeholder for empty state */}
                                    <div className="border border-dashed border-nebula-800 rounded p-4 text-center text-xs text-gray-600">
                                        Queue empty. Start a new job.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bio-Storage (Inventory) */}
        <div className="w-72 flex flex-col gap-4 bg-nebula-900 border-l border-nebula-700 p-4 shadow-xl z-20">
             <div className="flex items-center gap-2 text-purple-400 border-b border-nebula-800 pb-2">
                 <Box size={20} />
                 <h3 className="font-bold tracking-wider">BIO-STORAGE</h3>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3">
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

             <div className="pt-4 border-t border-nebula-800">
                 <div className="text-[10px] text-gray-500 text-center uppercase">Storage Capacity: 12%</div>
                 <div className="w-full bg-nebula-800 h-1 mt-1 rounded-full overflow-hidden">
                     <div className="bg-purple-600 h-full w-[12%] shadow-[0_0_5px_#8b5cf6]"></div>
                 </div>
             </div>
        </div>
    </div>
  );
};