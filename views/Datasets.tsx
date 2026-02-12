
import React, { useState } from 'react';
import { Dataset, DatasetTemplate } from '../types';
import { generateSyntheticDataSample } from '../services/geminiService';
import { Filter, SortAsc, Sparkles, Download, FileText, MessageSquare, Code, Save, FileJson, AlignLeft, Edit3, Plus, Trash2, X, Check, Copy, AlertTriangle, Wand2, Database } from 'lucide-react';

interface DatasetsProps {
  datasets: Dataset[];
}

type SortOption = 'name' | 'size' | 'rows';
type FilterOption = 'all' | 'SFT' | 'DPO' | 'Pretrain';

// --- Preset Templates (Unsloth / TRL Aligned) ---
const DEFAULT_TEMPLATES: DatasetTemplate[] = [
    {
        id: 'tpl-alpaca',
        name: 'Unsloth Alpaca (SFT)',
        description: 'Standard Instruction-Input-Output format. Best for single-turn instruction tuning.',
        format: 'Alpaca',
        systemPrompt: 'Generate diverse instruction-following examples with clear inputs (optional) and helpful outputs.',
        isPreset: true,
        exampleStructure: `[
  {
    "instruction": "Explain the concept of quantum entanglement.",
    "input": "",
    "output": "Quantum entanglement is a physical phenomenon..."
  }
]`
    },
    {
        id: 'tpl-sharegpt',
        name: 'Unsloth ShareGPT (Chat)',
        description: 'Multi-turn conversation format. Compatible with Unsloth and Axolotl.',
        format: 'ShareGPT',
        systemPrompt: 'Generate realistic multi-turn conversations between a "human" and "gpt".',
        isPreset: true,
        exampleStructure: `[
  {
    "conversations": [
      { "from": "human", "value": "Hi there!" },
      { "from": "gpt", "value": "Hello! How can I help you?" },
      { "from": "human", "value": "Tell me a joke." },
      { "from": "gpt", "value": "Why did the chicken cross the road?" }
    ]
  }
]`
    },
    {
        id: 'tpl-chatml',
        name: 'ChatML / OpenAI (SFT)',
        description: 'Standard role-based message list (system, user, assistant).',
        format: 'ChatML',
        systemPrompt: 'Generate dialogue following the ChatML role standard.',
        isPreset: true,
        exampleStructure: `[
  {
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "What is the capital of France?" },
      { "role": "assistant", "content": "Paris." }
    ]
  }
]`
    },
    {
        id: 'tpl-dpo',
        name: 'TRL DPO (Standard)',
        description: 'Prompt with Chosen/Rejected pairs. Used for Direct Preference Optimization.',
        format: 'Custom',
        systemPrompt: 'Generate a prompt and two responses: one clearly better (chosen) and one worse (rejected).',
        isPreset: true,
        exampleStructure: `[
  {
    "prompt": "Write a python function to add two numbers.",
    "chosen": "def add(a, b): return a + b",
    "rejected": "def add(a, b): print(a + b)"
  }
]`
    },
    {
        id: 'tpl-dpo-chat',
        name: 'TRL DPO (Conversational)',
        description: 'DPO for chat models using list of messages for chosen/rejected.',
        format: 'Custom',
        systemPrompt: 'Generate chosen and rejected conversation threads.',
        isPreset: true,
        exampleStructure: `[
  {
    "chosen": [
      { "role": "user", "content": "Hi" }, 
      { "role": "assistant", "content": "Hello!" }
    ],
    "rejected": [
      { "role": "user", "content": "Hi" }, 
      { "role": "assistant", "content": "What do you want?" }
    ]
  }
]`
    }
];

export const Datasets: React.FC<DatasetsProps> = ({ datasets }) => {
  const [topic, setTopic] = useState('');
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Template Management State
  const [templates, setTemplates] = useState<DatasetTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [isManageMode, setIsManageMode] = useState(false);
  
  // Editing State
  const [editingTemplate, setEditingTemplate] = useState<DatasetTemplate | null>(null);

  // Validation State
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMsg, setValidationMsg] = useState('');

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const validateData = (data: any[], formatName: string): { valid: boolean; msg: string } => {
      if (!data || data.length === 0) return { valid: false, msg: "No data to validate" };
      const item = data[0];

      if (formatName.includes('Alpaca')) {
          if (!item.hasOwnProperty('instruction') || !item.hasOwnProperty('output')) 
              return { valid: false, msg: "Missing 'instruction' or 'output' keys" };
      } 
      else if (formatName.includes('ShareGPT')) {
          if (!item.hasOwnProperty('conversations') || !Array.isArray(item.conversations)) 
              return { valid: false, msg: "Missing 'conversations' array" };
          if (item.conversations.length > 0 && (!item.conversations[0].from || !item.conversations[0].value))
              return { valid: false, msg: "Conversations must have 'from' and 'value'" };
      }
      else if (formatName.includes('ChatML')) {
          if (!item.hasOwnProperty('messages') || !Array.isArray(item.messages))
              return { valid: false, msg: "Missing 'messages' array" };
      }
      else if (formatName.includes('DPO')) {
          const isStandard = item.hasOwnProperty('prompt') && item.hasOwnProperty('chosen') && item.hasOwnProperty('rejected');
          const isChat = item.hasOwnProperty('chosen') && item.hasOwnProperty('rejected') && Array.isArray(item.chosen);
          if (!isStandard && !isChat) return { valid: false, msg: "Must match DPO schema (chosen/rejected)" };
      }
      
      return { valid: true, msg: "Format check passed" };
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setValidationStatus('idle');
    try {
      // Pass the template structure to the service
      const jsonStr = await generateSyntheticDataSample(
          topic, 
          3, 
          activeTemplate.exampleStructure,
          activeTemplate.systemPrompt
      );
      
      let data = [];
      try {
          data = JSON.parse(jsonStr || '[]');
          if (!Array.isArray(data) && data) data = [data];
      } catch (e) {
          console.warn("JSON Parse warning", e);
          data = [];
      }
      setGeneratedData(data);
      
      // Auto-validate
      const check = validateData(data, activeTemplate.name);
      setValidationStatus(check.valid ? 'valid' : 'invalid');
      setValidationMsg(check.msg);

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

  const getFormatBadge = (format?: string) => {
      switch(format) {
          case 'Alpaca': return <span className="text-[9px] bg-pink-900/30 text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/30">Alpaca</span>;
          case 'ShareGPT': return <span className="text-[9px] bg-cyan-900/30 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">ShareGPT</span>;
          case 'ChatML': return <span className="text-[9px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">ChatML</span>;
          default: return <span className="text-[9px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">Custom</span>;
      }
  };

  // --- Template Management Functions ---

  const handleEditTemplate = (tpl: DatasetTemplate) => {
      setEditingTemplate({ ...tpl });
      setIsManageMode(true);
  };

  const handleCreateTemplate = () => {
      setEditingTemplate({
          id: `tpl-${Date.now()}`,
          name: 'New Template',
          description: '',
          format: 'Custom',
          systemPrompt: '',
          exampleStructure: '[\n  {\n    "field1": "value"\n  }\n]',
          isPreset: false
      });
      setIsManageMode(true);
  };

  const handleSaveTemplate = () => {
      if (!editingTemplate) return;
      
      const exists = templates.find(t => t.id === editingTemplate.id);
      if (exists) {
          setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
      } else {
          setTemplates([...templates, editingTemplate]);
      }
      setSelectedTemplateId(editingTemplate.id);
      setEditingTemplate(null);
      setIsManageMode(false);
  };

  const handleDeleteTemplate = (id: string) => {
      if (confirm('Delete this template?')) {
          setTemplates(templates.filter(t => t.id !== id));
          if (selectedTemplateId === id) setSelectedTemplateId(templates[0].id);
          if (editingTemplate?.id === id) {
              setEditingTemplate(null);
              setIsManageMode(false);
          }
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl h-full p-space-lg overflow-hidden relative">
      
      {/* LEFT COLUMN: Datasets List */}
      <div className="flex flex-col space-y-space-md overflow-hidden">
        <div className="flex justify-between items-end shrink-0">
            <h2 className="text-type-heading-lg font-bold">📚 Data Curation</h2>
            
            {/* Controls */}
            <div className="flex gap-space-sm">
                 <div className="relative group">
                    <button className="bg-nebula-900 border border-nebula-700 p-space-sm rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
                        <Filter size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-nebula-900 border border-nebula-700 rounded shadow-xl hidden group-hover:block z-10">
                        {['all', 'SFT', 'DPO', 'Pretrain'].map(f => (
                            <div 
                                key={f} 
                                onClick={() => setFilterBy(f as FilterOption)}
                                className={`px-4 py-2 text-type-caption cursor-pointer hover:bg-purple-600/20 ${filterBy === f ? 'text-purple-400 font-bold' : 'text-gray-400'}`}
                            >
                                {f}
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="relative group">
                    <button className="bg-nebula-900 border border-nebula-700 p-space-sm rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
                        <SortAsc size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-nebula-900 border border-nebula-700 rounded shadow-xl hidden group-hover:block z-10">
                         {['name', 'size', 'rows'].map(s => (
                            <div 
                                key={s} 
                                onClick={() => setSortBy(s as SortOption)}
                                className={`px-4 py-2 text-type-caption cursor-pointer hover:bg-purple-600/20 ${sortBy === s ? 'text-purple-400 font-bold' : 'text-gray-400'}`}
                            >
                                Sort by {s}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        <div className="bg-nebula-900 border border-nebula-700 rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="p-space-md border-b border-nebula-700 bg-nebula-950/30 flex justify-between items-center">
                <span className="font-semibold text-gray-200 text-type-body">{filteredDatasets.length} Local Datasets</span>
                <button className="text-type-tiny bg-nebula-800 px-2 py-1 rounded text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                    <Download size={10} /> Import .JSONL
                </button>
            </div>
            <div className="overflow-y-auto flex-1 p-space-sm space-y-space-sm custom-scrollbar">
                {filteredDatasets.map(ds => (
                    <div key={ds.id} className="p-space-md rounded-lg bg-nebula-950/50 border border-nebula-700/50 hover:border-purple-500/30 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors text-type-body">{ds.name}</h4>
                                <p className="text-type-tiny text-gray-500 mt-1">{ds.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-type-tiny px-2 py-1 rounded border ${ds.type === 'SFT' ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' : ds.type === 'DPO' ? 'bg-orange-900/20 border-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-300'}`}>
                                    {ds.type}
                                </span>
                                {getFormatBadge(ds.format)}
                            </div>
                        </div>
                        <div className="mt-3 flex gap-space-lg text-type-tiny text-gray-500 font-mono">
                            <span className="flex items-center gap-1"><AlignLeft size={10}/> {ds.size}</span>
                            <span className="flex items-center gap-1"><FileJson size={10}/> {ds.rows.toLocaleString()} rows</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Generator & Template Manager */}
      <div className="flex flex-col space-y-space-md overflow-hidden relative">
        <div className="flex justify-between items-center shrink-0">
            <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm">
                <Database className="text-purple-500" /> Dataset Generator
            </h2>
            
            {/* Validation Badge */}
            {generatedData.length > 0 && (
                <div className={`px-3 py-1 rounded-full text-type-tiny font-bold flex items-center gap-2 border ${validationStatus === 'valid' ? 'bg-green-900/20 text-green-400 border-green-500/30' : validationStatus === 'invalid' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'hidden'}`}>
                    {validationStatus === 'valid' ? <Check size={12} /> : <AlertTriangle size={12} />}
                    {validationStatus === 'valid' ? 'Format Compatible' : validationMsg}
                </div>
            )}
        </div>
        
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg flex flex-col h-full relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-space-2xl opacity-5 pointer-events-none">
                <Sparkles size={120} />
             </div>

            {/* Template Manager Overlay/Mode */}
            {isManageMode && editingTemplate ? (
                <div className="absolute inset-0 bg-nebula-900 z-20 flex flex-col p-space-lg animate-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b border-nebula-800 pb-2">
                        <h3 className="font-bold text-white flex items-center gap-2"><Edit3 size={16}/> Edit Template</h3>
                        <button onClick={() => setIsManageMode(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                        <div>
                            <label className="text-type-tiny text-gray-500 font-bold uppercase">Template Name</label>
                            <input 
                                value={editingTemplate.name} 
                                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-2 text-white mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-type-tiny text-gray-500 font-bold uppercase">System Prompt (Context)</label>
                            <textarea 
                                value={editingTemplate.systemPrompt} 
                                onChange={e => setEditingTemplate({...editingTemplate, systemPrompt: e.target.value})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-2 text-white mt-1 h-20 resize-none text-sm"
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="text-type-tiny text-gray-500 font-bold uppercase flex justify-between items-center">
                                <span>Target JSON Structure (Example)</span>
                                <span className="text-[10px] bg-nebula-800 px-2 py-0.5 rounded">The LLM will mimic this</span>
                            </label>
                            <textarea 
                                value={editingTemplate.exampleStructure} 
                                onChange={e => setEditingTemplate({...editingTemplate, exampleStructure: e.target.value})}
                                className="w-full flex-1 bg-nebula-950 border border-nebula-700 rounded p-2 text-green-400 font-mono text-xs mt-1 resize-none"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-nebula-800">
                        {/* Only show delete for custom templates */}
                        {!editingTemplate.isPreset && (
                            <button onClick={() => handleDeleteTemplate(editingTemplate.id)} className="mr-auto text-red-400 hover:text-red-300 flex items-center gap-1 text-sm font-bold"><Trash2 size={14}/> Delete</button>
                        )}
                        <button onClick={handleSaveTemplate} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                            <Save size={16}/> Save Template
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Generator Controls */}
            <div className="mb-space-lg space-y-space-md relative z-10 shrink-0">
                <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center text-type-tiny text-gray-500 font-bold uppercase">
                         <span>Active Template</span>
                         <button 
                            onClick={handleCreateTemplate}
                            className="text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
                         >
                             <Plus size={10}/> New Template
                         </button>
                     </div>
                     
                     <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                         {templates.map(tpl => (
                             <div 
                                key={tpl.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded border transition-all cursor-pointer whitespace-nowrap group min-w-max ${
                                    selectedTemplateId === tpl.id 
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                                    : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/50 hover:text-white'
                                }`}
                                onClick={() => setSelectedTemplateId(tpl.id)}
                             >
                                 {tpl.format === 'Custom' ? <FileJson size={14}/> : 
                                  tpl.format === 'ChatML' || tpl.format === 'ShareGPT' ? <MessageSquare size={14}/> : 
                                  <FileText size={14}/>}
                                 <span className="text-type-caption font-bold">{tpl.name}</span>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditTemplate(tpl); }}
                                    className={`p-1 rounded-full hover:bg-black/20 ${selectedTemplateId === tpl.id ? 'text-purple-200' : 'text-gray-600 opacity-0 group-hover:opacity-100'}`}
                                 >
                                     <Edit3 size={10} />
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                <div>
                    <label className="text-type-body font-medium text-gray-300 block mb-2">Topic / Domain</label>
                    <div className="flex gap-space-md">
                        <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={activeTemplate.format === 'ShareGPT' ? "e.g. A debate about AI ethics" : "e.g. Python coding puzzles"}
                            className="flex-1 bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-600 text-type-body"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all text-type-body whitespace-nowrap flex items-center gap-2"
                        >
                            {isGenerating ? <Wand2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                            {isGenerating ? 'Generating' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Generated Output */}
            <div className="flex-1 bg-nebula-950 rounded-lg border border-nebula-800 p-space-md overflow-y-auto font-mono text-type-caption text-gray-300 relative z-10 custom-scrollbar">
                 {!generatedData.length && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col gap-space-sm text-center px-8">
                        <FileJson size={24} className="opacity-50" />
                        <span>Select a <strong>{activeTemplate.name}</strong> template and enter a topic.</span>
                        <div className="text-[10px] mt-2 opacity-50 bg-black/20 p-2 rounded max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            Target Schema: {activeTemplate.exampleStructure.substring(0, 50)}...
                        </div>
                    </div>
                 )}
                 {generatedData.map((item, i) => (
                     <div key={i} className="mb-4 pb-4 border-b border-nebula-800 last:border-0 animate-fade-in">
                         <div className="text-purple-400 mb-2 font-bold opacity-70 flex justify-between">
                             <span># Sample {i+1}</span>
                             <button className="text-gray-500 hover:text-white" title="Copy JSON" onClick={() => navigator.clipboard.writeText(JSON.stringify(item, null, 2))}><Copy size={12}/></button>
                         </div>
                         <pre className="whitespace-pre-wrap text-[10px] text-gray-400">
                             {JSON.stringify(item, null, 2)}
                         </pre>
                     </div>
                 ))}
            </div>
            
            {generatedData.length > 0 && (
                <div className="mt-4 flex justify-between items-center z-10 shrink-0">
                    <span className="text-type-tiny text-gray-500">{generatedData.length} samples generated</span>
                    <button className="text-type-body text-white bg-green-700 hover:bg-green-600 px-4 py-2 rounded shadow-lg transition-all flex items-center gap-space-sm">
                        <Save size={14} /> Save to Dataset
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
