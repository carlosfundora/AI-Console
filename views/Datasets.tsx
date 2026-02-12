
import React, { useState, useEffect, useRef } from 'react';
import { Dataset, DatasetTemplate } from '../types';
import { generateSyntheticDataSample } from '../services/geminiService';
import { Filter, SortAsc, Sparkles, Download, FileText, MessageSquare, Code, Save, FileJson, AlignLeft, Edit3, Plus, Trash2, X, Check, Copy, AlertTriangle, Wand2, Database, MoreHorizontal, Maximize2, CheckCircle2, Search, Table as TableIcon, Eye, Terminal, ChevronRight, RefreshCw, Layers } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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
    .filter(d => {
        const matchesFilter = filterBy === 'all' || d.type === filterBy;
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
        if (sortBy === 'rows') return b.rows - a.rows;
        if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size);
        return a.name.localeCompare(b.name);
    });

  const getFormatBadge = (format?: string) => {
      switch(format) {
          case 'Alpaca': return <span className="text-[9px] bg-pink-500/10 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20 font-bold uppercase tracking-wider">Alpaca</span>;
          case 'ShareGPT': return <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold uppercase tracking-wider">ShareGPT</span>;
          case 'ChatML': return <span className="text-[9px] bg-green-500/10 text-green-300 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider">ChatML</span>;
          default: return <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700 font-bold uppercase tracking-wider">{format || 'Custom'}</span>;
      }
  };

  const getTypeBadge = (type: string) => {
      switch(type) {
          case 'SFT': return <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-black tracking-widest">SFT</span>;
          case 'DPO': return <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-black tracking-widest">DPO</span>;
          case 'Pretrain': return <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-black tracking-widest">PT</span>;
          default: return <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">{type}</span>;
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
    <div className="flex flex-col lg:flex-row gap-space-lg h-full p-space-lg overflow-hidden relative">
      
      {/* LEFT COLUMN: Datasets List */}
      <div className="flex-1 flex flex-col space-y-space-md min-w-0">
        <div className="flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm text-white">
                    <Database className="text-purple-500" /> Data Curation
                </h2>
                <p className="text-type-body text-gray-400 mt-1">Local dataset cache and management.</p>
            </div>
            
            <button className="text-type-tiny bg-nebula-900 hover:bg-nebula-800 px-3 py-2 rounded text-purple-300 hover:text-white transition-all flex items-center gap-2 border border-nebula-700 hover:border-purple-500/50 shadow-sm font-bold uppercase tracking-wider">
                <Download size={14} /> Import Data
            </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-space-md items-center bg-nebula-900 p-1.5 rounded-lg border border-nebula-700 shrink-0">
            <div className="flex bg-nebula-950/50 rounded-md p-1 border border-nebula-800">
                {['all', 'SFT', 'DPO', 'Pretrain'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilterBy(f as FilterOption)}
                        className={`px-3 py-1 rounded text-type-tiny font-bold uppercase transition-all ${filterBy === f ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="h-4 w-px bg-nebula-700 mx-1"></div>
            <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search datasets..." 
                    className="w-full bg-nebula-950 border border-nebula-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-purple-500/50 transition-colors placeholder-gray-600"
                />
            </div>
            <div className="flex gap-1">
                <button onClick={() => setSortBy('rows')} className={`p-1.5 rounded hover:bg-nebula-800 transition-colors ${sortBy === 'rows' ? 'text-purple-400' : 'text-gray-500'}`} title="Sort by Rows"><TableIcon size={14}/></button>
                <button onClick={() => setSortBy('size')} className={`p-1.5 rounded hover:bg-nebula-800 transition-colors ${sortBy === 'size' ? 'text-purple-400' : 'text-gray-500'}`} title="Sort by Size"><AlignLeft size={14}/></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 pb-2">
            {filteredDatasets.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    <Database size={40} className="mx-auto mb-2 text-gray-600"/>
                    <p className="text-sm">No datasets found matching your criteria.</p>
                </div>
            )}
            {filteredDatasets.map(ds => (
                <div 
                    key={ds.id} 
                    onDoubleClick={() => setViewingDataset(ds)}
                    className="group bg-gradient-to-r from-nebula-900 to-nebula-950 border border-nebula-800 hover:border-purple-500/40 rounded-xl p-4 transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.05)] cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-500 hover:text-white p-1 bg-nebula-900 rounded-md border border-nebula-700 shadow-lg" onClick={(e) => { e.stopPropagation(); setViewingDataset(ds); }}>
                            <Maximize2 size={14} />
                        </button>
                    </div>

                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-nebula-950 rounded-lg border border-nebula-800 text-gray-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all shadow-inner">
                                {ds.format === 'JSON' ? <FileJson size={18} /> : <FileText size={18} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-200 text-sm group-hover:text-white transition-colors">{ds.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    {getTypeBadge(ds.type)}
                                    {getFormatBadge(ds.format)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4 line-clamp-1 pl-1">{ds.description}</p>

                    <div className="grid grid-cols-2 gap-2 bg-nebula-950/50 rounded-lg p-2 border border-nebula-800/50">
                        <div className="flex flex-col px-2">
                            <span className="text-[9px] uppercase text-gray-600 font-bold tracking-wider">Volume</span>
                            <span className="text-xs font-mono text-gray-300 font-bold">{ds.rows.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col px-2 border-l border-nebula-800">
                            <span className="text-[9px] uppercase text-gray-600 font-bold tracking-wider">Size</span>
                            <span className="text-xs font-mono text-gray-300 font-bold">{ds.size}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Generator & Template Manager */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col space-y-space-md shrink-0">
        <div className="flex justify-between items-center shrink-0">
            <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm text-white">
                <Wand2 className="text-purple-500" /> Synthetic Lab
            </h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${validationStatus === 'valid' ? 'bg-green-900/20 text-green-400 border-green-500/30' : validationStatus === 'invalid' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'opacity-0'}`}>
                {validationStatus === 'valid' ? <Check size={12} /> : <AlertTriangle size={12} />}
                {validationStatus === 'valid' ? 'Schema Valid' : 'Schema Error'}
            </div>
        </div>
        
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-space-md flex flex-col h-full relative overflow-hidden shadow-2xl">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-space-2xl opacity-5 pointer-events-none">
                <Sparkles size={180} />
             </div>

            {/* Template Manager Overlay/Mode */}
            {isManageMode && editingTemplate ? (
                <div className="absolute inset-0 bg-nebula-900 z-20 flex flex-col p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-nebula-800 pb-4 shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                            <Edit3 size={18} className="text-purple-400"/> 
                            {editingTemplate.isPreset ? 'View Template' : 'Edit Template'}
                        </h3>
                        <button onClick={() => setIsManageMode(false)} className="text-gray-500 hover:text-white p-1 hover:bg-nebula-800 rounded"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Template Name</label>
                                <input 
                                    value={editingTemplate.name} 
                                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                    className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Format</label>
                                <select 
                                    value={editingTemplate.format}
                                    onChange={e => setEditingTemplate({...editingTemplate, format: e.target.value as any})}
                                    className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                >
                                    <option value="Custom">Custom</option>
                                    <option value="Alpaca">Alpaca</option>
                                    <option value="ShareGPT">ShareGPT</option>
                                    <option value="ChatML">ChatML</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">System Prompt Context</label>
                            <textarea 
                                value={editingTemplate.systemPrompt} 
                                onChange={e => setEditingTemplate({...editingTemplate, systemPrompt: e.target.value})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white text-sm h-24 resize-none outline-none focus:border-purple-500"
                            />
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider flex justify-between items-center mb-1">
                                <span>Target JSON Structure</span>
                                <span className="text-[9px] bg-nebula-800 px-2 py-0.5 rounded text-gray-400">One example object</span>
                            </label>
                            <textarea 
                                value={editingTemplate.exampleStructure} 
                                onChange={e => setEditingTemplate({...editingTemplate, exampleStructure: e.target.value})}
                                className="w-full h-48 bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-green-400 font-mono text-xs resize-none outline-none focus:border-purple-500"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-nebula-800 shrink-0 mt-2">
                        {!editingTemplate.isPreset && (
                            <button onClick={() => handleDeleteTemplate(editingTemplate.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:underline"><Trash2 size={14}/> Delete</button>
                        )}
                        <div className="flex gap-3 ml-auto">
                             <button onClick={() => setIsManageMode(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-bold">Cancel</button>
                             <button onClick={handleSaveTemplate} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg text-sm">
                                <Save size={16}/> {editingTemplate.isPreset ? 'Clone & Save' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Generator Controls */}
            <div className="mb-6 space-y-4 relative z-10 shrink-0">
                <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Select Template</span>
                         <button 
                            onClick={handleCreateTemplate}
                            className="text-purple-400 hover:text-white flex items-center gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider"
                         >
                             <Plus size={10}/> New Custom
                         </button>
                     </div>
                     
                     {/* Horizontal Scrollable Template List */}
                     <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mask-linear-fade">
                         {templates.map(tpl => (
                             <div 
                                key={tpl.id}
                                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border transition-all cursor-pointer whitespace-nowrap group min-w-max ${
                                    selectedTemplateId === tpl.id 
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                    : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/50 hover:text-gray-200'
                                }`}
                                onClick={() => setSelectedTemplateId(tpl.id)}
                             >
                                 {tpl.format === 'Custom' ? <FileJson size={14}/> : 
                                  tpl.format === 'ChatML' || tpl.format === 'ShareGPT' ? <MessageSquare size={14}/> : 
                                  <FileText size={14}/>}
                                 <span className="text-xs font-bold">{tpl.name}</span>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditTemplate(tpl); }}
                                    className={`p-1 rounded-full hover:bg-black/20 ml-1 transition-opacity ${selectedTemplateId === tpl.id ? 'text-purple-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
                                 >
                                     <Edit3 size={10} />
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                <div className="bg-nebula-950/50 p-1 rounded-xl border border-nebula-800 flex items-center gap-2">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder={activeTemplate.format === 'ShareGPT' ? "Enter a conversation topic..." : "Enter instruction domain..."}
                        className="flex-1 bg-transparent border-none px-3 py-2 text-white focus:ring-0 outline-none placeholder-gray-600 text-sm font-medium"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all text-xs whitespace-nowrap flex items-center gap-2"
                    >
                        {isGenerating ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                        {isGenerating ? 'Generating...' : 'Generate Samples'}
                    </button>
                </div>
            </div>

            {/* Generated Output Console */}
            <div className="flex-1 bg-[#0a0a0f] rounded-xl border border-nebula-800 flex flex-col relative overflow-hidden group shadow-inner">
                 <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#0a0a0f] to-transparent z-10 pointer-events-none"></div>
                 
                 <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300 relative z-0 custom-scrollbar space-y-4">
                     {!generatedData.length && !isGenerating && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60">
                            <Terminal size={32} className="mb-3"/>
                            <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Instructions</p>
                            <p className="mt-1 text-[10px]">Target Schema: {activeTemplate.format}</p>
                        </div>
                     )}
                     
                     {generatedData.map((item, i) => (
                         <div key={i} className="relative pl-6 border-l-2 border-nebula-800 hover:border-purple-500/50 transition-colors animate-fade-in group/item">
                             <div className="absolute left-0 top-0 -translate-x-[5px] w-2 h-2 rounded-full bg-nebula-800 group-hover/item:bg-purple-500 transition-colors"></div>
                             <div className="flex justify-between items-center mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                                 <span>Sample 0{i+1}</span>
                                 <button 
                                    className="hover:text-white text-gray-500 opacity-0 group-hover/item:opacity-100 transition-opacity" 
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(item, null, 2))}
                                    title="Copy Code"
                                 >
                                     <Copy size={12}/>
                                 </button>
                             </div>
                             <pre className="whitespace-pre-wrap break-all text-gray-400 group-hover/item:text-gray-300 transition-colors">
                                 {JSON.stringify(item, null, 2)}
                             </pre>
                         </div>
                     ))}
                 </div>

                 {generatedData.length > 0 && (
                    <div className="p-3 bg-nebula-900 border-t border-nebula-800 flex justify-between items-center shrink-0 z-10">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{generatedData.length} items ready</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setGeneratedData([])} 
                                className="text-gray-500 hover:text-white p-2 rounded hover:bg-nebula-800 transition-colors"
                                title="Clear Console"
                            >
                                <Trash2 size={14}/>
                            </button>
                            <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all flex items-center gap-2">
                                <Save size={14} /> Append to Dataset
                            </button>
                        </div>
                    </div>
                 )}
            </div>
        </div>
      </div>

      {/* Dataset Viewer Modal */}
      {viewingDataset && (
          <div className="absolute inset-0 z-50 bg-nebula-950/90 backdrop-blur-md flex items-center justify-center p-space-lg animate-fade-in" onClick={() => setViewingDataset(null)}>
              <div 
                className="bg-nebula-900 border border-nebula-700 rounded-2xl w-full h-full flex flex-col shadow-2xl relative overflow-hidden max-w-6xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-nebula-800 bg-nebula-950/80 backdrop-blur-md">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-3">
                              {viewingDataset.name}
                              {getFormatBadge(viewingDataset.format)}
                          </h2>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-mono uppercase tracking-wider">
                              <span className="flex items-center gap-1"><Database size={10} /> {viewingDataset.rows.toLocaleString()} Rows</span>
                              <span className="text-nebula-700">|</span>
                              <span className="flex items-center gap-1"><AlignLeft size={10} /> {viewingDataset.size}</span>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          {/* View Mode Toggle */}
                          <div className="flex bg-nebula-950 p-1 rounded-lg border border-nebula-800">
                              <button 
                                onClick={() => setViewMode('raw')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'raw' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <Code size={14} /> JSON Source
                              </button>
                              <button 
                                onClick={() => setViewMode('dry-run')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'dry-run' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <Terminal size={14} /> Template Preview
                              </button>
                          </div>

                          <div className="h-6 w-px bg-nebula-800 mx-2"></div>

                          <button onClick={() => setViewingDataset(null)} className="p-2 hover:bg-nebula-800 rounded-full text-gray-400 hover:text-white transition-colors">
                              <X size={24} />
                          </button>
                      </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 flex overflow-hidden">
                      {/* Left Sidebar Metadata */}
                      <div className="w-64 bg-nebula-900/50 border-r border-nebula-800 p-6 overflow-y-auto shrink-0">
                          <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-6">Manifest</h4>
                          
                          <div className="space-y-6">
                              <div>
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Dataset Type</label>
                                  {getTypeBadge(viewingDataset.type)}
                              </div>
                              <div>
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Description</label>
                                  <p className="text-xs text-gray-300 leading-relaxed">{viewingDataset.description}</p>
                              </div>
                              
                              <div className="pt-4 border-t border-nebula-800">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-2">Health Check</label>
                                  {viewerValidation ? (
                                       <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border ${viewerValidation.valid ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                                          {viewerValidation.valid ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}
                                          {viewerValidation.msg}
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={handleRunViewerValidation}
                                        className="w-full py-2 bg-nebula-800 border border-nebula-700 hover:border-purple-500 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
                                      >
                                          Run Diagnostics
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                      
                      {/* Main Viewer Area */}
                      <div className="flex-1 bg-[#0a0a0f] relative group overflow-hidden flex flex-col">
                          {viewMode === 'raw' ? (
                              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                  <div className="absolute top-4 right-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest pointer-events-none group-hover:text-purple-500 transition-colors z-10">
                                      Read-Only
                                  </div>
                                  <SyntaxHighlight code={datasetContent} />
                              </div>
                          ) : (
                              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                  <div className="max-w-3xl mx-auto space-y-8">
                                      <div className="flex justify-between items-end border-b border-nebula-800 pb-4">
                                          <div>
                                              <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                                                  <Eye size={18} className="text-blue-400"/> Template Render
                                              </h3>
                                              <p className="text-gray-500 text-xs mt-1">Preview how the model will see this data during training.</p>
                                          </div>
                                          <select 
                                              value={dryRunTemplate} 
                                              onChange={(e) => setDryRunTemplate(e.target.value)}
                                              className="bg-nebula-900 border border-nebula-700 text-gray-300 text-xs font-bold rounded-lg p-2 outline-none focus:border-purple-500 cursor-pointer"
                                          >
                                              <option value="ChatML">ChatML (OpenAI)</option>
                                              <option value="Llama-3">Llama 3 (Official)</option>
                                              <option value="Alpaca">Alpaca (Standard)</option>
                                          </select>
                                      </div>
                                      
                                      {renderDryRun()}

                                      <div className="flex gap-4 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                                          <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5"/>
                                          <div>
                                              <h4 className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-1">Tokenizer Alignment</h4>
                                              <p className="text-gray-400 text-xs leading-relaxed">
                                                  This preview uses standard string templates. For exact tokenization during training, ensure your <code>tokenizer_config.json</code> matches the selected chat template format.
                                              </p>
                                          </div>
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
