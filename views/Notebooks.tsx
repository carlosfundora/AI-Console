
import React, { useState } from 'react';
import { BookOpen, ExternalLink, Cpu, Zap, PlayCircle, Rocket, Terminal, Code, Database, Layers, CheckCircle, AlertTriangle, FileJson, ArrowRight } from 'lucide-react';

interface NotebookTemplate {
    id: string;
    title: string;
    description: string;
    category: 'Fine-Tuning' | 'DPO' | 'Pretraining' | 'Inference';
    models: string[];
    link: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    unslothOptimized: boolean;
}

const NOTEBOOKS: NotebookTemplate[] = [
    {
        id: 'nb-1',
        title: 'Llama-3 8B Fine-tuning (Alpaca)',
        description: 'Standard instruction tuning using Alpaca dataset format. Includes 4-bit quantization setup.',
        category: 'Fine-Tuning',
        models: ['Llama-3-8b', 'Llama-3-70b'],
        link: 'https://colab.research.google.com/drive/135dw7kQLrigrytc055pMyzdC20n1n5P_?usp=sharing',
        difficulty: 'Beginner',
        unslothOptimized: true
    },
    {
        id: 'nb-2',
        title: 'Mistral 7B (ShareGPT / ChatML)',
        description: 'Conversational fine-tuning using ShareGPT format. Ideal for chat assistants.',
        category: 'Fine-Tuning',
        models: ['Mistral-7b-v0.3', 'Hermes-2'],
        link: 'https://colab.research.google.com/drive/15vttTpzzVXv_tJwEk-hIcQ0S9FcEWvcG?usp=sharing',
        difficulty: 'Intermediate',
        unslothOptimized: true
    },
    {
        id: 'nb-3',
        title: 'DPO Preference Alignment',
        description: 'Direct Preference Optimization to align models using chosen/rejected pairs.',
        category: 'DPO',
        models: ['Llama-3', 'Mistral'],
        link: 'https://colab.research.google.com/drive/15uFCv1xbejX1xO-v96lq6209ukn_p3m5?usp=sharing',
        difficulty: 'Advanced',
        unslothOptimized: true
    },
    {
        id: 'nb-4',
        title: 'Gemma 7B Continued Pretraining',
        description: 'Inject new domain knowledge into Gemma models using raw text corpora.',
        category: 'Pretraining',
        models: ['Gemma-7b', 'Gemma-2b'],
        link: 'https://colab.research.google.com/drive/1_5K50K5FXvy_-16r_6J-vDCSJgyQyV19?usp=sharing',
        difficulty: 'Advanced',
        unslothOptimized: true
    },
    {
        id: 'nb-5',
        title: 'ORPO (Odd Ratio Preference)',
        description: 'New alignment technique combining SFT and DPO. Memory efficient.',
        category: 'DPO',
        models: ['Llama-3', 'Mistral'],
        link: 'https://colab.research.google.com/drive/1e7J67X85x7z6R5a6X5X5X5X5X5X5X5X?usp=sharing',
        difficulty: 'Advanced',
        unslothOptimized: true
    }
];

export const Notebooks: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Validator State
    const [validatorInput, setValidatorInput] = useState('');
    const [validatorFormat, setValidatorFormat] = useState('Alpaca');
    const [validationResult, setValidationResult] = useState<{valid: boolean, msg: string} | null>(null);

    const categories = ['All', 'Fine-Tuning', 'DPO', 'Pretraining'];
    
    const filteredNotebooks = selectedCategory === 'All' 
        ? NOTEBOOKS 
        : NOTEBOOKS.filter(nb => nb.category === selectedCategory);

    const validateJson = () => {
        try {
            const data = JSON.parse(validatorInput);
            const item = Array.isArray(data) ? data[0] : data;
            
            if (!item) {
                setValidationResult({valid: false, msg: "Empty or invalid JSON object."});
                return;
            }

            if (validatorFormat === 'Alpaca') {
                if (item.instruction && item.output) setValidationResult({valid: true, msg: "Valid Alpaca Format"});
                else setValidationResult({valid: false, msg: "Missing 'instruction' or 'output'."});
            } else if (validatorFormat === 'ShareGPT') {
                if (item.conversations && Array.isArray(item.conversations)) setValidationResult({valid: true, msg: "Valid ShareGPT Format"});
                else setValidationResult({valid: false, msg: "Missing 'conversations' array."});
            } else if (validatorFormat === 'DPO') {
                if ((item.chosen && item.rejected) || (item.prompt && item.chosen && item.rejected)) setValidationResult({valid: true, msg: "Valid DPO Format"});
                else setValidationResult({valid: false, msg: "Missing chosen/rejected pair."});
            }
        } catch (e) {
            setValidationResult({valid: false, msg: "Invalid JSON Syntax."});
        }
    };

    return (
        <div className="flex h-full gap-space-lg p-space-lg overflow-hidden animate-fade-in">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-space-lg shrink-0">
                    <h2 className="text-type-heading-lg font-bold flex items-center gap-space-sm text-white">
                        <BookOpen className="text-purple-500" /> Notebooks & Recipes
                    </h2>
                    <p className="text-type-body text-gray-400 mt-1">
                        Curated collection of Unsloth-optimized training scripts and Jupyter notebooks.
                    </p>
                </div>

                <div className="flex gap-space-md mb-space-lg shrink-0 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-md ${
                                selectedCategory === cat
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/20'
                                : 'bg-nebula-900 text-gray-400 border border-nebula-700 hover:text-white hover:border-orange-500/50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg overflow-y-auto pr-2 custom-scrollbar">
                    {filteredNotebooks.map(nb => (
                        <div key={nb.id} className="bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg flex flex-col group hover:border-purple-500/50 transition-all shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-nebula-950 rounded-lg border border-nebula-800 text-purple-400">
                                    {nb.category === 'Fine-Tuning' ? <Cpu size={24} /> : 
                                     nb.category === 'DPO' ? <Zap size={24} /> : 
                                     <Database size={24} />}
                                </div>
                                {nb.unslothOptimized && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-black text-white bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 rounded shadow-md">
                                        <Rocket size={10} /> Unsloth
                                    </span>
                                )}
                            </div>

                            <h3 className="text-type-heading-sm font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                {nb.title}
                            </h3>
                            <p className="text-type-caption text-gray-400 mb-6 flex-1">
                                {nb.description}
                            </p>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {nb.models.map(m => (
                                        <span key={m} className="text-[10px] bg-nebula-950 text-gray-500 px-2 py-1 rounded border border-nebula-800">
                                            {m}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-nebula-800">
                                    <span className={`text-[10px] font-bold uppercase ${
                                        nb.difficulty === 'Beginner' ? 'text-green-400' : 
                                        nb.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                        {nb.difficulty}
                                    </span>
                                    <a 
                                        href={nb.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-type-caption font-bold text-white hover:text-purple-400 transition-colors"
                                    >
                                        Open in Colab <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Side Panel: Tools & Validator */}
            <div className="w-80 bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg flex flex-col shrink-0 h-full">
                <h3 className="text-type-body font-bold text-white flex items-center gap-2 mb-6">
                    <FileJson size={18} className="text-blue-500"/> Dataset Tools
                </h3>

                <div className="flex-1 space-y-6">
                    <div className="bg-nebula-950/50 p-4 rounded-xl border border-nebula-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-type-tiny uppercase font-bold text-gray-500">Unsloth Compat Check</span>
                        </div>
                        <p className="text-type-tiny text-gray-400 mb-4">Paste a sample JSON object to verify format compatibility.</p>
                        
                        <div className="space-y-3">
                            <select 
                                value={validatorFormat}
                                onChange={(e) => setValidatorFormat(e.target.value)}
                                className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white text-xs outline-none focus:border-purple-500"
                            >
                                <option value="Alpaca">Alpaca (Instruct)</option>
                                <option value="ShareGPT">ShareGPT (Chat)</option>
                                <option value="DPO">DPO / ORPO</option>
                            </select>
                            
                            <textarea 
                                value={validatorInput}
                                onChange={(e) => setValidatorInput(e.target.value)}
                                placeholder={`Paste sample... e.g. {"instruction": "..."}`}
                                className="w-full h-32 bg-nebula-900 border border-nebula-700 rounded p-2 text-xs text-gray-300 font-mono outline-none resize-none focus:border-purple-500/50"
                            />
                            
                            <button 
                                onClick={validateJson}
                                className="w-full py-2 bg-nebula-800 hover:bg-purple-600 text-white rounded text-xs font-bold transition-all border border-nebula-700"
                            >
                                Validate Schema
                            </button>

                            {validationResult && (
                                <div className={`flex items-center gap-2 p-2 rounded text-xs font-bold ${validationResult.valid ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                                    {validationResult.valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                    {validationResult.msg}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                        <h4 className="text-blue-400 font-bold text-type-caption mb-2 flex items-center gap-2">
                            <Code size={14} /> Quick Snippet
                        </h4>
                        <pre className="text-[10px] text-gray-300 font-mono overflow-x-auto p-2 bg-nebula-950 rounded border border-nebula-800">
{`from unsloth import FastLanguageModel
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3-8b-bnb-4bit",
    max_seq_length = 2048,
    dtype = None,
    load_in_4bit = True,
)`}
                        </pre>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-nebula-800 text-center">
                    <a href="https://unsloth.ai" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-purple-400 flex items-center justify-center gap-1 transition-colors">
                        Documentation <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
};
