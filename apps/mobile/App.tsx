import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  isTrustedPageUrl, normalizePageUrl, trackKey, WEBSITE_URL,
  type PageInfo, type ReadingPosition,
} from '../../src/lib/native/protocol';
import { openProgressStore, type Bookmark, type ProgressStore, type SavedListening, type SavedReading } from './src/storage';
import { usePlayback } from './src/usePlayback';
import { currentAudioTrack } from './src/current-audio';
import { ReaderView, type ReaderHandle } from './src/ReaderView';
import { MiniPlayer, PlayerSheet } from './src/PlayerSheet';
import { Button, clock, dateLabel, EmptyState, Icon, IconButton, ProgressBar, Section, ui, type IconName } from './src/ui';
import { colors } from './src/theme';

const configuredSite = process.env.EXPO_PUBLIC_SITE_URL ?? WEBSITE_URL;
const SITE_URL = configuredSite.endsWith('/') ? configuredSite : `${configuredSite}/`;
type Tab = 'home' | 'reader' | 'saved';
type Records = { readings: SavedReading[]; listenings: SavedListening[]; bookmarks: Bookmark[] };
type StorageIssue = { kind: 'history' | 'reading' | 'reader' | 'bookmark'; message: string; pageUrl?: string };
const emptyRecords: Records = { readings: [], listenings: [], bookmarks: [] };
const cleanTitle = (title: string) => title.replace(/\s*·\s*Kinh Tạng Pāli Việt\s*$/, '');

export default function App() {
  const [attempt, setAttempt] = useState(0);
  const opened = useMemo(() => {
    try {
      const url = new URL(SITE_URL);
      if (!['https:', 'http:'].includes(url.protocol) || (!__DEV__ && url.protocol !== 'https:')
        || url.username || url.password || url.hash || url.search) throw new Error('Địa chỉ thư viện không hợp lệ.');
      return { store: openProgressStore(), error: null };
    } catch (error) {
      return { store: null, error: error instanceof Error ? error.message : 'Không mở được dữ liệu đã lưu.' };
    }
  }, [attempt]);
  return <SafeAreaProvider><StatusBar style="dark" />
    {opened.store ? <Companion store={opened.store} /> : <SafeAreaView style={ui.page}><View style={ui.content}>
      <Icon name="folder-open-outline" size={40} /><Text style={ui.title}>Chưa mở được dữ liệu</Text>
      <Text style={ui.body}>{opened.error}</Text><Text style={ui.small}>Ứng dụng giữ nguyên tiến độ hiện có.</Text>
      <Button onPress={() => setAttempt(value => value + 1)}>Thử lại</Button>
      <Button secondary onPress={() => void Linking.openURL(WEBSITE_URL)}>Đọc trên website</Button>
    </View></SafeAreaView>}
  </SafeAreaProvider>;
}

function Companion({ store }: { store: ProgressStore }) {
  const [tab, setTab] = useState<Tab>('home');
  const [history, setHistory] = useState(false);
  const [records, setRecords] = useState<Records>(emptyRecords);
  const [storageError, setStorageError] = useState<StorageIssue | null>(null);
  const [destination, setDestination] = useState<{ url: string; key: number; position?: ReadingPosition } | null>(null);
  const [page, setPage] = useState<PageInfo>({ url: SITE_URL, title: 'Thư viện', uid: null });
  const [canGoBack, setCanGoBack] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [resolvingAudio, setResolvingAudio] = useState(false);
  const reader = useRef<ReaderHandle>(null);
  const audioRequest = useRef(0);
  const audioAbort = useRef<AbortController | null>(null);
  const navigationRequest = useRef(0);
  const backupOperation = useRef(false);
  const sequence = useRef(0);
  const playback = usePlayback(store);
  const refresh = useCallback((retry = false) => {
    try {
      setRecords({
        readings: store.listReadings().filter(item => isTrustedPageUrl(item.pageUrl, SITE_URL)),
        listenings: store.listListenings().filter(item => isTrustedPageUrl(item.track.pageUrl, SITE_URL)),
        bookmarks: store.getBookmarks().filter(item => isTrustedPageUrl(item.pageUrl, SITE_URL)),
      });
      setStorageError(previous => retry || previous?.kind === 'history' ? null : previous);
      return true;
    } catch (error) {
      setStorageError({ kind: 'history', message: error instanceof Error ? error.message : 'Không đọc được tiến độ đã lưu.' });
      return false;
    }
  }, [store]);
  useEffect(() => { refresh(); }, [refresh, tab, playback.track, playback.status.playing]);
  const cancelPendingAudio = useCallback(() => {
    ++audioRequest.current;
    audioAbort.current?.abort(); audioAbort.current = null;
    setResolvingAudio(false);
  }, []);
  useEffect(() => () => {
    ++audioRequest.current; ++navigationRequest.current;
    audioAbort.current?.abort();
  }, []);
  const openPage = useCallback(async (url: string, position?: ReadingPosition) => {
    if (!isTrustedPageUrl(url, SITE_URL)) {
      Alert.alert('Không mở được bài', 'Liên kết này không thuộc thư viện đã chọn.'); return;
    }
    const request = ++navigationRequest.current;
    await reader.current?.capture();
    if (request !== navigationRequest.current) return;
    setPage({ url, title: 'Thư viện', uid: null });
    setCanGoBack(false);
    setDestination({ url, key: ++sequence.current, position });
    setTab('reader');
  }, []);
  const selectTab = (next: Tab) => {
    ++navigationRequest.current;
    void reader.current?.capture(); playback.flush();
    if (next === 'reader' && !destination) void openPage(SITE_URL);
    else setTab(next);
    refresh();
  };
  const back = useCallback(() => {
    ++navigationRequest.current;
    void reader.current?.capture();
    if (canGoBack) reader.current?.goBack(); else setTab('home');
  }, [canGoBack]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'reader') { back(); return true; }
      if (tab === 'saved') { setTab('home'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [tab, back]);
  const onPage = useCallback((incoming: PageInfo) => {
    setPage(previous => ({ ...incoming, title: cleanTitle(incoming.title),
      uid: incoming.uid ?? (normalizePageUrl(previous.url) === normalizePageUrl(incoming.url) ? previous.uid : null) }));
  }, []);
  const saveReading = useCallback((position: ReadingPosition) => {
    try {
      const saved = store.saveReading(position);
      setRecords(previous => ({ ...previous, readings: [saved, ...previous.readings.filter(item => item.pageUrl !== saved.pageUrl)]
        .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100) }));
      setStorageError(previous => previous?.kind === 'reading' && previous.pageUrl === saved.pageUrl ? null : previous);
      return true;
    } catch (error) {
      setStorageError({ kind: 'reading', pageUrl: normalizePageUrl(position.pageUrl),
        message: error instanceof Error ? error.message : 'Chưa lưu được vị trí đọc trên thiết bị.' });
      return false;
    }
  }, [store]);
  const bookmarked = records.bookmarks.some(item => normalizePageUrl(item.pageUrl) === normalizePageUrl(page.url));
  const bookmark = () => {
    try {
      store.toggleBookmark(page); refresh();
      setStorageError(previous => previous?.kind === 'bookmark' ? null : previous);
    }
    catch (error) { setStorageError({ kind: 'bookmark', message: error instanceof Error ? error.message : 'Không lưu được dấu trang.' }); }
  };
  const resumeAudio = async (saved: SavedListening) => {
    cancelPendingAudio();
    const request = ++audioRequest.current;
    const controller = new AbortController(); audioAbort.current = controller;
    setResolvingAudio(true);
    try {
      const track = await currentAudioTrack(saved.track, SITE_URL, undefined, controller.signal);
      if (request !== audioRequest.current || controller.signal.aborted) return;
      playback.playTrack(track);
      setPlayerVisible(true); refresh();
      if (trackKey(track) !== trackKey(saved.track)) {
        Alert.alert('Bản audio đã cập nhật', 'Ứng dụng mở bản mới từ website. Vị trí của bản trước vẫn được giữ trong bản sao lưu.');
      }
    } catch (error) {
      if (request === audioRequest.current) Alert.alert('Chưa mở được audio', error instanceof Error && error.name !== 'AbortError'
        ? error.message : 'Không kết nối được thư viện. Hãy kiểm tra mạng rồi thử lại.');
    } finally {
      if (request === audioRequest.current) { audioAbort.current = null; setResolvingAudio(false); }
    }
  };
  // A late network response must not undo an explicit action on the current
  // player. Keep native controller/lifecycle saves independent of these controls.
  const playerControls = {
    ...playback,
    toggle: () => { cancelPendingAudio(); playback.toggle(); },
    retry: () => { cancelPendingAudio(); playback.retry(); },
    pause: () => { cancelPendingAudio(); playback.pause(); },
    stop: () => { cancelPendingAudio(); playback.stop(); },
    seek: (seconds: number) => { cancelPendingAudio(); playback.seek(seconds); },
    skip: (seconds: number) => { cancelPendingAudio(); playback.skip(seconds); },
    setRate: (rate: number) => { cancelPendingAudio(); playback.setRate(rate); },
    flush: () => { cancelPendingAudio(); playback.flush(); },
  };
  const exportProgress = async () => {
    if (backupOperation.current) return;
    backupOperation.current = true;
    cancelPendingAudio();
    setBackupBusy(true);
    try {
      playback.flush(); await reader.current?.capture();
      if (!await Sharing.isAvailableAsync()) throw new Error('Thiết bị chưa hỗ trợ chia sẻ tệp.');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File(Paths.cache, `kinh-tang-pali-progress-${timestamp}-${++sequence.current}.json`);
      file.create();
      playback.flush();
      await file.write(JSON.stringify(store.exportSnapshot(), null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Lưu bản sao tiến độ' });
    } catch (error) { Alert.alert('Chưa tạo được bản sao', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
    finally {
      // A share chooser returning does not prove the receiving app has read the
      // content URI. Leave this unique export in private cache for OS cleanup.
      backupOperation.current = false; setBackupBusy(false);
    }
  };
  const importProgress = async () => {
    if (backupOperation.current) return;
    backupOperation.current = true;
    cancelPendingAudio();
    setBackupBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled) return;
      const file = new File(picked.assets[0].uri);
      if (file.size > 20 * 1024 * 1024) throw new Error('Tệp sao lưu quá lớn (tối đa 20 MB).');
      const snapshot: unknown = JSON.parse(await file.text());
      playback.stop();
      await reader.current?.capture();
      // Invalidate immediately, not merely on React's next render, so queued
      // callbacks cannot write old positions over the imported records.
      reader.current?.suspend();
      ++navigationRequest.current;
      setDestination(null); setCanGoBack(false); setPlayerVisible(false); setTab('home');
      setPage({ url: SITE_URL, title: 'Thư viện', uid: null });
      const imported = store.importSnapshot(snapshot, SITE_URL);
      refresh(true);
      Alert.alert('Đã khôi phục tiến độ', `${imported.readings} vị trí đọc, ${imported.listenings} vị trí nghe và ${imported.bookmarks} dấu trang được thêm hoặc cập nhật. Dữ liệu mới hơn trên thiết bị được giữ nguyên.`);
    } catch (error) { Alert.alert('Không nhập được bản sao', error instanceof Error ? error.message : 'Tệp không hợp lệ. Dữ liệu hiện tại được giữ nguyên.'); }
    finally { backupOperation.current = false; setBackupBusy(false); }
  };
  // Show the most recent recording for each variant, while backups retain all
  // source-specific positions for recoverability after editorial updates.
  const listenings = records.listenings.filter((item, index, all) => all.findIndex(other => other.track.uid === item.track.uid && other.track.version.id === item.track.version.id) === index);
  return <SafeAreaView style={ui.page} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.header}>
      {tab === 'reader' ? <>
        <IconButton icon="arrow-back-outline" label="Quay lại" onPress={back} />
        <Text numberOfLines={1} style={styles.headerTitle}>{page.title}</Text>
        <IconButton icon={bookmarked ? 'bookmark' : 'bookmark-outline'} label={bookmarked ? 'Bỏ dấu trang' : 'Đánh dấu bài'} selected={bookmarked} onPress={bookmark} />
        <IconButton icon="open-outline" label="Mở trang này trong trình duyệt" onPress={() => void Linking.openURL(page.url)} />
      </> : <>
        <Image source={require('./assets/icon.png')} style={styles.brand} accessibilityIgnoresInvertColors />
        <Text style={styles.headerTitle}>Kinh Tạng Pāli</Text>
        <IconButton icon="settings-outline" label="Cài đặt và sao lưu" onPress={() => { cancelPendingAudio(); playback.flush(); refresh(); setSettingsVisible(true); }} />
      </>}
    </View>
    {storageError && <View style={ui.warning}><Text accessibilityRole="alert" style={ui.warningText}>{storageError.message}</Text>
      <Button secondary onPress={() => {
        const issue = storageError;
        refresh(true);
        if (issue.kind === 'reader') reader.current?.reload();
        else if (issue.kind === 'reading') void reader.current?.capture();
      }}>Thử lại</Button>
    </View>}
    {resolvingAudio && <View style={styles.resolving}><ActivityIndicator color={colors.accent} /><Text style={[ui.small, ui.grow]}>Đang kiểm tra bản audio mới nhất…</Text>
      <IconButton icon="close-outline" label="Hủy mở audio" onPress={cancelPendingAudio} />
    </View>}
    <View style={styles.body}>
      {destination && <View style={[StyleSheet.absoluteFill, tab !== 'reader' && styles.hidden]} pointerEvents={tab === 'reader' ? 'auto' : 'none'} accessibilityElementsHidden={tab !== 'reader'} importantForAccessibility={tab === 'reader' ? 'auto' : 'no-hide-descendants'}>
        <ReaderView key={destination.key} ref={reader} siteUrl={SITE_URL} destination={destination} active={tab === 'reader' && !playerVisible && !settingsVisible && !backupBusy}
          getReading={url => store.getReading(url)} onPage={onPage} onReading={saveReading} onNavigation={setCanGoBack}
          onError={message => setStorageError({ kind: 'reader', message })} onAudio={message => {
            cancelPendingAudio();
            playback.playTrack(message.track, message.startSeconds, message.queue);
            setPlayerVisible(true); refresh();
          }} />
      </View>}
      {tab === 'home' && <ScrollView style={ui.page} contentContainerStyle={ui.content}>
        <View style={{ gap: 12 }}><Text style={ui.eyebrow}>THƯ VIỆN CỦA BẠN</Text><Text accessibilityRole="header" style={ui.title}>Đọc &amp; lắng nghe</Text>
          <Text style={ui.body}>{records.readings.length || listenings.length ? 'Tiếp tục từ chỗ bạn đã dừng.' : 'Chọn một bài kinh. Ứng dụng sẽ nhớ chỗ bạn dừng.'}</Text>
        </View>
        <Button icon="book-outline" onPress={() => openPage(SITE_URL)}>Mở thư viện</Button>
        {records.readings.length > 0 && <Section title="Đang đọc">{records.readings.slice(0, 4).map(item => <ReadingCard key={item.pageUrl} item={item} onPress={() => openPage(item.pageUrl)} />)}</Section>}
        {listenings.length > 0 && <Section title="Đang nghe">{listenings.slice(0, 3).map(item => <ListeningCard key={trackKey(item.track)} item={item} onPress={() => void resumeAudio(item)} />)}</Section>}
        {!records.readings.length && !listenings.length && <EmptyState icon="bookmark-outline" title="Chỗ dừng của bạn ở đây">Vị trí đọc, bản audio đang nghe và dấu trang được lưu trên thiết bị. Không cần tạo tài khoản.</EmptyState>}
        {(records.readings.length > 4 || listenings.length > 3) && <Button secondary icon="time-outline" onPress={() => { setHistory(true); selectTab('saved'); }}>Xem lịch sử gần đây</Button>}
        <View style={styles.note}><Icon name="phone-portrait-outline" size={19} /><Text style={[ui.small, ui.grow]}>Tiến độ lưu trên thiết bị. Sao lưu trong Cài đặt trước khi đổi máy hoặc gỡ ứng dụng.</Text></View>
      </ScrollView>}
      {tab === 'saved' && <ScrollView style={ui.page} contentContainerStyle={ui.content}>
        <Text accessibilityRole="header" style={ui.title}>Đã lưu</Text>
        <View style={styles.switcher}>{[{ value: false, title: 'Dấu trang' }, { value: true, title: 'Gần đây' }].map(item => <Pressable key={item.title} accessibilityRole="tab" accessibilityState={{ selected: history === item.value }}
          onPress={() => setHistory(item.value)} style={[styles.switch, history === item.value && styles.selectedSwitch]}><Text style={[ui.body, history === item.value && { color: colors.accent, fontWeight: '600' }]}>{item.title}</Text></Pressable>)}</View>
        {!history && (records.bookmarks.length ? records.bookmarks.map(item => <View key={item.pageUrl} style={[ui.card, ui.row]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Mở ${item.title}`} onPress={() => openPage(item.pageUrl, item.position)} style={[ui.grow, { gap: 6 }]}>
            {item.uid && <Text style={ui.eyebrow}>{item.uid.toUpperCase()}</Text>}<Text style={ui.cardTitle}>{item.title}</Text>
          </Pressable>
          <IconButton icon="bookmark" label={`Bỏ dấu trang ${item.title}`} onPress={() => { try {
            store.toggleBookmark({ url: item.pageUrl, title: item.title, uid: item.uid }); refresh();
            setStorageError(previous => previous?.kind === 'bookmark' ? null : previous);
          } catch { setStorageError({ kind: 'bookmark', message: 'Không thay đổi được dấu trang.' }); } }} />
        </View>) : <EmptyState icon="bookmark-outline" title="Chưa có dấu trang">Khi đọc một bài, chạm biểu tượng dấu trang ở đầu màn hình để lưu lại.</EmptyState>)}
        {history && <>
          <Section title="Bài đọc gần đây">{records.readings.length ? records.readings.map(item => <ReadingCard key={item.pageUrl} item={item} onPress={() => openPage(item.pageUrl)} />) : <Text style={ui.body}>Chưa có bài đọc đã lưu.</Text>}</Section>
          <Section title="Audio gần đây">{listenings.length ? listenings.map(item => <ListeningCard key={trackKey(item.track)} item={item} onPress={() => void resumeAudio(item)} />) : <Text style={ui.body}>Chưa có vị trí nghe đã lưu.</Text>}</Section>
        </>}
      </ScrollView>}
    </View>
    <MiniPlayer playback={playerControls} onOpen={() => { cancelPendingAudio(); setPlayerVisible(true); }} />
    <View style={styles.tabs} accessibilityRole="tablist">
      {([{ id: 'home', label: 'Tiếp tục', icon: 'time-outline' }, { id: 'reader', label: 'Thư viện', icon: 'book-outline' }, { id: 'saved', label: 'Đã lưu', icon: 'bookmark-outline' }] as { id: Tab; label: string; icon: IconName }[]).map(item => <Pressable key={item.id}
        accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => selectTab(item.id)} style={styles.tab}>
        <Icon name={item.icon} color={tab === item.id ? colors.accent : colors.muted} /><Text style={[styles.tabLabel, tab === item.id && styles.selectedLabel]}>{item.label}</Text>
      </Pressable>)}
    </View>
    <PlayerSheet visible={playerVisible} onClose={() => { cancelPendingAudio(); setPlayerVisible(false); }} playback={playerControls} onRead={openPage} onInteraction={cancelPendingAudio} />
    <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
      <SafeAreaView style={ui.page}><View style={styles.header}><Text style={styles.headerTitle}>Cài đặt &amp; sao lưu</Text><IconButton icon="close-outline" label="Đóng cài đặt" onPress={() => setSettingsVisible(false)} /></View>
        <ScrollView contentContainerStyle={ui.content}>
          <Section title="Giữ lại tiến độ"><Text style={ui.body}>Lưu một bản sao để chuyển sang thiết bị khác hoặc khôi phục sau khi cài lại ứng dụng.</Text>
            <Button icon="share-outline" onPress={() => void exportProgress()} disabled={backupBusy}>Xuất bản sao lưu</Button>
            <Button secondary icon="document-outline" onPress={() => void importProgress()} disabled={backupBusy}>Nhập bản sao lưu</Button>
            {backupBusy && <ActivityIndicator color={colors.accent} />}
            <Text style={ui.small}>Nhập bản sao chỉ thêm hoặc cập nhật bản ghi cũ hơn. Tệp chứa lịch sử đọc và nghe của bạn; hãy chọn nơi lưu phù hợp.</Text>
            <Text style={ui.small}>Nếu trang đọc chưa phản hồi, bản sao dùng vị trí gần nhất đã lưu trên thiết bị. Nhập bản sao dừng audio và đóng bài đang mở để tải lại tiến độ.</Text>
          </Section>
          <Section title="Nội dung &amp; riêng tư"><Text style={ui.body}>Kinh văn, bản dịch, chú giải và audio được cập nhật từ website. Vị trí đọc, vị trí nghe và dấu trang được lưu riêng trên thiết bị.</Text>
            <Text style={ui.body}>Ứng dụng chưa đồng bộ giữa các thiết bị. Đọc bài và phát audio cần mạng; dữ liệu tiến độ vẫn xem được khi ngoại tuyến.</Text>
            <Text style={ui.small}>Trang web được mở trong ứng dụng vẫn sử dụng thống kê truy cập của website.</Text>
            <Button secondary icon="open-outline" onPress={() => { setSettingsVisible(false); openPage(new URL('credits/', SITE_URL).href); }}>Nguồn &amp; giấy phép</Button>
          </Section>
          <Text style={ui.small}>Kinh Tạng Pāli · 0.1.0</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

function ReadingCard({ item, onPress }: { item: SavedReading; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Đọc tiếp ${item.title}`} onPress={onPress} style={({ pressed }) => [ui.card, pressed && ui.pressed]}>
    <View style={ui.row}><Text style={[ui.eyebrow, ui.grow]}>{item.uid?.toUpperCase() ?? 'ĐỌC LIÊN TỤC'}</Text><Text style={ui.small}>{dateLabel(item.updatedAt)}</Text></View>
    <Text style={ui.cardTitle}>{cleanTitle(item.title)}</Text><ProgressBar value={item.scrollRatio} />
    <View style={ui.row}><Text style={[ui.small, ui.grow]}>{item.segmentId ? `Đoạn ${item.segmentId}` : `Vị trí ${Math.round(item.scrollRatio * 100)}%`}</Text><Icon name="arrow-forward-outline" size={18} /></View>
  </Pressable>;
}
function ListeningCard({ item, onPress }: { item: SavedListening; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Nghe tiếp ${item.track.title}, ${item.track.version.label}`} onPress={onPress} style={({ pressed }) => [ui.card, pressed && ui.pressed]}>
    <View style={ui.row}><Icon name="headset-outline" size={18} /><Text style={[ui.eyebrow, ui.grow]}>{item.track.uid.toUpperCase()}</Text><Text style={ui.small}>{dateLabel(item.updatedAt)}</Text></View>
    <Text style={ui.cardTitle}>{item.track.title}</Text><Text style={ui.small}>{item.track.version.label}</Text>
    <ProgressBar value={item.position / item.duration} /><Text style={ui.small}>{item.completed ? 'Đã nghe hết · Nghe lại' : `${clock(item.position)} / ${clock(item.duration)}`}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { width: 30, height: 30, marginHorizontal: 6, borderRadius: 4 },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  body: { flex: 1 }, hidden: { opacity: 0 },
  resolving: { flexDirection: 'row', gap: 10, justifyContent: 'center', padding: 10, backgroundColor: colors.soft },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 6, backgroundColor: colors.paper },
  tab: { flex: 1, minHeight: 58, gap: 4, alignItems: 'center', justifyContent: 'center', paddingBottom: 5 },
  tabLabel: { fontSize: 12, lineHeight: 18, color: colors.muted }, selectedLabel: { color: colors.accent, fontWeight: '600' },
  note: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20 },
  switcher: { flexDirection: 'row', backgroundColor: colors.soft, borderRadius: 4, padding: 3 },
  switch: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, selectedSwitch: { backgroundColor: colors.surface, borderRadius: 3 },
});
