import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { router } from "expo-router";
import { Disc3, ArrowLeft } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from "react-native-reanimated";
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { useMusicStore } from "../src/store/useMusicStore";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({ YatraOne_400Regular, Kalam_400Regular, Kalam_700Bold });
  
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setAuth, token } = useMusicStore();

  const spinValue = useSharedValue(0);

  useEffect(() => {
    spinValue.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinValue.value}deg` }]
    };
  });

  // If already logged in, go to admin
  useEffect(() => {
    if (token) {
      router.replace("/admin");
    }
  }, [token]);

  const handleAuth = async () => {
    if (!email || !password || (isSignup && !name)) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = isSignup ? "/api/mobile/signup" : "/api/mobile/login";
      const payload = isSignup ? { name, email, password } : { email, password };

      const res = await fetch(`https://mast-magan.vercel.app${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAuth(data.token, data.user);
        router.replace("/admin");
      } else {
        Alert.alert(isSignup ? "Signup Failed" : "Login Failed", data.error || "An error occurred");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Network Error", "Make sure your Next.js server is reachable");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#050505]">
      
      <Pressable 
        onPress={() => router.back()}
        className="absolute left-6 top-16 w-12 h-12 bg-[#1A1A1A] border border-[#D4AF37]/50 rounded-full items-center justify-center shadow-lg active:bg-black z-50"
      >
        <ArrowLeft color="#D4AF37" size={24} strokeWidth={2.5} />
      </Pressable>

      <View className="flex-1 items-center justify-center p-6">
        <Animated.View entering={FadeInDown.duration(800)} className="items-center w-full mb-8">
          <Animated.View style={spinStyle}>
            <Disc3 size={64} color="#D4AF37" strokeWidth={1.5} />
          </Animated.View>
          <Text style={{ fontFamily: 'YatraOne_400Regular' }} className="text-[#F3E5AB] text-5xl mt-6 text-center">
            {isSignup ? "Join Studio" : "Studio Login"}
          </Text>
          <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#F3E5AB]/60 text-lg text-center mt-2">
            {isSignup ? "Create your own mixtapes" : "Secure Admin Access"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(800)} className="w-full max-w-sm gap-4">
          
          {isSignup && (
            <View>
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-sm uppercase tracking-widest mb-1 ml-1">
                Display Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Mast Magan Fan"
                placeholderTextColor="rgba(255,255,255,0.2)"
                autoCapitalize="words"
                className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-4 text-[#E8DCC4] text-lg font-mono"
              />
            </View>
          )}

          <View>
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-sm uppercase tracking-widest mb-1 ml-1">
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-4 text-[#E8DCC4] text-lg font-mono"
            />
          </View>

          <View>
            <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#D4AF37] text-sm uppercase tracking-widest mb-1 ml-1">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry
              className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-4 text-[#E8DCC4] text-lg font-mono"
            />
          </View>

          <Pressable 
            onPress={handleAuth}
            disabled={loading}
            className={`bg-[#D4AF37] p-5 rounded-2xl items-center mt-4 shadow-[0_0_20px_rgba(212,175,55,0.3)] ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            {loading ? (
              <ActivityIndicator color="#140C07" />
            ) : (
              <Text style={{ fontFamily: 'Kalam_700Bold' }} className="text-[#140C07] text-xl uppercase tracking-widest">
                {isSignup ? "Create Account" : "Access Studio"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsSignup(!isSignup)} className="items-center mt-4 p-2">
            <Text style={{ fontFamily: 'Kalam_400Regular' }} className="text-[#F3E5AB]/60 text-base underline">
              {isSignup ? "Already have an account? Login here" : "Don't have an account? Sign up"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
