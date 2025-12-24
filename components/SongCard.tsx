import React from 'react';
import { Song, COLOR_MAP } from '../types';
import { Play, Activity, Cpu } from 'lucide-react';

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(song)}
      className="glass group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white/10 border-transparent hover:border-white/20"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={song.image} alt={song.title} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-end min-h-[160px]">
        {song.isAiGenerated && (
          <div className="absolute top-0 right-0 bg-purple-600/80 backdrop-blur px-2 py-1 rounded-bl-lg text-xs font-bold flex items-center gap-1">
             <Cpu size={12} /> AI Gen
          </div>
        )}
        
        <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{song.title}</h3>
        <p className="text-slate-300 text-sm mb-3">{song.artist}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded font-mono font-bold bg-black/40 ${
              song.difficulty === 'HARD' ? 'text-red-400' : 
              song.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {song.difficulty}
            </span>
            <span className="text-xs px-2 py-1 rounded font-mono bg-black/40 text-slate-300 flex items-center gap-1">
              <Activity size={12} /> {song.bpm} BPM
            </span>
          </div>
          
          <button className="bg-white text-slate-900 rounded-full p-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Play fill="currentColor" size={20} />
          </button>
        </div>

        {/* Color Palette Preview */}
        <div className="flex gap-1 mt-3">
            {song.colors.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_MAP[c] }} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
