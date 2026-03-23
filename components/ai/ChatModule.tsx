
import React, { useState, useRef, useEffect } from 'react';
import { getAIClient, formatAiError } from '../../lib/aiClient';

const ChatModule = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      const ai = getAIClient();
      const modelName = useThinking ? 'gemini-2.5-pro-preview' : 'gemini-2.5-flash';
      
      let latLng = null;
      if (userMsg.toLowerCase().includes('near me') || userMsg.toLowerCase().includes('restaurant') || userMsg.toLowerCase().includes('where')) {
         try {
           const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
           latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
         } catch(e) {}
      }

      const response = await ai.models.generateContent({
        model: latLng ? 'gemini-2.5-flash' : modelName,
        contents: userMsg,
        config: {
          thinkingConfig: useThinking && !latLng ? { thinkingBudget: 32768 } : undefined,
          tools: latLng ? [{ googleMaps: {} }, { googleSearch: {} }] : [{ googleSearch: {} }],
          toolConfig: latLng ? { retrievalConfig: { latLng } } : undefined
        }
      });

      const text = response.text || "PROTOCOL_ERROR: Empty Response";
      const thinking = response.candidates?.[0]?.content?.parts?.find(p => p.thought)?.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      setMessages(prev => [...prev, { role: 'model', text, thinking, sources }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: formatAiError(error, 'CRITICAL_ERROR') }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs text-slate-500 font-bold tracking-[0.3em]">NEURAL_COMMAND_INPUT</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={useThinking} 
              onChange={() => setUseThinking(!useThinking)}
              className="hidden" 
            />
            <div className={`w-4 h-4 border ${useThinking ? 'bg-[#9b59b6] border-[#9b59b6]' : 'border-white/20'}`}></div>
            <span className={`text-[10px] ${useThinking ? 'text-[#9b59b6]' : 'text-slate-500'}`}>THINKING_MODE</span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-4 border border-white/5 bg-black/30 p-6 mb-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[8px] text-slate-600 mb-1">{m.role.toUpperCase()}</span>
            {m.thinking && (
              <div className="bg-white/5 border-l border-white/20 p-4 mb-2 max-w-2xl italic text-[9px] text-slate-500 normal-case font-sans">
                {m.thinking}
              </div>
            )}
            <div className={`p-4 max-w-2xl text-[11px] leading-relaxed ${
              m.role === 'user' ? 'bg-[#9b59b6] text-black font-bold italic' : 'bg-white/5 border border-white/10 text-slate-300 normal-case font-sans'
            }`}>
              {m.text}
              {m.sources && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                  <span className="text-[8px] font-bold block text-[#9b59b6]">GROUNDING_SOURCES:</span>
                  {m.sources.map((s, idx) => (
                    <a key={idx} href={s.web?.uri || s.maps?.uri} target="_blank" rel="noreferrer" className="block text-[9px] text-slate-500 underline truncate hover:text-[#9b59b6]">
                      {s.web?.title || s.maps?.title || 'Unknown Source'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex flex-col items-start animate-pulse">
            <span className="text-[8px] text-slate-600 mb-1">MODEL</span>
            <div className="bg-white/5 border border-white/10 p-4 text-[10px] text-[#9b59b6]">
              EXECUTING_THOUGHT_PROTOCOL...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="ENTER_NEURAL_COMMAND_HERE"
          className="flex-1 bg-black border border-white/10 p-4 text-[11px] focus:outline-none focus:border-[#9b59b6] text-white placeholder:text-slate-800"
        />
        <button 
          onClick={sendMessage}
          disabled={isThinking}
          className="px-10 bg-[#9b59b6] text-black font-black text-[12px] italic hover:bg-white transition-all disabled:opacity-50"
        >
          EXECUTE
        </button>
      </div>
    </div>
  );
};

export default ChatModule;
