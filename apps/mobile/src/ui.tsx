import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, color = colors.accent, size = 22 }: { name: IconName; color?: string; size?: number }) {
  return <Ionicons name={name} color={color} size={size} />;
}
export function IconButton({ icon, label, onPress, disabled, selected }: {
  icon: IconName; label: string; onPress: () => void; disabled?: boolean; selected?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(selected) }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.iconButton, pressed && ui.pressed]}>
    <Icon name={icon} color={disabled ? colors.border : colors.accent} />
  </Pressable>;
}
export function Button({ children, onPress, icon, secondary = false, disabled = false }: {
  children: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, pressed && ui.pressed]}>
    {icon && <Icon name={icon} color={secondary ? colors.accent : colors.onAccent} size={20} />}
    <Text style={[ui.buttonText, secondary && { color: colors.accent }]}>{children}</Text>
  </Pressable>;
}
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <View style={ui.section}><View style={ui.sectionHeading}><Text accessibilityRole="header" style={ui.sectionTitle}>{title}</Text>{action}</View>{children}</View>;
}
export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children: string }) {
  return <View style={ui.empty}><Icon name={icon} size={32} /><Text style={ui.sectionTitle}>{title}</Text><Text style={ui.body}>{children}</Text></View>;
}
export function ProgressBar({ value }: { value: number }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return <View accessible accessibilityRole="progressbar" accessibilityLabel="Vị trí đã lưu" accessibilityValue={{ min: 0, max: 100, now: percent }} style={ui.progressTrack}>
    <View style={[ui.progressFill, { width: `${percent}%` }]} />
  </View>;
}
export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  return `${hours ? `${hours}:` : ''}${hours ? String(Math.floor(total / 60) % 60).padStart(2, '0') : Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
export function dateLabel(milliseconds: number): string {
  return new Date(milliseconds).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, paddingBottom: 32, gap: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 43, color: colors.ink },
  body: { fontSize: 15, lineHeight: 24, color: colors.muted },
  eyebrow: { fontSize: 12, lineHeight: 19, color: colors.accent, fontWeight: '600', letterSpacing: 1 },
  small: { fontSize: 13, lineHeight: 20, color: colors.muted },
  section: { gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 30, color: colors.ink },
  button: { backgroundColor: colors.accent, minHeight: 48, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondary: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.onAccent, fontSize: 15, lineHeight: 22, fontWeight: '600', flexShrink: 1 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  pressed: { opacity: 0.72 },
  empty: { gap: 12, padding: 24, backgroundColor: colors.soft, borderRadius: 8 },
  card: { padding: 18, gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 8 },
  cardTitle: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 29, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  progressTrack: { height: 3, backgroundColor: colors.line, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: colors.accent },
  warning: { backgroundColor: colors.warningSoft, padding: 12, borderRadius: 4, gap: 8 },
  warningText: { color: colors.warning, fontSize: 14, lineHeight: 22 },
  divider: { borderBottomColor: colors.line, borderBottomWidth: 1 },
});
