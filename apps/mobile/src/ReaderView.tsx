import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import {
  isTrustedPageUrl, parseWebMessage,
  type NativeMessage, type PageInfo, type ReadingPosition, type WebMessage,
} from '../../../src/lib/native/protocol';
import { colors } from './theme';
import { Button, Icon, ui } from './ui';
import { ReaderSession } from './reader-session';

export interface ReaderHandle { capture(): Promise<boolean>; suspend(): void; goBack(): void; reload(): void; }
interface Props {
  siteUrl: string;
  destination: { url: string; key: number; position?: ReadingPosition };
  active: boolean;
  getReading(url: string): ReadingPosition | null;
  onPage(page: PageInfo): void;
  onReading(position: ReadingPosition): boolean;
  onAudio(message: Extract<WebMessage, { type: 'audio-play' }>): void;
  onNavigation(back: boolean): void;
  onError(message: string): void;
}

function safeScript(message: NativeMessage): string {
  const json = JSON.stringify(message).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.__KINH_NATIVE__ && window.__KINH_NATIVE__.receive(${json}); true;`;
}

/** Retained under the native tabs so audio and browser history survive a visit
 * to the saved-progress screen. All scripture is still rendered by Astro. */
export const ReaderView = forwardRef<ReaderHandle, Props>(function ReaderView(props, ref) {
  // WebView 14 defaults its extra-props generic to undefined; an explicit object
  // keeps its prop intersection usable with strict TypeScript null checks.
  const web = useRef<WebView<object>>(null);
  const latest = useRef(props);
  latest.current = props;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [bridgeMissing, setBridgeMissing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridge = useMemo(() => new ReaderSession(props.siteUrl, props.destination.url, {
    send: outgoing => web.current?.injectJavaScript(safeScript(outgoing)),
    getReading: url => latest.current.getReading(url),
    saveReading: position => latest.current.onReading(position),
    isActive: () => latest.current.active,
    ready: page => {
      setConnected(true); setBridgeMissing(false);
      if (timer.current) clearTimeout(timer.current);
      latest.current.onPage(page);
    },
    audio: incoming => latest.current.onAudio(incoming),
    error: detail => latest.current.onError(detail),
  }, props.destination.position), [props.siteUrl, props.destination.key]);
  useImperativeHandle(ref, () => ({
    capture: () => bridge.capture(), suspend: () => bridge.suspend(),
    goBack: () => web.current?.goBack(), reload: () => web.current?.reload(),
  }), [bridge]);
  useEffect(() => {
    if (!props.active) void bridge.capture();
  }, [props.active, bridge]);
  useEffect(() => {
    bridge.activate();
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') void bridge.capture(); });
    return () => { bridge.suspend(); subscription.remove(); if (timer.current) clearTimeout(timer.current); };
  }, [bridge]);

  const external = (url: string) => {
    try {
      if (!['https:', 'http:', 'mailto:'].includes(new URL(url).protocol)) return;
      void Linking.openURL(url).catch(() => props.onError('Không mở được liên kết này trên thiết bị.'));
    } catch { /* Ignore malformed and executable URLs. */ }
  };
  const message = (event: WebViewMessageEvent) => {
    const incoming = parseWebMessage(event.nativeEvent.data, props.siteUrl, event.nativeEvent.url);
    if (incoming) bridge.receive(incoming);
  };
  const navigation = (state: WebViewNavigation) => {
    if (!bridge.isCurrentDocument(state.url)) return;
    props.onNavigation(state.canGoBack);
    if (!state.loading) props.onPage({ url: state.url, title: state.title || 'Thư viện', uid: null });
  };
  const beginLoad = (event: { nativeEvent: WebViewNavigation }) => {
    if (!isTrustedPageUrl(event.nativeEvent.url, props.siteUrl)) return;
    setLoading(true); setError(null); setConnected(false); setBridgeMissing(false);
    bridge.navigate(event.nativeEvent.url);
    if (timer.current) clearTimeout(timer.current);
  };
  const endLoad = (event: { nativeEvent: { url: string } }) => {
    if (!bridge.isCurrentDocument(event.nativeEvent.url)) return;
    setLoading(false);
    web.current?.injectJavaScript('window.__KINH_NATIVE__ && window.__KINH_NATIVE__.ready(); true;');
    timer.current = setTimeout(() => {
      if (!bridge.connected) setBridgeMissing(true);
    }, 8_000);
  };
  // Route every scheme through our callback: WebView's default whitelist can
  // otherwise open nonmatching schemes in the OS before that callback runs.
  return <View style={styles.container}>
    <WebView<object> ref={web} key={props.destination.key} source={{ uri: props.destination.url }}
      style={styles.web} onMessage={message} onLoadStart={beginLoad} onLoadEnd={endLoad}
      onNavigationStateChange={navigation} onShouldStartLoadWithRequest={request => {
        if (isTrustedPageUrl(request.url, props.siteUrl)) return true;
        if (request.url === 'about:blank') return true;
        if (request.isTopFrame !== false) { void bridge.capture(); external(request.url); }
        return false;
      }}
      onOpenWindow={event => external(event.nativeEvent.targetUrl)}
      originWhitelist={['*']}
      onError={() => { setLoading(false); setError('Không kết nối được thư viện.'); }}
      onHttpError={event => {
        if (event.nativeEvent.statusCode >= 400 && bridge.isCurrentDocument(event.nativeEvent.url)) {
          setError('Không tải được trang này.');
        }
      }}
      onContentProcessDidTerminate={() => setError('Trang đọc đã tạm dừng. Vị trí đã lưu vẫn còn.')}
      onRenderProcessGone={() => setError('Trang đọc đã tạm dừng. Vị trí đã lưu vẫn còn.')}
      allowsBackForwardNavigationGestures allowsInlineMediaPlayback={false}
      mediaPlaybackRequiresUserAction javaScriptEnabled domStorageEnabled cacheEnabled
      mixedContentMode="never" allowFileAccess={false} allowUniversalAccessFromFileURLs={false}
      javaScriptCanOpenWindowsAutomatically={false} sharedCookiesEnabled={false}
      applicationNameForUserAgent="KinhTangPali/0.1"
      accessibilityLabel="Thư viện kinh văn"
    />
    {loading && <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={ui.small}>Đang mở thư viện…</Text></View>}
    {!loading && !connected && bridgeMissing && !error && <View style={styles.bridgeNotice}>
      <Icon name="information-circle-outline" size={18} />
      <Text style={[ui.small, ui.grow]}>Trang này chưa kết nối với ứng dụng. Vị trí đọc sẽ được lưu sau khi website cập nhật.</Text>
    </View>}
    {error && <View style={styles.failure}><View style={ui.content}>
      <Icon name="cloud-offline-outline" size={42} />
      <Text accessibilityRole="header" style={ui.sectionTitle}>Chưa mở được bài đọc</Text>
      <Text accessibilityRole="alert" style={ui.body}>{error}</Text>
      <Text style={ui.body}>Thư viện cần kết nối mạng. Dấu trang và vị trí đã lưu trên thiết bị vẫn còn.</Text>
      <Button icon="refresh-outline" onPress={() => { setError(null); web.current?.reload(); }}>Thử lại</Button>
    </View></View>}
  </View>;
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  web: { flex: 1, backgroundColor: colors.paper },
  loading: { position: 'absolute', top: 8, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 10, backgroundColor: colors.surface, borderRadius: 4, borderWidth: 1, borderColor: colors.line },
  failure: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.paper, justifyContent: 'center' },
  bridgeNotice: { padding: 12, gap: 8, flexDirection: 'row', backgroundColor: colors.warningSoft },
});
