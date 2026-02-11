import React, { useState } from 'react';
import { Dataset } from '../types';
import { generateSyntheticDataSample } from '../services/geminiService';
import { Filter, SortAsc, Sparkles, Download, FileText, MessageSquare, Code, Save } from 'lucide-react';

interface DatasetsProps {
  datasets: Dataset[];
}

type SortOption = 'name' | 'size' | 'rows';
type FilterOption = 'all' | 'SFT' | 'DPO' | 'Pretrain';
type GenTemplate = 'Instruction' | 'Chat' | 'Completion';

const DatasetCard = React.memo(({ ds }: { ds: Dataset }) => (
    <div className="p-4 rounded-lg bg-nebula-950/50 border border-nebula-700/50 hover:border-purple-500/30 transition-all cursor-pointer group">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{ds.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{ds.description}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded border ${ds.type === 'SFT' ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' : ds.type === 'DPO' ? 'bg-orange-900/20 border-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-300'}`}>
                {ds.type}
            </span>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-gray-500 font-mono">
            <span>📦 {ds.size}</span>
            <span>📝 {ds.rows.toLocaleString()} rows</span>
        </div>
    </div>
));

export const Datasets: React.FC<DatasetsProps> = React.memo(({ datasets }) => {
  const [topic, setTopic] = useState('');
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [genTemplate, setGenTemplate] = useState<GenTemplate>('Instruction');

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const fullPrompt = `${genTemplate} examples for: ${topic}`;
      const jsonStr = await generateSyntheticDataSample(fullPrompt);
      const data = JSON.parse(jsonStr || '[]');
      setGeneratedData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate data. Check console/API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredDatasets = datasets
    .filter(d => filterBy === 'all' || d.type === filterBy)
    .sort((a, b) => {
        if (sortBy === 'rows') return b.rows - a.rows;
        if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size); // simplistic parsing
        return a.name.localeCompare(b.name);
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold">📚 Data Curation</h2>
            
            {/* Controls */}
            <div className="flex gap-2">
                 <div className="relative group">
                    <button className="bg-nebula-900 border border-nebula-700 p-2 rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
                        <Filter size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-nebula-900 border border-nebula-700 rounded shadow-xl hidden group-hover:block z-10">
                        {['all', 'SFT', 'DPO', 'Pretrain'].map(f => (
                            <div 
                                key={f} 
                                onClick={() => setFilterBy(f as FilterOption)}
                                className={`px-4 py-2 text-xs cursor-pointer hover:bg-purple-600/20 ${filterBy === f ? 'text-purple-400 font-bold' : 'text-gray-400'}`}
                            >
                                {f}
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="relative group">
                    <button className="bg-nebula-900 border border-nebula-700 p-2 rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
                        <SortAsc size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-nebula-900 border border-nebula-700 rounded shadow-xl hidden group-hover:block z-10">
                         {['name', 'size', 'rows'].map(s => (
                            <div 
                                key={s} 
                                onClick={() => setSortBy(s as SortOption)}
                                className={`px-4 py-2 text-xs cursor-pointer hover:bg-purple-600/20 ${sortBy === s ? 'text-purple-400 font-bold' : 'text-gray-400'}`}
                            >
                                Sort by {s}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        <div className="bg-nebula-900 border border-nebula-700 rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-nebula-700 bg-nebula-950/30 flex justify-between items-center">
                <span className="font-semibold text-gray-200">{filteredDatasets.length} Local Datasets</span>
                <button className="text-xs bg-nebula-800 px-2 py-1 rounded text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                    <Download size={10} /> Import .JSONL
                </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {filteredDatasets.map(ds => (
                    <DatasetCard key={ds.id} ds={ds} />
                ))}
            </div>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🧬</span> Synthetic Generator
        </h2>
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col h-full relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} />
             </div>

            <div className="mb-6 space-y-4 relative z-10">
                <div className="flex gap-4">
                     {/* Template Selectors */}
                     <button 
                        onClick={() => setGenTemplate('Instruction')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border transition-all text-xs font-bold ${genTemplate === 'Instruction' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:text-white'}`}
                     >
                        <FileText size={14} /> Instruct
                     </button>
                     <button 
                        onClick={() => setGenTemplate('Chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border transition-all text-xs font-bold ${genTemplate === 'Chat' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:text-white'}`}
                     >
                        <MessageSquare size={14} /> Chat
                     </button>
                     <button 
                        onClick={() => setGenTemplate('Completion')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border transition-all text-xs font-bold ${genTemplate === 'Completion' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:text-white'}`}
                     >
                        <Code size={14} /> Code
                     </button>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Topic / Domain</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={genTemplate === 'Instruction' ? "e.g., Python coding puzzles" : genTemplate === 'Chat' ? "e.g. Customer support scenarios" : "e.g. SQL query completion"} 
                            className="flex-1 bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-600"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
                        >
                            {isGenerating ? '...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-nebula-950 rounded-lg border border-nebula-800 p-4 overflow-y-auto font-mono text-xs text-gray-300 relative z-10">
                 {!generatedData.length && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col gap-2">
                        <Sparkles size={24} className="opacity-50" />
                        <span>Ready to synthesize training data...</span>
                    </div>
                 )}
                 {generatedData.map((item, i) => (
                     <div key={i} className="mb-4 pb-4 border-b border-nebula-800 last:border-0 animate-fade-in">
                         <div className="text-purple-400 mb-1 font-bold opacity-70"># Sample {i+1}</div>
                         <div className="mb-2 p-2 bg-nebula-900/50 rounded">{item.instruction || item.prompt || "No prompt"}</div>
                         {item.input && (
                            <>
                                <div className="text-blue-400 mb-1 font-bold opacity-70"># Input</div>
                                <div className="mb-2 p-2 bg-nebula-900/50 rounded">{item.input}</div>
                            </>
                         )}
                         <div className="text-green-400 mb-1 font-bold opacity-70"># Output</div>
                         <div className="p-2 bg-nebula-900/50 rounded">{item.output || item.completion}</div>
                     </div>
                 ))}
            </div>
            
            {generatedData.length > 0 && (
                <div className="mt-4 flex justify-between items-center z-10">
                    <span className="text-xs text-gray-500">{generatedData.length} samples generated</span>
                    <button className="text-sm text-white bg-green-700 hover:bg-green-600 px-4 py-2 rounded shadow-lg transition-all flex items-center gap-2">
                        <Save size={14} /> Save to Dataset
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});