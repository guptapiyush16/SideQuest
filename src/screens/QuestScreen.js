// ⚔️ Active quest — intentionally minimal. The screen is the shortest part.
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useGame } from '../store/GameContext';
import { colors, gradients } from '../theme';
import { Button, Card, FadeIn, Label, Pill, ProgressBar, Pulse, T } from '../components/ui';

export default function QuestScreen({ go }) {
  const { today, activeQuest, completeQuest, abandonQuest, settings } = useGame();
  const quest = today?.quests.find((q) => q.id === activeQuest?.id);
  const lastDone = today?.quests.filter((q) => q.status === 'done').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Quest finished (e.g. walk auto-completed or scan added) → show the wrap-up.
  if (!quest) {
    return (
      <View style={styles.center}>
        <Pulse size={300} />
        <T size={72}>{lastDone?.emoji || '🏁'}</T>
        <T w="black" size={28} style={{ marginTop: 12, textAlign: 'center' }}>Quest complete!</T>
        <T color={colors.textDim} style={{ textAlign: 'center', marginTop: 8, marginBottom: 28 }}>
          {lastDone ? lastDone.title : 'Nice work out there.'}
        </T>
        <Button id="quest-back-home" title="Back to quests" onPress={() => go('home')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const elapsed = Math.floor((now - activeQuest.startedAt) / 1000);
  const mm = `${Math.floor(elapsed / 60)}`.padStart(2, '0');
  const ss = `${elapsed % 60}`.padStart(2, '0');
  const km = activeQuest.distanceKm || 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topRow}>
        <Button small variant="ghost" title="← Quests" onPress={() => go('home')} />
        <Pill color={colors.xp}>+{quest.xp} XP</Pill>
      </View>

      <FadeIn style={{ alignItems: 'center', marginTop: 20 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 180 }}>
          <Pulse size={200} />
          <T size={96}>{quest.emoji}</T>
        </View>
        <Label color={colors.primary}>Quest active</Label>
        <T w="black" size={32} style={{ textAlign: 'center', marginTop: 4 }}>{quest.title}</T>
        <T size={17} color={colors.textDim} style={{ textAlign: 'center', marginTop: 8, lineHeight: 24, paddingHorizontal: 10 }}>
          {quest.description}
        </T>
      </FadeIn>

      <View style={styles.metrics}>
        <Metric label="Time" value={`${mm}:${ss}`} />
        <Metric label="Walked" value={`${km.toFixed(2)} km`} />
        <Metric label="Budget" value={`${quest.minutes} min`} />
      </View>

      {quest.kind === 'walk' ? (
        <Card style={{ marginTop: 16 }}>
          <View style={styles.rowBetween}>
            <T w="bold">👣 Distance</T>
            <T color={colors.textDim}>{km.toFixed(2)} / {quest.targetKm} km</T>
          </View>
          <View style={{ marginTop: 10 }}>
            <ProgressBar progress={km / quest.targetKm} colorsArr={gradients.primary} height={14} />
          </View>
          <T size={12} color={colors.textMute} style={{ marginTop: 10 }}>
            {settings.demoWalk ? '🎬 Demo walk is on (Profile → Demo). Distance is simulated.' : 'Tracking with GPS. Completes automatically when you reach the target.'}
          </T>
        </Card>
      ) : null}

      <Card style={{ marginTop: 16, alignItems: 'center' }} colorsArr={['#10241B', '#0B1712']}>
        <T size={28}>📵</T>
        <T w="semibold" style={{ textAlign: 'center', marginTop: 6 }}>Put your phone in your pocket.</T>
        <T size={13} color={colors.textDim} style={{ textAlign: 'center', marginTop: 4 }}>
          {quest.kind === 'scan' ? 'Only take it out when you find something worth scanning.' : quest.kind === 'walk' ? 'We’ll buzz you when you hit the distance.' : 'Come back when you’ve found it.'}
        </T>
      </Card>

      <View style={{ gap: 10, marginTop: 22 }}>
        {quest.kind === 'scan' ? (
          <Button id="quest-open-scanner" title="Open Scanner" icon="📸" onPress={() => go('scan')} />
        ) : quest.kind === 'observe' ? (
          <Button id="quest-complete" title="I did it!" icon="✅" onPress={() => completeQuest(quest.id)} />
        ) : null}
        {quest.kind !== 'scan' ? (
          <Button id="quest-scan-anyway" variant="secondary" title="Found something? Scan it" icon="🔍" onPress={() => go('scan')} />
        ) : null}
        <Button id="quest-abandon" variant="ghost" title="Abandon quest" onPress={() => { abandonQuest(); go('home'); }} />
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <T w="black" size={20}>{value}</T>
      <T size={11} color={colors.textDim}>{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 26 },
  metric: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
