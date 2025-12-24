import React, { useState } from 'react';
import { Song, GameState } from './types';
import { PRESET_SONGS } from './constants';
import SongCard from './components/SongCard';
import GameScreen from './components/GameScreen';
import { Music, Wand2, RefreshCw, Trophy, AlertTriangle, Youtube, Search } from 'lucide-react';
import { generateSongLevel, analyzeYoutubeSong } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState['status']>('MENU');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [score, setScore] = useState(0);
  const [songs, setSongs] = useState<Song[]>(PRESET_SONGS);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'AI' | 'YOUTUBE'>('YOUTUBE');
  
  // Inputs
  const [aiPrompt, setAiPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [ytName, setYtName] = useState('');

  const startGame = (song: Song) => {
    setCurrentSong(song);
    setScore(0);
    setGameState('PLAYING');
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('GAMEOVER');
  };

  const handleExit = () => {
    setGameState('MENU');
    setCurrentSong(null);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const newSong = await generateSongLevel(aiPrompt);
    setSongs([newSong, ...songs]);
    setIsGenerating(false);
    setAiPrompt('');
  };

  const handleYoutubeImport = async () => {
    if (!ytUrl.trim() || !ytName.trim()) return;
    
    // Extract Video ID
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = ytUrl.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;

    if (!videoId) {
        alert("קישור לא תקין ליוטיוב");
        return;
    }

    setIsGenerating(true);
    const newSong = await analyzeYoutubeSong(ytName, videoId);
    setSongs([newSong, ...songs]);
    setIsGenerating(false);
    setYtUrl('');
    setYtName('');
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* MENU SCREEN */}
      {gameState === 'MENU' && (
        <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
          <header className="flex flex-col items-center mb-10 text-center">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-2 drop-shadow-lg">
              ChromaRhythm
            </h1>
            <p className="text-slate-300 text-lg">בחר שיר, הקשב לקצב, והתאם את הצבעים</p>
          </header>

          {/* Generator Section */}
          <div className="mb-12 glass p-1 rounded-2xl border border-white/10 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setMode('YOUTUBE')}
                    className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'YOUTUBE' ? 'bg-white/10 text-red-400' : 'hover:bg-white/5 text-slate-400'}`}
                >
                    <Youtube size={20} /> ייבא מיוטיוב
                </button>
                <button 
                    onClick={() => setMode('AI')}
                    className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'AI' ? 'bg-white/10 text-purple-400' : 'hover:bg-white/5 text-slate-400'}`}
                >
                    <Wand2 size={20} /> צור עם AI
                </button>
            </div>

            <div className="p-5">
                {mode === 'AI' ? (
                    <div className="flex flex-col gap-3">
                         <p className="text-sm text-slate-400 mb-1">תאר אווירה וניצור לך שיר דמיוני:</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="לדוגמה: טכנו מהיר ועצבני"
                                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-500 text-right"
                            />
                            <button 
                                onClick={handleAiGenerate}
                                disabled={isGenerating || !aiPrompt}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 min-w-[120px]"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" /> : 'צור'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-slate-400 mb-1">הדבק קישור, כתוב את השם, וה-AI ינתח את הקצב:</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                value={ytUrl}
                                onChange={(e) => setYtUrl(e.target.value)}
                                placeholder="קישור ליוטיוב..."
                                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-500 text-left"
                                dir="ltr"
                            />
                            <input 
                                type="text" 
                                value={ytName}
                                onChange={(e) => setYtName(e.target.value)}
                                placeholder="שם השיר..."
                                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-500 text-right"
                            />
                            <button 
                                onClick={handleYoutubeImport}
                                disabled={isGenerating || !ytUrl || !ytName}
                                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2 min-w-[120px]"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" /> : 'ייבא'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {songs.map(song => (
              <SongCard key={song.id} song={song} onSelect={startGame} />
            ))}
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {gameState === 'PLAYING' && currentSong && (
        <GameScreen 
          song={currentSong} 
          onGameOver={handleGameOver} 
          onExit={handleExit}
        />
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass max-w-md w-full p-8 rounded-3xl text-center border-2 border-red-500/50 shadow-2xl shadow-red-900/50">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-2">נפסלת!</h2>
                <p className="text-slate-400 mb-8">לחצת על הצבע הלא נכון</p>

                <div className="bg-black/40 rounded-xl p-4 mb-8 flex items-center justify-center gap-4">
                    <Trophy className="text-yellow-400" />
                    <div className="text-left">
                        <span className="block text-xs text-slate-400 uppercase">ניקוד סופי</span>
                        <span className="block text-3xl font-mono font-bold">{score}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleExit}
                        className="flex-1 py-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 transition-colors text-white"
                    >
                        תפריט ראשי
                    </button>
                    <button 
                        onClick={() => startGame(currentSong!)}
                        className="flex-1 py-4 rounded-xl font-bold bg-green-600 hover:bg-green-500 transition-colors text-white shadow-lg shadow-green-900/20"
                    >
                        נסה שוב
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;