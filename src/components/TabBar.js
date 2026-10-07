// Bottom tab bar with a raised central Scan button.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '../theme';
import { Bouncy, T } from './ui';

const TABS = [
  { key: 'home', icon: '🏠', label: 'Quests' },
  { key: 'pokedex', icon: '📖', label: 'Pokédex' },
  { key: 'scan', icon: '📸', label: 'Scan', center: true },
  { key: 'adventures', icon: '🗺️', label: 'Journal' },
  { key: 'profile', icon: '🎒', label: 'Profile' },
];

export default function TabBar({ current, onChange }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) =>
        t.center ? (
          <Bouncy key={t.key} onPress={() => onChange(t.key)} style={styles.centerWrap} testID="tab-scan" nativeID="tab-scan">
            <LinearGradient colors={gradients.scan} style={styles.center}>
              <T size={28}>{t.icon}</T>
            </LinearGradient>
          </Bouncy>
        ) : (
          <Bouncy key={t.key} onPress={() => onChange(t.key)} style={styles.tab} testID={`tab-${t.key}`} nativeID={`tab-${t.key}`}>
            <T size={20} style={{ opacity: current === t.key ? 1 : 0.5 }}>{t.icon}</T>
            <T w={current === t.key ? 'bold' : 'medium'} size={11} color={current === t.key ? colors.primary : colors.textMute}>
              {t.label}
            </T>
            {current === t.key ? <View style={styles.dot} /> : null}
          </Bouncy>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    backgroundColor: 'rgba(9,20,15,0.97)', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  tab: { alignItems: 'center', gap: 3, minWidth: 60 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 2 },
  centerWrap: { marginTop: -34 },
  center: {
    width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.bg,
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
});
