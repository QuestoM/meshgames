import { GoogleGenAI, Type } from "@google/genai";
import { Song, GameColor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-3-flash-preview";

export async function generateSongLevel(prompt: string): Promise<Song> {
  const systemInstruction = `
    You are a game level designer for a rhythm game. 
    Your task is to generate a song profile based on a user's abstract description (mood, genre, etc.).
    The song is fictional, but the parameters must be playable.
    Available colors: YELLOW, GREEN, RED, BLUE, PURPLE.
    Difficulty mapping: 
    - BPM < 110: EASY
    - BPM 110-140: MEDIUM
    - BPM > 140: HARD
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            description: { type: Type.STRING },
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-5 colors suitable for the vibe"
            },
          },
          required: ["title", "artist", "bpm", "colors"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return mapResponseToSong(data, `ai-${Date.now()}`, `https://picsum.photos/seed/${data.title.replace(/\s/g, '')}/400/400`);

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return createFallbackSong();
  }
}

export async function analyzeYoutubeSong(songName: string, youtubeId: string): Promise<Song> {
  const systemInstruction = `
    You are a music expert and rhythm game designer.
    I will give you a song name. You need to identify the artist, the BPM (Beats Per Minute), and the mood colors.
    If you don't know the exact song, estimate the BPM based on the genre implied by the title.
    Available colors: YELLOW, GREEN, RED, BLUE, PURPLE.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze the song: "${songName}".`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artist: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 colors matching the album art or mood"
            },
          },
          required: ["artist", "bpm", "colors"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Construct thumbnail URL from ID
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    
    return mapResponseToSong(
      { ...data, title: songName }, 
      `yt-${youtubeId}`, 
      thumbnail,
      youtubeId
    );

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return createFallbackSong();
  }
}

// Helper to clean data and create Song object
function mapResponseToSong(data: any, id: string, image: string, youtubeId?: string): Song {
    const validColors: GameColor[] = [];
    if (Array.isArray(data.colors)) {
      data.colors.forEach((c: string) => {
        const upper = c.toUpperCase();
        if (upper in GameColor) {
          validColors.push(upper as GameColor);
        }
      });
    }

    if (validColors.length < 2) {
      validColors.push(GameColor.RED, GameColor.BLUE);
    }

    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
    const bpm = data.bpm || 120;
    if (bpm < 110) difficulty = 'EASY';
    else if (bpm > 140) difficulty = 'HARD';

    return {
      id,
      title: data.title || "Unknown Track",
      artist: data.artist || "Unknown Artist",
      bpm,
      durationSec: 180, // Default duration, will be controlled by YT player mainly
      image,
      colors: validColors,
      difficulty,
      isAiGenerated: true,
      youtubeId
    };
}

function createFallbackSong(): Song {
    return {
      id: 'fallback',
      title: 'Emergency Protocol',
      artist: 'System Backup',
      bpm: 125,
      durationSec: 120,
      image: 'https://picsum.photos/seed/error/400/400',
      colors: [GameColor.RED, GameColor.YELLOW],
      difficulty: 'MEDIUM',
      isAiGenerated: true
    };
}