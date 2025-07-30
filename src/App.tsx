import React, { useState, useEffect } from 'react';
import { Mic, Volume2, BookOpen, History, Languages, Brain } from 'lucide-react';
import TextToSpeech from './components/TextToSpeech';
import SpeechRecognition from './components/SpeechRecognition';
import PronunciationAnalyzer from './components/PronunciationAnalyzer';
import Dictionary from './components/Dictionary';
import WordHistory from './components/WordHistory';

interface WordData {
  word: string;
  phonetic?: string;
  meanings?: any[];
  timestamp: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<'speak' | 'practice' | 'analyze' | 'learn' | 'history'>('speak');
  const [currentWord, setCurrentWord] = useState('');
  const [wordHistory, setWordHistory] = useState<WordData[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pronunciationHistory');
    if (saved) {
      setWordHistory(JSON.parse(saved));
    }
  }, []);

  const addToHistory = (wordData: WordData) => {
    const newHistory = [wordData, ...wordHistory.filter(w => w.word !== wordData.word)].slice(0, 50);
    setWordHistory(newHistory);
    localStorage.setItem('pronunciationHistory', JSON.stringify(newHistory));
  };

  const tabs = [
    { id: 'speak' as const, label: 'Text to Speech', icon: Volume2 },
    { id: 'practice' as const, label: 'Practice', icon: Mic },
    { id: 'analyze' as const, label: 'AI Analysis', icon: Brain },
    { id: 'learn' as const, label: 'Dictionary', icon: BookOpen },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
              <Languages className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pronunciation Master
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Improve your pronunciation and expand your vocabulary with AI-powered speech recognition and comprehensive dictionary features.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white text-blue-600 shadow-lg scale-105'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {activeTab === 'speak' && (
            <TextToSpeech 
              currentWord={currentWord} 
              setCurrentWord={setCurrentWord}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'practice' && (
            <SpeechRecognition 
              currentWord={currentWord} 
              setCurrentWord={setCurrentWord}
            />
          )}
          {activeTab === 'analyze' && (
            <PronunciationAnalyzer 
              currentWord={currentWord} 
              setCurrentWord={setCurrentWord}
            />
          )}
          {activeTab === 'learn' && (
            <Dictionary 
              currentWord={currentWord} 
              setCurrentWord={setCurrentWord}
              addToHistory={addToHistory}
            />
          )}
          {activeTab === 'history' && (
            <WordHistory 
              wordHistory={wordHistory}
              setCurrentWord={setCurrentWord}
              setActiveTab={setActiveTab}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Practice makes perfect! Keep learning and improving your pronunciation.</p>
        </div>
      </div>
    </div>
  );
}

export default App;