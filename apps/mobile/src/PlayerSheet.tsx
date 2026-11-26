import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import type { usePlayback } from './usePlayback';
import { colors } from './theme';
import { Button, clock, Icon, IconButton, ui } from './ui';
import { trackKey } from '../../../src/lib/native/protocol';

export type Playback = ReturnType<typeof usePlayback>;
export function PlayerSheet({ visible, onClose, playback, onRead, onInteraction }: {
  visible: boolean; onClose(): void; playback: Playback; onRead(url: string): void; onInteraction(): void;
}) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const { track, status } = playback;
  const key = track ? trackKey(track) : null;
  const draggingTrack = useRef<string | null>(null);
  const currentTrack = useRef(key);
  currentTrack.current = key;
  const shown = useRef(visible);
  shown.current = visible;
  useEffect(() => { draggingTrack.current = null; setDragging(false); setPosition(0); }, [key, visible]);
  if (!track) return null;
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={ui.page}>
      <View style={styles.header}><Text style={ui.eyebrow}>ĐANG NGHE</Text><IconButton icon="chevron-down-outline" label="Thu gọn trình phát" onPress={onClose} /></View>
      <ScrollView contentContainerStyle={[ui.content, styles.content]}>
        <View style={styles.emblem}><Icon name="headset-outline" size={48} /></View>
        <View style={styles.titles}>
          <Text style={ui.eyebrow}>{track.uid.toUpperCase()} · {track.version.kind === 'sutta' ? 'KINH VĂN' : 'DIỄN GIẢI'}</Text>
          <Text accessibilityRole="header" style={ui.title}>{track.title}</Text>
          <Text style={ui.body}>{track.version.label}</Text>
          {track.version.review_status === 'pending' && <Text style={styles.review}>Chờ nghe duyệt</Text>}
        </View>
        <View style={{ gap: 8 }}>
          <Slider accessibilityLabel="Vị trí phát" minimumValue={0} maximumValue={Math.max(1, status.duration)}
            value={dragging ? position : status.position} disabled={status.loading}
            minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.line} thumbTintColor={colors.accent}
            onSlidingStart={value => { onInteraction(); draggingTrack.current = key; setDragging(true); setPosition(value); }} onValueChange={setPosition}
            onSlidingComplete={value => {
              if (shown.current && draggingTrack.current === currentTrack.current && draggingTrack.current !== null) playback.seek(value);
              draggingTrack.current = null; setDragging(false);
            }}
            accessibilityValue={{ text: `${clock(status.position)} trên ${clock(status.duration)}` }} />
          <View style={styles.times}><Text style={ui.small}>{clock(dragging ? position : status.position)}</Text><Text style={ui.small}>{clock(status.duration)}</Text></View>
        </View>
        <View style={styles.transport}>
          <Pressable accessibilityRole="button" accessibilityLabel="Lùi 15 giây" onPress={() => playback.skip(-15)} style={styles.skip}><Icon name="play-back-outline" size={26} /><Text style={ui.small}>15 giây</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Tạm dừng' : status.loading ? 'Dừng chờ phát' : 'Phát'}
            onPress={playback.toggle} style={({ pressed }) => [styles.play, pressed && ui.pressed]}>
            {status.loading ? <ActivityIndicator color={colors.onAccent} /> : <Icon name={status.playing ? 'pause' : 'play'} color={colors.onAccent} size={32} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Tiến 15 giây" onPress={() => playback.skip(15)} style={styles.skip}><Icon name="play-forward-outline" size={26} /><Text style={ui.small}>15 giây</Text></Pressable>
        </View>
        {status.error && <View style={ui.warning}><Text accessibilityRole="alert" style={ui.warningText}>{status.error}</Text>
          <Button secondary onPress={playback.retry}>{status.playing ? 'Lưu lại vị trí' : 'Thử lại'}</Button>
        </View>}
        <View style={styles.rates} accessibilityRole="radiogroup" accessibilityLabel="Tốc độ phát">
          {[0.85, 1, 1.15, 1.25, 1.5].map(rate => <Pressable key={rate} accessibilityRole="radio" accessibilityState={{ checked: rate === status.rate }}
            accessibilityLabel={`Tốc độ ${rate}`} onPress={() => playback.setRate(rate)} style={[styles.rate, rate === status.rate && styles.activeRate]}>
            <Text style={[ui.small, rate === status.rate && { color: colors.accent, fontWeight: '600' }]}>{rate}×</Text>
          </Pressable>)}
        </View>
        {track.version.kind === 'sutta' && track.version.scripture_start_seconds > 0 && <View style={{ gap: 8 }}>
          <Button secondary onPress={() => playback.seek(0)}>Nghe từ phần tóm tắt</Button>
          <Button secondary onPress={() => playback.seek(track.version.scripture_start_seconds)}>Đến phần kinh văn</Button>
        </View>}
        {status.queueRemaining > 0 && <Text style={ui.small}>Tự chuyển tiếp {status.queueRemaining} bài cùng bản đang nghe.</Text>}
        <Text style={ui.body}>{track.version.description}</Text>
        <Button secondary icon="book-outline" onPress={() => { onClose(); onRead(track.pageUrl); }}>Mở bài đọc</Button>
        <Text style={ui.small}>Vị trí nghe được lưu riêng cho bản audio này.</Text>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

export function MiniPlayer({ playback, onOpen }: { playback: Playback; onOpen(): void }) {
  const { track, status } = playback;
  if (!track) return null;
  return <View style={styles.mini}>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Mở trình phát: ${track.title}`} style={styles.miniInfo}>
      <Icon name="headset-outline" />
      <View style={ui.grow}><Text numberOfLines={1} style={styles.miniTitle}>{track.title}</Text><Text numberOfLines={1} style={ui.small}>{track.version.label} · {clock(status.position)}</Text></View>
    </Pressable>
    <IconButton icon={status.playing ? 'pause' : 'play'} label={status.playing ? 'Tạm dừng audio' : status.loading ? 'Dừng chờ phát' : 'Phát audio'} onPress={playback.toggle} />
  </View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.line },
  content: { gap: 24 },
  emblem: { width: 112, height: 112, backgroundColor: colors.accentSoft, borderRadius: 8, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  titles: { gap: 10 },
  review: { color: colors.warning, backgroundColor: colors.warningSoft, fontSize: 13, padding: 8, alignSelf: 'flex-start', borderRadius: 4 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  play: { height: 72, width: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  skip: { minWidth: 60, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 4 },
  rates: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  rate: { minHeight: 44, minWidth: 50, borderRadius: 4, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  activeRate: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  mini: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.soft, padding: 8, paddingLeft: 16, borderTopWidth: 1, borderTopColor: colors.line },
  miniInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  miniTitle: { color: colors.ink, fontSize: 15, fontWeight: '600', lineHeight: 22 },
});
