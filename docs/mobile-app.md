# Ứng dụng iOS / Android

Ứng dụng Expo nằm ở [`apps/mobile/`](../apps/mobile/). Website Astro vẫn là nguồn
nội dung duy nhất. App mở chính website trong `react-native-webview`, rồi bổ sung
tiến độ đọc, dấu trang và trình nghe native. Không có kho kinh văn, danh mục hoặc
quy trình duyệt nội dung thứ hai.

## Phần được dùng chung

| Thành phần | Nguồn và trách nhiệm |
| --- | --- |
| Kinh văn, đối chiếu, chú thích, nguồn và chất lượng | HTML do website hiện hành sinh ra |
| Mục lục, cây nhóm, tìm kiếm | Điều hướng và Pagefind của website |
| Audio và các bản diễn giải | Cùng metadata, URL MP3, phần audio và nhãn nghe duyệt của website |
| Nghe tiếp từ lịch sử | Đọc metadata hiện hành từ `/app/audio/<collection>/<uid>.json`, sinh bằng cùng `loadAudio` của website |
| Màu và dấu Pāli Folio | Registry `source/design-tokens.json` và `source/brand-mark.json` |
| Giao tiếp web / app | `src/lib/native/`; protocol có phiên bản, dùng chung giữa hai bên |
| Vị trí đọc, dấu trang, lịch sử nghe | SQLite trong ứng dụng trên thiết bị |
| Phát khi khóa màn hình | `expo-audio`, độc lập với vòng đời WebView |

Ứng dụng hiện dùng Expo SDK 58, React 19.3 và React Native 0.88. Các dependency của
app có lockfile riêng; cài trong `apps/mobile`, không nâng dependency của Astro để
phục vụ app.

## Chạy lần đầu

Dùng Node 24.3 trở lên, theo `engines` của app. Từ gốc repository:

```bash
cd apps/mobile
npm ci
npx expo start --go
```

Lệnh trên mở Expo Go để kiểm tra nhanh. URL nội dung mặc định là
`https://streamentry.github.io/kinh-tang-pali/`. Để kiểm tra đầy đủ phát nền và điều
khiển màn hình khóa, cài
một development build của chính app; cấu hình native không được áp dụng vào Expo
Go.

Với Xcode trên macOS hoặc Android Studio / Android SDK đã cài:

```bash
# Chạy tại apps/mobile; chọn một nền tảng.
npx expo run:ios --device
npx expo run:android --device
```

Sau khi cài development build, dùng `npm start` để mở Metro ở chế độ dev client.
Lệnh `run` tạo native project từ app config khi cần. Sau khi thay native dependency
hoặc config plugin, dựng lại binary. `npm start` chỉ khởi động Metro, không thay
native capabilities của binary đã cài.

### Phát triển cùng website local

Terminal thứ nhất, tại gốc repository:

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

Terminal thứ hai, tại `apps/mobile`:

```bash
EXPO_PUBLIC_SITE_URL=http://192.168.1.20:4321/kinh-tang-pali/ npm start
```

Thay `192.168.1.20` bằng IP LAN của máy đang chạy Astro. Điện thoại và máy phát
triển phải truy cập được cùng mạng. `localhost` trên điện thoại chỉ chính điện
thoại; không trỏ đến máy chạy Astro. Giữ cả hậu tố `/kinh-tang-pali/` và dấu `/`
cuối URL. Bản phát hành dùng HTTPS; HTTP local chỉ dành cho development build.
Nếu nền tảng chặn HTTP, dùng một URL HTTPS phát triển mà thiết bị truy cập được.
Đổi biến môi trường cần khởi động lại Metro.

`astro dev` không sinh chỉ mục Pagefind đầy đủ. Khi kiểm tra tìm kiếm, dựng website
bằng `npm run build`, rồi dùng `npm run preview -- --host 0.0.0.0` và chỉnh port
trong `EXPO_PUBLIC_SITE_URL` cho khớp terminal preview.

## Tiến độ được giữ như thế nào

Tiến độ đọc lưu ID segment hiện có, độ lệch trong segment, tỷ lệ trang dự phòng
và chế độ đọc. ID ổn định giúp tiếp tục đúng chỗ khi đổi cỡ chữ hoặc chiều rộng
màn hình; tỷ lệ trang chỉ dùng khi không còn tìm được segment. Đây là vị trí
tiếp tục đọc, không phải phép đo người dùng đã hiểu hay hoàn tất bài kinh.

Web báo sẵn sàng, app gửi lại vị trí đã lưu, rồi mới nhận các cập nhật cuộn. Cổng
này ngăn sự kiện đầu trang lúc tải mới ghi đè tiến độ trước đó. Mỗi document có
mã phiên riêng để sự kiện đến muộn từ trang cũ không ghi sang trang đang mở.

Tiến độ nghe tách theo bài, bản nghe và nguồn media. Bản kinh văn và bản diễn giải
không dùng chung mốc nghe. Audio nhiều phần dùng thời gian cộng dồn của cả bài;
khi thay nguồn hoặc danh sách phần, không áp dụng mốc cũ vào một bản thu khác.
Nghe tiếp từ lịch sử lấy lại metadata của website; một URL đã lưu không tự trở
thành bản thu hiện hành. Nếu bản nghe được chọn đã bị gỡ, không âm thầm đổi sang
bản khác. Lần mở lại không tự phát âm thanh: người dùng chọn nghe tiếp.

App ghi tiến độ định kỳ và tại các mốc như tạm dừng, tua, đổi bài hoặc vào nền.
Hệ điều hành có thể dừng tiến trình ngay lập tức; không hứa giữ chính xác giây
cuối cùng sau mọi kiểu force quit.

### Audio nhiều phần, nghe liên tiếp và màn hình khóa

Một bài kinh có thể gồm nhiều tệp MP3. App đưa các phần còn lại vào
[`AudioPlaylist` của Expo](https://docs.expo.dev/versions/latest/sdk/audio/#useaudioplaylistoptions):
`AVQueuePlayer` trên iOS và playlist ExoPlayer trên Android tự chuyển sang phần
kế tiếp. Việc chuyển phần không chờ callback JavaScript tạo player mới. App dùng
chỉ số phần và thời gian trong phần để tính một mốc cộng dồn cho cả bài; khi tua
qua ranh giới phần, app mở đúng phần và giữ các phần sau trong hàng đợi native.
MP3 và metadata vẫn lấy nguyên từ nguồn web, không ghép hay tạo bản thu khác.

| Điều khiển | Phạm vi thời gian |
| --- | --- |
| Đồng hồ, thanh tua và nút tua trong app | Cả bài kinh, cộng dồn các phần |
| Đồng hồ, thanh tua và nút tua trên màn hình khóa | Tệp MP3 đang phát; metadata ghi `Phần N/M` khi bài có nhiều phần |

Vì vậy, đồng hồ màn hình khóa có thể trở về đầu khi sang phần mới; tiến độ cả bài
trong app vẫn tăng liên tục. Dùng thanh tua trong app để chọn một mốc ở phần khác.
Khi hết bài cuối cùng, app lưu trạng thái hoàn tất rồi giải phóng player và điều
khiển màn hình khóa. Chọn phát lại trong app để bắt đầu từ mốc mặc định của bản
nghe, thường là đầu kinh văn; thao tác chọn mốc `0` vẫn phát phần tóm tắt nếu có.

**Chuyển sang bài kinh khác là một bước riêng.** Nếu người dùng bật nghe tiếp ở
danh sách web, app nhận các bài còn lại của đúng bản nghe đã chọn. Sau khi bài
hiện tại kết thúc, JavaScript mở bài tiếp theo ở `start_seconds` của bài đó.
Không dùng mốc nghe dở cũ cho bước tự chuyển bài, và không tự đổi sang bản gốc khi
bản diễn giải đang chọn bị thiếu. Bước này có thể cần chờ mạng; không tuyên bố
nghe liên tiếp giữa nhiều bài là một hàng đợi native không gián đoạn.

Luồng thực thi nằm ở [`usePlayback.ts`](../apps/mobile/src/usePlayback.ts),
[`playback-core.ts`](../apps/mobile/src/playback-core.ts) và
[`playlist-clock.ts`](../apps/mobile/src/playlist-clock.ts). Mỗi phiên tải hoặc
tua mới vô hiệu hóa callback cũ; player native được `release()` khi không còn
dùng. Tốc độ người nghe chọn được áp dụng lại sau khi native báo phát tiếp từ một
lần gián đoạn.

### Giới hạn cần kiểm tra trên thiết bị

Các test tự động kiểm tra trạng thái, ánh xạ thời gian, lưu tiến độ và lỗi cạnh
tranh; chúng không chứng minh âm thanh chạy đúng khi điện thoại bị khóa. Cần
development build trên iOS và Android để xác nhận phát nền, chuyển phần, chuyển
bài, cuộc gọi, Bluetooth và điều khiển màn hình khóa.

Nếu iOS khởi động lại dịch vụ media, playlist của Expo SDK 58 chưa có đường tự
khôi phục tương đương player đơn. Có thể cần mở app và thử phát lại; không cam
kết tự tiếp tục trong trường hợp này. Khi mất mạng hoặc phần tiếp theo không tải
xong, app báo lỗi để thử lại, giữ mốc đã lưu. Khoảng chờ lỗi là 30 giây khi
JavaScript đang được hệ điều hành cho chạy. Nếu hệ điều hành treo JavaScript hoặc
dừng tiến trình, việc cập nhật SQLite phải chờ app chạy lại; chu kỳ ghi 5 giây
không phải bảo đảm chỉ mất tối đa 5 giây tiến độ sau mọi kiểu ngắt.

### Phạm vi dữ liệu và quyền riêng tư

- Tiến độ và dấu trang nằm trong vùng dữ liệu của app; không có tài khoản hoặc
  đồng bộ tiến độ giữa các thiết bị.
- Đóng và mở lại app vẫn giữ dữ liệu. Gỡ app hoặc xóa dữ liệu ứng dụng có thể làm
  mất lịch sử. Không coi sao lưu tự động của hệ điều hành là một cam kết khôi phục.
- Lưu tiến độ không tải toàn bộ kinh văn hoặc MP3. Đọc nội dung mới và nghe audio
  cần mạng; cache của WebView không phải tính năng đọc offline được bảo đảm.
- App không xin quyền microphone. Nó chỉ phát audio hiện có.
- Website vẫn thực hiện các request, log truy cập và analytics như khi mở bằng
  trình duyệt. Lưu tiến độ cục bộ không đồng nghĩa duyệt website ẩn danh.

### Sao lưu thủ công

App có thể xuất tiến độ và dấu trang thành tệp JSON qua bảng chia sẻ của hệ điều
hành, rồi nhập lại từ tệp do người dùng chọn. Bản sao lưu chứa địa chỉ bài, tiêu
đề, vị trí đọc/nghe và thời điểm lưu; không chứa kinh văn hoặc MP3. Người dùng
chọn nơi giữ tệp và người nhận, không có dịch vụ upload tiến độ tự động.

Trước khi xuất, app yêu cầu trang đọc chụp vị trí hiện tại và chờ phản hồi đúng
mã yêu cầu, tối đa 750 ms. Nếu website chưa sẵn sàng hoặc không phản hồi, bản sao
vẫn chứa tiến độ đã lưu gần nhất; không hứa có vị trí cuộn cuối cùng chưa được
website gửi lại. App cũng ghi mốc nghe hiện tại trước khi tạo tệp.

Khi nhập, app ghi và dừng phiên audio, yêu cầu lưu vị trí trang đang đọc rồi vô
hiệu hóa và gỡ trang đó trước khi gộp dữ liệu. Callback đến muộn từ player hoặc
trang cũ không được ghi đè vị trí vừa nhập. Mở lại bài sẽ nạp tiến độ từ dữ liệu
đã gộp, không tiếp tục dùng vị trí của trang đang giữ trong bộ nhớ.

Khi nhập, app kiểm tra định dạng, phiên bản và website của mọi bản ghi trước khi
ghi. Bản ghi mới hơn được gộp trong một transaction; tệp lỗi không được nhập một
phần. Một dấu trang đã bỏ có thể xuất hiện lại nếu nhập bản sao lưu cũ vẫn chứa
nó: đây là khôi phục dữ liệu, không phải giao thức đồng bộ có lịch sử xóa. Xuất
một bản mới trước khi đổi thiết bị hoặc gỡ app.

## Triển khai web trước, app sau

1. Chạy các cổng kiểm tra của website và app trên đúng commit.
2. Sau khi thay đổi được merge, chờ workflow **Deploy GitHub Pages** hoàn tất.
3. Mở một trang kinh trên URL production trong app, kiểm tra bridge đã hoạt động:
   cuộn rồi quay lại, nghe rồi mở lại, đối chiếu mốc đã lưu.
4. Dựng binary cho người dùng với URL HTTPS production. Đổi bundle identifier,
   signing và cấu hình dự án Expo theo tài khoản phát hành thực tế trước khi
   phân phối qua TestFlight hoặc cửa hàng.

Chỉ merge code chưa đồng nghĩa website live đã có bridge. Bản app mới cần website
đã triển khai phần giao tiếp và endpoint metadata audio tương ứng. Sửa kinh văn, thêm bài hoặc cập nhật nguồn
audio đi qua quy trình web hiện có; không cần chép lại vào app.

### Dựng bằng EAS

Chạy EAS từ `apps/mobile`, nơi đặt `eas.json`. Các profile gồm `development`
(dev client), `preview` (bản cài nội bộ; Android APK) và `production`. Cần kết nối
dự án với tài khoản Expo và cấu hình signing của chủ ứng dụng trước khi dựng.

```bash
# Chạy tại apps/mobile sau khi đăng nhập Expo và liên kết dự án.
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
```

File [`.easignore`](../.easignore) đặt ở **gốc Git repository**. EAS đọc nó thay
cho mọi `.gitignore`, kể cả khi lệnh chạy trong `apps/mobile`. Allowlist giữ app,
`src/lib`, hai registry thiết kế và notice; loại corpus, ảnh bìa web, snapshot
upstream, MP3, dependency và kết quả build. Giữ các import dùng chung ngoài thư
mục app; không đặt `EAS_PROJECT_ROOT=apps/mobile` để cắt chúng khỏi archive.

Sau khi đăng nhập Expo, kiểm tra archive trước lần dựng đầu tiên:

```bash
npx eas-cli build:inspect --platform android --stage archive --output ../../tmp/eas-archive
```

Lệnh inspect không bắt đầu cloud build. Thư mục output cần chưa tồn tại. Kiểm tra
archive còn `apps/mobile/package-lock.json`, assets của app, `src/lib/native`,
`src/lib/audio` và `source/design-tokens.json`; không có `content`, `src/assets`,
`.cache`, `node_modules` hoặc thông tin signing. Đây là thao tác cần thực hiện bằng
tài khoản phát hành, không phải bằng chứng đã được CI chạy.

## Kiểm tra trước khi phát hành

Tại `apps/mobile`:

```bash
npm run typecheck
npm test
npx expo install --check
npm run assets -- --check
npm run export
npx expo prebuild --no-install
```

Workflow [`Mobile`](../.github/workflows/mobile.yml) chạy protocol tests, các kiểm
tra của app, export bundle iOS/Android và tạo native project. Nó không build binary
có chữ ký, không cài vào thiết bị và không kiểm chứng âm thanh nền.

Các thay đổi bridge thuộc website vẫn phải qua CI hiện có: sync nguồn đã ghim,
`npm run validate`, `npm test`, `npm run check`, `npm run design:check`,
`npm run build`, `npm run seo:check` và `npm run reading:check`. Không thay gate
kinh văn bằng một lượt export Expo.

### Kiểm tra trên thiết bị thật

Ghi OS, model thiết bị, commit app, URL web và kết quả từng mục. Dùng development
build trên cả iOS và Android; đánh dấu chưa kiểm tra nếu chưa có thiết bị.

| Luồng | Kết quả cần quan sát |
| --- | --- |
| Đọc một bài dài, quay về, mở lại | Đúng segment và chế độ đọc; không bật về đầu trang |
| Đổi cỡ chữ / xoay màn hình rồi mở lại | Segment giữ được ý nghĩa, không chỉ pixel cũ |
| Mở link có anchor rõ ràng | Đến anchor được chọn; không bị vị trí cũ kéo đi |
| Đọc liên tục theo nhóm | Tiến độ gắn đúng trang và segment của nhóm |
| Lưu / bỏ dấu trang rồi khởi động lại | Danh sách phản ánh đúng thao tác |
| Xuất, nhập lại và thử tệp JSON lỗi | Bản ghi mới hơn được giữ; lỗi không xóa hoặc nhập một phần dữ liệu |
| Xuất khi vừa cuộn, rồi thử khi website không phản hồi | Có vị trí được website xác nhận; nếu hết hạn chờ, giữ tiến độ đã lưu gần nhất |
| Nhập bản sao khi trang đọc và audio đang mở | Audio dừng; trang cũ không ghi đè dữ liệu nhập; mở lại bài nạp mốc mới hơn |
| Nghe rồi đóng và mở lại | Giữ bài, bản nghe và mốc; không tự phát |
| Tua qua ranh giới hai phần MP3 | Đồng hồ cộng dồn và nguồn phát cùng vị trí |
| Khóa màn hình trước khi hết một phần MP3 | Tự sang phần kế tiếp; đồng hồ app cộng dồn, màn hình khóa ghi đúng số phần |
| Nghe liên tiếp hai bài khi màn hình khóa | Bài sau giữ đúng bản nghe và bắt đầu ở mốc mặc định; kiểm tra cả mạng chậm |
| Chọn nhanh bài / bản nghe khác | Callback cũ không ghi đè vị trí bài mới; chỉ một nguồn phát |
| Chọn nghe từ lịch sử rồi tạm dừng hoặc tua bài đang phát trước khi tải xong | Kết quả tải cũ không thay bài hay đảo ngược thao tác vừa chọn |
| Rời trang đọc trước khi yêu cầu phát từ WebView đến app | Trang đang ẩn không tự bắt đầu audio |
| Khóa màn hình trên 5 phút | Audio tiếp tục, điều khiển play/pause và tua hoạt động |
| Hết bài cuối cùng, rồi phát lại | Lưu hoàn tất, bỏ điều khiển màn hình khóa đã hết tác dụng; app phát lại từ mốc mặc định |
| Rút tai nghe / ngắt Bluetooth, có cuộc gọi | Không phát bất ngờ; khi tiếp tục, tốc độ đã chọn vẫn đúng |
| Mất mạng, quay lại mạng | Báo lỗi có cách thử lại; tiến độ cũ không bị xóa |
| Lưu tiến độ thất bại rồi thử lại khi đang phát, tạm dừng hoặc đã hết bài | Thử lưu lại không đổi trạng thái phát hoặc bắt đầu phát lại bài đã hết |
| Bài chưa có audio hoặc chưa xuất bản | Giữ đúng trạng thái nguồn; không giả có nội dung |
| Mở liên kết ngoài | Mở bằng hệ điều hành; không cấp bridge cho trang ngoài |
| VoiceOver / TalkBack, chữ hệ thống lớn | Điều khiển có nhãn, vùng chạm đủ, không cắt dấu tiếng Việt |

Trên trình duyệt bình thường, kiểm tra MN1, mục lục và danh sách audio: player web,
chọn phiên bản, tua, chuyển bài và native HTML fallback vẫn hoạt động. Thực hiện
ma trận reader desktop/mobile trong [`DESIGN.md`](../DESIGN.md) khi đổi giao diện.

## Tài liệu nền tảng

- [Expo CLI: export khác với compile native binary](https://docs.expo.dev/more/expo-cli/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Audio và background playback](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [EAS trong monorepo](https://docs.expo.dev/build-reference/build-with-monorepos/)
- [Vị trí và quy tắc `.easignore`](https://docs.expo.dev/build-reference/easignore/)
