// 🗺️ Adventure History — where you've actually been.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useGame } from '../store/GameContext';
import { colors, getCategory, gradients, radius } from '../theme';
import { dayKey, prettyDay } from '../utils/geo';
import { Card, FadeIn, Label, T } from '../components/ui';

export default function AdventuresScreen() {
  const { history } = useGame();
  const days = useMemo(
    () => Object.entries(history).filter(([, d]) => d.distanceKm > 0.01 || d.discoveries || d.questsCompleted).sort(([a], [b]) => (a < b ? 1 : -1)),
    [history]
  );
  const totals = days.reduce(
    (t, [, d]) => ({ km: t.km + d.distanceKm, min: t.min + d.minutes, disc: t.disc + d.discoveries, quests: t.quests + d.questsCompleted }),
    { km: 0, min: 0, disc: 0, quests: 0 }
  );
  const streak = useMemo(() => {
    let n = 0;
    const has = (k) => days.some(([dk]) => dk === k);
    let cursor = new Date();
    if (!has(dayKey(cursor))) cursor = new Date(Date.now() - 864e5);
    while (has(dayKey(cursor))) {
      n += 1;
      cursor = new Date(cursor.getTime() - 864e5);
    }
    return n;
  }, [days]);

  const points = days.flatMap(([, d]) => d.points || []);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Label>My Adventures</Label>
      <T w="black" size={30} style={{ marginTop: 4 }}>The real world is the RPG.</T>

      <FadeIn>
        <Card glow colorsArr={gradients.hero} style={{ marginTop: 16 }}>
          <View style={styles.totals}>
            <Total icon="🚶" v={`${totals.km.toFixed(1)}`} unit="km" />
            <Total icon="⏱" v={`${totals.min}`} unit="min" />
            <Total icon="🌱" v={`${totals.disc}`} unit="finds" />
            <Total icon="⚔️" v={`${totals.quests}`} unit="quests" />
          </View>
          <View style={styles.streak}>
            <T size={22}>🔥</T>
            <T w="bold">{streak}-day streak</T>
            <T size={12} color={colors.textDim} style={{ marginLeft: 'auto' }}>{streak ? 'Keep it alive tomorrow!' : 'Start one today'}</T>
          </View>
        </Card>
      </FadeIn>

      {points.length >= 2 ? <ExplorationMap points={points} /> : null}

      <Label style={{ marginTop: 26, marginBottom: 10 }}>Journal</Label>
      {!days.length ? (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <T size={44}>🥾</T>
          <T w="bold" size={18} style={{ marginTop: 8 }}>No adventures yet</T>
          <T color={colors.textDim} style={{ textAlign: 'center', marginTop: 6 }}>Start a SideQuest and your journey will appear here.</T>
        </Card>
      ) : (
        days.map(([k, d], i) => (
          <FadeIn key={k} delay={i * 60}>
            <View style={styles.dayRow}>
              <View style={styles.timeline}>
                <View style={[styles.dot, i === 0 && { backgroundColor: colors.primary }]} />
                {i < days.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <Card style={{ flex: 1, marginBottom: 12 }}>
                <T w="bold" size={17}>{prettyDay(k)}</T>
                <View style={styles.dayStats}>
                  <DayStat icon="🚶" v={`${d.distanceKm.toFixed(1)} km`} />
                  <DayStat icon="⏱" v={`${d.minutes} min`} />
                  <DayStat icon="🌱" v={`${d.discoveries} discover${d.discoveries === 1 ? 'y' : 'ies'}`} />
                  <DayStat icon="⚔️" v={`${d.questsCompleted} quest${d.questsCompleted === 1 ? '' : 's'}`} />
                </View>
                {d.newDiscoveries ? <T size={12} color={colors.primary} style={{ marginTop: 8 }}>✨ {d.newDiscoveries} new to your Pokédex</T> : null}
              </Card>
            </View>
          </FadeIn>
        ))
      )}
    </ScrollView>
  );
}

/** A lightweight "map": normalised scatter of GPS points. No map SDK needed for v1. */
function ExplorationMap({ points }) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const spanLat = Math.max(maxLat - minLat, 0.002);
  const spanLng = Math.max(maxLng - minLng, 0.002);
  return (
    <Card style={{ marginTop: 16 }}>
      <Label color={colors.primary}>My Exploration</Label>
      <View style={styles.map}>
        {[0.25, 0.5, 0.75].map((f) => (
          <React.Fragment key={f}>
            <View style={[styles.grid, { top: `${f * 100}%`, left: 0, right: 0, height: 1 }]} />
            <View style={[styles.grid, { left: `${f * 100}%`, top: 0, bottom: 0, width: 1 }]} />
          </React.Fragment>
        ))}
        {points.map((p, i) => {
          const x = ((p.lng - minLng) / spanLng) * 88 + 6;
          const y = (1 - (p.lat - minLat) / spanLat) * 84 + 8;
          const isPath = p.t === 'path';
          return isPath ? (
            <View key={i} style={[styles.pathDot, { left: `${x}%`, top: `${y}%` }]} />
          ) : (
            <T key={i} size={18} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, marginLeft: -9, marginTop: -11 }}>
              {getCategory(p.t).emoji}
            </T>
          );
        })}
      </View>
    </Card>
  );
}

function Total({ icon, v, unit }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T size={18}>{icon}</T>
      <T w="black" size={22}>{v}</T>
      <T size={11} color={colors.textDim}>{unit}</T>
    </View>
  );
}

function DayStat({ icon, v }) {
  return (
    <View style={styles.dayStat}>
      <T size={14}>{icon}</T>
      <T size={13} color={colors.textDim}>{v}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  totals: { flexDirection: 'row' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,159,28,0.08)', borderWidth: 1, borderColor: 'rgba(255,159,28,0.25)' },
  map: { height: 220, marginTop: 12, borderRadius: radius.md, backgroundColor: '#0A1712', overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  grid: { position: 'absolute', backgroundColor: 'rgba(124,242,154,0.06)' },
  pathDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, marginLeft: -2.5, marginTop: -2.5, backgroundColor: colors.primary, opacity: 0.6 },
  dayRow: { flexDirection: 'row', gap: 12 },
  timeline: { width: 14, alignItems: 'center', paddingTop: 22 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textMute, borderWidth: 2, borderColor: colors.bg },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  dayStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  dayStat: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
});
