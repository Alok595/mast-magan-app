import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, Pressable, Image, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Disc3, Play } from "lucide-react-native";
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useMusicStore } from "../../src/store/useMusicStore";

const { width } = Dimensions.get('window');

// Mock data fallback in case API fails
const mockPlaylists = [
  {
    id: "cinematic",
    playlistId: "cinematic",
    title: "Cinematic Escapes",
    description: "Epic soundtracks for long night drives.",
    cover: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
    tracks: Array(10).fill({}),
    likesCount: 124,
    playCount: 1530
  },
  {
    id: "deluxe-salon",
    playlistId: "deluxe-salon",
    title: "Deluxe Salon",
    description: "Smooth jazz and lofi for late nights.",
    cover: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2064&auto=format&fit=crop",
    tracks: Array(8).fill({}),
    likesCount: 89,
    playCount: 920
  }
];

export default function PlaylistsScreen() {
  const [fontsLoaded] = useFonts({ YatraOne_400Regular, Kalam_400Regular, Kalam_700Bold });
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPlaylists: setStorePlaylists } = useMusicStore();

  useEffect(() => {
    // Attempt to fetch from a live API, fallback to mock data
    const fetchPlaylists = async () => {
      try {
        // Your computer's local IP address (where Next.js is likely running)
        // Note: 'localhost' doesn't work on physical Android devices!
        const res = await fetch("https://mast-magan.vercel.app/api/playlists");
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data.playlists || data);
          setStorePlaylists(data.playlists || data);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        console.log("Using fallback mock data for playlists");
        setPlaylists(mockPlaylists);
        setStorePlaylists(mockPlaylists);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 bg-[#140C07] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#140C07]">
      {/* Heavy Film Grain Background overlay */}
      <View className="absolute inset-0 bg-[#3c2a1e] opacity-30" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(800)} className="items-center justify-center mt-20 mb-8 relative w-full px-6">
        <Pressable 
          onPress={() => router.back()}
          className="absolute left-6 top-0 w-12 h-12 bg-[#E8DCC4] rounded-full items-center justify-center shadow-lg active:bg-white z-10"
        >
          <ArrowLeft color="#140C07" size={24} strokeWidth={2.5} />
        </Pressable>

        <View className="flex-row items-center justify-center mt-16 gap-3">
          <Disc3 color="#D4AF37" size={32} />
          <Text style={{ fontFamily: 'YatraOne_400Regular', fontSize: 44, color: '#F3E5AB', textShadowColor: 'rgba(0,0,0,1)', textShadowRadius: 15, textShadowOffset: { width: 0, height: 5 } }}>
            Mixtapes
          </Text>
        </View>
        <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#F3E5AB]/80 text-xl text-center mt-2">
          Handpicked nostalgic vibes for the road
        </Text>
      </Animated.View>

      {/* Playlists Grid */}
      <FlatList 
        data={playlists}
        keyExtractor={(item) => item.id || item.playlistId}
        renderItem={({ item, index }) => <PlaylistItem playlist={item} idx={index} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        windowSize={5}
        removeClippedSubviews={true}
        ItemSeparatorComponent={() => <View className="h-16" />}
      />
    </View>
  );
}

function PlaylistItem({ playlist, idx }: { playlist: any; idx: number }) {
  const isPressed = useSharedValue(false);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isPressed.value ? 0.95 : 1) },
      ],
    };
  });

  return (
    <Animated.View 
      entering={FadeInUp.delay(idx * 150).springify()}
      className="relative w-full"
    >
      <Pressable
        onPressIn={() => isPressed.value = true}
        onPressOut={() => isPressed.value = false}
        onPress={() => router.push(`/playlists/${playlist.playlistId || playlist.id}`)}
      >
        <Animated.View style={[cardStyle]} className="relative mt-12">
          
          {/* Vinyl Record (stuck out top) */}
          <View className="absolute -top-12 left-1/2 -ml-[96px] w-48 h-48 bg-[#111] rounded-full border-[6px] border-black items-center justify-center shadow-2xl z-0">
             <View className="absolute inset-2 rounded-full border border-white/10" />
             <View className="absolute inset-4 rounded-full border border-white/5" />
             <View className="absolute inset-6 rounded-full border border-white/10" />
             <View className="w-16 h-16 bg-[#D4AF37] rounded-full items-center justify-center border-2 border-black/50">
               <View className="w-3 h-3 bg-black rounded-full" />
             </View>
          </View>

          {/* Vintage Sleeve (Card) */}
          <View className="relative z-10 bg-[#F4EBD0] p-4 pb-6 rounded-sm border border-[#d3c5a3] shadow-xl overflow-hidden">
            {/* Cover Art */}
            <View className="w-full aspect-square bg-black border-4 border-[#F4EBD0] overflow-hidden relative">
              <Image 
                source={{ uri: playlist.cover }} 
                style={StyleSheet.absoluteFill}
              />
              <View className="absolute inset-0 bg-[#d4af37]/20 mix-blend-overlay" />
            </View>

            {/* Label info */}
            <View className="pt-5 items-center">
              <View className="w-12 h-1 bg-black/20 rounded-full mb-3" />
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-3xl text-[#2A1B14] mb-1 text-center">
                {playlist.title}
              </Text>
              <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#4A3C31] text-lg text-center leading-5 mb-4">
                {playlist.description}
              </Text>

              {/* Stats */}
              <View className="flex-row items-center justify-center gap-6 pt-3 border-t border-black/10 w-full">
                <View className="flex-row items-center gap-1.5">
                  <Disc3 color="#8C6D23" size={16} />
                  <Text className="text-[#8C6D23] font-bold">{playlist.playCount || 0}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Play color="#CC3333" size={14} fill="#CC3333" />
                  <Text className="text-[#CC3333] font-bold">{playlist.likesCount || 0}</Text>
                </View>
              </View>

              {/* Side A tag */}
              <View className="absolute -right-6 top-8 bg-[#CC3333] px-6 py-1 rotate-6 shadow-md border border-black/20">
                <Text className="text-white text-xs font-bold uppercase tracking-widest">
                  Side A • {playlist.tracks?.length || 0} Trks
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
