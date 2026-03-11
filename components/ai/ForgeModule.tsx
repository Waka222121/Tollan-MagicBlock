
import React, { useState, useRef } from 'react';
import { blobToBase64 } from '../../lib/gemini';
import { getAIClient, formatAiError } from '../../lib/aiClient';

const ForgeModule = () => {
  const [prompt, setPrompt] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [forgedMedia, setForgedMedia] = useState<{ type: string; url: string } | null>(null);
  const [config, setConfig] = useState({ type: 'image', mode: 'generate', size: '1K', ratio: '1:1' });
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ensureKeySelected = async () => {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    return true;
  };

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      setSourcePreview(URL.createObjectURL(file));
      setConfig(prev => ({ ...prev, mode: 'edit' }));
    }
  };

  const forge = async () => {
    if (!prompt.trim() || isForging) return;
    setIsForging(true);
    setError(null);
    setForgedMedia(null);

    try {
      if (config.type === 'video' || (config.type === 'image' && config.mode !== 'edit')) {
        await ensureKeySelected();
      }

      const ai = getAIClient();
      
      if (config.type === 'video') {
        let videoParams: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: config.ratio
          }
        };

        if (sourceImage) {
          videoParams.image = {
            imageBytes: await blobToBase64(sourceImage),
            mimeType: sourceImage.type
          };
        }

        let operation = await ai.models.generateVideos(videoParams);

        while (!operation.done) {
          await new Promise(res => setTimeout(res, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await resp.blob();
        setForgedMedia({ type: 'video', url: URL.createObjectURL(videoBlob) });

      } else {
        if (config.mode === 'edit' && sourceImage) {
          const base64 = await blobToBase64(sourceImage);
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: base64, mimeType: sourceImage.type } },
                { text: prompt }
              ]
            }
          });

          const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imgPart?.inlineData) {
            setForgedMedia({ type: 'image', url: `data:image/png;base64,${imgPart.inlineData.data}` });
          } else {
            setError("PROTOCOL_FAILURE: IMAGE_EDIT_FAILED");
          }
        } else {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-preview-image-generation',
            contents: { parts: [{ text: prompt }] },
            config: {
              imageConfig: {
                aspectRatio: config.ratio,
                imageSize: config.size
              }
            }
          });

          const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imgPart?.inlineData) {
            setForgedMedia({ type: 'image', url: `data:image/png;base64,${imgPart.inlineData.data}` });
          } else {
            setError("PROTOCOL_FAILURE: IMAGE_GENERATION_FAILED");
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      }
      setError(formatAiError(e, 'FORGE_ERROR'));
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="border-l-4 border-[#9b59b6] pl-6">
            <span className="text-[#9b59b6] text-[11px] tracking-[0.5em] font-bold block mb-2 font-mono">NEURAL_FORGE_V3</span>
            <h3 className="text-5xl font-pirata tracking-wide text-white uppercase">Forging Chamber</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfig({...config, type: 'image', mode: 'generate'})} 
                className={`btn-stone p-4 text-[10px] font-bold tracking-widest ${config.type === 'image' && config.mode === 'generate' ? 'text-[#9b59b6] border-[#9b59b6] bg-[#9b59b6]/10' : 'text-slate-500'}`}
              >
                STILL_SYNTHESIS
              </button>
              <button 
                onClick={() => setConfig({...config, type: 'video'})} 
                className={`btn-stone p-4 text-[10px] font-bold tracking-widest ${config.type === 'video' ? 'text-[#9b59b6] border-[#9b59b6] bg-[#9b59b6]/10' : 'text-slate-500'}`}
              >
                MOTION_UNIT
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[8px] text-slate-600 font-bold tracking-widest">SOURCE_ARTIFACT (OPTIONAL)</span>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed h-24 flex items-center justify-center cursor-pointer transition-all ${sourcePreview ? 'border-[#9b59b6] bg-[#9b59b6]/5' : 'border-white/10 hover:border-white/30'}`}
              >
                {sourcePreview ? (
                  <div className="flex items-center gap-4 px-4 overflow-hidden w-full">
                    <img src={sourcePreview} className="h-16 w-16 object-cover border border-white/20" alt="Source" />
                    <div className="flex-1">
                      <p className="text-[9px] text-[#9b59b6] truncate font-mono">{sourceImage?.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setSourceImage(null); setSourcePreview(null); setConfig(prev => ({...prev, mode: 'generate'})); }} className="text-[8px] text-red-500 underline uppercase mt-1">Eject</button>
                    </div>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-700 tracking-widest uppercase font-bold">Select Image to Edit or Animate</span>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleSourceUpload} className="hidden" accept="image/*" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[8px] text-slate-600 font-bold tracking-widest">ASSET_SCALE</span>
                <select 
                  disabled={config.mode === 'edit'}
                  value={config.size} 
                  onChange={(e) => setConfig({...config, size: e.target.value})}
                  className="w-full btn-stone bg-black p-3 text-[10px] focus:outline-none focus:border-[#9b59b6] text-white"
                >
                  <option>1K</option>
                  <option>2K</option>
                  <option>4K</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="text-[8px] text-slate-600 font-bold tracking-widest">ASPECT_RATIO</span>
                <select 
                  value={config.ratio} 
                  onChange={(e) => setConfig({...config, ratio: e.target.value})}
                  className="w-full btn-stone bg-black p-3 text-[10px] focus:outline-none focus:border-[#9b59b6] text-white"
                >
                  <option>1:1</option>
                  <option>16:9</option>
                  <option>9:16</option>
                  <option>3:2</option>
                  <option>2:3</option>
                  <option>4:3</option>
                  <option>3:4</option>
                  <option>21:9</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[8px] text-slate-600 font-bold tracking-widest">COMMAND_SEQUENCE</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={config.mode === 'edit' ? "e.g. 'Add a retro filter' or 'Remove the enemy'" : "Describe the target asset for synthesis..."}
                className="w-full h-32 bg-black border border-white/10 p-4 text-[11px] focus:outline-none focus:border-[#9b59b6] text-white placeholder:text-slate-800 resize-none font-sans"
              />
            </div>

            <button 
              onClick={forge}
              disabled={isForging}
              className="w-full btn-stone py-8 text-black font-black text-2xl italic tracking-tighter transition-all disabled:opacity-30 overflow-hidden"
            >
              <div className="metal-shine"></div>
              <span className="relative z-10 text-[#9b59b6] uppercase font-bold">
                {isForging ? 'EXECUTING_PROTOCOL...' : (config.mode === 'edit' ? 'REAUTHORIZE_MODIFICATION' : 'INITIATE_FORGE')}
              </span>
            </button>
            {error && <p className="text-red-500 text-[10px] font-bold font-mono text-center uppercase tracking-widest">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center btn-stone bg-black/40 relative overflow-hidden min-h-[500px]">
          {isForging ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 border-4 border-[#9b59b6] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-pirata text-2xl text-[#9b59b6] tracking-widest animate-pulse uppercase">Assembling Shards...</p>
            </div>
          ) : forgedMedia ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <span className="text-[9px] text-slate-700 mb-4 tracking-[0.4em] uppercase font-bold">Protocol_Output: Verified</span>
              <div className="relative border border-white/20 shadow-[0_0_100px_rgba(155,89,182,0.1)] max-w-full overflow-hidden">
                {forgedMedia.type === 'image' ? (
                  <img src={forgedMedia.url} className="max-w-full h-auto object-contain" alt="Forged Asset" />
                ) : (
                  <video src={forgedMedia.url} controls autoPlay loop className="max-w-full h-auto" />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 px-20">
              <div className="font-pirata text-9xl text-slate-800/20 select-none">NULL</div>
              <p className="text-[10px] text-slate-700 tracking-[0.4em] font-bold uppercase">Ready for Command Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgeModule;
