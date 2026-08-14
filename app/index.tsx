import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ImageBackground, StyleSheet } from "react-native";
import { useMusicStore } from "../src/store/useMusicStore";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Disc3, Trophy, Settings } from "lucide-react-native";
import LiveStatus from "../src/components/LiveStatus";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";

const backgrounds: Record<string, string> = {
  "cinematic": "https://mast-magan.vercel.app/Man_listening_to_music_outdoors_202608131857.mp4",
  "deluxe-salon": "https://images.unsplash.com/photo-1521590832167-7bfc17484d20?q=80&w=2070&auto=format&fit=crop",
  "night-bus": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop"
};

export default function Home() {
  const { mode, playlists, setMode, isPlaying, setIsPlaying } = useMusicStore();
  const [fontsLoaded] = useFonts({
    YatraOne_400Regular,
    Kalam_400Regular,
    Kalam_700Bold
  });

  useEffect(() => {
    // Auto-play when app opens
    if (!isPlaying) {
      if (!mode) setMode("cinematic");
      setIsPlaying(true);
    }
  }, []);

  const activePlaylist = playlists.find(p => p.id === mode || p.playlistId === mode);
  const bgMedia = activePlaylist?.backgroundMedia || backgrounds[mode || "cinematic"] || backgrounds["cinematic"];
  const isVideo = bgMedia.endsWith('.mp4');

  const player = useVideoPlayer(bgMedia, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  if (!fontsLoaded) {
    return <View className="flex-1 bg-[#140C07]" />;
  }

  return (
    <View className="flex-1 bg-[#140C07] justify-center items-center relative">
      <View className="absolute inset-0 z-0">
        {isVideo ? (
          <VideoView 
            style={StyleSheet.absoluteFill} 
            player={player} 
            contentFit="cover" 
          />
        ) : (
          <ImageBackground 
            source={{ uri: bgMedia }} 
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <View className="absolute top-12 w-full px-6 z-30 flex-row justify-between items-start">
        <LiveStatus />

        <View className="flex-col items-end gap-3">
          <Pressable onPress={() => router.push('/playlists')}>
            <Animated.View className="flex-row items-center gap-2 bg-[#F4EBD0] px-4 py-2 rounded-sm border border-[#d3c5a3]">
              <Disc3 color="#140C07" size={20} />
              <Text className="text-[#140C07] tracking-widest uppercase" style={{ fontFamily: 'Kalam_700Bold' }}>Mixtapes</Text>
            </Animated.View>
          </Pressable>

          <Pressable onPress={() => router.push('/leaderboard')}>
            <Animated.View className="flex-row items-center gap-2 bg-[#D4AF37] px-4 py-2 rounded-sm border border-[#F3E5AB]">
              <Trophy color="#140C07" size={20} />
              <Text className="text-[#140C07] tracking-widest uppercase" style={{ fontFamily: 'Kalam_700Bold' }}>Leaderboard</Text>
            </Animated.View>
          </Pressable>

          <Pressable onPress={() => router.push('/admin')}>
            <Animated.View className="flex-row items-center gap-2 bg-[#1A1A1A] px-4 py-2 rounded-sm border border-[#D4AF37]/50">
              <Settings color="#D4AF37" size={20} />
              <Text className="text-[#D4AF37] tracking-widest uppercase" style={{ fontFamily: 'Kalam_700Bold' }}>Creator Studio</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <Animated.View 
        entering={FadeInDown.duration(1500)}
        className="z-20 items-center mt-20"
      >
        <Text 
          style={{ fontFamily: 'YatraOne_400Regular', fontSize: 60, color: '#F3E5AB', textShadowColor: 'rgba(243, 229, 171, 0.6)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } }}
          className="text-center"
        >
          मस्त मगन
        </Text>
        
        <Animated.View entering={FadeIn.delay(800).duration(1500)} className="flex-row items-center gap-4 mt-6">
          <View className="h-[2px] w-12 bg-[#D4AF37]/50" />
          <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB]/90 text-2xl">
            Handpicked Nostalgic Vibes
          </Text>
          <View className="h-[2px] w-12 bg-[#D4AF37]/50" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
