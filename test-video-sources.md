# Free Legal Test Video Sources for Video Player Demo

## Table of Contents
1. [Popular Open Source Movies](#popular-open-source-movies)
2. [HLS Test Streams](#hls-test-streams)
3. [DASH Test Streams](#dash-test-streams)
4. [Live Streaming Sources](#live-streaming-sources)
5. [4K and High Resolution Content](#4k-and-high-resolution-content)
6. [DRM Protected Samples](#drm-protected-samples)
7. [Subtitles and Multi-Audio Track Content](#subtitles-and-multi-audio-track-content)
8. [CDN Provider Test Streams](#cdn-provider-test-streams)
9. [Various Format Test Files](#various-format-test-files)
10. [Public Domain Resources](#public-domain-resources)

---

## Popular Open Source Movies

### Big Buck Bunny (Blender Foundation)
- **License**: Creative Commons Attribution 3.0
- **Formats**: MP4, WebM, HLS, DASH
- **Resolutions**: 480p, 720p, 1080p, 4K

**Direct Downloads:**
- MP4 (1080p): `http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
- HLS Stream: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- DASH (2s segments): `http://ftp.itec.aau.at/datasets/DASHDataset2014/BigBuckBunny/2sec/BigBuckBunny_2s_onDemand_2014_05_09.mpd`

### Sintel (Blender Foundation)
- **License**: Creative Commons Attribution 3.0
- **Duration**: 14:48
- **Formats**: MP4, WebM, HLS, DASH
- **Resolutions**: 480p, 720p, 1080p, 4K

**Streams:**
- MP4: `http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4`

### Tears of Steel (Blender Foundation)
- **License**: Creative Commons Attribution 3.0
- **Duration**: 12:14
- **Formats**: MP4, WebM, HLS, DASH

**Streams:**
- HLS: `https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8`
- HLS (MP4): `https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8`
- DASH: `http://ftp.itec.aau.at/datasets/DASHDataset2014/TearsOfSteel/2sec/TearsOfSteel_2s_onDemand_2014_05_09.mpd`

### Elephants Dream (Blender Foundation)
- **License**: Creative Commons Attribution 2.5
- **Duration**: 10:54
- **Formats**: MP4, WebM, DASH

**Streams:**
- DASH: `http://ftp.itec.aau.at/datasets/DASHDataset2014/ElephantsDream/2sec/ElephantsDream_2s_onDemand_2014_05_09.mpd`
- DASH (Audio Only): `http://dash.akamaized.net/dash264/TestCases/3a/fraunhofer/aac-lc_stereo_without_video/ElephantsDream/elephants_dream_audio_only_aaclc_stereo_sidx.mpd`

---

## HLS Test Streams

### Apple Test Streams
- **Advanced fMP4 Stream**: `https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8`
- **Basic Stream (bipbop)**: `https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8`

### Akamai Test Streams
- **Live Stream 1**: `https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8`
- **Live Stream 2**: `https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8`

### Dolby Test Streams
- **Stereo with Subtitles**: `http://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_stereo_subs.m3u8`
- **Multichannel with Subtitles**: `http://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_multichannel_subs.m3u8`
- **Multi-language with Subtitles**: `http://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_multi_language_subs.m3u8`

### Blender 24x7 Test Channel
- **URL**: `https://ireplay.tv/test/blender.m3u8`

---

## DASH Test Streams

### Akamai DASH Test Cases

**Basic Streams:**
- **480p with Audio**: `http://dash.akamaized.net/dash264/TestCases/3b/fraunhofer/aac-lc_stereo_with_video/ElephantsDream/elephants_dream_480p_aaclc_stereo_sidx.mpd`
- **Multi-Rate HD**: `http://dash.akamaized.net/dash264/TestCasesHD/1a/qualcomm/1/MultiRate.mpd`

**HEVC Streams:**
- **HEVC Multi-Rate**: `http://dash.akamaized.net/dash264/TestCasesHEVC/1a/1/TOS_OnDemand_HEVC_MultiRate.mpd`

### ITEC/AAU Repository
Base URL for various segment durations:
- **Big Buck Bunny**: `http://ftp.itec.aau.at/datasets/DASHDataset2014/BigBuckBunny/`
- **Tears of Steel**: `http://ftp.itec.aau.at/datasets/DASHDataset2014/TearsOfSteel/`
- **Elephants Dream**: `http://ftp.itec.aau.at/datasets/DASHDataset2014/ElephantsDream/`

Available segment durations: 1sec, 2sec, 4sec, 6sec, 10sec, 15sec

---

## Live Streaming Sources

### Public Live Streams
- **NASA TV Public**: `https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8`
- **NASA TV Media**: `https://ntv2.akamaized.net/hls/live/2013923/NASA-NTV2-HLS/master.m3u8`

### Test Pattern Streams
- **Mux Test Patterns**: Available at `https://test-streams.mux.dev/`
  - Various bitrates and resolutions
  - Includes SAMPLE-AES encrypted content
  - IMSC captions support

---

## 4K and High Resolution Content

### Jellyfish Test Videos
- **400 Mbps H.264 4K**: Available from Kodi samples
- **400 Mbps H.265 HEVC 4K**: Available from Kodi samples
- **Formats**: MKV containers
- **Frame rates**: 23.976fps, 30fps, 60fps

### Demolandia 4K Samples
- **Resolutions**: 3840×2160, 4096×2160
- **Codecs**: H.264, H.265
- **Frame rates**: Up to 60fps

### 4K Media.org Resources
- **HDR Support**: HDR10, HLG, Dolby Vision
- **Uncompressed demos**: For display testing
- **Formats**: Various containers and codecs

---

## DRM Protected Samples

### Bitmovin DRM Test Streams

**Art of Motion (DRM Protected):**
- **DASH**: `https://cdn.bitmovin.com/content/assets/art-of-motion_drm/mpds/11331.mpd`
- **HLS**: `https://cdn.bitmovin.com/content/assets/art-of-motion_drm/m3u8s/11331.m3u8`
- **Smooth**: `https://test.playready.microsoft.com/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/manifest`

**License Servers:**
- **Widevine**: `https://cwip-shaka-proxy.appspot.com/no_auth`
- **PlayReady**: `https://test.playready.microsoft.com/service/rightsmanager.asmx?PlayRight=1&ContentKey=EAtsIJQPd5pFiRUrV9Layw==`

### DRM Support by Platform
- **Widevine**: Chrome, Firefox, Edge (Windows/Mac/Linux), Android
- **PlayReady**: Edge, IE (Windows), Xbox
- **FairPlay**: Safari (macOS/iOS)

---

## Subtitles and Multi-Audio Track Content

### WebVTT Test Content

**Tears of Steel with Captions:**
- Base stream with WebVTT support via HLS
- Multiple language tracks available

**Dolby Streams (Multiple Audio/Subtitle Tracks):**
- Stereo, multichannel, and multi-language versions
- All include WebVTT subtitle tracks

### Caption Formats Supported
- **WebVTT**: W3C standard, widely supported
- **IMSC1**: In fMP4 containers for HLS
- **TTML**: For DASH streams
- **SRT**: Legacy format, convertible to WebVTT

---

## CDN Provider Test Streams

### Akamai
- **Adaptive Media Delivery**: Supports HLS, DASH, Smooth Streaming
- **Test Player**: `http://players.akamai.com/players/hlsjs`
- **Sample URL Format**: `http://origin.akamaized.net/hls/live/[stream-id]/[stream-name]/master.m3u8`

### Cloudflare
- **Cloudflare Stream**: Beta video hosting service
- **Supports**: HLS, DASH adaptive streaming
- **Features**: Global CDN, automatic transcoding

### AWS
- **Elemental MediaPackage**: HLS and DASH packaging
- **Elemental MediaTailor**: Ad insertion testing
- **CloudFront CDN**: Global distribution

---

## Various Format Test Files

### MP4 Test Files
```
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4
```

### WebM Test Files
- **WebM Files Demo Site**: `https://www.webmfiles.org/demo-files/`
- **Formats**: VP8, VP9, AV1 codecs
- **Audio**: Vorbis, Opus codecs

---

## Public Domain Resources

### Internet Archive
- **URL**: `https://archive.org/details/movies`
- **Content**: 2000+ public domain videos
- **Prelinger Archives**: Historic footage
- **Formats**: Multiple formats available for download

### Wikimedia Commons
- **URL**: `https://commons.wikimedia.org/`
- **Videos**: 340,000+ freely licensed videos
- **Formats**: WebM (VP9), OGV (Theora)
- **License**: Various Creative Commons licenses

### Pexels
- **URL**: `https://www.pexels.com/`
- **Content**: 28,000+ public domain stock videos
- **Quality**: Up to 4K resolution
- **License**: Free to use, no attribution required

### Pixabay
- **URL**: `https://pixabay.com/videos/`
- **Content**: Royalty-free videos
- **Quality**: HD and 4K available
- **License**: Pixabay License (free for commercial use)

---

## Testing Tools and Players

### Online Test Players
1. **HLS.js Demo**: `https://hlsjs.video-dev.org/demo/`
2. **Castr HLS Player**: `https://castr.com/hlsplayer/`
3. **Wowza Test Player**: `https://www.wowza.com/testplayers`
4. **Bitmovin Player Demo**: `https://bitmovin.com/demos/`
5. **Livepush Player**: `https://livepush.io/hlsplayer/`

### Validation Tools
- **W3C WebVTT Validator**: For subtitle file validation
- **HLS Validator**: Apple's mediastreamvalidator tool
- **DASH Validator**: DASH-IF Conformance Tool

---

## Usage Notes

1. **CORS Considerations**: Some streams may require proper CORS headers or proxy setup
2. **HTTPS Requirements**: Modern browsers require HTTPS for certain features (EME, camera access)
3. **License Compliance**: Always check and comply with content licenses
4. **Availability**: Test streams may become unavailable; always have backup options
5. **Performance Testing**: Use various bitrates and resolutions to test adaptive streaming
6. **Browser Compatibility**: Test across different browsers for DRM and codec support

---

## Quick Reference Table

| Content Type | Best Sources | Formats | Special Features |
|-------------|--------------|---------|------------------|
| VOD Testing | Blender Movies | MP4, WebM, HLS, DASH | Multiple resolutions |
| Live Streams | Akamai, NASA TV | HLS | Real-time streaming |
| 4K Content | Jellyfish, Demolandia | H.264, H.265 | Up to 400 Mbps |
| DRM Testing | Bitmovin | DASH, HLS | Widevine, PlayReady |
| Subtitles | Dolby, Tears of Steel | WebVTT | Multi-language |
| Short Clips | Google Sample Videos | MP4 | Various durations |

---

## Additional Resources

- **GitHub Repository**: `bengarney/list-of-streams` - Community maintained list
- **Video Test Files**: `joshuatz/video-test-file-links` - Curated collection
- **IPTV Collection**: IPTV-org with 8000+ public channels
- **Kodi Samples**: Comprehensive test file collection with HDR/Dolby Vision

---

*Last Updated: September 2024*
*Note: URLs and availability subject to change. Always verify current status before production use.*