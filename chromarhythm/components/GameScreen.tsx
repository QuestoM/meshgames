import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Song, GameState, Ball, GameColor, COLOR_MAP, COLOR_LABELS_HE } from '../types';
import { audioService } from '../services/audioService';
import { X, Pause, Play, Heart, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface GameScreenProps {
  song: Song;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const MAX_LIVES = 5;
const POINTS_PER_LIFE = 500;

const GameScreen: React.FC<GameScreenProps> = ({ song, onGameOver, onExit }) => {
  // Game Logic Refs (Mutable, no re-renders)
  const ballsRef = useRef<Ball[]>([]);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3); 
  const nextLifeScoreRef = useRef(POINTS_PER_LIFE);
  const nextSpawnTimeRef = useRef(0);
  const beatTimerRef = useRef(0);
  const beatCountRef = useRef(0);
  const currentColorIndexRef = useRef(0);
  const playerRef = useRef<any>(null);
  
  // React State for UI
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentColor, setCurrentColor] = useState<GameColor>(song.colors[0]);
  const [isPlaying, setIsPlaying] = useState(false); // Start false, wait for ready
  const [isReadyToStart, setIsReadyToStart] = useState(false); // For "Click to Start" overlay
  const [balls, setBalls] = useState<Ball[]>([]); 
  const [flash, setFlash] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(!!song.youtubeId);

  // Constants calculated from song
  const BEAT_INTERVAL_MS = (60000 / song.bpm); 
  const COLOR_SWITCH_INTERVAL_BEATS = 8; 

  // --- YouTube Initialization ---
  useEffect(() => {
    if (!song.youtubeId) {
      setIsReadyToStart(true);
      return;
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: song.youtubeId,
          playerVars: {
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
          },
          events: {
            'onReady': () => {
              setLoadingVideo(false);
              setIsReadyToStart(true);
            },
            'onStateChange': (event: any) => {
               // 0 = ended, 1 = playing
               if (event.data === 0) {
                 endGame();
               }
            }
          },
        });
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
       if (playerRef.current) {
           playerRef.current.destroy();
       }
    };
  }, [song.youtubeId]);


  const startGame = () => {
    setIsPlaying(true);
    setIsReadyToStart(false);

    // Audio / Video Start
    if (song.youtubeId && playerRef.current) {
        playerRef.current.playVideo();
    } else {
        audioService.startMusic(song.bpm);
    }

    // Animation Loop Start
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };


  const spawnBall = useCallback(() => {
    const id = Math.random().toString(36).substr(2, 9);
    const size = Math.random() * 40 + 40; 
    const x = Math.random() * (window.innerWidth - size);
    const y = window.innerHeight + size; 
    
    const color = song.colors[Math.floor(Math.random() * song.colors.length)];
    const speed = (song.bpm / 60) * (Math.random() * 2 + 3); 

    const newBall: Ball = {
      id,
      x,
      y,
      color,
      dx: (Math.random() - 0.5) * 2, 
      dy: -speed, 
      size
    };
    ballsRef.current.push(newBall);
  }, [song]);

  const handleBallClick = (ballId: string, ballColor: GameColor) => {
    if (!isPlaying) return;

    if (ballColor === currentColor) {
      audioService.playClickSound(true); // Keep SFX
      scoreRef.current += 10;
      setScore(scoreRef.current);
      
      if (scoreRef.current >= nextLifeScoreRef.current) {
        if (livesRef.current < MAX_LIVES) {
            livesRef.current += 1;
            setLives(livesRef.current);
        }
        nextLifeScoreRef.current += POINTS_PER_LIFE;
      }

      ballsRef.current = ballsRef.current.filter(b => b.id !== ballId);
      setBalls([...ballsRef.current]);
    } else {
      audioService.playClickSound(false);
      livesRef.current -= 1;
      setLives(livesRef.current);
      
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 150);

      if (livesRef.current <= 0) {
        endGame();
      }
    }
  };

  const endGame = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        playerRef.current.stopVideo();
    } else {
        audioService.stopMusic();
    }
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const gameLoop = useCallback((time: number) => {
    if (!isPlaying) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // 1. Manage Beat
    beatTimerRef.current += deltaTime;
    if (beatTimerRef.current >= BEAT_INTERVAL_MS) {
        beatTimerRef.current -= BEAT_INTERVAL_MS;
        beatCountRef.current += 1;
        
        if (beatCountRef.current % COLOR_SWITCH_INTERVAL_BEATS === 0) {
            currentColorIndexRef.current = (currentColorIndexRef.current + 1) % song.colors.length;
            const newColor = song.colors[currentColorIndexRef.current];
            setCurrentColor(newColor);
            setFlash(true);
            setTimeout(() => setFlash(false), 200); 
        }
    }

    // 2. Manage Spawning
    if (time > nextSpawnTimeRef.current) {
        spawnBall();
        const spawnRate = (60000 / song.bpm) * 0.8; 
        nextSpawnTimeRef.current = time + spawnRate;
    }

    // 3. Update Physics
    ballsRef.current.forEach(ball => {
        ball.y += ball.dy;
        ball.x += ball.dx;

        if (ball.x <= 0 || ball.x + ball.size >= window.innerWidth) {
            ball.dx *= -1;
        }
    });

    const activeBalls = ballsRef.current.filter(b => b.y > -100);
    ballsRef.current = activeBalls;
    setBalls([...ballsRef.current]);

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, song, spawnBall, BEAT_INTERVAL_MS]);


  // Cleanup
  useEffect(() => {
    return () => {
      audioService.stopMusic();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Background style
  const bgStyle = {
    backgroundColor: COLOR_MAP[currentColor],
    transition: 'background-color 0.4s ease-in-out'
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden touch-none select-none"
      style={bgStyle}
    >
      {/* YouTube Background Layer */}
      {song.youtubeId && (
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0 mix-blend-multiply grayscale">
             <div id="youtube-player" className="w-full h-full pointer-events-none" />
             {/* Overlay to prevent interaction with iframe */}
             <div className="absolute inset-0 z-10" />
          </div>
      )}

      {/* Overlays */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 z-0 ${flash ? 'opacity-30' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-red-600 pointer-events-none transition-opacity duration-150 z-0 ${damageFlash ? 'opacity-50' : 'opacity-0'}`} />

      {/* START OVERLAY */}
      {!isPlaying && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
             {loadingVideo ? (
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-white w-12 h-12" />
                    <span className="text-white text-xl">טוען שיר...</span>
                 </div>
             ) : (
                <button 
                  onClick={startGame}
                  className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-full flex items-center gap-4 transition-all hover:scale-105"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <Play className="fill-white text-white w-12 h-12 relative z-10" />
                    <span className="text-4xl font-black text-white relative z-10 tracking-widest">התחל</span>
                </button>
             )}
          </div>
      )}

      {/* UI Layer */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="glass px-4 py-2 rounded-xl flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-white/80 uppercase tracking-widest">ניקוד</span>
                <span className="text-3xl font-bold font-mono">{score}</span>
            </div>
            
            <div className="flex gap-1 justify-center glass p-2 rounded-full">
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                    <Heart 
                        key={i} 
                        size={20} 
                        className={`transition-all duration-300 ${i < lives ? 'fill-red-500 text-red-500 scale-100' : 'text-white/20 scale-75'}`} 
                    />
                ))}
            </div>
        </div>

        <div className="flex flex-col items-center glass px-6 py-2 rounded-xl border-2 border-white/40 animate-pulse-slow pointer-events-auto">
            <span className="text-xs text-white/80 mb-1">לחץ רק על</span>
            <span className="text-2xl font-black uppercase tracking-wider">{COLOR_LABELS_HE[currentColor]}</span>
        </div>

        <button onClick={() => {
            if (playerRef.current) playerRef.current.pauseVideo();
            audioService.stopMusic();
            onExit();
        }} className="glass p-3 rounded-full hover:bg-white/20 transition-colors pointer-events-auto">
            <X size={24} />
        </button>
      </div>

      {/* Game Layer (Balls) */}
      {balls.map(ball => {
        const HIT_PADDING = 30; 
        return (
          <div
            key={ball.id}
            onPointerDown={(e) => {
               e.stopPropagation(); 
               handleBallClick(ball.id, ball.color);
            }}
            className="absolute flex items-center justify-center cursor-pointer touch-none z-10"
            style={{
              left: ball.x - HIT_PADDING,
              top: ball.y - HIT_PADDING,
              width: ball.size + (HIT_PADDING * 2),
              height: ball.size + (HIT_PADDING * 2),
            }}
          >
              <div 
                className="rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center ball-shadow border-2 border-white/20 pointer-events-none"
                style={{
                  width: ball.size,
                  height: ball.size,
                  backgroundColor: COLOR_MAP[ball.color],
                }}
              >
                  <div className="w-1/3 h-1/3 bg-white/30 rounded-full blur-sm" />
              </div>
          </div>
        );
      })}

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay z-0" />
    </div>
  );
};

export default GameScreen;