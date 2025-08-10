import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Volume2, BookOpen, History, Languages, Brain, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TextToSpeech from './components/TextToSpeech';
import PronunciationAnalyzer from './components/PronunciationAnalyzer';
import Dictionary from './components/Dictionary';
import WordHistory from './components/WordHistory';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ProfileSection from './components/auth/ProfileSection';
import ProtectedRoute from './components/auth/ProtectedRoute';

interface WordData {
  word: string;
  phonetic?: string;
  meanings?: any[];
  timestamp: number;
}

const PronunciationApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'speak' | 'analyze' | 'learn' | 'history'>('speak');
  const [currentWord, setCurrentWord] = useState('');
  const [wordHistory, setWordHistory] = useState<WordData[]>([]);
  const { user, profile, signOut } = useAuth();

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
    { id: 'analyze' as const, label: 'AI Analysis', icon: Brain },
    { id: 'learn' as const, label: 'Dictionary', icon: BookOpen },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* User Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  Welcome back, {profile?.first_name || profile?.username || 'User'}!
                </p>
                <p className="text-sm text-gray-600">Ready to practice pronunciation?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/profile'}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

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
                setWordHistory={setWordHistory}
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
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected routes */}
            <Route path="/profile" element={<ProfileSection />} />
            <Route path="/pronunciation" element={<PronunciationApp />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/pronunciation" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;