import { Slot } from 'expo-router';
import '../global.css';

import React, { useEffect, useState } from 'react';
import { View, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import GlobalPlayer from '../src/components/GlobalPlayer';
import { useFonts, YatraOne_400Regular } from "@expo-google-fonts/yatra-one";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

function CustomSplash({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, opacity: fadeAnim }}>
      <ImageBackground 
        source={require('../assets/images/premium-splash.jpg')} 
        style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 }}
        resizeMode="cover"
      >
        <View style={{ width: width * 0.6, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View style={{ width: progressWidth, height: '100%', backgroundColor: '#D4AF37' }} />
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

import { useMusicStore } from '../src/store/useMusicStore';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    YatraOne_400Regular,
    Kalam_400Regular,
    Kalam_700Bold
  });

  const [splashVisible, setSplashVisible] = useState(true);
  const { setPlaylists, mode, setMode } = useMusicStore();

  // Fetch playlists globally on app load
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch("https://mast-magan.vercel.app/api/playlists");
        if (res.ok) {
          const data = await res.json();
          const fetched = data.playlists || data;
          setPlaylists(fetched);
          
          // If no mode is set, or the mode doesn't exist in fetched playlists, use the first available one
          if (fetched && fetched.length > 0) {
            const modeExists = fetched.some((p: any) => p.id === mode || p.playlistId === mode);
            if (!mode || !modeExists) {
              setMode(fetched[0].playlistId || fetched[0].id);
            }
          }
        }
      } catch (err) {
        console.log("Failed to fetch playlists globally", err);
      }
    };
    fetchPlaylists();
  }, [mode]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; 
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#140C07' }}>
      <Slot />
      <GlobalPlayer />
      {splashVisible && <CustomSplash onAnimationComplete={() => setSplashVisible(false)} />}
    </View>
  );
}
