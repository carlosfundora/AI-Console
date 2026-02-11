import React, { useState } from 'react';
import { Model, Dataset } from '../types';

interface TrainingProps {
  models: Model[];
  datasets: Dataset[];
}

export const Training: React.FC<TrainingProps> = ({ models, datasets }) => {
  const [mode, setMode] = useState<'lora' | 'sft' | 'distill'>('lora');
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-nebula-700 pb-4">
        <h2 className="text-2xl font-bold">🛠️ Training Laboratory</h2>
        <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
          <button 
            onClick={() => setMode('lora')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${mode === 'lora' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            LoRA (Laura)
          </button>
          <button 
            onClick={() => setMode('sft')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${mode === 'sft' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Supervised FT
          </button>
          <button 
            onClick={() => setMode('distill')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${mode === 'distill' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Distillation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-200">
                    {mode === 'lora' ? 'LoRA Adapter Configuration' : mode === 'sft' ? 'Full Fine-Tuning Setup' : 'Knowledge Distillation'}
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Base Model</label>
                        <select 
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.versions[0]?.size || 'Unknown'})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Dataset</label>
                        <select className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none">
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.rows} rows)</option>)}
                        </select>
                    </div>
                </div>

                {mode === 'lora' && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                         <div className="space-y-2">
                            <label className="text-sm text-gray-400">Rank (r)</label>
                            <input type="number" defaultValue={16} className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Alpha</label>
                            <input type="number" defaultValue={32} className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Dropout</label>
                            <input type="number" step="0.01" defaultValue={0.05} className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2 text-white" />
                        </div>
                    </div>
                )}
                
                {mode === 'distill' && (
                     <div className="space-y-2 mb-6">
                        <label className="text-sm text-gray-400">Teacher Model</label>
                        <select className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2.5 text-white">
                            <option>Gemini 1.5 Pro</option>
                            <option>GPT-4o</option>
                            <option>Llama-3-70b-Instruct</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">The student model will learn to mimic the teacher's probability distribution.</p>
                    </div>
                )}

                <div className="border-t border-nebula-700 pt-6 flex justify-end">
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-purple-900/30 flex items-center gap-2">
                        <span>🚀</span> Start {mode === 'lora' ? 'LoRA Training' : 'Job'}
                    </button>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-3">Estimated Resources</h3>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">VRAM Required</span>
                        <span className="text-white font-mono">18.4 GB</span>
                    </div>
                    <div className="w-full bg-nebula-950 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Est. Time</span>
                        <span className="text-white font-mono">4h 12m</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Cost (Cloud)</span>
                        <span className="text-white font-mono">$2.40/hr</span>
                    </div>
                </div>
            </div>

             <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-3">Training Queue</h3>
                <div className="space-y-3">
                    <div className="p-3 rounded bg-nebula-950 border border-nebula-800 opacity-60">
                         <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-gray-300">Q-LoRA Mistral</span>
                            <span className="text-xs text-green-500">Done</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1">
                            <div className="bg-green-500 h-1 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                    <div className="p-3 rounded bg-nebula-950 border border-purple-500/30">
                         <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-white">SFT Llama-3</span>
                            <span className="text-xs text-purple-400">Running</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1">
                            <div className="bg-purple-500 h-1 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};