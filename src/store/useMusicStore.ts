import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Playlist {
  id: string;
  playlistId: string;
  backgroundMedia: string;
}

interface MusicStore {
  mode: string | null;
  setMode: (mode: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  playerRef: any;
  setPlayerRef: (ref: any) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  currentVideoData: any;
  setCurrentVideoData: (data: any) => void;
  savedTime: number;
  setSavedTime: (time: number) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  token: string | null;
  user: any | null;
  setAuth: (token: string | null, user: any | null) => void;
  logout: () => void;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
      
      isPlaying: false,
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      playerRef: null,
      setPlayerRef: (ref) => set({ playerRef: ref }),
      
      currentSongIndex: 0,
      setCurrentSongIndex: (index) => set({ currentSongIndex: index }),

      currentVideoData: null,
      setCurrentVideoData: (data) => set({ currentVideoData: data }),

      savedTime: 0,
      setSavedTime: (time) => set({ savedTime: time }),

      playlists: [],
      setPlaylists: (playlists) => set({ playlists }),

      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "music-player-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        currentSongIndex: state.currentSongIndex,
        currentVideoData: state.currentVideoData,
        savedTime: state.savedTime,
      }),
    }
  )
);
