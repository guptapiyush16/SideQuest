// 📸 AI Discovery Scanner — photo → Field Guide AI → Pokédex.
// Uncertain results are shown as "POSSIBLE MATCH", never as fact.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGame } from '../store/GameContext';
import { identifyPhoto } from '../ai/fieldGuide';
import { speciesKey } from '../data/fieldGuide';
import { colors, getCategory, gradients, radius } from '../theme';
import { Bouncy, Button, Card, FadeIn, Label, Pill, ProgressBar, Pulse, Stars, T } from '../components/ui';

const CATS = ['🌳', '🌸', '🐦', '🍄', '🪨', '🦋'];

export default function ScanScreen({ go }) {
  const { settings, pokedex, addDiscovery, activeQuest, today } = useGame();
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [picked, setPicked] = useState(null); // candidate index chosen in possible-match mode
  const activeScanQuest = today?.quests.find((q) => q.id === activeQuest?.id && q.kind === 'scan');

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setPicked(null);
  };

  const pick = async (fromCamera) => {
    const opts = { mediaTypes: ['images'], quality: 0.45, base64: true, allowsEditing: true, aspect: [1, 1] };
    let res;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      res = await ImagePicker.launchCameraAsync(opts);
    } else {
      res = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const base64 = a.base64 || (a.uri?.startsWith('data:') ? a.uri.split(',')[1] : null);
    setPhoto({ uri: a.uri, base64 });
    setResult(null);
    setPicked(null);
    setScanning(true);
    const r = await identifyPhoto({ base64, settings });
    setResult(r);
    setScanning(false);
  };

  const add = (cand, userConfirmed = false) => {
    addDiscovery(cand, {
      photoUri: photo?.uri,
      region: result.region,
      fact: result.fact,
      confidence: cand.confidence,
      userConfirmed,
    });
    reset();
    go(activeScanQuest ? 'quest' : 'pokedex');
  };

  // ---------- idle ----------
  if (!photo) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Label>AI Discovery Scanner</Label>
        <T w="black" size={30} style={{ marginTop: 4 }}>What did you find?</T>
        <T color={colors.textDim} style={{ marginTop: 6 }}>Point your camera at something alive or wild. Your Field Guide will try to identify it.</T>

        {activeScanQuest ? (
          <Card style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <T size={26}>{activeScanQuest.emoji}</T>
            <View style={{ flex: 1 }}>
              <T w="bold" size={12} color={colors.primary}>ACTIVE QUEST</T>
              <T w="semibold">{activeScanQuest.description}</T>
            </View>
          </Card>
        ) : null}

        <View style={styles.viewfinderWrap}>
          <Pulse size={300} color={colors.primary} />
          <Bouncy onPress={() => pick(true)} testID="scan-camera" nativeID="scan-camera">
            <View style={styles.viewfinder}>
              <Corner style={{ top: 0, left: 0 }} r="tl" />
              <Corner style={{ top: 0, right: 0 }} r="tr" />
              <Corner style={{ bottom: 0, left: 0 }} r="bl" />
              <Corner style={{ bottom: 0, right: 0 }} r="br" />
              <T size={64}>📸</T>
              <T w="bold" size={18} style={{ marginTop: 10 }}>Tap to scan</T>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                {CATS.map((c) => <T key={c} size={22}>{c}</T>)}
              </View>
            </View>
          </Bouncy>
        </View>

        <Button id="scan-take-photo" title="Take Photo" icon="📷" onPress={() => pick(true)} />
        <Button id="scan-gallery" variant="secondary" title="Choose from gallery" icon="🖼️" onPress={() => pick(false)} style={{ marginTop: 10 }} />
        <T size={12} color={colors.textMute} style={{ textAlign: 'center', marginTop: 16 }}>
          {settings.aiEnabled ? `👁️ Vision model: ${settings.visionModel} (local, via Ollama)` : '🎬 AI disabled. Results will be simulated demo IDs.'}
        </T>
      </ScrollView>
    );
  }

  // ---------- photo + scanning / result ----------
  const top = result?.candidates?.[0];
  const alreadyHave = top && pokedex[speciesKey(top.name, top.scientific)];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.photoFrame}>
        <Image source={{ uri: photo.uri }} style={styles.photo} />
        {scanning ? <ScanLine /> : null}
      </View>

      {scanning ? (
        <View style={{ alignItems: 'center', marginTop: 24, gap: 6 }}>
          <T w="bold" size={18}>🔍 Analyzing…</T>
          <T color={colors.textDim} size={13}>The Field Guide is studying leaves, feathers and wings.</T>
        </View>
      ) : null}

      {result?.source === 'demo' ? (
        <View style={styles.demoBanner}>
          <T size={12} w="semibold" color={colors.warn}>
            🎬 DEMO MODE: AI offline{result.error ? ' (couldn’t reach Ollama)' : ''}. This is a simulated result, not a real identification.
          </T>
        </View>
      ) : null}

      {result?.status === 'identified' && top ? (
        <FadeIn>
          <Card glow style={{ marginTop: 16 }}>
            <Label color={colors.primary}>🔍 Identified</Label>
            <T w="black" size={30} style={{ marginTop: 6 }}>{top.name}</T>
            <T size={16} color={colors.textDim} style={{ fontStyle: 'italic' }}>{top.scientific}</T>
            <View style={{ marginTop: 14 }}>
              <View style={styles.rowBetween}>
                <T size={13} color={colors.textDim}>Confidence</T>
                <T w="bold" color={colors.primary}>{top.confidence}%</T>
              </View>
              <View style={{ marginTop: 6 }}><ProgressBar progress={top.confidence / 100} colorsArr={gradients.primary} height={8} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <Pill color={getCategory(top.category).color}>{getCategory(top.category).emoji} {getCategory(top.category).label.replace(/s$/, '')}</Pill>
              {result.region ? <Pill color={colors.textDim}>📍 {result.region}</Pill> : null}
            </View>
            <View style={{ marginTop: 10 }}><Stars n={top.rarity} /></View>
            {result.fact ? <T size={14} color={colors.textDim} style={{ marginTop: 10, lineHeight: 20 }}>💡 {result.fact}</T> : null}
          </Card>
          {alreadyHave ? <T w="semibold" color={colors.xp} style={{ textAlign: 'center', marginTop: 14 }}>Already in your Pokédex. You’ll earn +5 XP for spotting it again.</T> : null}
          <Button id="scan-add-pokedex" title={alreadyHave ? 'Log sighting' : 'Add to Pokédex'} icon="🧬" onPress={() => add(top)} style={{ marginTop: 16 }} />
          <Button id="scan-retry" variant="ghost" title="Not right? Try another photo" onPress={reset} style={{ marginTop: 10 }} />
        </FadeIn>
      ) : null}

      {result?.status === 'possible' ? (
        <FadeIn>
          <Card style={{ marginTop: 16 }}>
            <Label color={colors.warn}>🤔 Possible match</Label>
            <T size={13} color={colors.textDim} style={{ marginTop: 6, marginBottom: 12 }}>
              The Field Guide isn’t sure. A closer, sharper photo of leaves, flowers or markings helps.
            </T>
            {result.candidates.map((c, i) => (
              <Bouncy key={i} onPress={() => setPicked(i)} testID={`candidate-${i}`}>
                <View style={[styles.candidate, picked === i && { borderColor: colors.primary, backgroundColor: 'rgba(124,242,154,0.08)' }]}>
                  <View style={styles.rowBetween}>
                    <T w="bold" style={{ flex: 1 }}>{i + 1}. {getCategory(c.category).emoji} {c.name}</T>
                    <T w="bold" color={colors.warn}>{c.confidence}%</T>
                  </View>
                  <T size={12} color={colors.textMute} style={{ fontStyle: 'italic', marginBottom: 6 }}>{c.scientific}</T>
                  <ProgressBar progress={c.confidence / 100} height={6} colorsArr={['#FFD58A', '#FFB347']} />
                </View>
              </Bouncy>
            ))}
            {result.other > 0 ? (
              <View style={[styles.candidate, { opacity: 0.6 }]}>
                <View style={styles.rowBetween}>
                  <T w="bold">{result.candidates.length + 1}. Other</T>
                  <T w="bold" color={colors.textDim}>{result.other}%</T>
                </View>
              </View>
            ) : null}
          </Card>
          <Button id="scan-try-another" title="Try another photo" icon="📷" onPress={() => pick(true)} style={{ marginTop: 16 }} />
          {picked !== null ? (
            <Button
              id="scan-confirm-candidate"
              variant="secondary"
              title={`I’m sure it’s ${result.candidates[picked].name}`}
              icon="✋"
              onPress={() => add(result.candidates[picked], true)}
              style={{ marginTop: 10 }}
            />
          ) : (
            <T size={12} color={colors.textMute} style={{ textAlign: 'center', marginTop: 12 }}>
              Know what it is? Tap a match to confirm it yourself. It’ll be marked “user-confirmed”.
            </T>
          )}
          <Button variant="ghost" title="Cancel" onPress={reset} style={{ marginTop: 10 }} />
        </FadeIn>
      ) : null}

      {result?.status === 'unknown' ? (
        <FadeIn>
          <Card style={{ marginTop: 16, alignItems: 'center' }}>
            <T size={40}>🫥</T>
            <T w="bold" size={18} style={{ marginTop: 6 }}>No natural subject found</T>
            <T size={13} color={colors.textDim} style={{ textAlign: 'center', marginTop: 6 }}>
              Try getting closer to a plant, bird, insect, mushroom or rock.
            </T>
          </Card>
          <Button id="scan-try-again" title="Try another photo" icon="📷" onPress={() => pick(true)} style={{ marginTop: 16 }} />
          <Button variant="ghost" title="Cancel" onPress={reset} style={{ marginTop: 10 }} />
        </FadeIn>
      ) : null}
    </ScrollView>
  );
}

function Corner({ style, r }) {
  const b = 3;
  const map = {
    tl: { borderTopWidth: b, borderLeftWidth: b, borderTopLeftRadius: 22 },
    tr: { borderTopWidth: b, borderRightWidth: b, borderTopRightRadius: 22 },
    bl: { borderBottomWidth: b, borderLeftWidth: b, borderBottomLeftRadius: 22 },
    br: { borderBottomWidth: b, borderRightWidth: b, borderBottomRightRadius: 22 },
  };
  return <View style={[{ position: 'absolute', width: 40, height: 40, borderColor: colors.primary }, map[r], style]} />;
}

function ScanLine() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: colors.primary,
        shadowColor: colors.primary, shadowOpacity: 1, shadowRadius: 12, elevation: 8,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, 316] }) }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewfinderWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 28 },
  viewfinder: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: 'rgba(124,242,154,0.04)' },
  photoFrame: { width: '100%', aspectRatio: 1, maxHeight: 320, alignSelf: 'center', borderRadius: radius.xl, overflow: 'hidden', borderWidth: 2, borderColor: colors.borderHi, backgroundColor: colors.card },
  photo: { width: '100%', height: '100%' },
  demoBanner: { marginTop: 14, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,179,71,0.08)', borderWidth: 1, borderColor: 'rgba(255,179,71,0.3)' },
  candidate: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.02)' },
});
