// SideQuest IRL — design tokens
// Dark "night forest" palette with lime + amber accents.

export const colors = {
  bg: '#07110D',
  bgElevated: '#0D1A14',
  card: '#11221A',
  cardHi: '#162C22',
  border: 'rgba(160, 255, 200, 0.10)',
  borderHi: 'rgba(160, 255, 200, 0.22)',

  text: '#EAF7EF',
  textDim: '#9DB7A8',
  textMute: '#5F7A6B',

  primary: '#7CF29A', // lime
  primaryDeep: '#2FBF71',
  xp: '#FFC857', // amber
  xpDeep: '#FF9F1C',
  sky: '#6CC7FF',
  violet: '#B79CFF',
  danger: '#FF6B6B',
  warn: '#FFB347',
};

export const gradients = {
  primary: ['#9BFFB4', '#2FBF71'],
  xp: ['#FFE08A', '#FF9F1C'],
  hero: ['#143325', '#0B1A13'],
  card: ['#14281F', '#0E1D16'],
  scan: ['#7CF29A', '#36D1C4'],
  night: ['#0A1A13', '#07110D'],
};

export const categoryMeta = {
  plant: { emoji: '🌳', label: 'Plants', color: '#7CF29A' },
  flower: { emoji: '🌸', label: 'Flowers', color: '#FF8FC7' },
  bird: { emoji: '🐦', label: 'Birds', color: '#6CC7FF' },
  insect: { emoji: '🦋', label: 'Insects', color: '#B79CFF' },
  mushroom: { emoji: '🍄', label: 'Fungi', color: '#FF9F6B' },
  rock: { emoji: '🪨', label: 'Rocks', color: '#C9B79C' },
  animal: { emoji: '🐿️', label: 'Animals', color: '#FFC857' },
  other: { emoji: '✨', label: 'Others', color: '#9DB7A8' },
};

export const getCategory = (c) => categoryMeta[c] || categoryMeta.other;

export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  black: 'Outfit_800ExtraBold',
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = (n) => n * 4;
