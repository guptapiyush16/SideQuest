// 🎒 Profile — interests, AI (Ollama) settings, demo mode.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useGame } from '../store/GameContext';
import { ollamaTags, guessOllamaUrl } from '../ai/ollama';
import { INTEREST_OPTIONS } from '../data/questTemplates';
import { colors, fonts, gradients, radius } from '../theme';
import { Bouncy, Button, Card, Label, ProgressBar, T } from '../components/ui';

export default function ProfileScreen() {
  const g = useGame();
  const { settings, updateSettings, level } = g;
  const [test, setTest] = useState(null); // { ok, models?, error? }
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleInterest = (i) =>
    updateSettings({ interests: settings.interests.includes(i) ? settings.interests.filter((x) => x !== i) : [...settings.interests, i] });

  const runTest = async () => {
    setTesting(true);
    try {
      const models = await ollamaTags(settings.ollamaUrl);
      setTest({ ok: true, models });
    } catch (e) {
      setTest({ ok: false, error: e.message || 'Unreachable' });
    }
    setTesting(false);
  };
  const has = (m) => test?.models?.some((x) => x === m || x.startsWith(`${m}:`));

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Label>Profile</Label>

      <Card glow colorsArr={gradients.hero} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={styles.avatar}><T size={34}>🧭</T></View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={settings.name}
            onChangeText={(name) => updateSettings({ name })}
            placeholder="Your explorer name"
            placeholderTextColor={colors.textMute}
            style={[styles.nameInput]}
            testID="profile-name"
          />
          <T size={13} color={colors.primary}>Level {level.level} · {level.title}</T>
          <View style={{ marginTop: 8 }}><ProgressBar progress={level.progress} height={6} /></View>
        </View>
      </Card>

      <Label style={styles.section}>Interests</Label>
      <T size={13} color={colors.textDim} style={{ marginBottom: 10 }}>The Quest Master uses these to personalise your quests.</T>
      <View style={styles.chips}>
        {INTEREST_OPTIONS.map((i) => {
          const on = settings.interests.includes(i);
          return (
            <Bouncy key={i} onPress={() => toggleInterest(i)}>
              <View style={[styles.chip, on && styles.chipOn]}>
                <T w="semibold" size={13} color={on ? '#062014' : colors.textDim}>{i}</T>
              </View>
            </Bouncy>
          );
        })}
      </View>

      <Label style={styles.section}>Open-source AI · Ollama</Label>
      <Card>
        <Row title="Use local AI" sub="Off = offline quest deck + simulated demo IDs">
          <Switch value={settings.aiEnabled} onValueChange={(aiEnabled) => updateSettings({ aiEnabled })} trackColor={{ true: colors.primaryDeep, false: '#2A3A32' }} thumbColor={settings.aiEnabled ? colors.primary : '#888'} />
        </Row>

        <Field label="Ollama URL" value={settings.ollamaUrl} onChange={(ollamaUrl) => updateSettings({ ollamaUrl })} id="ollama-url" />
        <T size={11} color={colors.textMute} style={{ marginTop: -4, marginBottom: 8 }}>
          Your computer's LAN IP, port 11434. Detected: {guessOllamaUrl()}
        </T>
        <Field label="🧠 Quest Master (text model)" value={settings.textModel} onChange={(textModel) => updateSettings({ textModel })} id="text-model" ok={test?.ok ? has(settings.textModel) : undefined} />
        <Field label="👁️ Field Guide (vision model)" value={settings.visionModel} onChange={(visionModel) => updateSettings({ visionModel })} id="vision-model" ok={test?.ok ? has(settings.visionModel) : undefined} />

        <Button id="test-ollama" small variant="secondary" title={testing ? 'Testing…' : 'Test connection'} icon="🔌" onPress={runTest} disabled={testing} style={{ marginTop: 6 }} />
        {test ? (
          <View style={[styles.testBox, { borderColor: test.ok ? colors.primary + '55' : colors.danger + '55' }]}>
            <T w="semibold" size={13} color={test.ok ? colors.primary : colors.danger}>
              {test.ok ? `✅ Connected · ${test.models.length} model(s)` : `❌ ${test.error}`}
            </T>
            {test.ok ? <T size={12} color={colors.textDim} style={{ marginTop: 4 }}>{test.models.join(', ') || 'No models pulled yet'}</T> : (
              <T size={12} color={colors.textDim} style={{ marginTop: 4 }}>
                On your PC: set OLLAMA_HOST=0.0.0.0, restart Ollama, and keep the phone on the same Wi-Fi.
              </T>
            )}
          </View>
        ) : null}
      </Card>

      <Label style={styles.section}>Demo</Label>
      <Card>
        <Row title="🎬 Simulate walking" sub="For indoor demos: walk quests progress automatically">
          <Switch value={settings.demoWalk} onValueChange={(demoWalk) => updateSettings({ demoWalk })} trackColor={{ true: colors.primaryDeep, false: '#2A3A32' }} thumbColor={settings.demoWalk ? colors.primary : '#888'} />
        </Row>
        <Button
          id="reset-data"
          small
          variant="ghost"
          title={confirmReset ? 'Tap again to erase everything' : 'Reset all progress'}
          icon="🗑️"
          onPress={() => (confirmReset ? g.resetAll() : setConfirmReset(true))}
          style={{ marginTop: 8 }}
        />
      </Card>

      <Label style={styles.section}>How the AI works</Label>
      <Card>
        <Explain icon="🧠" title="Quest Master" text="User context → open-weight LLM → 3 safe, personalised SideQuests." />
        <Explain icon="👁️" title="Field Guide" text="Camera image → vision model → species + honest confidence." />
        <Explain icon="🎒" title="Adventure Memory" text="Past quests + discoveries + interests → better future quests." />
        <T size={12} color={colors.textMute} style={{ marginTop: 6 }}>Everything runs locally. Your photos never leave your network.</T>
      </Card>

      <T size={12} color={colors.textMute} style={{ textAlign: 'center', marginTop: 24 }}>
        The AI isn’t trying to keep you on the screen.{'\n'}It gives you a reason to put the phone down. 🌳
      </T>
    </ScrollView>
  );
}

function Row({ title, sub, children }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <T w="semibold">{title}</T>
        {sub ? <T size={12} color={colors.textMute}>{sub}</T> : null}
      </View>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, id, ok }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T size={12} color={colors.textDim} style={{ marginBottom: 4 }}>{label}</T>
        {ok === true ? <T size={12} color={colors.primary}>installed ✓</T> : ok === false ? <T size={12} color={colors.warn}>not pulled</T> : null}
      </View>
      <TextInput value={value} onChangeText={onChange} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholderTextColor={colors.textMute} testID={id} nativeID={id} />
    </View>
  );
}

function Explain({ icon, title, text }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
      <T size={22}>{icon}</T>
      <View style={{ flex: 1 }}>
        <T w="bold">{title}</T>
        <T size={13} color={colors.textDim}>{text}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  section: { marginTop: 26, marginBottom: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,242,154,0.12)', borderWidth: 2, borderColor: colors.primary },
  nameInput: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, padding: 0, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  testBox: { marginTop: 10, padding: 10, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
});
