// SideQuest IRL — root
// Go outside → get a quest → do something → discover something → collect it → earn XP
import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';

import { GameProvider, useGame } from './src/store/GameContext';
import { colors, gradients } from './src/theme';
import TabBar from './src/components/TabBar';
import RewardOverlay from './src/components/RewardOverlay';
import QuestTracker from './src/components/QuestTracker';
import HomeScreen from './src/screens/HomeScreen';
import QuestScreen from './src/screens/QuestScreen';
import ScanScreen from './src/screens/ScanScreen';
import PokedexScreen from './src/screens/PokedexScreen';
import AdventuresScreen from './src/screens/AdventuresScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const SCREENS = {
  home: HomeScreen,
  quest: QuestScreen,
  scan: ScanScreen,
  pokedex: PokedexScreen,
  adventures: AdventuresScreen,
  profile: ProfileScreen,
};

function Shell() {
  const { hydrated, onboarded } = useGame();
  const [route, setRoute] = useState('home');

  if (!hydrated) return <Loading />;
  if (!onboarded) return <OnboardingScreen />;

  const Screen = SCREENS[route] || HomeScreen;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Screen key={route} go={setRoute} />
      </View>
      <TabBar current={route === 'quest' ? 'home' : route} onChange={setRoute} />
      <QuestTracker />
      <RewardOverlay />
    </View>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });

  return (
    <SafeAreaProvider>
      <LinearGradient colors={gradients.night} style={styles.root}>
        <View style={styles.frame}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <StatusBar style="light" />
            {fontsLoaded ? (
              <GameProvider>
                <Shell />
              </GameProvider>
            ) : (
              <Loading />
            )}
          </SafeAreaView>
        </View>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // On web, constrain to a phone-sized column so the demo looks like the app.
  frame: Platform.select({
    web: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
    default: { flex: 1 },
  }),
});
