
import React, { useState, useEffect } from 'react';
import { Model, Dataset } from '../types';
import { Terminal, Play, Clock, Zap, Database, Cpu, Layers, Activity, Lock, AlertTriangle, CheckCircle, RotateCw, Wrench, Mic, GraduationCap, Users, Plus, X, ArrowRight, GitMerge, Scale, SlidersHorizontal, ThumbsUp, Rocket, Calculator } from 'lucide-react';

interface TrainingProps {
  models: Model[];
  datasets: Dataset[];
}

export const Training: React.FC<TrainingProps> = ({ models, datasets }) => {
  const [mode, setMode] = useState<'lora' | 'sft' | 'distill' | 'agent' | 'audio' | 'dpo'>('lora');
  const [teacherModelId, setTeacherModelId] = useState<string>('');
  const [studentModels, setStudentModels] = useState<string[]>([models[0]?.id || '']);
  const [useUnsloth, setUseUnsloth] = useState(true);
  const [datasetsConfig, setDatasetsConfig] = useState({
      primary: '',
      contrastive: '',
      additive: ''
  });
  
  // LoRA State
  const [loraConfig, setLoraConfig] = useState({
      r: 16,
      alpha: 32,
      dropout: 0.05,
      targetModules: ['q_proj', 'v_proj'] // Default to attention only
  });

  // DPO Specific State
  const [dpoConfig, setDpoConfig] = useState({
      beta: 0.1,
      lossType: 'sigmoid',
      maxLength: 1024,
      maxPromptLength: 512,
      referenceModelId: ''
  });

  const [loraImpact, setLoraImpact] = useState({ params: 0, percent: 0 });

  const addStudent = () => {
      setStudentModels([...studentModels, '']);
  };

  const removeStudent = (index: number) => {
      if (studentModels.length > 1) {
          setStudentModels(studentModels.filter((_, i) => i !== index));
      }
  };

  const updateStudent = (index: number, modelId: string) => {
      const newStudents = [...studentModels];
      newStudents[index] = modelId;
      setStudentModels(newStudents);
  };

  const toggleLoRAModule = (mod: string) => {
      const current = new Set(loraConfig.targetModules);
      if (current.has(mod)) current.delete(mod);
      else current.add(mod);
      setLoraConfig({ ...loraConfig, targetModules: Array.from(current) });
  };

  // Recalculate LoRA Impact
  useEffect(() => {
      // Heuristic for 7B model: 
      // Hidden size ~4096, Layers ~32.
      // Params per linear adapter = 2 * d_model * r
      // Total = Layers * Num_Modules * (2 * d_model * r)
      const d_model = 4096;
      const layers = 32;
      const r = loraConfig.r;
      const num_modules = loraConfig.targetModules.length;
      
      const trainableParams = layers * num_modules * (2 * d_model * r);
      const totalParams7B = 7_000_000_000;
      
      setLoraImpact({
          params: trainableParams,
          percent: (trainableParams / totalParams7B) * 100
      });
  }, [loraConfig]);

  const isDataMixingSupported = ['lora', 'sft', 'distill'].includes(mode);
  const supportsUnsloth = ['lora', 'sft', 'dpo'].includes(mode);

  return (
    <div className="flex h-full gap-space-lg text-nebula-100 font-sans animate-fade-in p-space-lg overflow-hidden">
      {/* Main Configuration Chamber */}
      <div className="flex-1 flex flex-col gap-space-lg min-w-0 overflow-hidden">
         <div className="flex justify-between items-center shrink-0">
            <div>
                 <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm">
                    <Terminal className="text-purple-500" /> Training Console
                 </h2>
                 <p className="text-type-body text-gray-400 mt-1">Fine-tune, distill, and adapt models to new domains.</p>
            </div>
            
            <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
                <button 
                    onClick={() => setMode('lora')}
                    className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'lora' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Layers size={16} /> LoRA
                </button>
                <button 
                     onClick={() => setMode('sft')}
                     className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'sft' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Database size={16} /> SFT
                </button>
                <button 
                     onClick={() => setMode('dpo')}
                     className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'dpo' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Scale size={16} /> TRL / DPO
                </button>
                <button 
                     onClick={() => setMode('distill')}
                     className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'distill' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Cpu size={16} /> DistillKit
                </button>
                 <button 
                     onClick={() => setMode('agent')}
                     className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'agent' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Wrench size={16} /> Agent
                </button>
                <button 
                     onClick={() => setMode('audio')}
                     className={`px-4 py-2 rounded text-type-body font-bold transition-all flex items-center gap-space-sm ${mode === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Mic size={16} /> Audio FT
                </button>
            </div>
        </div>

        <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg relative overflow-y-auto backdrop-blur-sm custom-scrollbar">
             {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-space-2xl opacity-5 pointer-events-none">
                <Activity size={200} />
            </div>

            <div className="space-y-space-xl relative z-10">
                {/* Topology Config */}
                <div className="bg-nebula-950/50 border border-nebula-800 rounded-xl p-space-lg">
                    {mode === 'dpo' ? (
                        <>
                            <h3 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm uppercase tracking-wider">
                                <Scale size={16}/> Direct Preference Optimization (TRL)
                            </h3>
                            <div className="flex flex-col md:flex-row gap-space-xl items-start">
                                {/* Policy Model */}
                                <div className="flex-1 w-full">
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs flex items-center gap-space-sm">
                                        <GraduationCap size={14} /> Policy Model (Train)
                                    </label>
                                    <select 
                                        value={studentModels[0]}
                                        onChange={(e) => setStudentModels([e.target.value])}
                                        className="w-full bg-nebula-900 border border-nebula-700 rounded-lg p-space-md text-white focus:border-purple-500 outline-none transition-colors text-type-body"
                                    >
                                        <option value="">Select Policy Model...</option>
                                        {models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.params})</option>
                                        ))}
                                    </select>
                                    <p className="text-type-tiny text-gray-500 mt-space-xs leading-relaxed">
                                        The model to be aligned using preference pairs (chosen/rejected).
                                    </p>
                                </div>

                                {/* Flow Arrow */}
                                <div className="hidden md:flex flex-col items-center justify-center pt-8 text-gray-600">
                                    <ArrowRight size={24} />
                                </div>

                                {/* Reference Model */}
                                <div className="flex-1 w-full">
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs flex items-center gap-space-sm">
                                        <Lock size={14} /> Reference Model (Frozen)
                                    </label>
                                    <select 
                                        value={dpoConfig.referenceModelId}
                                        onChange={(e) => setDpoConfig({...dpoConfig, referenceModelId: e.target.value})}
                                        className="w-full bg-nebula-900 border border-nebula-700 rounded-lg p-space-md text-white focus:border-purple-500 outline-none transition-colors text-type-body"
                                    >
                                        <option value="">Same as Policy (Auto-Copy)</option>
                                        <optgroup label="Custom Ref">
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.params})</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <p className="text-type-tiny text-gray-500 mt-space-xs leading-relaxed">
                                        Used to compute the implicit reward. Keeps the policy from drifting too far.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm uppercase tracking-wider">
                                <GitMerge size={16}/> Training Topology
                            </h3>
                            <div className="flex flex-col md:flex-row gap-space-xl items-start">
                                {/* Teacher Column */}
                                <div className="flex-1 w-full">
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs flex items-center gap-space-sm">
                                        <GraduationCap size={14} /> Teacher (Oracle)
                                        {mode === 'distill' && <span className="text-red-400">* Required</span>}
                                    </label>
                                    <select 
                                        value={teacherModelId}
                                        onChange={(e) => setTeacherModelId(e.target.value)}
                                        className="w-full bg-nebula-900 border border-nebula-700 rounded-lg p-space-md text-white focus:border-purple-500 outline-none transition-colors text-type-body"
                                    >
                                        <option value="">None (Self-Supervised)</option>
                                        <optgroup label="Local Models">
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.params})</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="API Oracles">
                                            <option value="gpt-4o">GPT-4o (OpenAI)</option>
                                            <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
                                        </optgroup>
                                    </select>
                                    <p className="text-type-tiny text-gray-500 mt-space-xs leading-relaxed">
                                        The teacher provides soft labels, reasoning traces, or synthetic data to guide the student models.
                                    </p>
                                </div>

                                {/* Flow Arrow */}
                                <div className="hidden md:flex flex-col items-center justify-center pt-8 text-gray-600">
                                    <ArrowRight size={24} />
                                </div>

                                {/* Students Column */}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-center mb-space-xs">
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase flex items-center gap-space-sm">
                                            <Users size={14} /> Student Models
                                        </label>
                                        <button onClick={addStudent} className="text-type-tiny bg-purple-900/30 text-purple-300 px-2 py-1 rounded hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1">
                                            <Plus size={10} /> Add
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-space-sm">
                                        {studentModels.map((studentId, idx) => (
                                            <div key={idx} className="flex gap-space-sm">
                                                <select 
                                                    value={studentId}
                                                    onChange={(e) => updateStudent(idx, e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded-lg p-space-md text-white focus:border-purple-500 outline-none transition-colors text-type-body"
                                                >
                                                    <option value="">Select Student...</option>
                                                    {models.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name} ({m.params} - {m.tensorType})</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    onClick={() => removeStudent(idx)}
                                                    disabled={studentModels.length <= 1}
                                                    className="p-space-md bg-nebula-900 border border-nebula-700 rounded-lg text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Dataset & Params Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
                     <div className="space-y-space-md">
                        <label className="text-purple-400 text-type-tiny font-bold uppercase block tracking-wider">Dataset Configuration</label>
                        
                         <div className="space-y-space-xs">
                             <label className="text-type-body text-gray-400 font-medium">Training Data (Primary)</label>
                             <select 
                                value={datasetsConfig.primary}
                                onChange={(e) => setDatasetsConfig({...datasetsConfig, primary: e.target.value})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white focus:border-purple-500 outline-none transition-colors text-type-body"
                            >
                                <option value="">Select Dataset...</option>
                                {datasets.filter(d => mode !== 'dpo' || d.type === 'DPO').map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.rows.toLocaleString()} rows)</option>
                                ))}
                            </select>
                            {mode === 'dpo' && <p className="text-type-tiny text-gray-500">Only showing datasets tagged as 'DPO' (pairwise format).</p>}
                        </div>

                        {/* Hyperparameters */}
                        <div className="pt-space-md space-y-space-md">
                            <div className="flex justify-between items-center">
                                <label className="text-purple-400 text-type-tiny font-bold uppercase block tracking-wider">Hyperparameters</label>
                                {supportsUnsloth && (
                                    <div className="flex items-center gap-2">
                                        <label className={`text-type-tiny font-bold uppercase flex items-center gap-1 cursor-pointer ${useUnsloth ? 'text-orange-400' : 'text-gray-500'}`}>
                                            <Rocket size={12} /> Unsloth
                                            <input 
                                                type="checkbox" 
                                                checked={useUnsloth} 
                                                onChange={(e) => setUseUnsloth(e.target.checked)}
                                                className="ml-2 accent-orange-500"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                            
                            {mode === 'lora' && (
                                 <div className="grid grid-cols-2 gap-space-md">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Rank (r)</label>
                                        <input 
                                            type="number" 
                                            value={loraConfig.r}
                                            onChange={(e) => setLoraConfig({...loraConfig, r: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body outline-none focus:border-purple-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Alpha</label>
                                        <input 
                                            type="number" 
                                            value={loraConfig.alpha}
                                            onChange={(e) => setLoraConfig({...loraConfig, alpha: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body outline-none focus:border-purple-500" 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                         <label className="text-type-tiny text-gray-500 font-bold uppercase">Target Modules</label>
                                         <div className="flex gap-space-sm mt-1 flex-wrap">
                                            {['q_proj', 'v_proj', 'k_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'].map(mod => (
                                                <button 
                                                    key={mod} 
                                                    onClick={() => toggleLoRAModule(mod)}
                                                    className={`px-3 py-1 rounded text-type-tiny transition-all border ${loraConfig.targetModules.includes(mod) ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-nebula-900 border-nebula-700 text-gray-500 hover:text-white'}`}
                                                >
                                                    {mod}
                                                </button>
                                            ))}
                                         </div>
                                    </div>
                                    
                                    {/* Parameter Impact Calculator */}
                                    <div className="col-span-2 bg-nebula-900/50 border border-nebula-700 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calculator size={16} className="text-blue-400" />
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">Trainable Params (Est. 7B)</div>
                                                <div className="text-type-body font-mono text-white font-bold">{loraImpact.params.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Impact</div>
                                            <div className={`text-type-body font-mono font-bold ${loraImpact.percent > 2 ? 'text-red-400' : loraImpact.percent < 0.1 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {loraImpact.percent.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                            )}

                            {(mode === 'sft' || mode === 'agent' || mode === 'audio' || mode === 'distill') && (
                                <div className="grid grid-cols-2 gap-space-md">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Epochs</label>
                                        <input type="number" defaultValue={3} className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" />
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Learning Rate</label>
                                        <input type="number" defaultValue={2e-5} step={1e-6} className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" />
                                    </div>
                                </div>
                            )}

                            {mode === 'dpo' && (
                                <div className="grid grid-cols-2 gap-space-md">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Beta (Temperature)</label>
                                        <input 
                                            type="number" 
                                            step={0.1}
                                            min={0}
                                            max={1}
                                            value={dpoConfig.beta}
                                            onChange={(e) => setDpoConfig({...dpoConfig, beta: parseFloat(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" 
                                        />
                                        <span className="text-type-tiny text-gray-600 block mt-1">Controls deviation (0.1 - 0.5)</span>
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Learning Rate</label>
                                        <input type="number" defaultValue={1e-6} step={1e-7} className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" />
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Max Prompt Length</label>
                                        <input 
                                            type="number" 
                                            value={dpoConfig.maxPromptLength}
                                            onChange={(e) => setDpoConfig({...dpoConfig, maxPromptLength: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase">Max Seq Length</label>
                                        <input 
                                            type="number" 
                                            value={dpoConfig.maxLength}
                                            onChange={(e) => setDpoConfig({...dpoConfig, maxLength: parseInt(e.target.value)})}
                                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-md text-white mt-1 text-type-body" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>

                     <div className="space-y-space-md">
                        {isDataMixingSupported && (
                            <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl h-full">
                                <h4 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm"><Database size={14}/> Advanced Data Mixing Strategy</h4>
                                <div className="space-y-space-md">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs block">Positive / Additive (Reinforcement)</label>
                                        <select 
                                            value={datasetsConfig.additive}
                                            onChange={(e) => setDatasetsConfig({...datasetsConfig, additive: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-space-md text-white text-type-body outline-none focus:border-purple-500 transition-colors"
                                        >
                                            <option value="">None</option>
                                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        <p className="text-type-tiny text-gray-500 mt-space-xs">Injects high-quality examples (e.g. Golden sets) to steer behavior during training.</p>
                                    </div>
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs block">Negative / Contrastive (Rejection)</label>
                                        <select 
                                            value={datasetsConfig.contrastive}
                                            onChange={(e) => setDatasetsConfig({...datasetsConfig, contrastive: e.target.value})}
                                            className="w-full bg-nebula-900 border border-nebula-700 rounded p-space-md text-white text-type-body outline-none focus:border-purple-500 transition-colors"
                                        >
                                            <option value="">None</option>
                                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        <p className="text-type-tiny text-gray-500 mt-space-xs">Used for DPO/ORPO preference optimization or to unlearn behaviors.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mode Specific Configs */}
                        {mode === 'agent' && (
                             <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl h-full">
                                <h4 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm"><Wrench size={14}/> Agent Tool Config</h4>
                                <div>
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs block">Format Enforcement</label>
                                    <div className="space-y-space-sm">
                                        <label className="flex items-center gap-space-sm p-space-sm bg-nebula-900 rounded border border-nebula-700 cursor-pointer">
                                            <input type="radio" name="format" defaultChecked className="accent-purple-500" />
                                            <span className="text-type-body text-gray-300">Strict JSON (Constrained Decoding)</span>
                                        </label>
                                        <label className="flex items-center gap-space-sm p-space-sm bg-nebula-900 rounded border border-nebula-700 cursor-pointer">
                                            <input type="radio" name="format" className="accent-purple-500" />
                                            <span className="text-type-body text-gray-300">Thought + Action (ReAct)</span>
                                        </label>
                                    </div>
                                </div>
                             </div>
                        )}
                        
                        {mode === 'audio' && (
                            <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl h-full">
                                <h4 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm"><Mic size={14}/> Audio Specifics</h4>
                                <div className="space-y-space-md">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs block">CTC Loss Weight</label>
                                        <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" className="w-full accent-purple-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'dpo' && (
                            <div className="p-space-lg bg-nebula-950/50 border border-nebula-800 rounded-xl h-full">
                                <h4 className="text-purple-400 text-type-body font-bold mb-space-md flex items-center gap-space-sm"><SlidersHorizontal size={14}/> DPO Trainer Settings (TRL)</h4>
                                <div className="space-y-space-lg">
                                    <div>
                                        <label className="text-type-tiny text-gray-500 font-bold uppercase mb-space-xs block">Loss Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['sigmoid', 'hinge', 'ipo'].map(l => (
                                                <button 
                                                    key={l}
                                                    onClick={() => setDpoConfig({...dpoConfig, lossType: l})}
                                                    className={`py-2 rounded border text-type-tiny font-bold uppercase transition-all ${dpoConfig.lossType === l ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-900 border-nebula-700 text-gray-400 hover:text-white'}`}
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-type-tiny text-gray-500 mt-2">
                                            {dpoConfig.lossType === 'sigmoid' && "Standard DPO loss. Good default."}
                                            {dpoConfig.lossType === 'hinge' && "L1 hinge loss. More robust to outliers."}
                                            {dpoConfig.lossType === 'ipo' && "Identity Preference Optimization (IPO)."}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 bg-nebula-900/50 p-3 rounded border border-nebula-800">
                                        <ThumbsUp size={20} className="text-green-500" />
                                        <div className="flex-1">
                                            <div className="text-type-body text-white font-bold">Reward Signal</div>
                                            <div className="text-type-tiny text-gray-500">Implicit reward maximization via preference pairs</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-space-lg border-t border-nebula-800 flex justify-between items-center">
                    <div className="flex items-center gap-space-md text-type-caption text-gray-500">
                        <span className="flex items-center gap-space-xs"><Lock size={12}/> VRAM Protected</span>
                        <span className="flex items-center gap-space-xs"><AlertTriangle size={12}/> Backup Enabled</span>
                    </div>
                    <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-space-sm">
                        <Play size={18} fill="currentColor" />
                        START TRAINING JOB
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Sidebar: Resources & Queue */}
      <div className="w-80 flex flex-col gap-space-lg shrink-0">
           {/* Resource Monitor */}
           <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-space-md shadow-lg">
                <h3 className="text-type-body font-bold text-gray-200 mb-space-md flex items-center gap-space-sm">
                    <Zap size={16} className="text-yellow-500" /> Resource Estimate
                </h3>
                
                <div className="space-y-space-md">
                    <div>
                        <div className="flex justify-between text-type-caption text-gray-400 mb-1">
                            <span>VRAM Usage</span>
                            <span className="text-white">18.4 GB</span>
                        </div>
                        <div className="w-full bg-nebula-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-yellow-500 h-full w-[75%]"></div>
                        </div>
                        {useUnsloth && supportsUnsloth && (
                            <p className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                                <Rocket size={10} /> Unsloth VRAM savings active (-30%)
                            </p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-space-md pt-2">
                        <div className="p-space-sm bg-nebula-950 rounded border border-nebula-800">
                            <span className="text-type-tiny text-gray-500 uppercase block">Est. Duration</span>
                            <span className="text-type-body font-mono text-white">4h 12m</span>
                        </div>
                        <div className="p-space-sm bg-nebula-950 rounded border border-nebula-800">
                            <span className="text-type-tiny text-gray-500 uppercase block">Est. Cost</span>
                            <span className="text-type-body font-mono text-white">$2.40</span>
                        </div>
                    </div>
                </div>
           </div>

           {/* Active Queue */}
           <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-space-md shadow-lg flex flex-col">
                <h3 className="text-type-body font-bold text-gray-200 mb-space-md flex items-center gap-space-sm">
                    <Clock size={16} className="text-blue-500" /> Job Queue
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-space-sm">
                    {/* Active Job */}
                    <div className="p-space-sm bg-nebula-950 border border-purple-500/50 rounded relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-type-caption font-bold text-white">Llama-3-SFT-v1</span>
                             <RotateCw size={12} className="text-purple-400 animate-spin" />
                        </div>
                        <div className="text-type-tiny text-gray-500 mb-2">Step 450/1000 • Loss: 1.24</div>
                        <div className="w-full bg-nebula-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full w-[45%]"></div>
                        </div>
                    </div>

                    {/* Completed Job */}
                    <div className="p-space-sm bg-nebula-950/50 border border-nebula-800 rounded opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-type-caption font-bold text-gray-300">Q-LoRA Mistral</span>
                             <CheckCircle size={12} className="text-green-500" />
                        </div>
                        <div className="text-type-tiny text-gray-500">Completed 2h ago</div>
                    </div>

                    {/* Pending Job */}
                    <div className="p-space-sm bg-nebula-950/30 border border-nebula-800/50 border-dashed rounded text-gray-500">
                        <div className="flex justify-between items-start mb-1">
                             <span className="text-type-caption font-bold">DPO-Alignment</span>
                             <span className="text-type-tiny bg-nebula-800 px-1 rounded">Pending</span>
                        </div>
                    </div>
                </div>
           </div>
      </div>
    </div>
  );
};
