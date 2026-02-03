
import React, { useState, useMemo } from 'react';
import { AppMode, CategoryType, VocabularyItem } from './types';
import { VOCABULARY } from './data/vocabulary';
import Dashboard from './components/Dashboard';
import StudyMode from './components/StudyMode';
import QuizMode from './components/QuizMode';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('DASHBOARD');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  const filteredVocab = useMemo(() => {
    if (!selectedCategory) return [];
    return VOCABULARY.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const handleStartStudy = (category: CategoryType) => {
    setSelectedCategory(category);
    setMode('STUDY');
  };

  const handleStartQuiz = (category: CategoryType) => {
    setSelectedCategory(category);
    setMode('QUIZ');
  };

  const backToDashboard = () => {
    setMode('DASHBOARD');
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-pink-500 text-white p-6 shadow-lg sticky top-0 z-50 rounded-b-3xl">
        <div className="container mx-auto flex justify-between items-center">
          <h1 
            className="text-2xl md:text-3xl font-heading cursor-pointer select-none"
            onClick={backToDashboard}
          >
            Spotlight 2
          </h1>
          {mode !== 'DASHBOARD' && (
            <button 
              onClick={backToDashboard}
              className="bg-white text-pink-500 px-4 py-2 rounded-full font-bold shadow-md hover:bg-pink-50 transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8">
        {mode === 'DASHBOARD' && (
          <Dashboard 
            onStartStudy={handleStartStudy}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {mode === 'STUDY' && selectedCategory && (
          <StudyMode 
            category={selectedCategory}
            items={filteredVocab}
            onFinish={backToDashboard}
          />
        )}

        {mode === 'QUIZ' && selectedCategory && (
          <QuizMode 
            category={selectedCategory}
            items={filteredVocab}
            onFinish={backToDashboard}
          />
        )}
      </main>

      {/* Floating Footer Attribution */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 text-center text-pink-400 font-semibold border-t border-pink-100">
        Mastering English step by step! 🌟
      </footer>
    </div>
  );
};

export default App;
