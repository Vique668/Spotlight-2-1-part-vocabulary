
import React, { useState, useRef } from 'react';
import { CategoryType, VocabularyItem } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

interface StudyModeProps {
  category: CategoryType;
  items: VocabularyItem[];
  onFinish: () => void;
}

const pcmCache: Record<string, Uint8Array> = {};

const StudyMode: React.FC<StudyModeProps> = ({ category, items, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentItem = items[currentIndex];

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const length = data.byteLength - (data.byteLength % 2);
    const bufferCopy = data.buffer.slice(data.byteOffset, data.byteOffset + length);
    const dataInt16 = new Int16Array(bufferCopy);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const speakWord = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying || isAudioLoading) return;
    setIsAudioLoading(true);
    setQuotaError(null);
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      let uint8Data = pcmCache[currentItem.word];
      if (!uint8Data) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Say clearly: ${currentItem.word}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          uint8Data = decode(base64Audio);
          pcmCache[currentItem.word] = uint8Data;
        }
      }
      if (uint8Data) {
        const audioBuffer = await decodeAudioData(uint8Data, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { setIsPlaying(false); setIsAudioLoading(false); };
        setIsPlaying(true);
        setIsAudioLoading(false);
        source.start(0);
      } else {
        setIsAudioLoading(false);
      }
    } catch (err: any) {
      if (err.message?.includes('429')) setQuotaError("Sound limit reached. Try again in 1 min.");
      setIsAudioLoading(false);
      setIsPlaying(false);
    }
  };

  const wordLength = currentItem.word.length;
  const fontSizeClass = wordLength > 10 
    ? "text-2xl sm:text-3xl md:text-4xl" 
    : wordLength > 7 
    ? "text-3xl sm:text-4xl md:text-5xl" 
    : "text-4xl sm:text-6xl md:text-7xl";

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center px-4 mb-24">
      <div className="mb-4 text-center">
        <h2 className="text-xl md:text-2xl font-heading text-pink-600 mb-1">{category}</h2>
        <div className="bg-pink-100 text-pink-800 px-4 py-1 rounded-full text-xs font-bold shadow-sm">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden shadow-inner">
        <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }} />
      </div>

      {quotaError && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded-r text-xs font-bold animate-pulse">
          ⚠️ {quotaError}
        </div>
      )}

      <div className="w-full aspect-[4/5] md:aspect-square relative perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`w-full h-full transition-all duration-700 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-white border-8 border-pink-300 rounded-[3rem] shadow-2xl flex flex-col items-center p-4 md:p-8">
            <div className="w-full flex justify-end">
              <button onClick={speakWord} disabled={isAudioLoading} className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${isPlaying ? 'bg-pink-500 text-white animate-pulse' : isAudioLoading ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'}`}>
                {isAudioLoading ? '⌛' : isPlaying ? '🌟' : '🔊'}
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center w-full gap-4 overflow-hidden">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 flex items-center justify-center relative">
                <div className="text-7xl sm:text-8xl md:text-[10rem] select-none animate-bounce-slow drop-shadow-xl filter saturate-150">
                  {currentItem.icon || '❓'}
                </div>
              </div>
              <div className="text-center w-full px-2">
                <h1 className={`${fontSizeClass} font-heading text-slate-900 uppercase tracking-tight break-words text-center leading-tight`}>
                  {currentItem.word}
                </h1>
                <p className="mt-2 text-pink-400 font-bold text-[10px] md:text-sm tracking-widest uppercase animate-pulse">Tap to see Russian</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 backface-hidden bg-pink-500 border-8 border-pink-200 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-8 rotate-y-180 overflow-hidden">
            <div className="text-6xl md:text-9xl mb-4 md:mb-8 filter drop-shadow-lg">💡</div>
            <h2 className="text-2xl sm:text-3xl md:text-6xl font-heading text-white text-center leading-tight break-words px-2">{currentItem.translation}</h2>
            <div className="mt-6 md:mt-12 bg-white/20 px-4 md:px-10 py-2 md:py-4 rounded-3xl border border-white/30 backdrop-blur-sm">
              <p className="text-white font-bold text-lg md:text-3xl uppercase tracking-widest">{currentItem.word}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-between mt-12 gap-5">
        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); setQuotaError(null); }} disabled={currentIndex === 0} className="bg-white border-4 border-gray-100 text-gray-400 py-6 rounded-3xl font-heading text-2xl flex-1 shadow-lg disabled:opacity-20 active:scale-95 transition-all">⬅️</button>
        <button onClick={(e) => { e.stopPropagation(); if (currentIndex < items.length - 1) { setCurrentIndex(currentIndex + 1); setIsFlipped(false); setQuotaError(null); } else { onFinish(); } }} className="bg-pink-500 text-white py-6 rounded-3xl font-heading text-2xl flex-1 shadow-xl hover:bg-pink-600 transition-all active:scale-95">{currentIndex === items.length - 1 ? 'Finish 🏁' : 'Next ➡️'}</button>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1200px; } 
        .transform-style-3d { transform-style: preserve-3d; } 
        .backface-hidden { backface-visibility: hidden; } 
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
      `}</style>
    </div>
  );
};

export default StudyMode;
