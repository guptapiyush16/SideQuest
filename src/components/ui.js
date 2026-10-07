// Reusable UI primitives built on the design tokens.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, gradients, radius } from '../theme';

export const tap = (style = Haptics.ImpactFeedbackStyle.Light) => Haptics.impactAsync(style).catch(() => {});

export function T({ style, w = 'regular', size = 15, color = colors.text, children, ...rest }) {
  return (
    <RNText style={[{ fontFamily: fonts[w], fontSize: size, color }, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Label({ children, color = colors.textMute, style }) {
  return (
    <T w="semibold" size={11} color={color} style={[{ letterSpacing: 2, textTransform: 'uppercase' }, style]}>
      {children}
    </T>
  );
}

export function Card({ children, style, glow, colorsArr = gradients.card }) {
  return (
    <LinearGradient colors={colorsArr} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, glow && styles.glow, style]}>
      {children}
    </LinearGradient>
  );
}

/** Pressable that gently scales down — used everywhere for a tactile feel. */
export function Bouncy({ onPress, children, style, disabled, haptic = true, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => to(0.96)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.45 }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, style, disabled, small, id }) {
  const isPrimary = variant === 'primary' || variant === 'xp';
  const content = (
    <View style={[styles.btnInner, small && { paddingVertical: 10, paddingHorizontal: 16 }]}>
      {icon ? <T size={small ? 15 : 18}>{icon}</T> : null}
      <T w="bold" size={small ? 14 : 16} color={isPrimary ? '#062014' : colors.text} style={{ letterSpacing: 0.5 }}>
        {title}
      </T>
    </View>
  );
  return (
    <Bouncy onPress={onPress} disabled={disabled} style={style} nativeID={id} testID={id}>
      {isPrimary ? (
        <LinearGradient colors={variant === 'xp' ? gradients.xp : gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, styles.btnGlow]}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.btn, variant === 'ghost' ? styles.btnGhost : styles.btnSecondary]}>{content}</View>
      )}
    </Bouncy>
  );
}

export function Pill({ children, color = colors.primary, style }) {
  return (
    <View style={[styles.pill, { borderColor: color + '55', backgroundColor: color + '18' }, style]}>
      <T w="semibold" size={12} color={color}>
        {children}
      </T>
    </View>
  );
}

/** Animated XP progress bar. */
export function ProgressBar({ progress = 0, height = 12, colorsArr = gradients.xp, track = 'rgba(255,255,255,0.06)' }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, progress)), duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ width, height: '100%' }}>
        <LinearGradient colors={colorsArr} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: height }} />
      </Animated.View>
    </View>
  );
}

export function Stars({ n = 0, size = 14 }) {
  return (
    <T size={size} color={colors.xp} style={{ letterSpacing: 2 }}>
      {'★'.repeat(n)}
      <T size={size} color={colors.textMute}>
        {'★'.repeat(Math.max(0, 5 - n))}
      </T>
    </T>
  );
}

/** Soft breathing glow used behind hero elements. */
export function Pulse({ size = 220, color = colors.primary, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color },
        { opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] },
        style,
      ]}
    />
  );
}

/** Fade + slide-up on mount, with optional stagger delay. */
export function FadeIn({ delay = 0, children, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border },
  glow: { borderColor: colors.borderHi, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  btn: { borderRadius: radius.pill },
  btnGlow: { shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 22 },
  btnSecondary: { backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.borderHi },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
});
