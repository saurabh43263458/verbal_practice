import React, { useState, useEffect } from 'react';
import { Volume2, Globe, Zap } from 'lucide-react';

interface TextToSpeechProps {
  currentWord: string;
  setCurrentWord: (word: string) => void;
  addToHistory: (wordData: any) => void;
}

interface Voice {
  name: string;
  lang: string;
  localService: boolean;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ currentWord, setCurrentWord, addToHistory }) => {
  const [text, setText] = useState(currentWord || '');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Set default voice (prefer English)
      const defaultVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en-US') || voice.lang.startsWith('en')
      );
      if (defaultVoice && !selectedVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  useEffect(() => {
    setText(currentWord);
  }, [currentWord]);

  const speak = () => {
    if (!text.trim()) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      // Add to history
      addToHistory({
        word: text,
        timestamp: Date.now()
      });
    };
    utterance.onerror = () => setSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
  };

  const getPhoneticApproximation = (word: string): string => {
    // Simple phonetic approximation - in a real app you'd use a proper phonetic API
    const phoneticMap: Record<string, string> = {
      'hello': '/həˈloʊ/',
      'world': '/wɜːrld/',
      'pronunciation': '/prəˌnʌnsiˈeɪʃən/',
      'practice': '/ˈpræktɪs/',
      'language': '/ˈlæŋɡwɪdʒ/',
      'speech': '/spiːtʃ/',
      'voice': '/vɔɪs/',
      'sound': '/saʊnd/',
      'learn': '/lɜːrn/',
      'improve': '/ɪmˈpruːv/'
    };
    
    return phoneticMap[word.toLowerCase()] || `/${word}/`;
  };

  const popularWords = [
    'pronunciation', 'vocabulary', 'language', 'practice', 'improve',
    'communication', 'articulation', 'fluency', 'accent', 'dialect'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Text to Speech</h2>
        <p className="text-gray-600">Enter text and hear it pronounced with different voices and accents</p>
      </div>

      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter text to pronounce
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a word or sentence..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
          />
        </div>

        {/* Voice Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Voice & Language
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speed: {rate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pitch: {pitch}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={speak}
            disabled={!text.trim() || speaking}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            {speaking ? 'Speaking...' : 'Speak'}
          </button>
          
          {speaking && (
            <button
              onClick={stop}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          )}
        </div>

        {/* Phonetic Display */}
        {text && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Phonetic Transcription (Approximate)</h3>
            <p className="text-lg font-mono text-blue-700">
              {getPhoneticApproximation(text)}
            </p>
          </div>
        )}

        {/* Quick Words */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3">
            <Zap className="w-4 h-4 inline mr-1" />
            Try these words
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularWords.map((word) => (
              <button
                key={word}
                onClick={() => setText(word)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;