import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Bot, Loader2, Send, Sparkles, User, X } from 'lucide-react';
import { renderFormattedText } from '../utils/appHelpers';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

/**
 * 🤖 Widget flutuante do "Agente FOLDEX Automate" (chat com IA via Gemini).
 * Extraído de App.tsx — mantém seu próprio estado de abertura/mensagens.
 * Atualmente exibido apenas quando o recurso é habilitado pelo componente pai.
 */
export const AgentChatWidget: React.FC = () => {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Olá! Eu sou o **Agente FOLDEX Automate**. Estou conectado ao motor cognitivo e pronto para te ajudar com regras ou dicas sobre o sistema. Como posso te auxiliar hoje?'
    }
  ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading, isAgentOpen]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const apiKey = localStorage.getItem('foldex_gemini_key');
    if (!apiKey) {
      alert("Acesso Negado: A chave da Inteligência Artificial não foi encontrada. Por favor, acesse a aba 'Configurações' e cadastre a sua chave Gemini.");
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');

    const newMessages = [...chatMessages, { id: Date.now().toString(), role: 'user' as const, text: userMessage }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    const historyToRust = newMessages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const response = await invoke<string>('chat_with_foldex_agent', {
        messages: historyToRust,
        apiKey: apiKey.trim()
      });

      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: response ?? '' }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Desculpe, encontrei um erro de comunicação: ${error}`
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end shadow-2xl rounded-full">
      {isAgentOpen && (
        <div className="mb-4 w-[340px] sm:w-[400px] bg-white/90 dark:bg-[#1e1e24]/90 backdrop-blur-xl border border-slate-200 dark:border-[#383840] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Agente FOLDEX Automate</h3>
                <p className="text-[10px] text-indigo-100 opacity-90">Governança Cognitiva</p>
              </div>
            </div>
            <button
              onClick={() => setIsAgentOpen(false)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={chatContainerRef} className="h-72 sm:h-80 p-4 bg-slate-50/50 dark:bg-[#141416]/50 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
            {(chatMessages ?? []).map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                      <Bot size={12} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}

                  <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] text-slate-700 dark:text-slate-300 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user' ? msg.text : renderFormattedText(msg.text)}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 shrink-0 rounded-full bg-slate-200 dark:bg-[#2e2e34] flex items-center justify-center border border-slate-300 dark:border-[#383840]">
                      <User size={12} className="text-slate-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    <Bot size={12} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="p-3 bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white/50 dark:bg-[#1e1e24]/50 border-t border-slate-100 dark:border-[#2e2e34] shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Pergunte ao Agente FOLDEX Automate..."
                disabled={isChatLoading}
                className="flex-1 px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#383840] rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors disabled:opacity-60"
              />
              <button
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-sm transition-transform active:scale-95 shrink-0"
              >
                {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsAgentOpen(!isAgentOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 z-50 ${
          isAgentOpen
            ? 'bg-slate-800 border-slate-700 dark:bg-[#27272a] dark:border-[#383840] rotate-12'
            : 'bg-gradient-to-tr from-indigo-600 to-blue-500 border-indigo-400 hover:shadow-indigo-500/50'
        }`}
        title="Agente FOLDEX Automate (Inteligência Artificial)"
      >
        {isAgentOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
};
