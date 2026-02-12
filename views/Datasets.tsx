
import React, { useState, useEffect, useRef } from 'react';
import { Dataset, DatasetTemplate } from '../types';
import { generateSyntheticDataSample } from '../services/geminiService';
import { Filter, SortAsc, Sparkles, Download, FileText, MessageSquare, Code, Save, FileJson, AlignLeft, Edit3, Plus, Trash2, X, Check, Copy, AlertTriangle, Wand2, Database, MoreHorizontal, Maximize2, CheckCircle2, Search, Table as TableIcon, Eye, Terminal } from 'lucide-react';

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
  const [templates, setTemplates] = useState<DatasetTemplate[]>(() => {
      try {
          const saved = localStorage.getItem('customDatasetTemplates');
          const custom = saved ? JSON.parse(saved) : [];
          return [...DEFAULT_TEMPLATES, ...custom];
      } catch (e) {
          console.error("Failed to load templates", e);
          return DEFAULT_TEMPLATES;
      }
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [isManageMode, setIsManageMode] = useState(false);
  
  // Editing State
  const [editingTemplate, setEditingTemplate] = useState<DatasetTemplate | null>(null);

  // Validation State (Generator)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMsg, setValidationMsg] = useState('');

  // Viewer Modal State
  const [viewingDataset, setViewingDataset] = useState<Dataset | null>(null);
  const [datasetContent, setDatasetContent] = useState<string>('');
  const [viewerValidation, setViewerValidation] = useState<{valid: boolean, msg: string} | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'dry-run'>('raw');
  const [dryRunTemplate, setDryRunTemplate] = useState('ChatML');

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Helper: Mock content generation for viewer
  useEffect(() => {
      if (viewingDataset) {
          setViewerValidation(null);
          setViewMode('raw');
          // Simulate loading content based on format
          let mockContent = [];
          const count = 3;
          
          if (viewingDataset.format === 'Alpaca') {
              mockContent = Array(count).fill(0).map((_, i) => ({
                  instruction: `Instruction ${i+1} from ${viewingDataset.name}`,
                  input: "",
                  output: `This is a simulated output for row ${i+1}.`
              }));
          } else if (viewingDataset.format === 'ShareGPT') {
              mockContent = Array(count).fill(0).map((_, i) => ({
                  conversations: [
                      { from: "human", value: `User query ${i+1}` },
                      { from: "gpt", value: `Assistant response ${i+1}` }
                  ]
              }));
          } else if (viewingDataset.format === 'ChatML') {
              mockContent = Array(count).fill(0).map((_, i) => ({
                  messages: [
                      { role: "system", content: "System prompt" },
                      { role: "user", content: `User ${i+1}` },
                      { role: "assistant", content: `Assistant ${i+1}` }
                  ]
              }));
          } else {
              // Generic
              mockContent = Array(count).fill(0).map((_, i) => ({
                  id: i,
                  content: `Generic content row ${i+1}`
              }));
          }
          setDatasetContent(JSON.stringify(mockContent, null, 2));
      }
  }, [viewingDataset]);

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

  const handleRunViewerValidation = () => {
      if (!viewingDataset) return;
      try {
          const data = JSON.parse(datasetContent);
          const result = validateData(Array.isArray(data) ? data : [data], viewingDataset.format || 'Custom');
          setViewerValidation(result);
      } catch (e) {
          setViewerValidation({ valid: false, msg: "Invalid JSON Syntax" });
      }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setValidationStatus('idle');
    try {
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

  const renderDryRun = () => {
      try {
          const data = JSON.parse(datasetContent);
          const item = Array.isArray(data) ? data[0] : data;
          
          let preview = '';
          
          // Simple heuristic to extract conversation-like structure
          let messages = [];
          if (item.messages) messages = item.messages;
          else if (item.conversations) messages = item.conversations.map((c: any) => ({ role: c.from === 'human' ? 'user' : 'assistant', content: c.value }));
          else if (item.instruction) messages = [{role: 'user', content: item.instruction}, {role: 'assistant', content: item.output}];
          
          if (dryRunTemplate === 'ChatML') {
              preview = messages.map((m: any) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join('\n') + '\n<|im_start|>assistant';
          } else if (dryRunTemplate === 'Llama-3') {
              preview = `<|begin_of_text|>` + messages.map((m: any) => `<|start_header_id|>${m.role}<|end_header_id|>\n\n${m.content}<|eot_id|>`).join('');
          } else if (dryRunTemplate === 'Alpaca') {
              if (item.instruction) {
                  preview = `### Instruction:\n${item.instruction}\n\n${item.input ? `### Input:\n${item.input}\n\n` : ''}### Response:\n${item.output}`;
              } else {
                  preview = `(Auto-converted from chat)\n### Instruction:\n${messages[0]?.content || ''}\n\n### Response:\n${messages[1]?.content || ''}`;
              }
          }

          return (
              <div className="bg-black/40 p-4 rounded-lg border border-white/10 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                  {preview || "Could not map data structure to template."}
              </div>
          );
      } catch (e) {
          return <div className="text-red-400">Invalid JSON data for dry run.</div>;
      }
  };

  const filteredDatasets = datasets
    .filter(d => filterBy === 'all' || d.type === filterBy)
    .sort((a, b) => {
        if (sortBy === 'rows') return b.rows - a.rows;
        if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size);
        return a.name.localeCompare(b.name);
    });

  const getFormatBadge = (format?: string) => {
      switch(format) {
          case 'Alpaca': return <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded border border-pink-500/20 font-medium">Alpaca</span>;
          case 'ShareGPT': return <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-medium">ShareGPT</span>;
          case 'ChatML': return <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-medium">ChatML</span>;
          default: return <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 font-medium">{format || 'Custom'}</span>;
      }
  };

  const getTypeBadge = (type: string) => {
      switch(type) {
          case 'SFT': return <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold tracking-wider">SFT</span>;
          case 'DPO': return <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 font-bold tracking-wider">DPO</span>;
          case 'Pretrain': return <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold tracking-wider">PRETRAIN</span>;
          default: return <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">{type}</span>;
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
          name: 'New Custom Template',
          description: 'Custom dataset format',
          format: 'Custom',
          systemPrompt: 'You are a helpful assistant that generates data in JSON format.',
          exampleStructure: '[\n  {\n    "field1": "value"\n  }\n]',
          isPreset: false
      });
      setIsManageMode(true);
  };

  const handleSaveTemplate = () => {
      if (!editingTemplate) return;
      
      let templateToSave = { ...editingTemplate };
      if (templateToSave.isPreset) {
          templateToSave.id = `tpl-${Date.now()}`;
          templateToSave.name = `${templateToSave.name} (Copy)`;
          templateToSave.isPreset = false;
      }

      let newTemplates = [...templates];
      const index = newTemplates.findIndex(t => t.id === templateToSave.id);
      
      if (index >= 0) {
          newTemplates[index] = templateToSave;
      } else {
          newTemplates.push(templateToSave);
      }
      
      setTemplates(newTemplates);
      
      const customTemplates = newTemplates.filter(t => !t.isPreset);
      localStorage.setItem('customDatasetTemplates', JSON.stringify(customTemplates));

      setSelectedTemplateId(templateToSave.id);
      setEditingTemplate(null);
      setIsManageMode(false);
  };

  const handleDeleteTemplate = (id: string) => {
      if (confirm('Delete this template?')) {
          const newTemplates = templates.filter(t => t.id !== id);
          setTemplates(newTemplates);
          
          const customTemplates = newTemplates.filter(t => !t.isPreset);
          localStorage.setItem('customDatasetTemplates', JSON.stringify(customTemplates));

          if (selectedTemplateId === id) setSelectedTemplateId(templates[0].id);
          if (editingTemplate?.id === id) {
              setEditingTemplate(null);
              setIsManageMode(false);
          }
      }
  };

  // --- Syntax Highlighter for Modal ---
  const SyntaxHighlight = ({ code }: { code: string }) => {
      const [highlighted, setHighlighted] = useState('');
      
      useEffect(() => {
          if ((window as any).Prism) {
              const html = (window as any).Prism.highlight(code || '', (window as any).Prism.languages.json, 'json');
              setHighlighted(html);
          } else {
              setHighlighted(code);
          }
      }, [code]);

      return (
          <pre className="font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: highlighted }} />
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl h-full p-space-lg overflow-hidden relative">
      
      {/* LEFT COLUMN: Datasets List */}
      <div className="flex flex-col space-y-space-md overflow-hidden">
        <div className="flex justify-between items-end shrink-0">
            <div>
                <h2 className="text-type-heading-lg font-bold">📚 Data Curation</h2>
                <p className="text-type-body text-gray-400 mt-1">Manage local training datasets.</p>
            </div>
            
            {/* Controls */}
            <div className="flex gap-space-sm">
                 <div className="relative group">
                    <button className="bg-nebula-900 border border-nebula-700 p-2 rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
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
                    <button className="bg-nebula-900 border border-nebula-700 p-2 rounded hover:bg-nebula-800 text-gray-400 hover:text-white transition-colors">
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

        <div className="bg-nebula-900 border border-nebula-700 rounded-xl flex-1 overflow-hidden flex flex-col shadow-lg">
            <div className="p-space-md border-b border-nebula-700 bg-nebula-950/30 flex justify-between items-center">
                <span className="font-semibold text-gray-200 text-type-body flex items-center gap-2"><Database size={14}/> {filteredDatasets.length} Datasets</span>
                <button className="text-type-tiny bg-nebula-800 px-3 py-1.5 rounded text-purple-300 hover:text-white transition-colors flex items-center gap-1 border border-nebula-700 hover:border-purple-500/50 shadow-sm">
                    <Download size={12} /> Import .JSONL
                </button>
            </div>
            <div className="overflow-y-auto flex-1 p-space-md space-y-space-md custom-scrollbar">
                {filteredDatasets.map(ds => (
                    <div 
                        key={ds.id} 
                        onDoubleClick={() => setViewingDataset(ds)}
                        className="p-space-md rounded-xl bg-nebula-950/50 border border-nebula-700/50 hover:border-purple-500/30 hover:bg-nebula-900/80 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-nebula-900 rounded-lg border border-nebula-800 text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-colors">
                                    <FileJson size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors text-type-body leading-tight">{ds.name}</h4>
                                    <p className="text-type-tiny text-gray-500 mt-0.5 line-clamp-1">{ds.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getTypeBadge(ds.type)}
                                {getFormatBadge(ds.format)}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-nebula-800/50">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">Size</span>
                                <span className="text-type-caption font-mono text-gray-300 flex items-center gap-1"><AlignLeft size={10}/> {ds.size}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">Volume</span>
                                <span className="text-type-caption font-mono text-gray-300 flex items-center gap-1"><TableIcon size={10}/> {ds.rows.toLocaleString()} rows</span>
                            </div>
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={12} className="text-gray-500" />
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
                <Wand2 className="text-purple-500" /> Generator
            </h2>
            
            {/* Validation Badge */}
            {generatedData.length > 0 && (
                <div className={`px-3 py-1 rounded-full text-type-tiny font-bold flex items-center gap-2 border ${validationStatus === 'valid' ? 'bg-green-900/20 text-green-400 border-green-500/30' : validationStatus === 'invalid' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'hidden'}`}>
                    {validationStatus === 'valid' ? <Check size={12} /> : <AlertTriangle size={12} />}
                    {validationStatus === 'valid' ? 'Format Compatible' : validationMsg}
                </div>
            )}
        </div>
        
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg flex flex-col h-full relative overflow-hidden shadow-lg">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-space-2xl opacity-5 pointer-events-none">
                <Sparkles size={120} />
             </div>

            {/* Template Manager Overlay/Mode */}
            {isManageMode && editingTemplate ? (
                <div className="absolute inset-0 bg-nebula-900 z-20 flex flex-col p-space-lg animate-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b border-nebula-800 pb-2 shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Edit3 size={16}/> 
                            {editingTemplate.isPreset ? 'View / Clone Template' : 'Edit Template'}
                        </h3>
                        <button onClick={() => setIsManageMode(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-4">
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
                            <div className="flex gap-4 shrink-0">
                                <div className="flex-1">
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase">Template Name</label>
                                    <input 
                                        value={editingTemplate.name} 
                                        onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                        className="w-full bg-nebula-950 border border-nebula-700 rounded p-2 text-white mt-1 outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-type-tiny text-gray-500 font-bold uppercase">Format Tag</label>
                                    <select 
                                        value={editingTemplate.format}
                                        onChange={e => setEditingTemplate({...editingTemplate, format: e.target.value as any})}
                                        className="w-full bg-nebula-950 border border-nebula-700 rounded p-2 text-white mt-1 outline-none focus:border-purple-500"
                                    >
                                        <option value="Custom">Custom</option>
                                        <option value="Alpaca">Alpaca</option>
                                        <option value="ShareGPT">ShareGPT</option>
                                        <option value="ChatML">ChatML</option>
                                        <option value="JSON">JSON</option>
                                    </select>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <label className="text-type-tiny text-gray-500 font-bold uppercase">System Prompt (Context)</label>
                                <textarea 
                                    value={editingTemplate.systemPrompt} 
                                    onChange={e => setEditingTemplate({...editingTemplate, systemPrompt: e.target.value})}
                                    className="w-full bg-nebula-950 border border-nebula-700 rounded p-2 text-white mt-1 h-20 resize-none text-sm outline-none focus:border-purple-500"
                                />
                            </div>
                            
                            <div className="flex-1 flex flex-col min-h-[150px]">
                                <label className="text-type-tiny text-gray-500 font-bold uppercase flex justify-between items-center mb-1">
                                    <span>Target JSON Structure (Example)</span>
                                    <span className="text-[10px] bg-nebula-800 px-2 py-0.5 rounded">The LLM will mimic this</span>
                                </label>
                                <textarea 
                                    value={editingTemplate.exampleStructure} 
                                    onChange={e => setEditingTemplate({...editingTemplate, exampleStructure: e.target.value})}
                                    className="w-full flex-1 bg-nebula-950 border border-nebula-700 rounded p-2 text-green-400 font-mono text-xs resize-none outline-none focus:border-purple-500"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-nebula-800 shrink-0">
                        {!editingTemplate.isPreset && (
                            <button onClick={() => handleDeleteTemplate(editingTemplate.id)} className="mr-auto text-red-400 hover:text-red-300 flex items-center gap-1 text-sm font-bold"><Trash2 size={14}/> Delete</button>
                        )}
                        <button onClick={handleSaveTemplate} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                            <Save size={16}/> {editingTemplate.isPreset ? 'Save as Copy' : 'Save Template'}
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

      {/* Dataset Viewer Modal */}
      {viewingDataset && (
          <div className="absolute inset-0 z-50 bg-nebula-950/90 backdrop-blur-sm flex items-center justify-center p-space-2xl animate-fade-in" onClick={() => setViewingDataset(null)}>
              <div 
                className="bg-nebula-900 border border-nebula-700 rounded-xl w-full h-full flex flex-col shadow-2xl relative overflow-hidden max-w-5xl max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-space-lg border-b border-nebula-700 bg-nebula-950/50">
                      <div>
                          <h2 className="text-type-heading-md font-bold text-white flex items-center gap-3">
                              {viewingDataset.name}
                              {getFormatBadge(viewingDataset.format)}
                          </h2>
                          <p className="text-type-tiny text-gray-400 mt-1 uppercase font-bold tracking-widest">{viewingDataset.id} • {viewingDataset.rows} ROWS</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          {/* View Mode Toggle */}
                          <div className="flex bg-nebula-950 p-1 rounded-lg border border-nebula-800">
                              <button 
                                onClick={() => setViewMode('raw')}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'raw' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <Code size={14} /> JSON
                              </button>
                              <button 
                                onClick={() => setViewMode('dry-run')}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'dry-run' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <Terminal size={14} /> Dry Run
                              </button>
                          </div>

                          <div className="flex items-center gap-space-md border-l border-nebula-800 pl-4">
                              {viewerValidation && (
                                  <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-2 border ${viewerValidation.valid ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                                      {viewerValidation.valid ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                                      {viewerValidation.msg}
                                  </div>
                              )}
                              <button 
                                onClick={handleRunViewerValidation}
                                className="px-3 py-1.5 bg-nebula-800 border border-nebula-700 hover:border-purple-500 text-gray-300 hover:text-white rounded text-xs font-bold transition-all"
                              >
                                  Run Validation
                              </button>
                              <button onClick={() => setViewingDataset(null)} className="p-2 hover:bg-nebula-800 rounded-full text-gray-400 hover:text-white transition-colors">
                                  <X size={24} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 flex overflow-hidden">
                      <div className="w-64 bg-nebula-900/50 border-r border-nebula-800 p-space-md overflow-y-auto">
                          <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Metadata</h4>
                          <div className="space-y-4">
                              <div>
                                  <label className="text-[9px] text-gray-600 block mb-1">TYPE</label>
                                  {getTypeBadge(viewingDataset.type)}
                              </div>
                              <div>
                                  <label className="text-[9px] text-gray-600 block mb-1">SIZE</label>
                                  <span className="text-type-caption font-mono text-gray-300">{viewingDataset.size}</span>
                              </div>
                              <div>
                                  <label className="text-[9px] text-gray-600 block mb-1">DESCRIPTION</label>
                                  <p className="text-xs text-gray-400 leading-relaxed">{viewingDataset.description}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex-1 bg-nebula-950 p-space-lg overflow-y-auto custom-scrollbar relative group">
                          {viewMode === 'raw' ? (
                              <>
                                  <div className="absolute top-4 right-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest pointer-events-none group-hover:text-purple-500 transition-colors">
                                      Preview Mode (Read-Only)
                                  </div>
                                  <SyntaxHighlight code={datasetContent} />
                              </>
                          ) : (
                              <div className="max-w-3xl mx-auto space-y-6">
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-white font-bold flex items-center gap-2">
                                          <Eye size={16} className="text-blue-400"/> Template Preview
                                      </h3>
                                      <select 
                                          value={dryRunTemplate} 
                                          onChange={(e) => setDryRunTemplate(e.target.value)}
                                          className="bg-nebula-900 border border-nebula-700 text-gray-300 text-xs rounded p-2 outline-none focus:border-purple-500"
                                      >
                                          <option value="ChatML">ChatML (OpenAI)</option>
                                          <option value="Llama-3">Llama 3 (Official)</option>
                                          <option value="Alpaca">Alpaca (Standard)</option>
                                      </select>
                                  </div>
                                  
                                  {renderDryRun()}

                                  <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500/80 leading-relaxed flex items-start gap-3">
                                      <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                      <div>
                                          <strong>Tokenizer Warning:</strong> This is a simulation based on standard templates. Actual training requires the tokenizer's `apply_chat_template` method to match the base model exactly.
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
