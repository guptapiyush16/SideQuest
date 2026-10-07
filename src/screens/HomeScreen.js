// 🏠 Home — level card + today's 3 SideQuests.
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../store/GameContext';
import { colors, gradients, radius } from '../theme';
import { greeting } from '../utils/geo';
import { XP } from '../utils/xp';
import { FIELD_GUIDE_SIZE } from '../data/fieldGuide';
import { TIME_OPTIONS } from '../data/questTemplates';
import { Bouncy, Button, Card, FadeIn, Label, Pill, ProgressBar, Pulse, T } from '../components/ui';

const KIND = {
  scan: { label: '📸 Scan', color: colors.sky },
  walk: { label: '👣 Walk', color: colors.primary },
  observe: { label: '👀 Observe', color: colors.violet },
};

export default function HomeScreen({ go }) {
  const g = useGame();
  const { level, today, questsLoading, settings, pokedex, activeQuest } = g;
  const quests = today?.quests || [];
  const done = quests.filter((q) => q.status === 'done').length;
  const discovered = Object.keys(pokedex).length;
  const guideFound = Object.values(pokedex).filter((e) => e.inFieldGuide).length;
  const active = quests.find((q) => q.id === activeQuest?.id);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <FadeIn>
        <View style={styles.header}>
          <View>
            <T size={14} color={colors.textDim}>
              {greeting()}{settings.name ? `, ${settings.name}` : ''} 👋
            </T>
            <T w="black" size={28} style={{ letterSpacing: -0.5 }}>
              SideQuest <T w="black" size={28} color={colors.primary}>IRL</T>
            </T>
          </View>
          {g.place ? <Pill color={colors.textDim}>📍 {g.place}</Pill> : null}
        </View>
      </FadeIn>

      {/* Level card */}
      <FadeIn delay={80}>
        <Card glow colorsArr={gradients.hero} style={{ overflow: 'hidden' }}>
          <Pulse size={260} style={{ right: -90, top: -110 }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <Label color={colors.primary}>{level.title}</Label>
              <T w="black" size={44} style={{ lineHeight: 50 }}>LEVEL {level.level}</T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T w="black" size={22} color={colors.xp}>{g.xp}</T>
              <T size={12} color={colors.textDim}>total XP</T>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <ProgressBar progress={level.progress} height={14} />
            <View style={styles.rowBetween}>
              <T size={12} color={colors.textDim}>{level.current} / {level.needed} XP</T>
              <T size={12} color={colors.textDim}>{level.needed - level.current} to level {level.level + 1}</T>
            </View>
          </View>
          <View style={styles.statRow}>
            <Stat icon="🧬" value={discovered} label="discovered" />
            <Stat icon="🌎" value={`${guideFound}/${FIELD_GUIDE_SIZE}`} label="field guide" />
            <Stat icon="⚔️" value={`${done}/3`} label="today" />
          </View>
        </Card>
      </FadeIn>

      {/* Active quest banner */}
      {active ? (
        <FadeIn>
          <Bouncy onPress={() => go('quest')} testID="resume-quest">
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeBanner}>
              <T size={26}>{active.emoji}</T>
              <View style={{ flex: 1 }}>
                <T w="bold" size={12} color="#0B3320">QUEST IN PROGRESS</T>
                <T w="bold" size={16} color="#062014">{active.title}</T>
              </View>
              <T w="bold" color="#062014">Resume →</T>
            </LinearGradient>
          </Bouncy>
        </FadeIn>
      ) : null}

      {/* Today */}
      <View style={[styles.rowBetween, { marginTop: 28, marginBottom: 12 }]}>
        <View>
          <Label>Today's SideQuests</Label>
          <T size={12} color={colors.textMute} style={{ marginTop: 4 }}>
            {today?.source === 'ai' ? `🧠 Crafted by Quest Master · ${settings.textModel}` : '📦 Offline quest deck'}
          </T>
        </View>
        <Bouncy onPress={() => g.refreshQuests(true)} disabled={questsLoading || !!active} testID="reroll-quests">
          <View style={styles.reroll}>
            <T size={13} w="semibold" color={colors.textDim}>🎲 New set</T>
          </View>
        </Bouncy>
      </View>

      {/* Available time */}
      <View style={styles.timeRow}>
        <T size={13} color={colors.textDim}>I have</T>
        {TIME_OPTIONS.map((m) => (
          <Bouncy key={m} onPress={() => g.updateSettings({ minutes: m })} testID={`time-${m}`}>
            <View style={[styles.chip, settings.minutes === m && styles.chipOn]}>
              <T w="semibold" size={13} color={settings.minutes === m ? '#062014' : colors.textDim}>{m} min</T>
            </View>
          </Bouncy>
        ))}
      </View>

      {questsLoading ? (
        <Card style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}>
          <ActivityIndicator color={colors.primary} />
          <T color={colors.textDim}>The Quest Master is reading the world around you…</T>
        </Card>
      ) : (
        quests.map((q, i) => (
          <FadeIn key={q.id} delay={120 + i * 90}>
            <QuestCard q={q} disabled={!!active && active.id !== q.id} onStart={() => { g.startQuest(q.id); go('quest'); }} onResume={() => go('quest')} />
          </FadeIn>
        ))
      )}

      {/* Daily challenge */}
      {quests.length ? (
        <Card style={{ marginTop: 6 }}>
          <View style={styles.rowBetween}>
            <T w="bold">🏆 Daily challenge</T>
            <Pill color={colors.xp}>+{XP.DAILY_CHALLENGE} XP</Pill>
          </View>
          <T size={13} color={colors.textDim} style={{ marginVertical: 8 }}>
            {today?.bonusClaimed ? 'Claimed! See you tomorrow, explorer.' : 'Complete all 3 SideQuests today.'}
          </T>
          <ProgressBar progress={done / 3} colorsArr={gradients.primary} height={8} />
        </Card>
      ) : null}

      {today?.error ? (
        <T size={11} color={colors.textMute} style={{ marginTop: 12, textAlign: 'center' }}>
          AI offline ({today.error.slice(0, 60)}). Using the quest deck. Check Profile → AI settings.
        </T>
      ) : null}
    </ScrollView>
  );
}

function Stat({ icon, value, label }) {
  return (
    <View style={styles.stat}>
      <T size={16}>{icon}</T>
      <T w="bold" size={16}>{value}</T>
      <T size={11} color={colors.textDim}>{label}</T>
    </View>
  );
}

function QuestCard({ q, onStart, onResume, disabled }) {
  const kind = KIND[q.kind] || KIND.observe;
  const isDone = q.status === 'done';
  const isActive = q.status === 'active';
  return (
    <Card style={[styles.quest, isDone && { opacity: 0.6 }, isActive && { borderColor: colors.primary }]}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={[styles.questIcon, { backgroundColor: kind.color + '1A', borderColor: kind.color + '40' }]}>
          <T size={28}>{isDone ? '✅' : q.emoji}</T>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <T w="bold" size={18} style={[{ flex: 1 }, isDone && { textDecorationLine: 'line-through' }]}>{q.title}</T>
            <T w="black" size={16} color={colors.xp}>+{q.xp} XP</T>
          </View>
          <T size={14} color={colors.textDim} style={{ marginTop: 4, lineHeight: 20 }}>{q.description}</T>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <Pill color={kind.color}>{kind.label}{q.targetKm ? ` ${q.targetKm} km` : ''}</Pill>
            <Pill color={colors.textDim}>⏱ ~{q.minutes} min</Pill>
          </View>
        </View>
      </View>
      {!isDone ? (
        <Button
          id={`start-quest-${q.title.replace(/\s+/g, '-').toLowerCase()}`}
          small
          title={isActive ? 'Resume quest' : 'Start Quest'}
          icon={isActive ? '▶️' : '⚔️'}
          variant={isActive ? 'primary' : 'secondary'}
          onPress={isActive ? onResume : onStart}
          disabled={disabled}
          style={{ marginTop: 14 }}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  statRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingVertical: 10, gap: 2 },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: 14, marginTop: 16 },
  reroll: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  quest: { marginBottom: 12 },
  questIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
