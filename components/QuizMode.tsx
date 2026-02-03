
import React, { useState, useEffect, useRef } from 'react';
import { CategoryType, VocabularyItem, QuizQuestion } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

interface QuizModeProps {
  category: CategoryType;
  items: VocabularyItem[];
  onFinish: () => void;
}

const pcmCache: Record<string, Uint8Array> = {};

const QuizMode: React.FC<QuizModeProps> = ({ category, items, onFinish }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    const newQuestions = shuffledItems.map((item) => {
      const wrongOptions = items
        .filter(i => i.id !== item.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(i => i.translation);
      const options = [item.translation, ...wrongOptions].sort(() => Math.random() - 0.5);
      return { id: item.id, correctItem: item, options };
    });
    setQuestions(newQuestions);
  }, [items]);

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

  const speakWord = async (word: string) => {
    if (isPlaying || isAudioLoading) return;
    setIsAudioLoading(true);
    setQuotaError(null);
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      let uint8Data = pcmCache[word];
      if (!uint8Data) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Say clearly: ${word}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          uint8Data = decode(base64Audio);
          pcmCache[word] = uint8Data;
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
      if (err.message?.includes('429')) setQuotaError("Audio limit reached!");
      setIsAudioLoading(false);
      setIsPlaying(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);
    if (option === currentQuestion.correctItem.translation) setScore(score + 1);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setShowResult(false);
        setQuotaError(null);
      } else {
        setQuizFinished(true);
      }
    }, 1500);
  };

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion && !quizFinished) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-16 h-16 border-8 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="font-heading text-xl text-pink-500">Preparing Quiz...</p>
    </div>
  );

  if (quizFinished) {
    return (
      <div className="max-w-md mx-auto bg-white border-8 border-pink-300 rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in duration-500">
        <h2 className="text-4xl font-heading text-pink-600 mb-6">Finished! 🏆</h2>
        <div className="text-9xl mb-6">🎖️</div>
        <div className="bg-pink-50 rounded-3xl p-8 border-4 border-pink-100 mb-8 shadow-inner">
           <p className="text-7xl font-heading text-pink-500">{score} / {questions.length}</p>
        </div>
        <button onClick={onFinish} className="w-full bg-pink-500 text-white font-heading text-2xl py-6 rounded-[2rem] shadow-xl hover:bg-pink-600 transition-all active:scale-95">Finish Game</button>
      </div>
    );
  }

  const wordLength = currentQuestion.correctItem.word.length;
  const fontSizeClass = wordLength > 10 
    ? "text-xl sm:text-2xl md:text-4xl lg:text-5xl" 
    : wordLength > 7 
    ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" 
    : "text-4xl sm:text-6xl md:text-7xl lg:text-8xl";

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center px-4 mb-20">
      <div className="w-full mb-6 flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border-2 border-pink-50">
        <div className="overflow-hidden">
          <h2 className="text-xs sm:text-base font-heading text-pink-600 truncate">{category}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Card {currentIndex + 1}</p>
        </div>
        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 md:px-6 md:py-3 rounded-2xl font-heading text-lg md:text-3xl shadow-inner shrink-0">⭐ {score}</div>
      </div>

      {quotaError && (
        <div className="w-full mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-yellow-800 text-xs font-bold animate-pulse">⚠️ {quotaError}</div>
      )}

      <div className="w-full bg-white border-8 border-pink-100 rounded-[3rem] p-4 md:p-12 text-center shadow-xl mb-8 relative flex flex-col items-center justify-center min-h-[200px] md:min-h-[400px] overflow-hidden">
        <button onClick={() => speakWord(currentQuestion.correctItem.word)} disabled={isAudioLoading} className={`absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${isPlaying ? 'bg-pink-500 text-white animate-pulse' : isAudioLoading ? 'bg-gray-100 text-gray-400' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'}`}>
          {isAudioLoading ? '⌛' : isPlaying ? '🌟' : '🔊'}
        </button>
        <p className="text-gray-400 font-bold mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-sm">Choose the translation</p>
        <div className="w-full flex items-center justify-center px-4">
          <h3 className={`${fontSizeClass} font-heading text-slate-900 uppercase tracking-tight leading-tight text-center break-words`}>
            {currentQuestion.correctItem.word}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 w-full">
        {currentQuestion.options.map((option) => {
          let colorClass = 'bg-white border-gray-100 text-gray-700 hover:border-pink-300 hover:bg-pink-50 shadow-lg';
          if (showResult) {
            if (option === currentQuestion.correctItem.translation) colorClass = 'bg-green-500 border-green-600 text-white shadow-green-200 scale-105 z-10';
            else if (option === selectedOption) colorClass = 'bg-red-500 border-red-600 text-white scale-95 opacity-80';
            else colorClass = 'bg-gray-50 border-gray-100 text-gray-300 opacity-40';
          }
          return (
            <button key={option} disabled={showResult} onClick={() => handleOptionClick(option)} className={`p-4 md:p-8 rounded-[2rem] border-4 text-lg md:text-2xl font-bold transition-all active:scale-95 ${colorClass}`}>{option}</button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizMode;
