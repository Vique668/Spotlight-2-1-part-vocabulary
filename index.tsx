
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- TYPES ---
enum CategoryType {
  ALPHABET = 'Alphabet Fun (p.16)',
  FAMILY = 'My Family (p.18, 22)',
  COLORS = 'Colours (p.24, 30)',
  HOME = 'My Home (p.26, 30, 34)',
  BIRTHDAY = 'My Birthday (p.44)',
  FOOD = 'Yummy Food (p.48)'
}

interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  category: CategoryType;
  icon?: string;
}

type AppMode = 'DASHBOARD' | 'STUDY' | 'QUIZ';

interface QuizQuestion {
  id: string;
  correctItem: VocabularyItem;
  options: string[];
}

// --- DATA ---
const VOCABULARY: VocabularyItem[] = [
  // Page 16 - Alphabet Fun
  { id: 'p16-1', word: 'ant', translation: 'муравей', category: CategoryType.ALPHABET, icon: '🐜' },
  { id: 'p16-2', word: 'bed', translation: 'кровать', category: CategoryType.ALPHABET, icon: '🛏️' },
  { id: 'p16-3', word: 'cat', translation: 'кошка', category: CategoryType.ALPHABET, icon: '🐱' },
  { id: 'p16-4', word: 'dog', translation: 'собака', category: CategoryType.ALPHABET, icon: '🐶' },
  { id: 'p16-5', word: 'egg', translation: 'яйцо', category: CategoryType.ALPHABET, icon: '🥚' },
  { id: 'p16-6', word: 'flag', translation: 'флаг', category: CategoryType.ALPHABET, icon: '🚩' },
  { id: 'p16-7', word: 'glass', translation: 'стакан', category: CategoryType.ALPHABET, icon: '🥛' },
  { id: 'p16-8', word: 'horse', translation: 'лошадь', category: CategoryType.ALPHABET, icon: '🐴' },
  { id: 'p16-9', word: 'ink', translation: 'чернила', category: CategoryType.ALPHABET, icon: '🖋️' },
  { id: 'p16-10', word: 'jug', translation: 'кувшин', category: CategoryType.ALPHABET, icon: '🏺' },
  { id: 'p16-11', word: 'kangaroo', translation: 'кенгуру', category: CategoryType.ALPHABET, icon: '🦘' },
  { id: 'p16-12', word: 'lamp', translation: 'лампа', category: CategoryType.ALPHABET, icon: '💡' },
  { id: 'p16-13', word: 'mouse', translation: 'мышь', category: CategoryType.ALPHABET, icon: '🐭' },
  { id: 'p16-14', word: 'nest', translation: 'гнездо', category: CategoryType.ALPHABET, icon: '🐣' },
  { id: 'p16-15', word: 'orange', translation: 'апельсин', category: CategoryType.ALPHABET, icon: '🍊' },
  { id: 'p16-16', word: 'pin', translation: 'булавка', category: CategoryType.ALPHABET, icon: '📍' },
  { id: 'p16-17', word: 'queen', translation: 'королева', category: CategoryType.ALPHABET, icon: '👸' },
  { id: 'p16-18', word: 'rabbit', translation: 'кролик', category: CategoryType.ALPHABET, icon: '🐰' },
  { id: 'p16-19', word: 'snake', translation: 'змея', category: CategoryType.ALPHABET, icon: '🐍' },
  { id: 'p16-20', word: 'tree', translation: 'дерево', category: CategoryType.ALPHABET, icon: '🌳' },
  { id: 'p16-21', word: 'umbrella', translation: 'зонтик', category: CategoryType.ALPHABET, icon: '☂️' },
  { id: 'p16-22', word: 'vest', translation: 'жилет', category: CategoryType.ALPHABET, icon: '🎽' },
  { id: 'p16-23', word: 'window', translation: 'окно', category: CategoryType.ALPHABET, icon: '🏠' },
  { id: 'p16-24', word: 'box', translation: 'коробка', category: CategoryType.ALPHABET, icon: '📦' },
  { id: 'p16-25', word: 'yacht', translation: 'яхта', category: CategoryType.ALPHABET, icon: '⛵' },
  { id: 'p16-26', word: 'zip', translation: 'молния', category: CategoryType.ALPHABET, icon: '🤐' },

  // Page 18 & 22 - My Family
  { id: 'p18-1', word: 'brother', translation: 'брат', category: CategoryType.FAMILY, icon: '👦' },
  { id: 'p18-2', word: 'sister', translation: 'сестра', category: CategoryType.FAMILY, icon: '👧' },
  { id: 'p18-3', word: 'mummy', translation: 'мама', category: CategoryType.FAMILY, icon: '👩' },
  { id: 'p18-4', word: 'daddy', translation: 'папа', category: CategoryType.FAMILY, icon: '👨' },
  { id: 'p22-1', word: 'grandma', translation: 'бабушка', category: CategoryType.FAMILY, icon: '👵' },
  { id: 'p22-2', word: 'grandpa', translation: 'дедушка', category: CategoryType.FAMILY, icon: '👴' },

  // Page 24 & 30 - Colours
  { id: 'p24-1', word: 'red', translation: 'красный', category: CategoryType.COLORS, icon: '🔴' },
  { id: 'p24-2', word: 'yellow', translation: 'желтый', category: CategoryType.COLORS, icon: '🟡' },
  { id: 'p24-3', word: 'green', translation: 'зеленый', category: CategoryType.COLORS, icon: '🟢' },
  { id: 'p24-4', word: 'white', translation: 'белый', category: CategoryType.COLORS, icon: '⚪' },
  { id: 'p24-5', word: 'blue', translation: 'синий', category: CategoryType.COLORS, icon: '🔵' },
  { id: 'p30-1', word: 'black', translation: 'черный', category: CategoryType.COLORS, icon: '⚫' },
  { id: 'p30-2', word: 'brown', translation: 'коричневый', category: CategoryType.COLORS, icon: '🟤' },

  // Page 26, 30, 34 - My Home
  { id: 'p26-1', word: 'tree house', translation: 'домик на дереве', category: CategoryType.HOME, icon: '🏠🌳' },
  { id: 'p26-2', word: 'chair', translation: 'стул', category: CategoryType.HOME, icon: '🪑' },
  { id: 'p26-3', word: 'table', translation: 'стол', category: CategoryType.HOME, icon: '🍽️' },
  { id: 'p26-4', word: 'radio', translation: 'радио', category: CategoryType.HOME, icon: '📻' },
  { id: 'p30-3', word: 'garden', translation: 'сад', category: CategoryType.HOME, icon: '🏡' },
  { id: 'p30-4', word: 'bedroom', translation: 'спальня', category: CategoryType.HOME, icon: '🛌' },
  { id: 'p30-5', word: 'kitchen', translation: 'кухня', category: CategoryType.HOME, icon: '🍳' },
  { id: 'p30-6', word: 'house', translation: 'дом', category: CategoryType.HOME, icon: '🏠' },
  { id: 'p34-1', word: 'living room', translation: 'гостиная', category: CategoryType.HOME, icon: '🛋️' },
  { id: 'p34-2', word: 'bathroom', translation: 'ванная', category: CategoryType.HOME, icon: '🛁' },
  { id: 'p34-3', word: 'bath', translation: 'ванна', category: CategoryType.HOME, icon: '🛀' },

  // Page 44 - My Birthday
  { id: 'p44-1', word: 'candles', translation: 'свечи', category: CategoryType.BIRTHDAY, icon: '🕯️' },
  { id: 'p44-2', word: 'party', translation: 'праздник/вечеринка', category: CategoryType.BIRTHDAY, icon: '🎉' },
  { id: 'p44-3', word: 'happy', translation: 'счастливый', category: CategoryType.BIRTHDAY, icon: '😊' },
  { id: 'p44-4', word: 'sad', translation: 'грустный', category: CategoryType.BIRTHDAY, icon: '😢' },
  { id: 'p44-5', word: 'one', translation: 'один', category: CategoryType.BIRTHDAY, icon: '1️⃣' },
  { id: 'p44-6', word: 'two', translation: 'два', category: CategoryType.BIRTHDAY, icon: '2️⃣' },
  { id: 'p44-7', word: 'three', translation: 'три', category: CategoryType.BIRTHDAY, icon: '3️⃣' },
  { id: 'p44-8', word: 'four', translation: 'четыре', category: CategoryType.BIRTHDAY, icon: '4️⃣' },
  { id: 'p44-9', word: 'five', translation: 'пять', category: CategoryType.BIRTHDAY, icon: '5️⃣' },
  { id: 'p44-10', word: 'six', translation: 'шесть', category: CategoryType.BIRTHDAY, icon: '6️⃣' },
  { id: 'p44-11', word: 'seven', translation: 'семь', category: CategoryType.BIRTHDAY, icon: '7️⃣' },
  { id: 'p44-12', word: 'eight', translation: 'восемь', category: CategoryType.BIRTHDAY, icon: '8️⃣' },
  { id: 'p44-13', word: 'nine', translation: 'девять', category: CategoryType.BIRTHDAY, icon: '9️⃣' },
  { id: 'p44-14', word: 'ten', translation: 'десять', category: CategoryType.BIRTHDAY, icon: '🔟' },
  { id: 'p44-15', word: 'eleven', translation: 'одиннадцать', category: CategoryType.BIRTHDAY, icon: '1️⃣1️⃣' },
  { id: 'p44-16', word: 'twelve', translation: 'двенадцать', category: CategoryType.BIRTHDAY, icon: '1️⃣2️⃣' },

  // Page 48 - Yummy Food
  { id: 'p48-1', word: 'burgers', translation: 'бургеры', category: CategoryType.FOOD, icon: '🍔' },
  { id: 'p48-2', word: 'chips', translation: 'картофель фри', category: CategoryType.FOOD, icon: '🍟' },
  { id: 'p48-3', word: 'apples', translation: 'яблоки', category: CategoryType.FOOD, icon: '🍎' },
  { id: 'p48-4', word: 'bananas', translation: 'бананы', category: CategoryType.FOOD, icon: '🍌' },
  { id: 'p48-5', word: 'sandwiches', translation: 'бутерброды', category: CategoryType.FOOD, icon: '🥪' },
  { id: 'p48-6', word: 'chocolate', translation: 'шоколад', category: CategoryType.FOOD, icon: '🍫' },
  { id: 'p48-7', word: 'yummy', translation: 'вкусный', category: CategoryType.FOOD, icon: '😋' },
];

// --- UTILITIES ---
const pcmCache: Record<string, Uint8Array> = {};

function decodeBase64(base64: string) {
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

// --- COMPONENTS ---

const Dashboard: React.FC<{ onStartStudy: (c: CategoryType) => void; onStartQuiz: (c: CategoryType) => void }> = ({ onStartStudy, onStartQuiz }) => {
  const getCategoryStyles = (category: CategoryType) => {
    switch(category) {
      case CategoryType.ALPHABET: return 'bg-blue-100 border-blue-300 text-blue-800';
      case CategoryType.FAMILY: return 'bg-purple-100 border-purple-300 text-purple-800';
      case CategoryType.COLORS: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case CategoryType.HOME: return 'bg-green-100 border-green-300 text-green-800';
      case CategoryType.BIRTHDAY: return 'bg-pink-100 border-pink-300 text-pink-800';
      case CategoryType.FOOD: return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.values(CategoryType).map((cat) => (
        <div 
          key={cat}
          className={`p-6 rounded-3xl border-4 shadow-xl flex flex-col items-center text-center transition-transform hover:scale-105 ${getCategoryStyles(cat)}`}
        >
          <div className="mb-4">
            <span className="text-4xl">
              {cat === CategoryType.ALPHABET && '🔤'}
              {cat === CategoryType.FAMILY && '👨‍👩‍👧‍👦'}
              {cat === CategoryType.COLORS && '🎨'}
              {cat === CategoryType.HOME && '🏠'}
              {cat === CategoryType.BIRTHDAY && '🎂'}
              {cat === CategoryType.FOOD && '🍕'}
            </span>
          </div>
          <h2 className="text-xl font-heading mb-6">{cat}</h2>
          
          <div className="flex w-full gap-3 mt-auto">
            <button onClick={() => onStartStudy(cat)} className="flex-1 bg-white border-2 border-current py-3 rounded-2xl font-bold hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">📖 Study</button>
            <button onClick={() => onStartQuiz(cat)} className="flex-1 bg-white border-2 border-current py-3 rounded-2xl font-bold hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">🎮 Play</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StudyMode: React.FC<{ category: CategoryType; items: VocabularyItem[]; onFinish: () => void }> = ({ category, items, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentItem = items[currentIndex];

  const speak = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
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
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
          uint8Data = decodeBase64(base64);
          pcmCache[currentItem.word] = uint8Data;
        }
      }

      if (uint8Data) {
        const buffer = await decodeAudioData(uint8Data, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => { setIsPlaying(false); setIsAudioLoading(false); };
        setIsPlaying(true);
        setIsAudioLoading(false);
        source.start(0);
      } else { setIsAudioLoading(false); }
    } catch { setIsAudioLoading(false); setIsPlaying(false); }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center px-4 mb-20">
      <div className="mb-4 text-center">
        <h2 className="text-xl md:text-2xl font-heading text-pink-600 mb-1">{category}</h2>
        <div className="bg-pink-100 text-pink-800 px-4 py-1 rounded-full text-xs font-bold">{currentIndex + 1} / {items.length}</div>
      </div>
      <div className="w-full aspect-[4/5] relative cursor-pointer" style={{perspective: '1200px'}} onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`w-full h-full transition-all duration-700 relative`} style={{transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}}>
          <div className="absolute inset-0 bg-white border-8 border-pink-300 rounded-[3rem] shadow-2xl flex flex-col items-center p-8" style={{backfaceVisibility: 'hidden'}}>
             <button onClick={speak} className="self-end w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center text-2xl shadow-md">{isAudioLoading ? '⌛' : '🔊'}</button>
             <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-8xl md:text-9xl mb-4">{currentItem.icon || '❓'}</div>
                <h1 className="text-4xl md:text-5xl font-heading uppercase text-slate-800">{currentItem.word}</h1>
             </div>
          </div>
          <div className="absolute inset-0 bg-pink-500 border-8 border-pink-200 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-8 text-white" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
             <div className="text-7xl mb-6">💡</div>
             <h2 className="text-3xl md:text-4xl font-heading text-center">{currentItem.translation}</h2>
          </div>
        </div>
      </div>
      <div className="flex w-full gap-5 mt-12">
        <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }} disabled={currentIndex === 0} className="bg-white border-4 border-pink-100 py-4 rounded-2xl flex-1 text-3xl shadow-md disabled:opacity-20 transition-all active:scale-95">⬅️</button>
        <button onClick={() => { if (currentIndex < items.length - 1) { setCurrentIndex(currentIndex + 1); setIsFlipped(false); } else { onFinish(); } }} className="bg-pink-500 text-white py-4 rounded-2xl flex-1 text-xl md:text-2xl font-heading shadow-xl transition-all active:scale-95">{currentIndex === items.length - 1 ? 'Finish 🏁' : 'Next ➡️'}</button>
      </div>
    </div>
  );
};

const QuizMode: React.FC<{ category: CategoryType; items: VocabularyItem[]; onFinish: () => void }> = ({ category, items, onFinish }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.map(item => ({
      id: item.id,
      correctItem: item,
      options: [item.translation, ...items.filter(i => i.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 3).map(i => i.translation)].sort(() => Math.random() - 0.5)
    })));
  }, [items]);

  const handleOption = (opt: string) => {
    if (showResult) return;
    setSelectedOption(opt);
    setShowResult(true);
    if (opt === questions[currentIndex].correctItem.translation) setScore(score + 1);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setShowResult(false);
      } else { setQuizFinished(true); }
    }, 1500);
  };

  if (quizFinished) return (
    <div className="max-w-md mx-auto bg-white border-8 border-pink-300 rounded-[3rem] p-10 text-center shadow-2xl">
      <h2 className="text-4xl font-heading text-pink-600 mb-6">Result! 🏆</h2>
      <div className="text-9xl mb-6">🎖️</div>
      <p className="text-6xl font-heading text-pink-500 mb-8">{score} / {questions.length}</p>
      <button onClick={onFinish} className="w-full bg-pink-500 text-white font-heading text-2xl py-6 rounded-3xl shadow-xl transition-all active:scale-95">Back Home</button>
    </div>
  );

  const q = questions[currentIndex];
  if (!q) return <div className="text-center font-heading p-20 text-pink-500">Loading Quiz...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 mb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm mb-8 border-2 border-pink-50">
        <h2 className="font-heading text-pink-600 text-sm md:text-base">{category}</h2>
        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-2xl font-heading text-xl md:text-2xl">⭐ {score}</div>
      </div>
      <div className="bg-white border-8 border-pink-100 rounded-[3rem] p-8 md:p-12 text-center shadow-xl mb-8">
        <p className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">Card {currentIndex + 1}</p>
        <h3 className="text-4xl md:text-6xl font-heading text-slate-900 uppercase">{q.correctItem.word}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.options.map((opt) => {
          let color = 'bg-white border-gray-100 text-gray-700';
          if (showResult) {
            if (opt === q.correctItem.translation) color = 'bg-green-500 border-green-600 text-white scale-105';
            else if (opt === selectedOption) color = 'bg-red-500 border-red-600 text-white opacity-80';
            else color = 'bg-gray-50 border-gray-100 text-gray-300 opacity-40';
          }
          return (
            <button key={opt} disabled={showResult} onClick={() => handleOption(opt)} className={`p-6 rounded-3xl border-4 text-lg md:text-xl font-bold transition-all ${color} active:scale-95`}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('DASHBOARD');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const filteredVocab = useMemo(() => VOCABULARY.filter(i => i.category === selectedCategory), [selectedCategory]);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-pink-500 text-white p-6 shadow-lg sticky top-0 z-50 rounded-b-3xl">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-heading cursor-pointer" onClick={() => setMode('DASHBOARD')}>Spotlight 2</h1>
          {mode !== 'DASHBOARD' && <button onClick={() => setMode('DASHBOARD')} className="bg-white text-pink-500 px-4 py-2 rounded-full font-bold shadow-md hover:bg-pink-50 transition-colors">Back</button>}
        </div>
      </header>
      <main className="container mx-auto px-4 pt-8">
        {mode === 'DASHBOARD' && <Dashboard onStartStudy={(c) => { setSelectedCategory(c); setMode('STUDY'); }} onStartQuiz={(c) => { setSelectedCategory(c); setMode('QUIZ'); }} />}
        {mode === 'STUDY' && selectedCategory && <StudyMode category={selectedCategory} items={filteredVocab} onFinish={() => setMode('DASHBOARD')} />}
        {mode === 'QUIZ' && selectedCategory && <QuizMode category={selectedCategory} items={filteredVocab} onFinish={() => setMode('DASHBOARD')} />}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 text-center text-pink-400 font-semibold border-t border-pink-100 z-40">vk.com/proenglishkulagina 🌟</footer>
    </div>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
