
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, LayoutDashboard, Activity, Database, Terminal, BookOpen, FlaskConical, BrainCircuit, Bot, MessageSquare, Settings, Zap, Power, Trash2, RefreshCw, Command } from 'lucide-react';
import { ViewState } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: 'Navigation' | 'System';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define commands
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', label: 'Go to Dashboard', category: 'Navigation', icon: <LayoutDashboard size={16}/>, action: () => onNavigate('dashboard') },
    { id: 'nav-bench', label: 'Go to Benchmarks', category: 'Navigation', icon: <Activity size={16}/>, action: () => onNavigate('benchmarks') },
    { id: 'nav-data', label: 'Go to Datasets', category: 'Navigation', icon: <Database size={16}/>, action: () => onNavigate('datasets') },
    { id: 'nav-train', label: 'Go to Training', category: 'Navigation', icon: <Terminal size={16}/>, action: () => onNavigate('training') },
    { id: 'nav-note', label: 'Go to Notebooks', category: 'Navigation', icon: <BookOpen size={16}/>, action: () => onNavigate('notebooks') },
    { id: 'nav-lab', label: 'Go to Laboratory', category: 'Navigation', icon: <FlaskConical size={16}/>, action: () => onNavigate('laboratory') },
    { id: 'nav-models', label: 'Go to Model Registry', category: 'Navigation', icon: <BrainCircuit size={16}/>, action: () => onNavigate('models') },
    { id: 'nav-agents', label: 'Go to Agents', category: 'Navigation', icon: <Bot size={16}/>, action: () => onNavigate('agents') },
    { id: 'nav-chat', label: 'Go to Chat', category: 'Navigation', icon: <MessageSquare size={16}/>, action: () => onNavigate('chat') },
    { id: 'nav-settings', label: 'Go to Settings', category: 'Navigation', icon: <Settings size={16}/>, action: () => onNavigate('settings') },
    
    // System Actions (Mock)
    { id: 'sys-start', label: 'Start All Servers', category: 'System', icon: <Zap size={16}/>, action: () => alert('Starting all services...') },
    { id: 'sys-stop', label: 'Stop All Servers', category: 'System', icon: <Power size={16}/>, action: () => alert('Stopping all services...') },
    { id: 'sys-clear', label: 'Purge Cache', category: 'System', icon: <Trash2 size={16}/>, action: () => alert('Cache cleared.') },
    { id: 'sys-reload', label: 'Reload Environment', category: 'System', icon: <RefreshCw size={16}/>, action: () => window.location.reload() },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-nebula-900 border border-nebula-700 rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-nebula-800">
          <Search className="text-gray-500 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-lg"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="bg-nebula-800 text-gray-400 px-2 py-0.5 rounded text-xs font-mono border border-nebula-700">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No commands found.</div>
          ) : (
            <>
              {['Navigation', 'System'].map(category => {
                const categoryCommands = filteredCommands.filter(c => c.category === category);
                if (categoryCommands.length === 0) return null;
                
                return (
                  <div key={category} className="mb-2">
                    <div className="text-[10px] uppercase text-gray-500 font-bold px-3 py-1 tracking-wider">{category}</div>
                    {categoryCommands.map((cmd) => {
                      const isActive = filteredCommands[selectedIndex]?.id === cmd.id;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => { cmd.action(); onClose(); }}
                          onMouseEnter={() => setSelectedIndex(filteredCommands.findIndex(c => c.id === cmd.id))}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                            isActive 
                              ? 'bg-purple-600 text-white shadow-md' 
                              : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-nebula-800 text-gray-400'}`}>
                              {cmd.icon}
                            </div>
                            <span className="font-medium">{cmd.label}</span>
                          </div>
                          {isActive && <ArrowRight size={14} className="animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
        
        <div className="px-4 py-2 bg-nebula-950 border-t border-nebula-800 text-[10px] text-gray-500 flex justify-between">
            <span>ProTip: Use <kbd className="font-mono bg-nebula-800 px-1 rounded">Cmd+K</kbd> to open this menu anytime.</span>
            <span>Replicator AI Console</span>
        </div>
      </div>
    </div>
  );
};
