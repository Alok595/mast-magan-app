import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Settings, Save, Plus, Trash2, Edit2, Disc3, X, LogOut, Activity, LayoutDashboard, Users, Music, ChevronDown, ChevronUp, Star } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useMusicStore } from "../src/store/useMusicStore";

const { height } = Dimensions.get("window");
const API_BASE = "https://mast-magan.vercel.app/api";

const defaultPlaylist = {
  playlistId: "",
  title: "",
  description: "",
  cover: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop",
  tracks: [{ title: "", artist: "", videoId: "", duration: "" }]
};

export default function AdminScreen() {
  const [fontsLoaded] = useFonts({ YatraOne_400Regular, Kalam_400Regular, Kalam_700Bold });
  
  const { playlists, setPlaylists, token, logout, user } = useMusicStore();
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("studio");
  const [stats, setStats] = useState({ siteVisits: 0, playlists: [], users: [] });
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState(defaultPlaylist);
  const [saving, setSaving] = useState(false);

  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const plRes = await fetch(`${API_BASE}/playlists`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (plRes.ok) {
        const plData = await plRes.json();
        setPlaylists(plData);
      }

      if (user?.role === "admin") {
        const stRes = await fetch(`${API_BASE}/analytics`);
        if (stRes.ok) {
          const stData = await stRes.json();
          setStats(stData);
        }
      }
    } catch (e) {
      console.error("Failed to fetch data in admin", e);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl) {
      Alert.alert("Error", "Please enter a valid YouTube playlist URL");
      return;
    }
    
    setImportLoading(true);
    try {
      // Use Next.js backend to parse the YouTube playlist
      const res = await fetch(`https://mast-magan.vercel.app/api/youtube/playlist?url=${encodeURIComponent(importUrl)}`);
      
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Import Failed", err.error || "Could not fetch playlist");
        setImportLoading(false);
        return;
      }
      
      const data = await res.json();
      const randomId = "imported-" + Math.random().toString(36).substring(2, 9);
      
      setFormData({
        playlistId: randomId,
        title: data.title || "Imported Playlist",
        description: data.description || "Imported from YouTube",
        cover: data.cover || defaultPlaylist.cover,
        tracks: data.tracks || []
      });
      
      setShowImportForm(false);
      setImportUrl("");
      setIsEditing(false);
      setShowModal(true); // Open the editor modal with the prefilled data
    } catch (e) {
      Alert.alert("Error", "Network error while importing.");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleUser = (email: string) => {
    setExpandedUsers(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const handleEdit = (pl: any) => {
    setIsEditing(true);
    setEditingDbId(pl._id);
    setFormData({
      playlistId: pl.playlistId || pl.id,
      title: pl.title || "",
      description: pl.description || "",
      cover: pl.cover || defaultPlaylist.cover,
      tracks: pl.tracks?.length > 0 ? pl.tracks : defaultPlaylist.tracks
    });
    setShowModal(true);
  };

  const handleDelete = (dbId: string) => {
    Alert.alert(
      "Delete Mixtape",
      "Are you sure you want to delete this mixtape? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE}/playlists/${dbId}`, { 
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (res.ok) {
                fetchData();
              }
            } catch (e) {
              Alert.alert("Error", "Failed to delete mixtape");
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (dbId: string) => {
    if (user?.role !== "admin") return;
    try {
      const res = await fetch(`${API_BASE}/playlists/${encodeURIComponent(dbId)}/default`, { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        Alert.alert("Error", "Failed to set default playlist.");
      }
    } catch (e) {
      console.error("Error setting default playlist:", e);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.playlistId) {
      Alert.alert("Error", "Title and ID are required.");
      return;
    }

    setSaving(true);
    const validTracks = formData.tracks.filter(t => t.title && t.videoId);
    
    const payload = {
      ...formData,
      tracks: validTracks,
    };

    const url = isEditing ? `${API_BASE}/playlists/${editingDbId}` : `${API_BASE}/playlists`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData(defaultPlaylist);
        setIsEditing(false);
        setEditingDbId(null);
        fetchData();
      } else {
        const errorData = await res.json();
        Alert.alert("Error", errorData.error || "Failed to save mixtape");
      }
    } catch (e) {
      Alert.alert("Error", "Network error. Make sure your server is running.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTrack = () => {
    setFormData({
      ...formData,
      tracks: [...formData.tracks, { title: "", artist: "", videoId: "", duration: "" }]
    });
  };

  const handleRemoveTrack = (index: number) => {
    const newTracks = [...formData.tracks];
    newTracks.splice(index, 1);
    setFormData({ ...formData, tracks: newTracks });
  };

  const handleTrackChange = (index: number, field: string, value: string) => {
    const newTracks = [...formData.tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setFormData({ ...formData, tracks: newTracks });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => {
        logout();
        router.replace("/login");
      }}
    ]);
  };

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 bg-[#140C07] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const adminPlaylists = playlists.filter(p => p.ownerEmail === user?.email || !p.ownerEmail);
  const topPlaylist = stats.playlists?.length > 0 ? stats.playlists[0] : null;

  return (
    <View className="flex-1 bg-[#140C07]">
      <View className="absolute inset-0 bg-[#3c2a1e] opacity-30" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800)} className="items-center justify-center mt-16 mb-8 relative w-full px-6">
          <Pressable 
            onPress={() => router.back()}
            className="absolute left-6 top-0 w-12 h-12 bg-[#1A1A1A] border border-[#D4AF37]/50 rounded-full items-center justify-center shadow-lg active:bg-black"
          >
            <ArrowLeft color="#D4AF37" size={24} strokeWidth={2.5} />
          </Pressable>

          <Pressable 
            onPress={handleLogout}
            className="absolute right-6 top-0 w-12 h-12 bg-red-900/20 border border-red-500/50 rounded-full items-center justify-center shadow-lg active:bg-red-900/40"
          >
            <LogOut color="#ff6b6b" size={20} strokeWidth={2.5} />
          </Pressable>

          <View className="flex-row items-center justify-center mt-16 gap-4">
            <Settings color="#D4AF37" size={40} />
            <Text style={{ fontFamily: 'YatraOne_400Regular', fontSize: 44, color: '#F3E5AB', textShadowColor: 'rgba(0,0,0,1)', textShadowRadius: 15, textShadowOffset: { width: 0, height: 5 } }}>
              Studio
            </Text>
          </View>
          <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#F3E5AB]/80 text-lg text-center mt-2">
            Logged in as {user?.name || "Admin"}
          </Text>
        </Animated.View>

        {/* STUDIO TAB */}
        {activeTab === "studio" && (
          <Animated.View entering={FadeInUp.duration(500)}>
            
            <View className="px-6 mb-8 gap-4 flex-col">
              <Pressable 
                onPress={() => setShowImportForm(!showImportForm)}
                className="flex-row items-center justify-center gap-3 bg-[#1A1A1A] border border-[#D4AF37]/30 px-6 py-4 rounded-2xl shadow-lg active:bg-black"
              >
                <Disc3 size={24} color="#D4AF37" />
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-lg uppercase tracking-widest">
                  IMPORT YOUTUBE
                </Text>
              </Pressable>

              {showImportForm && (
                <Animated.View entering={FadeInDown.duration(300)} className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-6">
                  <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-lg mb-2">Import from URL</Text>
                  <TextInput
                    value={importUrl}
                    onChangeText={setImportUrl}
                    placeholder="https://youtube.com/playlist?list=..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="bg-black/50 border border-[#D4AF37]/20 rounded-xl p-4 text-[#E8DCC4] mb-4 font-mono text-sm"
                  />
                  <Pressable 
                    onPress={handleImport}
                    disabled={importLoading}
                    className={`bg-white px-6 py-3 rounded-xl items-center ${importLoading ? 'opacity-50' : 'active:scale-95'}`}
                  >
                    {importLoading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-black text-sm uppercase tracking-widest">FETCH PLAYLIST</Text>}
                  </Pressable>
                </Animated.View>
              )}

              <Pressable 
                onPress={() => {
                  setFormData(defaultPlaylist);
                  setIsEditing(false);
                  setShowModal(true);
                }}
                className="flex-row items-center justify-center gap-3 bg-[#D4AF37] px-6 py-4 rounded-2xl shadow-lg active:scale-95 mt-2"
              >
                <Plus size={24} color="#140C07" />
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-lg uppercase tracking-widest">
                  NEW MIXTAPE
                </Text>
              </Pressable>
            </View>

            <View className="px-6 gap-6">
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-xl mb-2">Your Collection</Text>
              
              {adminPlaylists.map((pl, idx) => (
                <View key={pl._id || idx} className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-4 flex-row items-center shadow-lg">
                  <Image source={{ uri: pl.cover }} className="w-20 h-20 rounded-xl bg-black border border-white/20" />
                  
                  <View className="flex-1 px-4 justify-center">
                    <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-xl mb-1">{pl.title}</Text>
                    <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#E8DCC4]/60 text-sm">{pl.tracks?.length || 0} Tracks</Text>
                  </View>

                  <View className="items-end gap-3 justify-center flex-row">
                    {user?.role === "admin" && (
                      <Pressable 
                        onPress={() => handleSetDefault(pl._id)} 
                        className={`${pl.isDefault ? 'bg-[#D4AF37]' : 'bg-white/10'} px-3 py-2 rounded-full border border-[#D4AF37]/50 active:scale-95 flex-row items-center gap-1`}
                      >
                        <Star size={12} color={pl.isDefault ? "#140C07" : "#F3E5AB"} fill={pl.isDefault ? "#140C07" : "transparent"} />
                        <Text style={{ fontFamily: 'Kalam_700Bold' }} className={`${pl.isDefault ? 'text-[#140C07]' : 'text-[#F3E5AB]'} text-[10px] uppercase tracking-widest`}>
                          {pl.isDefault ? "Default" : "Set Default"}
                        </Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleEdit(pl)} className="bg-[#D4AF37]/20 p-2 rounded-full border border-[#D4AF37]/50 active:bg-[#D4AF37]/40">
                      <Edit2 size={18} color="#F3E5AB" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(pl._id)} className="bg-red-500/20 p-2 rounded-full border border-red-500/50 active:bg-red-500/40">
                      <Trash2 size={18} color="#ff6b6b" />
                    </Pressable>
                  </View>
                </View>
              ))}
              
              {adminPlaylists.length === 0 && (
                <Text className="text-white/30 text-center py-10">No mixtapes found.</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && user?.role === "admin" && (
          <Animated.View entering={FadeInUp.duration(500)} className="px-6 gap-6">
            <View className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl flex-col gap-4">
              <View className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <Activity size={32} color="#F3E5AB" />
              </View>
              <View>
                <Text className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Total Site Visits</Text>
                <Text style={{ fontFamily: 'YatraOne_400Regular' }} className="text-6xl text-[#F3E5AB]">{stats.siteVisits?.toLocaleString() || 0}</Text>
              </View>
            </View>

            <View className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl flex-col gap-4">
              <View className="w-16 h-16 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center">
                <Disc3 size={32} color="#D4AF37" />
              </View>
              <View>
                <Text className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Top Playlist</Text>
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-3xl text-white mb-2 leading-tight">
                  {topPlaylist ? topPlaylist.title : "N/A"}
                </Text>
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-lg uppercase tracking-widest">
                  {topPlaylist?.playCount || 0} PLAYS
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === "community" && user?.role === "admin" && (
          <Animated.View entering={FadeInUp.duration(500)} className="px-6 gap-6">
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-xl mb-2">Community Creators</Text>
            
            {(stats.users && stats.users.length > 0) ? stats.users.filter((u: any) => u.email !== "admin@mastmagan.com").map((u: any) => (
              <View key={u.email} className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl">
                <Pressable onPress={() => toggleUser(u.email)} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <Users size={20} color="#F3E5AB" />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-lg">{u.name || "User"}</Text>
                      <Text className="text-white/40 text-xs">{u.email}</Text>
                    </View>
                  </View>
                  <View>
                    {expandedUsers[u.email] ? <ChevronUp color="#D4AF37" /> : <ChevronDown color="#D4AF37" />}
                  </View>
                </Pressable>

                {expandedUsers[u.email] && (
                  <View className="mt-6 pt-6 border-t border-white/10 gap-4">
                    {stats.playlists.filter((p: any) => p.ownerEmail === u.email).map((pl: any, idx) => (
                      <View key={pl._id || idx} className="bg-black/50 border border-white/5 rounded-2xl p-4 flex-row items-center">
                        <Image source={{ uri: pl.cover }} className="w-12 h-12 rounded-xl bg-black" />
                        <View className="flex-1 px-4 justify-center">
                          <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-white text-base mb-1">{pl.title}</Text>
                          <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-white/50 text-xs">{pl.tracks?.length || 0} Tracks</Text>
                        </View>
                      </View>
                    ))}
                    {stats.playlists.filter((p: any) => p.ownerEmail === u.email).length === 0 && (
                      <Text className="text-white/30 italic text-sm text-center">No mixtapes created yet.</Text>
                    )}
                  </View>
                )}
              </View>
            )) : (
              <Text className="text-white/30 text-center py-10">No community data available.</Text>
            )}
          </Animated.View>
        )}

      </ScrollView>

      {/* Floating Bottom Navigation (Admins Only) */}
      {user?.role === "admin" && (
        <Animated.View entering={FadeInDown.duration(800)} className="absolute bottom-10 left-0 right-0 items-center">
          <View className="flex-row items-center bg-[#1A1A1A]/90 border border-[#D4AF37]/30 rounded-full px-2 py-2 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            
            <Pressable 
              onPress={() => setActiveTab("studio")}
              className={`flex-row items-center gap-2 px-6 py-3 rounded-full transition-all ${activeTab === "studio" ? "bg-[#D4AF37]" : "bg-transparent"}`}
            >
              <Music size={18} color={activeTab === "studio" ? "#140C07" : "#F3E5AB"} />
              {activeTab === "studio" && (
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-sm uppercase tracking-widest mt-1">Studio</Text>
              )}
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab("overview")}
              className={`flex-row items-center gap-2 px-6 py-3 rounded-full transition-all ${activeTab === "overview" ? "bg-[#D4AF37]" : "bg-transparent"}`}
            >
              <LayoutDashboard size={18} color={activeTab === "overview" ? "#140C07" : "#F3E5AB"} />
              {activeTab === "overview" && (
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-sm uppercase tracking-widest mt-1">Overview</Text>
              )}
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab("community")}
              className={`flex-row items-center gap-2 px-6 py-3 rounded-full transition-all ${activeTab === "community" ? "bg-[#D4AF37]" : "bg-transparent"}`}
            >
              <Users size={18} color={activeTab === "community" ? "#140C07" : "#F3E5AB"} />
              {activeTab === "community" && (
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-sm uppercase tracking-widest mt-1">Community</Text>
              )}
            </Pressable>

          </View>
        </Animated.View>
      )}

      {/* Editor Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#0a0604]">
          
          <View className="flex-row items-center justify-between p-6 border-b border-white/10 bg-[#140C07]">
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-2xl">
              {isEditing ? "Edit Mixtape" : "Craft New Mixtape"}
            </Text>
            <Pressable onPress={() => setShowModal(false)} className="p-2 rounded-full bg-white/10">
              <X size={24} color="#F3E5AB" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
            
            <View className="mb-8 p-6 bg-[#1A1A1A] rounded-2xl border border-white/5">
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-lg mb-4">Basic Info</Text>
              
              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Internal URL ID</Text>
              <TextInput 
                value={formData.playlistId}
                onChangeText={t => setFormData({...formData, playlistId: t})}
                placeholder="e.g. 90s-bollywood"
                placeholderTextColor="rgba(255,255,255,0.2)"
                className="bg-black/50 border border-white/10 rounded-xl p-4 text-[#E8DCC4] mb-4 font-mono"
              />

              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Display Title</Text>
              <TextInput 
                value={formData.title}
                onChangeText={t => setFormData({...formData, title: t})}
                placeholder="Title"
                placeholderTextColor="rgba(255,255,255,0.2)"
                className="bg-black/50 border border-white/10 rounded-xl p-4 text-[#E8DCC4] mb-4"
              />

              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Description</Text>
              <TextInput 
                value={formData.description}
                onChangeText={t => setFormData({...formData, description: t})}
                placeholder="Short description..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                className="bg-black/50 border border-white/10 rounded-xl p-4 text-[#E8DCC4] mb-4"
              />

              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Cover Image URL</Text>
              <TextInput 
                value={formData.cover}
                onChangeText={t => setFormData({...formData, cover: t})}
                placeholder="https://..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                className="bg-black/50 border border-white/10 rounded-xl p-4 text-[#E8DCC4]"
              />
            </View>

            <View className="mb-8 p-6 bg-[#1A1A1A] rounded-2xl border border-white/5">
              <View className="flex-row items-center justify-between mb-6">
                <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-lg">Tracklist ({formData.tracks.length})</Text>
                <Pressable onPress={handleAddTrack} className="bg-white/10 px-4 py-2 rounded-full border border-white/20 flex-row items-center gap-1">
                  <Plus size={16} color="#F3E5AB" />
                  <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#F3E5AB] text-sm">ADD TRACK</Text>
                </Pressable>
              </View>

              {formData.tracks.map((track, index) => (
                <View key={index} className="bg-black/50 border border-white/10 rounded-xl p-4 mb-4 relative">
                  
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[#D4AF37]/50 font-bold">Track {index + 1}</Text>
                    {formData.tracks.length > 1 && (
                      <Pressable onPress={() => handleRemoveTrack(index)}>
                        <Trash2 size={18} color="#ff6b6b" />
                      </Pressable>
                    )}
                  </View>

                  <TextInput 
                    value={track.title}
                    onChangeText={t => handleTrackChange(index, 'title', t)}
                    placeholder="Title"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="border-b border-white/10 p-2 text-white mb-2"
                  />
                  <TextInput 
                    value={track.artist}
                    onChangeText={t => handleTrackChange(index, 'artist', t)}
                    placeholder="Artist"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="border-b border-white/10 p-2 text-white mb-2"
                  />
                  <View className="flex-row gap-2">
                    <TextInput 
                      value={track.videoId}
                      onChangeText={t => handleTrackChange(index, 'videoId', t)}
                      placeholder="YouTube ID (e.g. jfKfPfyJRdk)"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="border-b border-white/10 p-2 text-white flex-1 font-mono text-xs"
                    />
                    <TextInput 
                      value={track.duration}
                      onChangeText={t => handleTrackChange(index, 'duration', t)}
                      placeholder="3:45"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="border-b border-white/10 p-2 text-white w-16 text-center font-mono text-xs"
                    />
                  </View>
                </View>
              ))}
            </View>

          </ScrollView>

          <View className="p-6 border-t border-white/10 bg-[#140C07]">
            <Pressable 
              onPress={handleSave}
              disabled={saving}
              className={`flex-row items-center justify-center gap-3 bg-[#D4AF37] px-6 py-4 rounded-2xl shadow-lg ${saving ? 'opacity-50' : 'active:scale-95'}`}
            >
              <Save size={24} color="#140C07" />
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-lg uppercase tracking-widest">
                {saving ? "SAVING..." : (isEditing ? "UPDATE MIXTAPE" : "PUBLISH MIXTAPE")}
              </Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
