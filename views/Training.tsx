
import React, { useState } from 'react';
import { Model, Dataset } from '../types';
import { Terminal, Play, Clock, Zap, Database, Cpu, Layers, Activity, Lock, AlertTriangle, CheckCircle, RotateCw, Wrench, Mic } from 'lucide-react';

interface TrainingProps {
  models: Model[];
  datasets: Dataset[];
}

export const Training: React.FC<TrainingProps> = ({ models, datasets }) => {
  const [mode, setMode] = useState<'lora' | 'sft' | 'distill' | 'agent' | 'audio'>('lora');
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || '');
  const [datasetsConfig, setDatasetsConfig] = useState({
      primary: '',
      contrastive: '',
      additive: ''
  });

  return (
    <div className="flex h-full gap-8 text-nebula-100 font-sans animate-fade-in">
      {/* Main Configuration Chamber */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
         <div className="flex justify-between items-center">
            <div>
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="text-purple-500" /> Training Console
                 </h2>
                 <p className="text-sm text-gray-400 mt-1">Fine-tune, distill, and adapt models to new domains.</p>
            </div>
            
            <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
                <button 
                    onClick={() => setMode('lora')}
                    className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'lora' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Layers size={16} /> LoRA
                </button>
                <button 
                     onClick={() => setMode('sft')}
                     className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'sft' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Database size={16} /> SFT
                </button>
                <button 
                     onClick={() => setMode('distill')}
                     className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'distill' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Cpu size={16} /> DistillKit
                </button>
                 <button 
                     onClick={() => setMode('agent')}
                     className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'agent' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Wrench size={16} /> Agent
                </button>
                <button 
                     onClick={() => setMode('audio')}
                     className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Mic size={16} /> Audio FT
                </button>
            </div>
        </div>

        <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
             {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Activity size={200} />
            </div>

            <div className="space-y-8 relative z-10">
                {/* Core Config */}
                <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-purple-400 text-xs font-bold uppercase block tracking-wider">Target Configuration</label>
                        
                        <div className="space-y-2">
                             <label className="text-sm text-gray-400 font-medium">Base Model</label>
                             <select 
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            >
                                {models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.params} - {m.tensorType})</option>
                                ))}
                            </select>
                        </div>

                         <div className="space-y-2">
                             <label className="text-sm text-gray-400 font-medium">Training Data (Primary)</label>
                             <select 
                                value={datasetsConfig.primary}
                                onChange={(e) => setDatasetsConfig({...datasetsConfig, primary: e.target.value})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            >
                                <option value="">Select Dataset...</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.rows.toLocaleString()} rows)</option>)}
                            </select>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-purple-400 text-xs font-bold uppercase block tracking-wider">Hyperparameters</label>
                        
                        {mode === 'lora' && (
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase">Rank (r)</label>
                                    <input type="number" defaultValue={16} className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase">Alpha</label>
                                    <input type="number" defaultValue={32} className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white mt-1" />
                                </div>
                                <div className="col-span-2">
                                     <label className="text-xs text-gray-500 font-bold uppercase">Target Modules</label>
                                     <div className="flex gap-2 mt-1">
                                        {['q_proj', 'v_proj', 'k_proj', 'o_proj'].map(mod => (
                                            <span key={mod} className="px-3 py-1 bg-nebula-800 border border-nebula-600 rounded text-xs text-gray-300 cursor-pointer hover:bg-purple-900/50 hover:border-purple-500">{mod}</span>
                                        ))}
                                     </div>
                                </div>
                             </div>
                        )}

                        {mode === 'distill' && (
                             <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-medium">Teacher Model (Oracle)</label>
                                <select className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white">
                                    <option>Gemini 1.5 Pro</option>
                                    <option>GPT-4o</option>
                                    <option>Llama-3-70b-Instruct</option>
                                </select>
                             </div>
                        )}

                        {(mode === 'sft' || mode === 'agent' || mode === 'audio') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase">Epochs</label>
                                    <input type="number" defaultValue={3} className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase">Learning Rate</label>
                                    <input type="number" defaultValue={2e-5} step={1e-6} className="w-full bg-nebula-950 border border-nebula-700 rounded p-3 text-white mt-1" />
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {/* Advanced Data Mixing / Agent Config / Audio Config */}
                {mode === 'agent' && (
                     <div className="p-5 bg-nebula-950/50 border border-nebula-800 rounded-xl">
                        <h4 className="text-purple-400 text-sm font-bold mb-4 flex items-center gap-2"><Wrench size={14}/> Tool Use Configuration</h4>
                        <div className="grid grid-cols-2 gap-8">
                             <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Tool Definitions (JSON Schema)</label>
                                <textarea 
                                    className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-xs font-mono outline-none h-24"
                                    placeholder='[{"type": "function", "function": { "name": "get_weather", ... } }]'
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Format Enforcement</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-2 bg-nebula-900 rounded border border-nebula-700 cursor-pointer">
                                        <input type="radio" name="format" defaultChecked className="accent-purple-500" />
                                        <span className="text-sm text-gray-300">Strict JSON (Constrained Decoding)</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 bg-nebula-900 rounded border border-nebula-700 cursor-pointer">
                                        <input type="radio" name="format" className="accent-purple-500" />
                                        <span className="text-sm text-gray-300">Thought + Action (ReAct)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                     </div>
                )}

                {mode === 'audio' && (
                    <div className="p-5 bg-nebula-950/50 border border-nebula-800 rounded-xl">
                        <h4 className="text-purple-400 text-sm font-bold mb-4 flex items-center gap-2"><Mic size={14}/> Audio Fine-Tuning Parameters (LFM-Audio)</h4>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Audio Encoder Frozen?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freeze_enc" defaultChecked className="accent-purple-500" />
                                            <span className="text-sm text-gray-300">Yes (Adapter Only)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freeze_enc" className="accent-purple-500" />
                                            <span className="text-sm text-gray-300">No (Full FT)</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">CTC Loss Weight</label>
                                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" className="w-full accent-purple-500" />
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>0.0 (LLM Only)</span>
                                        <span>0.3 (Hybrid)</span>
                                        <span>1.0 (ASR Only)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">SpecAugment Masking</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500">Freq Mask</label>
                                            <input type="number" defaultValue={27} className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-xs mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500">Time Mask</label>
                                            <input type="number" defaultValue={100} className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-xs mt-1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-nebula-900 rounded border border-nebula-700">
                                    <input type="checkbox" defaultChecked className="accent-purple-500" />
                                    <label className="text-sm text-gray-300">Interleaved Audio/Text Data</label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(mode === 'distill' || mode === 'sft') && (
                    <div className="p-5 bg-nebula-950/50 border border-nebula-800 rounded-xl">
                        <h4 className="text-purple-400 text-sm font-bold mb-4 flex items-center gap-2"><Database size={14}/> Advanced Data Mixing Strategy</h4>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Positive / Additive (Reinforcement)</label>
                                <select 
                                    value={datasetsConfig.additive}
                                    onChange={(e) => setDatasetsConfig({...datasetsConfig, additive: e.target.value})}
                                    className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-sm outline-none"
                                >
                                    <option value="">None</option>
                                    {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">Injects high-quality examples to steer behavior.</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Negative / Contrastive (Rejection)</label>
                                <select 
                                    value={datasetsConfig.contrastive}
                                    onChange={(e) => setDatasetsConfig({...datasetsConfig, contrastive: e.target.value})}
                                    className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-sm outline-none"
                                >
                                    <option value="">None</option>
                                    {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">Used for DPO/ORPO preference optimization.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="pt-6 border-t border-nebula-800 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Lock size={12}/> VRAM Protected</span>
                        <span className="flex items-center gap-1"><AlertTriangle size={12}/> Backup Enabled</span>
                    </div>
                    <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-3">
                        <Play size={18} fill="currentColor" />
                        START TRAINING JOB
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Sidebar: Resources & Queue */}
      <div className="w-80 flex flex-col gap-6">
           {/* Resource Monitor */}
           <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" /> Resource Estimate
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>VRAM Usage</span>
                            <span className="text-white">18.4 GB</span>
                        </div>
                        <div className="w-full bg-nebula-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-yellow-500 h-full w-[75%]"></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-2 bg-nebula-950 rounded border border-nebula-800">
                            <span className="text-[10px] text-gray-500 uppercase block">Est. Duration</span>
                            <span className="text-sm font-mono text-white">4h 12m</span>
                        </div>
                        <div className="p-2 bg-nebula-950 rounded border border-nebula-800">
                            <span className="text-[10px] text-gray-500 uppercase block">Est. Cost</span>
                            <span className="text-sm font-mono text-white">$2.40</span>
                        </div>
                    </div>
                </div>
           </div>

           {/* Active Queue */}
           <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-5 shadow-lg flex flex-col">
                <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> Job Queue
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                    {/* Active Job */}
                    <div className="p-3 bg-nebula-950 border border-purple-500/50 rounded relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-bold text-white">Llama-3-SFT-v1</span>
                             <RotateCw size={12} className="text-purple-400 animate-spin" />
                        </div>
                        <div className="text-[10px] text-gray-500 mb-2">Step 450/1000 • Loss: 1.24</div>
                        <div className="w-full bg-nebula-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full w-[45%]"></div>
                        </div>
                    </div>

                    {/* Completed Job */}
                    <div className="p-3 bg-nebula-950/50 border border-nebula-800 rounded opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-bold text-gray-300">Q-LoRA Mistral</span>
                             <CheckCircle size={12} className="text-green-500" />
                        </div>
                        <div className="text-[10px] text-gray-500">Completed 2h ago</div>
                    </div>

                    {/* Pending Job */}
                    <div className="p-3 bg-nebula-950/30 border border-nebula-800/50 border-dashed rounded text-gray-500">
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-bold">DPO-Alignment</span>
                             <span className="text-[10px] bg-nebula-800 px-1 rounded">Pending</span>
                        </div>
                    </div>
                </div>
           </div>
      </div>
    </div>
  );
};
