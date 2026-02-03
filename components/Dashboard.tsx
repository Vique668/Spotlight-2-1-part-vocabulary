
import React from 'react';
import { CategoryType } from '../types.ts';

interface DashboardProps {
  onStartStudy: (category: CategoryType) => void;
  onStartQuiz: (category: CategoryType) => void;
}

const CATEGORIES = Object.values(CategoryType);

const Dashboard: React.FC<DashboardProps> = ({ onStartStudy, onStartQuiz }) => {
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
      {CATEGORIES.map((cat) => (
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
            <button 
              onClick={() => onStartStudy(cat)}
              className="flex-1 bg-white border-2 border-current py-3 rounded-2xl font-bold hover:bg-opacity-50 transition-all flex items-center justify-center gap-2"
            >
              📖 Study
            </button>
            <button 
              onClick={() => onStartQuiz(cat)}
              className="flex-1 bg-white border-2 border-current py-3 rounded-2xl font-bold hover:bg-opacity-50 transition-all flex items-center justify-center gap-2"
            >
              🎮 Play
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
