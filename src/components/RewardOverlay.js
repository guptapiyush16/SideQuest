// Full-screen celebration when XP is earned (quest done, discovery, level up).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Modal, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../store/GameContext';
import { colors } from '../theme';
import { Button, Card, Label, ProgressBar, Pulse, T } from './ui';

export default function RewardOverlay() {
  const { rewards, dismissReward, level } = useGame();
  const r = rewards[0];
  const scale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(0);

  useEffect(() => {
    if (!r) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    scale.setValue(0.6);
    fade.setValue(0);
    count.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(count, { toValue: r.total, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
    const id = count.addListener(({ value }) => setShown(Math.round(value)));
    return () => count.removeListener(id);
  }, [r?.id]);

  if (!r) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismissReward}>
      <View style={styles.backdrop}>
        <Animated.View style={{ opacity: fade, transform: [{ scale }], width: '100%', alignItems: 'center' }}>
          <Pulse size={320} color={r.levelUp ? colors.xp : colors.primary} style={{ top: -40 }} />
          <Card glow style={styles.card}>
            {r.photoUri ? <Image source={{ uri: r.photoUri }} style={styles.photo} /> : <T size={64} style={{ textAlign: 'center' }}>{r.emoji || '⭐'}</T>}
            <Label color={colors.primary} style={{ textAlign: 'center', marginTop: 12 }}>
              {r.headline || 'REWARD'}
            </Label>
            <T w="black" size={56} color={colors.xp} style={{ textAlign: 'center', marginVertical: 4 }}>
              +{shown} XP
            </T>
            <View style={{ gap: 6, marginBottom: 18 }}>
              {r.lines.map((l, i) => (
                <View key={i} style={styles.line}>
                  <T size={14} color={colors.textDim} style={{ flex: 1 }}>{l.label}</T>
                  <T w="bold" size={14} color={colors.xp}>+{l.xp}</T>
                </View>
              ))}
            </View>

            {r.levelUp ? (
              <View style={styles.levelUp}>
                <T size={32}>🎉</T>
                <T w="black" size={24} color={colors.text}>LEVEL {r.levelUp.level}</T>
                <T w="medium" color={colors.xp}>You're now a {r.levelUp.title}</T>
              </View>
            ) : (
              <View style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <T w="bold" size={13}>LEVEL {level.level}</T>
                  <T size={13} color={colors.textDim}>{level.current} / {level.needed} XP</T>
                </View>
                <ProgressBar progress={level.progress} />
              </View>
            )}
            <Button id="reward-continue" title="Keep exploring" onPress={dismissReward} />
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3,8,6,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, paddingVertical: 26 },
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', borderWidth: 3, borderColor: colors.primary },
  line: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  levelUp: { alignItems: 'center', gap: 4, marginBottom: 18, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,200,87,0.10)', borderWidth: 1, borderColor: 'rgba(255,200,87,0.35)' },
});
