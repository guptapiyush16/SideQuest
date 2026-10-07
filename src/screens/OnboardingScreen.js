// First launch: name + interests → first quests.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useGame } from '../store/GameContext';
import { INTEREST_OPTIONS } from '../data/questTemplates';
import { colors, fonts, radius } from '../theme';
import { Bouncy, Button, FadeIn, Label, Pulse, T } from '../components/ui';

export default function OnboardingScreen() {
  const { finishOnboarding } = useGame();
  const [name, setName] = useState('');
  const [interests, setInterests] = useState(['🌳 Trees', '🐦 Birds', '🚶 Walking']);
  const toggle = (i) => setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Pulse size={280} />
        <FadeIn style={{ alignItems: 'center' }}>
          <T size={80}>🧭</T>
          <T w="black" size={40} style={{ marginTop: 10, letterSpacing: -1 }}>
            SideQuest <T w="black" size={40} color={colors.primary}>IRL</T>
          </T>
          <T size={16} color={colors.textDim} style={{ textAlign: 'center', marginTop: 8, lineHeight: 23 }}>
            Go outside → get a quest → discover something{'\n'}→ collect it → earn XP.
          </T>
        </FadeIn>
      </View>

      <FadeIn delay={200}>
        <View style={styles.loop}>
          {['⚔️ Quest', '🌳 Outside', '📸 Scan', '🧬 Collect', '⭐ XP'].map((s, i) => (
            <React.Fragment key={s}>
              <T size={12} w="semibold" color={colors.textDim}>{s}</T>
              {i < 4 ? <T size={12} color={colors.textMute}>›</T> : null}
            </React.Fragment>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={300}>
        <Label style={{ marginTop: 30, marginBottom: 8 }}>What should we call you?</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Explorer name"
          placeholderTextColor={colors.textMute}
          style={styles.input}
          testID="onboard-name"
          nativeID="onboard-name"
        />

        <Label style={{ marginTop: 24, marginBottom: 10 }}>What pulls you outside?</Label>
        <View style={styles.chips}>
          {INTEREST_OPTIONS.map((i) => {
            const on = interests.includes(i);
            return (
              <Bouncy key={i} onPress={() => toggle(i)}>
                <View style={[styles.chip, on && styles.chipOn]}>
                  <T w="semibold" size={14} color={on ? '#062014' : colors.textDim}>{i}</T>
                </View>
              </Bouncy>
            );
          })}
        </View>

        <Button id="onboard-start" title="Get my first SideQuests" icon="⚔️" onPress={() => finishOnboarding({ name: name.trim(), interests })} style={{ marginTop: 32 }} />
        <T size={12} color={colors.textMute} style={{ textAlign: 'center', marginTop: 14 }}>
          The real world is the RPG. The screen is the shortest part.
        </T>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 48 },
  hero: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 10 },
  loop: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 18, flexWrap: 'wrap' },
  input: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderHi, paddingHorizontal: 16, paddingVertical: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
