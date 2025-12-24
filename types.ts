export enum GameColor {
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  RED = 'RED',
  BLUE = 'BLUE',
  PURPLE = 'PURPLE'
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  durationSec: number;
  image: string;
  colors: GameColor[]; // The palette used in this song
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isAiGenerated?: boolean;
  youtubeId?: string; // Optional YouTube Video ID
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  color: GameColor;
  dx: number;
  dy: number;
  size: number;
}

export interface GameState {
  status: 'MENU' | 'PLAYING' | 'GAMEOVER' | 'GENERATING';
  score: number;
  currentSong: Song | null;
  backgroundColor: GameColor;
  highScore: number;
}

export const COLOR_MAP: Record<GameColor, string> = {
  [GameColor.YELLOW]: '#EAB308', // yellow-500
  [GameColor.GREEN]: '#22C55E',  // green-500
  [GameColor.RED]: '#EF4444',    // red-500
  [GameColor.BLUE]: '#3B82F6',   // blue-500
  [GameColor.PURPLE]: '#A855F7', // purple-500
};

export const COLOR_LABELS_HE: Record<GameColor, string> = {
  [GameColor.YELLOW]: 'צהוב',
  [GameColor.GREEN]: 'ירוק',
  [GameColor.RED]: 'אדום',
  [GameColor.BLUE]: 'כחול',
  [GameColor.PURPLE]: 'סגול',
};