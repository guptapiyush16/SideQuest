// 📖 Your IRL Pokédex — one species = one entry.
import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useGame } from '../store/GameContext';
import { FIELD_GUIDE, FIELD_GUIDE_SIZE } from '../data/fieldGuide';
import { categoryMeta, colors, getCategory, gradients, radius } from '../theme';
import { shortDate } from '../utils/geo';
import { Bouncy, Button, Card, FadeIn, Label, Pill, ProgressBar, Pulse, Stars, T } from '../components/ui';

export default function PokedexScreen({ go }) {
  const { pokedex } = useGame();
  const [mode, setMode] = useState('mine'); // mine | guide
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const entries = useMemo(() => Object.values(pokedex).sort((a, b) => b.firstSeen - a.firstSeen), [pokedex]);
  const counts = useMemo(() => {
    const c = {};
    entries.forEach((e) => (c[e.category] = (c[e.category] || 0) + 1));
    return c;
  }, [entries]);
  const guideFound = entries.filter((e) => e.inFieldGuide).length;

  const list =
    mode === 'mine'
      ? entries.filter((e) => filter === 'all' || e.category === filter)
      : FIELD_GUIDE.filter((s) => filter === 'all' || s.category === filter).map((s, i) => ({ ...s, slot: FIELD_GUIDE.indexOf(s) + 1, found: pokedex[s.id] }));

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Label>My Pokédex</Label>

      {/* Hero counter */}
      <FadeIn>
        <Card glow colorsArr={gradients.hero} style={styles.hero}>
          <Pulse size={240} style={{ left: -60, top: -80 }} />
          <T size={14} w="semibold" color={colors.primary}>🌎 MY WORLD</T>
          <T w="black" size={64} style={{ lineHeight: 70 }}>{entries.length}</T>
          <T w="bold" size={14} color={colors.textDim} style={{ letterSpacing: 3 }}>DISCOVERED</T>
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <View style={styles.rowBetween}>
              <T size={12} color={colors.textDim}>Field Guide</T>
              <T size={12} w="bold">{guideFound} / {FIELD_GUIDE_SIZE}</T>
            </View>
            <View style={{ marginTop: 6 }}><ProgressBar progress={guideFound / FIELD_GUIDE_SIZE} colorsArr={gradients.primary} /></View>
          </View>
        </Card>
      </FadeIn>

      {/* Category breakdown / filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
        <FilterChip on={filter === 'all'} onPress={() => setFilter('all')} label={`✨ All ${mode === 'mine' ? entries.length : FIELD_GUIDE_SIZE}`} />
        {Object.entries(categoryMeta).filter(([k]) => k !== 'other' || counts.other).map(([k, m]) => (
          <FilterChip key={k} on={filter === k} onPress={() => setFilter(k)} label={`${m.emoji} ${mode === 'mine' ? counts[k] || 0 : FIELD_GUIDE.filter((s) => s.category === k).length} ${m.label}`} />
        ))}
      </ScrollView>

      {/* Mode toggle */}
      <View style={styles.toggle}>
        {[['mine', 'My collection'], ['guide', `Field Guide · ${FIELD_GUIDE_SIZE}`]].map(([k, l]) => (
          <Pressable key={k} onPress={() => setMode(k)} style={[styles.toggleBtn, mode === k && styles.toggleOn]} testID={`dex-mode-${k}`}>
            <T w="semibold" size={13} color={mode === k ? '#062014' : colors.textDim}>{l}</T>
          </Pressable>
        ))}
      </View>

      {mode === 'mine' && !entries.length ? (
        <Card style={{ alignItems: 'center', paddingVertical: 32, marginTop: 8 }}>
          <T size={44}>🧬</T>
          <T w="bold" size={18} style={{ marginTop: 8 }}>Your Pokédex is empty</T>
          <T color={colors.textDim} style={{ textAlign: 'center', marginTop: 6, marginBottom: 18 }}>Go outside and scan your first plant, bird or bug.</T>
          <Button id="dex-go-scan" title="Scan something" icon="📸" onPress={() => go('scan')} />
        </Card>
      ) : null}

      <View style={styles.grid}>
        {list.map((e, i) =>
          mode === 'guide' && !e.found ? (
            <LockedCard key={e.id} e={e} />
          ) : (
            <FadeIn key={e.id} delay={Math.min(i, 10) * 40} style={styles.cell}>
              <EntryCard e={mode === 'guide' ? e.found : e} onPress={() => setSelected(mode === 'guide' ? e.found : e)} />
            </FadeIn>
          )
        )}
      </View>

      <DetailModal entry={selected} onClose={() => setSelected(null)} />
    </ScrollView>
  );
}

function FilterChip({ on, label, onPress }) {
  return (
    <Bouncy onPress={onPress}>
      <View style={[styles.chip, on && styles.chipOn]}>
        <T w="semibold" size={13} color={on ? '#062014' : colors.textDim}>{label}</T>
      </View>
    </Bouncy>
  );
}

function EntryCard({ e, onPress }) {
  const cat = getCategory(e.category);
  return (
    <Bouncy onPress={onPress} testID={`dex-entry-${e.id}`}>
      <View style={[styles.entry, { borderColor: cat.color + '40' }]}>
        <View style={[styles.entryImg, { backgroundColor: cat.color + '14' }]}>
          {e.photoUri ? <Image source={{ uri: e.photoUri }} style={StyleSheet.absoluteFill} /> : <T size={44}>{cat.emoji}</T>}
          <View style={styles.badge}><T w="bold" size={10} color={colors.text}>#{String(e.number || 0).padStart(3, '0')}</T></View>
          {e.count > 1 ? <View style={[styles.badge, { left: undefined, right: 8 }]}><T w="bold" size={10} color={colors.xp}>×{e.count}</T></View> : null}
        </View>
        <View style={{ padding: 10 }}>
          <T w="bold" size={14} numberOfLines={1}>{cat.emoji} {e.name}</T>
          <T size={11} color={colors.textMute} numberOfLines={1} style={{ fontStyle: 'italic' }}>{e.scientific}</T>
          <View style={{ marginTop: 4 }}><Stars n={e.rarity} size={11} /></View>
        </View>
      </View>
    </Bouncy>
  );
}

function LockedCard({ e }) {
  const cat = getCategory(e.category);
  return (
    <View style={styles.cell}>
      <View style={[styles.entry, { opacity: 0.5, borderStyle: 'dashed' }]}>
        <View style={[styles.entryImg, { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
          <T size={40} style={{ opacity: 0.25 }}>{cat.emoji}</T>
          <View style={styles.badge}><T w="bold" size={10} color={colors.textMute}>#{String(e.slot).padStart(3, '0')}</T></View>
        </View>
        <View style={{ padding: 10 }}>
          <T w="bold" size={14} color={colors.textMute}>???</T>
          <T size={11} color={colors.textMute}>{cat.label.replace(/s$/, '')} · {'★'.repeat(e.rarity)}</T>
        </View>
      </View>
    </View>
  );
}

function DetailModal({ entry, onClose }) {
  if (!entry) return null;
  const cat = getCategory(entry.category);
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <ScrollView>
            <View style={[styles.detailImg, { backgroundColor: cat.color + '14' }]}>
              {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={StyleSheet.absoluteFill} /> : <T size={90}>{cat.emoji}</T>}
            </View>
            <View style={{ padding: 22 }}>
              <View style={styles.rowBetween}>
                <Pill color={cat.color}>{cat.emoji} {cat.label.replace(/s$/, '')}</Pill>
                <T w="bold" color={colors.textMute}>#{String(entry.number || 0).padStart(3, '0')}</T>
              </View>
              <T w="black" size={28} style={{ marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{entry.name}</T>
              <T size={16} color={colors.textDim} style={{ fontStyle: 'italic' }}>{entry.scientific}</T>
              <View style={{ marginTop: 10 }}><Stars n={entry.rarity} size={18} /></View>

              <View style={styles.facts}>
                <Fact k="Discovered" v={shortDate(entry.firstSeen)} />
                <Fact k="Location" v={`📍 ${entry.place || 'Unknown'}`} />
                <Fact k="Sightings" v={`👁 ${entry.count}`} />
                <Fact k="ID" v={entry.userConfirmed ? '✋ You confirmed' : entry.confidence ? `🤖 ${entry.confidence}% AI` : '-'} />
              </View>
              {entry.region ? <T color={colors.textDim} style={{ marginTop: 6 }}>🌍 {entry.region}</T> : null}
              {entry.fact ? <T color={colors.textDim} style={{ marginTop: 10, lineHeight: 21 }}>💡 {entry.fact}</T> : null}

              {entry.photos?.length > 1 ? (
                <>
                  <Label style={{ marginTop: 18, marginBottom: 8 }}>Sightings</Label>
                  <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
                    {entry.photos.map((p, i) => <Image key={i} source={{ uri: p }} style={styles.thumb} />)}
                  </ScrollView>
                </>
              ) : null}
              <Button title="Close" variant="secondary" onPress={onClose} style={{ marginTop: 22 }} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Fact({ k, v }) {
  return (
    <View style={styles.fact}>
      <T size={11} color={colors.textMute}>{k}</T>
      <T w="semibold" size={14} numberOfLines={1}>{v}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { alignItems: 'center', marginTop: 10, overflow: 'hidden', paddingVertical: 24 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  entry: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
  entryImg: { height: 120, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bgElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', overflow: 'hidden', borderWidth: 1, borderColor: colors.borderHi },
  detailImg: { height: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  fact: { width: '48%', padding: 12, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 2 },
  thumb: { width: 80, height: 80, borderRadius: 12 },
});
