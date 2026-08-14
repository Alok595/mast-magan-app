import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { FadeInLeft, FadeIn } from "react-native-reanimated";

export default function LiveStatus() {
  const [listeners, setListeners] = useState(50);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).toUpperCase();
    setCurrentDate(formattedDate);
    
    // Heartbeat logic placeholder (React Native fetch is identical to web fetch)
    const clientId = Math.random().toString(36).substring(2, 15);
    const sendHeartbeat = async () => {
      // In a real mobile app, you would replace this with your actual backend URL
      // e.g., fetch("https://your-backend.com/api/heartbeat")
      try {
        // const res = await fetch("https://your-backend.com/api/heartbeat", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ clientId })
        // });
        // const data = await res.json();
        // if (data.listeners) setListeners(data.listeners);
        
        // Mocking for now since relative URL doesn't work in React Native
        setListeners(Math.floor(Math.random() * 20) + 40); 
      } catch (e) {}
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  return (
    <View className="z-50 flex flex-col gap-2 pointer-events-none">
      <Animated.View 
        entering={FadeInLeft.duration(1000)}
        className="flex-row items-center gap-3 bg-black/20 px-4 py-2 rounded-sm border border-white/10"
      >
        <View className="relative flex h-3 w-3">
          <View className="absolute h-full w-full rounded-full bg-green-400 opacity-75" />
          <View className="relative rounded-full h-3 w-3 bg-green-500" />
        </View>
        <Text className="text-green-400 font-mono text-lg tracking-widest font-bold flex-row items-center">
          {listeners} <Text className="text-white/80">ONLINE</Text>
        </Text>
      </Animated.View>
      
      <Animated.View 
        entering={FadeIn.delay(500).duration(1000)}
        className="px-4"
      >
        <Text className="text-white/60 font-mono text-sm tracking-[3px]">
          {currentDate || "SYNCING..."}
        </Text>
      </Animated.View>
    </View>
  );
}
