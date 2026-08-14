import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, Image, StyleSheet, Dimensions, PanResponder } from "react-native";
import YoutubePlayer, { getYoutubeMeta } from "react-native-youtube-iframe";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue, 
  interpolate,
  Extrapolation,
  FadeInUp,
  FadeOutDown
} from "react-native-reanimated";
import { Play, Pause, SkipForward, SkipBack, Music2, ChevronDown } from "lucide-react-native";
import { usePathname } from "expo-router";
import { useMusicStore } from "../store/useMusicStore";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";

const { width, height } = Dimensions.get("window");

export default function GlobalPlayer() {
  const { 
    isPlaying, 
    setIsPlaying, 
    mode, 
    currentSongIndex, 
    setCurrentSongIndex,
    playlists,
    setCurrentVideoData,
    currentVideoData
  } = useMusicStore();
  
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Expanded animation values
  const expandAnim = useSharedValue(0); // 0 = collapsed, 1 = expanded

  useEffect(() => {
    expandAnim.value = withSpring(isExpanded ? 1 : 0, { damping: 20, stiffness: 100 });
  }, [isExpanded]);

  const currentPlaylistTracks = playlists.find(p => p.id === mode || p.playlistId === mode)?.tracks || [];
  const currentTrack = currentPlaylistTracks[currentSongIndex];
  
  // A helper to extract youtube ID robustly
  const getExtractId = (str: string) => {
    if (!str) return "";
    if (str.length === 11) return str;
    const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match && match[1] ? match[1] : str;
  };
  
  const videoId = getExtractId(currentTrack?.videoId || "jfKfPfyJRdk");

  // Fetch metadata when video changes
  useEffect(() => {
    if (videoId) {
      getYoutubeMeta(videoId).then(meta => {
        setCurrentVideoData({
          title: currentTrack?.title || meta.title,
          author: currentTrack?.artist || meta.author_name,
          videoId: videoId
        });
      }).catch(() => {
        // Fallback
        setCurrentVideoData({
          title: currentTrack?.title || "Unknown Track",
          author: currentTrack?.artist || "Unknown Artist",
          videoId: videoId
        });
      });
    }
  }, [videoId, currentTrack]);

  const startProgressInterval = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(async () => {
      if (playerRef.current) {
        const time = await playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // Duration is usually set once, but we'll fetch it occasionally
        const dur = await playerRef.current.getDuration();
        if (dur) setDuration(dur);
      }
    }, 1000);
  }, []);

  const stopProgressInterval = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
  }, []);

  const handleNext = useCallback(() => {
    if (currentPlaylistTracks.length > 0) {
      setCurrentSongIndex((currentSongIndex + 1) % currentPlaylistTracks.length);
      setIsPlaying(true);
    }
  }, [currentPlaylistTracks, currentSongIndex, setCurrentSongIndex, setIsPlaying]);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      handleNext();
    }
    if (state === "playing") {
      setIsPlaying(true);
      startProgressInterval();
    }
    if (state === "paused") {
      setIsPlaying(false);
      stopProgressInterval();
    }
  }, [handleNext, setIsPlaying, startProgressInterval, stopProgressInterval]);

  const handlePrev = useCallback(() => {
    if (currentPlaylistTracks.length > 0) {
      setCurrentSongIndex((currentSongIndex - 1 + currentPlaylistTracks.length) % currentPlaylistTracks.length);
      setIsPlaying(true);
    }
  }, [currentPlaylistTracks, currentSongIndex, setCurrentSongIndex, setIsPlaying]);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // --- Animations --- //

  // Floating Button Style (fades out when expanded)
  const floatingBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(expandAnim.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(expandAnim.value, [0, 0.5], [1, 0.5], Extrapolation.CLAMP) },
        { translateY: interpolate(expandAnim.value, [0, 1], [0, 50]) }
      ],
      pointerEvents: isExpanded ? 'none' : 'auto'
    };
  });

  // Expanded Sheet Style (slides up from bottom)
  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(expandAnim.value, [0, 1], [height, 0]) }
      ],
      opacity: interpolate(expandAnim.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  // Don't show player if there's no mode (no playlist selected) or if we are on an admin screen
  if (!mode || pathname?.startsWith("/admin")) {
    return null;
  }

  const [barWidth, setBarWidth] = useState(1);

  return (
    <>
      {/* Hidden Youtube Player */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: 50, height: 50, zIndex: -100, opacity: 1, transform: [{ scale: 0.01 }] }}>
        <YoutubePlayer
          ref={playerRef}
          height={50}
          width={50}
          videoId={videoId}
          play={isPlaying}
          onChangeState={onStateChange}
          initialPlayerParams={{
            controls: false,
            modestbranding: true,
            preventFullScreen: true,
          }}
        />
      </View>

      {/* Floating Action Button (Collapsed state) */}
      <Animated.View 
        style={[styles.floatingContainer, floatingBtnStyle]}
      >
        <Pressable 
          onPress={() => setIsExpanded(true)}
          className="w-16 h-16 bg-[#160E0A] rounded-full items-center justify-center border border-[#D4AF37] shadow-xl overflow-hidden"
        >
          <View className="absolute inset-0 bg-[#D4AF37]/10" />
          {isPlaying ? (
            <View className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#D4AF37] opacity-80" style={{ transform: [{ rotate: '45deg' }] }} />
          ) : (
            <Music2 size={24} color="#D4AF37" />
          )}
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <Music2 size={24} color="#D4AF37" opacity={isPlaying ? 1 : 0} />
          </View>
        </Pressable>
      </Animated.View>

      {/* Expanded Bottom Sheet */}
      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        <View className="w-full bg-[#160E0A] border border-[#3C2A1E] rounded-t-[40px] px-6 pt-4 pb-12 shadow-2xl relative overflow-hidden">
          
          <View className="absolute inset-0 bg-[#3c2a1e] opacity-10" />

          {/* Close Handle */}
          <Pressable 
            onPress={() => setIsExpanded(false)}
            className="w-full items-center py-4"
          >
            <View className="w-16 h-1.5 bg-white/20 rounded-full" />
            <ChevronDown color="rgba(255,255,255,0.4)" size={24} className="mt-2" />
          </Pressable>

          <View className="flex-row items-center gap-5 mt-2">
            {/* Cover */}
            <View className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden shadow-lg bg-black">
              {currentVideoData?.videoId ? (
                <>
                  <Image 
                    source={{ uri: `https://img.youtube.com/vi/${currentVideoData.videoId}/mqdefault.jpg` }}
                    style={{ width: '100%', height: '100%', transform: [{ scale: 1.5 }] }}
                  />
                  <View className="absolute top-1/2 left-1/2 -ml-2 -mt-2 w-4 h-4 bg-[#140C07] rounded-full border border-black/50" />
                </>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Music2 color="rgba(255,255,255,0.3)" size={24} />
                </View>
              )}
            </View>

            {/* Track Info */}
            <View className="flex-1 pr-4">
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F4EBD0] text-2xl tracking-wide" numberOfLines={1}>
                {currentVideoData?.title || "Loading..."}
              </Text>
              <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#8C6D23] text-sm uppercase tracking-widest mt-1" numberOfLines={1}>
                {currentVideoData?.author || ""}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="flex-row items-center gap-4 mt-8 w-full">
            <Text className="text-white/40 text-xs font-mono">{formatTime(currentTime)}</Text>
            <Pressable 
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              onPressIn={(e) => {
                if (duration > 0 && playerRef.current && barWidth > 0) {
                  const touchX = e.nativeEvent.locationX;
                  const newPercent = Math.max(0, Math.min(1, touchX / barWidth));
                  const newTime = newPercent * duration;
                  setCurrentTime(newTime);
                  playerRef.current.seekTo(newTime, true);
                }
              }}
              className="flex-1 h-8 justify-center relative"
            >
              <View pointerEvents="none" className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <View 
                  style={{ width: `${progressPercent}%` }}
                  className="absolute left-0 top-0 bottom-0 bg-[#D4AF37]" 
                />
              </View>
              <View className="absolute inset-0" />
            </Pressable>
            <Text className="text-white/40 text-xs font-mono">{formatTime(duration)}</Text>
          </View>

          {/* Controls */}
          <View className="flex-row items-center justify-center gap-10 mt-10 mb-4">
            <Pressable onPress={handlePrev} className="active:opacity-50">
              <SkipBack color="rgba(255,255,255,0.6)" size={32} />
            </Pressable>
            
            <Pressable 
              onPress={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 bg-[#D4AF37] rounded-full items-center justify-center shadow-lg active:scale-95"
            >
              {isPlaying ? (
                <Pause color="#2A1B14" size={36} fill="#2A1B14" />
              ) : (
                <Play color="#2A1B14" size={36} fill="#2A1B14" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            <Pressable onPress={handleNext} className="active:opacity-50">
              <SkipForward color="rgba(255,255,255,0.6)" size={32} />
            </Pressable>
          </View>
          
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 100,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 90,
  }
});
