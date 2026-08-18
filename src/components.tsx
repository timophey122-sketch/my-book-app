import React from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './constants';
import { MascotStyle } from './types';

export function MagicBackground({ children }: React.PropsWithChildren) {
  return <SafeAreaView style={styles.screen}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />
      <Text style={styles.stars}>✦  ·  ✧{`\n`}  ✦   ·   ✦{`\n`}·   ✧</Text>
    </View>
    {children}
  </SafeAreaView>;
}

const mascotPalettes: Record<MascotStyle, { book: string; cover: string; hat: string; gem: string }> = {
  cute: { book: '#b98544', cover: '#915e2d', hat: '#274aa0', gem: '#6ff0ff' },
  adventure: { book: '#2d7890', cover: '#184d66', hat: '#6342a8', gem: '#ffd95a' },
  scholar: { book: '#693d91', cover: '#42255f', hat: '#17235f', gem: '#ff7bd1' },
};

export function MagicMascot({ styleId = 'cute', size = 92 }: { styleId?: MascotStyle; size?: number }) {
  const palette = mascotPalettes[styleId];
  const scale = size / 92;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={[styles.mascotGlow, { width: size * .92, height: size * .92, borderColor: palette.gem }]} />
    <View style={[styles.hat, { borderBottomColor: palette.hat, transform: [{ scale }] }]} />
    <View style={[styles.hatBand, { backgroundColor: palette.gem, transform: [{ scale }] }]} />
    <View style={[styles.bookFace, { backgroundColor: palette.book, borderColor: palette.cover, transform: [{ scale }] }]}>
      <View style={styles.eyeRow}><View style={styles.eye} /><View style={styles.eye} /></View>
      <View style={styles.smile} />
    </View>
    <View style={[styles.staff, { backgroundColor: '#7b512f', transform: [{ scale }, { rotate: '-18deg' }] }]} />
    <View style={[styles.staffOrb, { backgroundColor: palette.gem, transform: [{ scale }] }]} />
  </View>;
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, danger = false, disabled = false }: { title: string; onPress(): void; danger?: boolean; disabled?: boolean }) {
  return <TouchableOpacity disabled={disabled} activeOpacity={.85} onPress={onPress} style={[styles.primaryButton, danger && { backgroundColor: COLORS.danger }, disabled && { opacity: .5 }]}>
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>;
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return <View style={styles.track}><View style={[styles.fill, { width: `${safe}%` }]} /></View>;
}

export function BottomTabs({ active, tabs, onChange }: { active: string; tabs: { id: string; icon: string; title: string }[]; onChange(id: string): void }) {
  return <View style={styles.tabs}>{tabs.map((tab) => <TouchableOpacity key={tab.id} onPress={() => onChange(tab.id)} style={[styles.tab, active === tab.id && styles.tabActive]}>
    <Text style={styles.tabIcon}>{tab.icon}</Text><Text style={[styles.tabText, active === tab.id && styles.tabTextActive]}>{tab.title}</Text>
  </TouchableOpacity>)}</View>;
}

export function Sheet({ visible, title, children, onClose }: React.PropsWithChildren<{ visible: boolean; title: string; onClose(): void }>) {
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <Pressable onPress={onClose} style={styles.backdrop} />
    <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>{title}</Text><TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity></View>{children}</View>
  </Modal>;
}

export const ui = StyleSheet.create({
  content: { padding: 18, paddingBottom: 120 },
  brand: { color: COLORS.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: '900', marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginBottom: 10 },
  itemTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  body: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  label: { color: COLORS.primary, fontSize: 12, fontWeight: '900', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.muted, fontWeight: '800' },
  chipTextActive: { color: COLORS.primaryText },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#5a4a40', backgroundColor: COLORS.cardStrong, color: COLORS.text, borderRadius: 9, paddingHorizontal: 14, marginBottom: 10, fontSize: 16 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  orb: { position: 'absolute', borderRadius: 999, opacity: .34 },
  orbOne: { width: 360, height: 360, right: -130, top: -90, backgroundColor: '#34206c' },
  orbTwo: { width: 280, height: 280, left: -100, bottom: 80, backgroundColor: '#075f4a' },
  stars: { position: 'absolute', right: 22, top: 60, color: COLORS.cyan, fontSize: 42, opacity: .17, lineHeight: 80 },
  mascotGlow: { position: 'absolute', borderRadius: 18, borderWidth: 3, opacity: .55, backgroundColor: 'rgba(141,232,255,.12)' },
  hat: { position: 'absolute', top: 3, width: 0, height: 0, borderLeftWidth: 24, borderRightWidth: 18, borderBottomWidth: 40, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  hatBand: { position: 'absolute', top: 34, width: 50, height: 8, borderRadius: 4 },
  bookFace: { position: 'absolute', bottom: 18, width: 54, height: 54, borderRadius: 10, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  eyeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  eye: { width: 9, height: 12, borderRadius: 5, backgroundColor: '#f7fbff', borderWidth: 2, borderColor: '#08213d' },
  smile: { marginTop: 7, width: 19, height: 6, borderBottomWidth: 3, borderColor: '#43230f', borderRadius: 8 },
  staff: { position: 'absolute', right: 14, bottom: 12, width: 7, height: 67, borderRadius: 4 },
  staffOrb: { position: 'absolute', right: 5, top: 17, width: 21, height: 21, borderRadius: 11, borderWidth: 3, borderColor: COLORS.gold },
  card: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(34,29,24,.94)', padding: 15, marginBottom: 12 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: COLORS.primary, marginTop: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: COLORS.primaryText, fontSize: 15, fontWeight: '900' },
  track: { width: '100%', height: 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#4a3c32', marginTop: 10 },
  fill: { height: '100%', borderRadius: 8, backgroundColor: COLORS.success },
  tabs: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 7, paddingHorizontal: 10, paddingTop: 9, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#17120f' },
  tab: { flex: 1, minHeight: 57, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabIcon: { fontSize: 19 }, tabText: { color: COLORS.muted, fontSize: 11, fontWeight: '900' }, tabTextActive: { color: COLORS.primaryText },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' }, close: { color: COLORS.muted, fontSize: 22, padding: 5 },
});
