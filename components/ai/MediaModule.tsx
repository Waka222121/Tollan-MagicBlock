
import React, { useState } from 'react';
import { blobToBase64 } from '../../lib/gemini';
import { getAIClient, formatAiError } from '../../lib/aiClient';

const MediaModule = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const analyze = async () => {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const ai = getAIClient();
      const base64 = await blobToBase64(file);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: file.type } },
            { text: "Analyze this media file with high-detail forensic accuracy. If it's a video, provide a scene-by-scene breakdown. If it's an image, perform entity recognition and pattern analysis. Look for technical artifacts, metadata clues, and creative context. Output as a detailed technical report with headers." }
          ]
        },
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      setAnalysis(response.text || "ANALYSIS_FAILURE: NO_RECORDS_FOUND");
    } catch (e) {
      setAnalysis(formatAiError(e, 'CRITICAL_ANALYSIS_ERROR'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
        <div className="space-y-8 flex flex-col">
          <div className="border-l-4 border-[#9b59b6] pl-6">
            <span className="text-[#9b59b6] text-[11px] tracking-[0.4em] font-bold block mb-2 font-mono">NEURAL_DECODER_PRO</span>
            <h3 className="text-5xl font-pirata tracking-wide text-white uppercase">Deep Insight</h3>
          </div>

          <div 
            className="flex-1 btn-stone bg-black/40 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden min-h-[400px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
            }}
          >
            {preview ? (
              <div className="w-full h-full flex flex-col items-center gap-8">
                {file?.type.startsWith('image') ? (
                  <img src={preview} className="max-w-full max-h-[350px] shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/20" alt="Preview" />
                ) : (
                  <video src={preview} className="max-w-full max-h-[350px] border border-white/20" controls />
                )}
                <button onClick={() => { setFile(null); setPreview(null); setAnalysis(null); }} className="text-[10px] text-red-500 underline uppercase tracking-widest font-bold font-mono">Eject_Data_Core</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-8xl mb-6 opacity-10">📂</div>
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.5em] uppercase">Insert Shard for Processing</p>
                <input type="file" id="fileIn" onChange={handleFile} className="hidden" accept="image/*,video/*" />
                <label htmlFor="fileIn" className="inline-block px-12 py-4 btn-stone text-white text-[10px] font-black tracking-widest cursor-pointer hover:text-[#9b59b6] transition-colors uppercase">Select_Local_Asset</label>
              </div>
            )}
          </div>

          <button 
            onClick={analyze}
            disabled={!file || isAnalyzing}
            className="w-full btn-stone py-8 text-black font-black text-2xl italic tracking-tighter transition-all disabled:opacity-20 overflow-hidden"
          >
            <div className="slab-accent corner-tl"></div>
            <div className="slab-accent corner-tr"></div>
            <div className="slab-accent corner-bl"></div>
            <div className="slab-accent corner-br"></div>
            <span className="relative z-10 text-[#9b59b6] uppercase font-bold">
              {isAnalyzing ? 'DECODING_DATA_STREAM...' : 'Initiate_Neural_Scan'}
            </span>
          </button>
        </div>

        <div className="btn-stone bg-black/60 p-12 font-sans normal-case text-slate-300 overflow-y-auto max-h-none border-white/5 shadow-inner">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <span className="font-mono text-[9px] text-slate-600 block tracking-[0.4em] uppercase font-bold">Data_Analysis_Log // Report_Shard_0x{Math.floor(Math.random()*9999)}</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#9b59b6]"></div>
              <div className="w-1 h-1 bg-[#9b59b6]"></div>
            </div>
          </div>
          
          {isAnalyzing ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-6 bg-white/5 w-1/4 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/5 w-full rounded"></div>
                <div className="h-4 bg-white/5 w-5/6 rounded"></div>
                <div className="h-4 bg-white/5 w-4/6 rounded"></div>
              </div>
              <div className="h-6 bg-white/5 w-1/3 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/5 w-full rounded"></div>
                <div className="h-4 bg-white/5 w-3/4 rounded"></div>
              </div>
            </div>
          ) : analysis ? (
            <div className="prose prose-invert max-w-none text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
              {analysis}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
              <span className="font-pirata text-[12rem] leading-none select-none uppercase">VOID</span>
              <span className="text-[10px] tracking-[0.8em] font-bold uppercase mt-4">Buffer Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaModule;
