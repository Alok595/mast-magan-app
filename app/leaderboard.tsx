import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator, Image, Alert } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Trophy, Medal, Heart } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useMusicStore } from "../src/store/useMusicStore";

export default function LeaderboardScreen() {
  const [fontsLoaded] = useFonts({ YatraOne_400Regular, Kalam_400Regular, Kalam_700Bold });
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"plays" | "likes">("plays");
  
  const { user, token } = useMusicStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("https://mast-magan.vercel.app/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((item: any) => {
            const rawLikes = item.likes || [];
            return {
              id: item.playlistId || item.id || item._id,
              title: item.title,
              creator: item.creatorName || (item.ownerEmail ? item.ownerEmail.split('@')[0] : "Unknown"),
              score: item.playCount || 0,
              likes: item.likesCount || 0,
              rawLikes: rawLikes,
              hasLiked: user ? rawLikes.includes(user.email) : false,
              cover: item.cover || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2064&auto=format&fit=crop"
            };
          });
          setLeaders(formatted);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        console.log("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  const handleLike = async (playlistId: string) => {
    if (!user) {
      Alert.alert("Login Required", "Please go to Creator Studio to login before liking mixtapes!");
      return;
    }
    
    // Optimistic UI update
    setLeaders(prev => prev.map(p => {
      if (p.id === playlistId) {
        const hasLiked = p.rawLikes.includes(user.email);
        const newLikes = hasLiked 
          ? p.rawLikes.filter((e: string) => e !== user.email)
          : [...p.rawLikes, user.email];
        return { 
          ...p, 
          rawLikes: newLikes, 
          likes: newLikes.length, 
          hasLiked: !hasLiked 
        };
      }
      return p;
    }));

    try {
      await fetch(`https://mast-magan.vercel.app/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Like error", e);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 bg-[#140C07] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // Sort dynamically based on active tab
  const sortedLeaders = [...leaders].sort((a, b) => {
    if (activeTab === "likes") return b.likes - a.likes;
    return b.score - a.score;
  });

  const renderItem = ({ item, index: idx }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(idx * 100).springify()}
    >
      <Pressable 
        onPress={() => router.push(`/playlists/${item.id}`)}
        className="flex-row items-center bg-[#F4EBD0]/10 border border-[#D4AF37]/20 p-4 rounded-xl active:bg-[#F4EBD0]/20 mb-4"
      >
        <View className="w-10 items-center justify-center">
          {idx === 0 ? <Medal color="#FFD700" size={28} /> : 
           idx === 1 ? <Medal color="#C0C0C0" size={28} /> : 
           idx === 2 ? <Medal color="#CD7F32" size={28} /> : 
           <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37]/50 text-2xl">{idx + 1}</Text>}
        </View>

        <Image source={{ uri: item.cover }} className="w-14 h-14 rounded-md ml-2 border-2 border-black/50" />

        <View className="flex-1 ml-4 justify-center">
          <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-xl mb-1">{item.title}</Text>
          <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#E8DCC4]/60 text-xs">By {item.creator}</Text>
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => handleLike(item.id)} className="items-center p-2 active:scale-90">
            <Heart 
              size={20} 
              color={item.hasLiked ? "#EF4444" : "rgba(255,255,255,0.4)"} 
              fill={item.hasLiked ? "#EF4444" : "transparent"} 
            />
            <Text className={`text-[10px] font-bold mt-1 ${item.hasLiked ? "text-red-400" : "text-white/40"}`}>{item.likes}</Text>
          </Pressable>

          <View className="items-end min-w-[30px]">
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-lg">{item.score}</Text>
            <Text className="text-[#D4AF37]/50 text-[10px] uppercase tracking-widest font-bold">Plays</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-[#140C07]">
      <View className="absolute inset-0 bg-[#3c2a1e] opacity-30" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(800)} className="items-center justify-center mt-20 mb-8 relative w-full px-6">
        <Pressable 
          onPress={() => router.back()}
          className="absolute left-6 top-0 w-12 h-12 bg-[#D4AF37] rounded-full items-center justify-center shadow-lg active:bg-white z-10"
        >
          <ArrowLeft color="#140C07" size={24} strokeWidth={2.5} />
        </Pressable>

        <View className="flex-row items-center justify-center mt-16 gap-4">
          <Trophy color="#D4AF37" size={40} />
          <Text style={{ fontFamily: 'YatraOne_400Regular', fontSize: 44, color: '#F3E5AB', textShadowColor: 'rgba(0,0,0,1)', textShadowRadius: 15, textShadowOffset: { width: 0, height: 5 } }}>
            Hall of Fame
          </Text>
        </View>
        
        <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#F3E5AB]/80 text-xl text-center mt-2">
          Most loved and played mixtapes
        </Text>

        {/* Toggle Tabs */}
        <View className="flex-row mt-8 bg-[#1A1A1A] p-1 rounded-full border border-[#D4AF37]/30">
          <Pressable 
            onPress={() => setActiveTab("plays")}
            className={`px-6 py-2 rounded-full ${activeTab === "plays" ? "bg-[#D4AF37]" : ""}`}
          >
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className={`uppercase tracking-widest ${activeTab === "plays" ? "text-black" : "text-white/50"}`}>Most Played</Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab("likes")}
            className={`px-6 py-2 rounded-full ${activeTab === "likes" ? "bg-[#D4AF37]" : ""}`}
          >
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className={`uppercase tracking-widest ${activeTab === "likes" ? "text-black" : "text-white/50"}`}>Most Liked</Text>
          </Pressable>
        </View>
      </Animated.View>

      <FlatList 
        data={sortedLeaders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}
