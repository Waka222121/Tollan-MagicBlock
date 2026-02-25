
import React, { useState, useRef, useEffect } from 'react';
import { getAI, encode, decode, decodeAudioData } from '../../lib/gemini';
import { Modality, LiveServerMessage } from '@google/genai';

const VoiceModule = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<any[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const toggleVoice = async () => {
    if (isActive) {
      sessionRef.current?.close();
      setIsActive(false);
      return;
    }

    try {
      const ai = getAI();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: blob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => [...prev, { role: 'AI', text: msg.serverContent.outputTranscription.text }]);
            } else if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev, { role: 'YOU', text: msg.serverContent.inputTranscription.text }]);
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            if (msg.serverContent?.interrupted) {
              nextStartTimeRef.current = outputCtx.currentTime;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => { console.error(e); setIsActive(false); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are the TOLLAN MagicBlock Neural Interface. You are helpful, slightly industrial, and focused on helping the user navigate the TOLLAN protocol powered by MagicBlock. Keep responses concise for real-time conversation."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setIsActive(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-12 items-center justify-center">
      <div className="text-center mb-20">
        <span className="text-[#9b59b6] text-[11px] font-bold tracking-[0.6em] block mb-4 font-mono">NEURAL_LINK_STABLE</span>
        <h3 className="text-7xl font-pirata text-white tracking-wide uppercase">Voice Protocols</h3>
      </div>

      <div className="relative mb-24">
        <button 
          onClick={toggleVoice}
          className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${
            isActive 
              ? 'border-[#9b59b6] bg-[#9b59b6]/20 shadow-[0_0_80px_rgba(155,89,182,0.4)]' 
              : 'border-white/5 bg-black hover:border-white/20'
          }`}
        >
          <div className={`w-24 h-24 rounded-full transition-all duration-500 flex items-center justify-center ${isActive ? 'scale-75 bg-[#9b59b6] shadow-[0_0_20px_#9b59b6]' : 'scale-100 bg-white/10'}`}>
            <span className="text-4xl">{isActive ? '🔊' : '🎙️'}</span>
          </div>
          {isActive && (
            <>
              <div className="absolute inset-0 border-2 border-[#9b59b6] rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-[-20px] border border-[#9b59b6]/10 rounded-full animate-pulse"></div>
            </>
          )}
        </button>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
           <span className={`text-[10px] font-black tracking-widest uppercase ${isActive ? 'text-[#9b59b6] animate-pulse' : 'text-slate-700'}`}>
             {isActive ? 'Session_Active' : 'Awaiting_Activation'}
           </span>
        </div>
      </div>

      <div className="w-full max-w-3xl btn-stone bg-black/40 p-8 h-72 overflow-y-auto font-mono flex flex-col border-white/5 shadow-inner">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
          <span className="text-[9px] text-slate-600 block tracking-[0.4em] uppercase font-bold">Encrypted_Transmission_Log</span>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-[#9b59b6]"></div>
             <div className={`w-1.5 h-1.5 ${isActive ? 'bg-[#9b59b6]' : 'bg-slate-800'}`}></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {transcription.map((entry, i) => (
            <div key={i} className={`flex flex-col ${entry.role === 'AI' ? 'items-start' : 'items-end'}`}>
              <div className={`max-w-[80%] p-3 text-[11px] leading-relaxed transition-all ${
                entry.role === 'AI' 
                  ? 'text-[#9b59b6] bg-[#9b59b6]/5 border-l-2 border-[#9b59b6]' 
                  : 'text-white bg-white/5 border-r-2 border-white/20'
              }`}>
                <span className="text-[8px] opacity-40 block mb-1 tracking-widest uppercase">{entry.role}:</span>
                {entry.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
        
        {transcription.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <span className="font-pirata text-6xl uppercase">Silent Shard</span>
            <p className="text-[9px] tracking-[0.4em] uppercase font-bold mt-2">Initialize link for data transfer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceModule;
