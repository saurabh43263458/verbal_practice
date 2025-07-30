import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Volume2, Lightbulb, MessageSquare } from 'lucide-react';

interface DictionaryProps {
  currentWord: string;
  setCurrentWord: (word: string) => void;
  addToHistory: (wordData: any) => void;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface WordData {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Meaning[];
}

const Dictionary: React.FC<DictionaryProps> = ({ currentWord, setCurrentWord, addToHistory }) => {
  const [searchWord, setSearchWord] = useState(currentWord || '');
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);

  useEffect(() => {
    if (currentWord && currentWord !== searchWord) {
      setSearchWord(currentWord);
      searchDictionary(currentWord);
    }
  }, [currentWord]);

  const searchDictionary = async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    setWordData(null);
    setSynonyms([]);
    setAntonyms([]);

    try {
      // Search main dictionary
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim()}`);
      
      if (!response.ok) {
        throw new Error('Word not found');
      }

      const data = await response.json();
      const firstEntry = data[0];
      setWordData(firstEntry);

      // Get synonyms and antonyms from Datamuse API
      try {
        const [synonymsResponse, antonymsResponse] = await Promise.all([
          fetch(`https://api.datamuse.com/words?rel_syn=${word.trim()}&max=10`),
          fetch(`https://api.datamuse.com/words?rel_ant=${word.trim()}&max=10`)
        ]);

        if (synonymsResponse.ok) {
          const synonymsData = await synonymsResponse.json();
          setSynonyms(synonymsData.map((item: any) => item.word));
        }

        if (antonymsResponse.ok) {
          const antonymsData = await antonymsResponse.json();
          setAntonyms(antonymsData.map((item: any) => item.word));
        }
      } catch (relatedWordsError) {
        console.log('Related words API unavailable');
      }

      // Add to history
      addToHistory({
        word: firstEntry.word,
        phonetic: firstEntry.phonetic,
        meanings: firstEntry.meanings,
        timestamp: Date.now()
      });

    } catch (err) {
      setError('Word not found. Please check spelling and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchWord.trim()) {
      searchDictionary(searchWord);
    }
  };

  const playPronunciation = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    } else if (wordData) {
      // Fallback to speech synthesis
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      speechSynthesis.speak(utterance);
    }
  };

  const searchRelatedWord = (word: string) => {
    setSearchWord(word);
    searchDictionary(word);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dictionary & Vocabulary</h2>
        <p className="text-gray-600">Look up word meanings, pronunciations, synonyms, and antonyms</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="Enter a word to look up..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Word Data */}
      {wordData && (
        <div className="space-y-6">
          {/* Word Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{wordData.word}</h1>
                {wordData.phonetic && (
                  <p className="text-lg text-blue-600 font-mono">{wordData.phonetic}</p>
                )}
              </div>
              
              {/* Pronunciation Buttons */}
              <div className="flex gap-2">
                {wordData.phonetics?.map((phonetic, index) => (
                  phonetic.audio && (
                    <button
                      key={index}
                      onClick={() => playPronunciation(phonetic.audio)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Play pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                      Play
                    </button>
                  )
                ))}
                
                {(!wordData.phonetics?.some(p => p.audio)) && (
                  <button
                    onClick={() => playPronunciation()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Play pronunciation (synthetic)"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Meanings */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Definitions
            </h2>
            
            {wordData.meanings.map((meaning, meaningIndex) => (
              <div key={meaningIndex} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-blue-600 mb-3 capitalize">
                  {meaning.partOfSpeech}
                </h3>
                
                <div className="space-y-3">
                  {meaning.definitions.map((def, defIndex) => (
                    <div key={defIndex} className="border-l-4 border-blue-100 pl-4">
                      <p className="text-gray-800 mb-2">{def.definition}</p>
                      
                      {def.example && (
                        <div className="bg-gray-50 p-3 rounded italic text-gray-600 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span>"{def.example}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Synonyms and Antonyms */}
          <div className="grid md:grid-cols-2 gap-6">
            {synonyms.length > 0 && (
              <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Synonyms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {synonyms.map((synonym, index) => (
                    <button
                      key={index}
                      onClick={() => searchRelatedWord(synonym)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors text-sm"
                    >
                      {synonym}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {antonyms.length > 0 && (
              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Antonyms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {antonyms.map((antonym, index) => (
                    <button
                      key={index}
                      onClick={() => searchRelatedWord(antonym)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm"
                    >
                      {antonym}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popular Words to Try */}
      {!wordData && !loading && (
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">Popular words to explore:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'serendipity', 'ephemeral', 'quintessential', 'ubiquitous', 'anomaly',
              'eloquent', 'indigenous', 'meticulous', 'paradigm', 'resilient'
            ].map((word) => (
              <button
                key={word}
                onClick={() => searchRelatedWord(word)}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionary;