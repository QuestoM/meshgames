import { GameColor, Song } from './types';

export const PRESET_SONGS: Song[] = [
  {
    id: '1',
    title: 'אינטלקטוערס',
    artist: 'אודיה',
    bpm: 128,
    durationSec: 180,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.PURPLE, GameColor.BLUE, GameColor.RED],
    difficulty: 'MEDIUM',
    youtubeId: 'CwJ7kZq1sS0'
  },
  {
    id: '2',
    title: 'מה איתך אבא',
    artist: 'אודיה',
    bpm: 110,
    durationSec: 205,
    image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.YELLOW, GameColor.RED, GameColor.PURPLE],
    difficulty: 'EASY',
    youtubeId: 'J5e8O5M4i5g'
  },
  {
    id: '3',
    title: 'בלילות (עם עופר ניסים)',
    artist: 'אודיה',
    bpm: 138,
    durationSec: 240,
    image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97d890?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.BLUE, GameColor.PURPLE, GameColor.RED],
    difficulty: 'HARD',
    youtubeId: 's3M_vjWJzUg'
  },
  {
    id: '4',
    title: 'אם הייתי צריכה',
    artist: 'אודיה',
    bpm: 118,
    durationSec: 195,
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.RED, GameColor.YELLOW, GameColor.BLUE],
    difficulty: 'MEDIUM',
    youtubeId: '7y0_X1X2X3X' // Placeholder, will fallback or load if valid
  },
  {
    id: '5',
    title: 'האמת',
    artist: 'אודיה',
    bpm: 124,
    durationSec: 188,
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.GREEN, GameColor.BLUE, GameColor.PURPLE],
    difficulty: 'MEDIUM',
    youtubeId: 'CwJ7kZq1sS0' // Using Intellectuars as fallback for demo
  },
  {
    id: '6',
    title: 'הרב שלי אמר',
    artist: 'אודיה',
    bpm: 105,
    durationSec: 210,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    colors: [GameColor.YELLOW, GameColor.RED, GameColor.GREEN],
    difficulty: 'EASY',
    youtubeId: 'J5e8O5M4i5g' // Using Ma Itach Abba as fallback for demo
  }
];

export const BALL_SPAWN_RATE_MS = 800;
export const BG_CHANGE_INTERVAL_BEATS = 8; // Change bg color every 8 beats
