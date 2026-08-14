import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Play, Pause, Clock, Disc3 } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withRepeat, withTiming, Easing, useSharedValue } from "react-native-reanimated";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useMusicStore } from "../../src/store/useMusicStore";

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const [fontsLoaded] = useFonts({ YatraOne_400Regular, Kalam_400Regular, Kalam_700Bold });
  
  const { playlists, isPlaying, setIsPlaying, setMode, setCurrentSongIndex, mode } = useMusicStore();
  const [playlist, setPlaylist] = useState<any>(null);

  const rotation = useSharedValue(0);

  useEffect(() => {
    const found = playlists.find(p => p.id === id || p.playlistId === id);
    if (found) setPlaylist(found);
  }, [id, playlists]);

  useEffect(() => {
    if (isPlaying && mode === id) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1
      );
    } else {
      rotation.value = 0;
    }
  }, [isPlaying, mode, id]);

  const vinylStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (isPlaying && mode === id) ? 40 : 0 },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });

  if (!fontsLoaded || !playlist) {
    return (
      <View className="flex-1 bg-[#140C07] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const handlePlayPlaylist = () => {
    if (!playlist.tracks?.length) return;
    if (mode === id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentSongIndex(0);
      setIsPlaying(true);
      setMode(id as string);
    }
  };

  const handlePlayTrack = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    setMode(id as string);
  };

  return (
    <View className="flex-1 bg-[#140C07]">
      <View className="absolute inset-0 bg-[#3c2a1e] opacity-30" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header & Back */}
        <View className="px-6 mt-16 mb-6 flex-row items-center">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
            <ArrowLeft color="#E8DCC4" size={24} opacity={0.7} />
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#E8DCC4]/70 uppercase tracking-widest text-sm">
              Back to Playlists
            </Text>
          </Pressable>
        </View>

        {/* Album Cover & Info */}
        <Animated.View entering={FadeInDown.duration(800)} className="px-6 items-center">
          
          <View className="relative w-[280px] aspect-square mb-8 mt-4">
            {/* Spinning Vinyl */}
            <Animated.View 
              style={[vinylStyle, { position: 'absolute', top: 8, bottom: 8, right: 0, width: '95%' }]}
              className="bg-[#111] rounded-full border-[4px] border-black items-center justify-center shadow-2xl z-0"
            >
              <View className="absolute inset-2 rounded-full border border-white/10" />
              <View className="absolute inset-6 rounded-full border border-white/5" />
              <View className="absolute inset-10 rounded-full border border-white/10" />
              <View className="w-24 h-24 bg-[#D4AF37] rounded-full items-center justify-center border-2 border-black/50">
                <View className="w-4 h-4 bg-black rounded-full" />
              </View>
            </Animated.View>

            {/* Sleeve */}
            <View className="absolute inset-0 z-10 bg-[#F4EBD0] p-3 pb-8 rounded-sm shadow-2xl border border-[#d3c5a3]">
              <View className="w-full aspect-square bg-black border-4 border-[#F4EBD0] overflow-hidden">
                <Image source={{ uri: playlist.cover }} style={StyleSheet.absoluteFill} />
                <View className="absolute inset-0 bg-[#d4af37]/20 mix-blend-overlay" />
              </View>
              <View className="absolute bottom-3 left-0 right-0 items-center">
                <View className="w-24 h-1 bg-black/10 rounded-full" />
              </View>
            </View>
          </View>

          <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-5xl text-[#F3E5AB] text-center mb-3 text-shadow-lg">
            {playlist.title}
          </Text>
          <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#E8DCC4]/70 text-xl text-center mb-6 px-4">
            {playlist.description}
          </Text>

          <Pressable 
            onPress={handlePlayPlaylist}
            className="flex-row items-center justify-center gap-3 bg-[#D4AF37] px-10 py-4 rounded-full shadow-lg active:scale-95"
          >
            {isPlaying && mode === id ? (
              <Pause size={24} fill="#140C07" color="#140C07" />
            ) : (
              <Play size={24} fill="#140C07" color="#140C07" />
            )}
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-lg uppercase tracking-widest">
              {isPlaying && mode === id ? "PAUSE" : "PLAY PLAYLIST"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Tracks */}
        <Animated.View entering={FadeIn.delay(300).duration(800)} className="px-6 mt-16">
          <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-4">
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37]/50 uppercase tracking-widest text-xs"># Title</Text>
            <Clock size={16} color="rgba(212,175,55,0.5)" />
          </View>

          {playlist.tracks?.map((track: any, idx: number) => (
            <Pressable 
              key={idx} 
              onPress={() => handlePlayTrack(idx)}
              className="flex-row items-center justify-between py-4 border-b border-white/5 active:bg-white/5 px-2 rounded-lg"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#D4AF37]/50 text-xl w-6 text-right">
                  {idx + 1}
                </Text>
                <View className="flex-1 pr-4">
                  <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#E8DCC4] text-xl" numberOfLines={1}>
                    {track.title || "Track Title"}
                  </Text>
                  <Text className="text-white/40 text-xs uppercase tracking-wider mt-1" numberOfLines={1}>
                    {track.artist || "Unknown Artist"}
                  </Text>
                </View>
              </View>
              <Text className="text-white/30 text-xs tracking-widest">
                {track.duration || "0:00"}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

      </ScrollView>
    </View>
  );
}
