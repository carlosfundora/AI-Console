import React, { useState } from 'react';
import { Dataset } from '../types';
import { generateSyntheticDataSample } from '../services/geminiService';

interface DatasetsProps {
  datasets: Dataset[];
}

export const Datasets: React.FC<DatasetsProps> = ({ datasets }) => {
  const [topic, setTopic] = useState('');
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const jsonStr = await generateSyntheticDataSample(topic);
      const data = JSON.parse(jsonStr || '[]');
      setGeneratedData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate data. Check console/API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col space-y-6">
        <h2 className="text-2xl font-bold">📚 Data Curation</h2>
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-nebula-700 bg-nebula-950/30 flex justify-between items-center">
                <span className="font-semibold text-gray-200">Local Datasets</span>
                <button className="text-xs bg-nebula-800 px-2 py-1 rounded text-purple-300 hover:text-white transition-colors">Import .JSONL</button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {datasets.map(ds => (
                    <div key={ds.id} className="p-4 rounded-lg bg-nebula-950/50 border border-nebula-700/50 hover:border-purple-500/30 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{ds.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{ds.description}</p>
                            </div>
                            <span className="text-xs bg-nebula-800 text-gray-300 px-2 py-1 rounded">{ds.type}</span>
                        </div>
                        <div className="mt-3 flex gap-4 text-xs text-gray-500 font-mono">
                            <span>📦 {ds.size}</span>
                            <span>📝 {ds.rows.toLocaleString()} rows</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🧬</span> Synthetic Generator
        </h2>
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col h-full">
            <div className="mb-6 space-y-2">
                <label className="text-sm font-medium text-gray-300">Generation Topic (Gemini-Powered)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Python coding puzzles for beginners" 
                        className="flex-1 bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? '...' : 'Generate'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-nebula-950 rounded-lg border border-nebula-800 p-4 overflow-y-auto font-mono text-xs text-gray-300 relative">
                 {!generatedData.length && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        Generated samples will appear here...
                    </div>
                 )}
                 {generatedData.map((item, i) => (
                     <div key={i} className="mb-4 pb-4 border-b border-nebula-800 last:border-0">
                         <div className="text-purple-400 mb-1"># Instruction</div>
                         <div className="mb-2">{item.instruction}</div>
                         {item.input && (
                            <>
                                <div className="text-blue-400 mb-1"># Input</div>
                                <div className="mb-2">{item.input}</div>
                            </>
                         )}
                         <div className="text-green-400 mb-1"># Output</div>
                         <div>{item.output}</div>
                     </div>
                 ))}
            </div>
            
            {generatedData.length > 0 && (
                <div className="mt-4 flex justify-end">
                    <button className="text-sm text-white bg-green-700 hover:bg-green-600 px-4 py-2 rounded shadow-lg">
                        Save to Dataset
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};