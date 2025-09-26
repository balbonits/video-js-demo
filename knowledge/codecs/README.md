# Video & Audio Codecs Guide

Comprehensive guide to video and audio codecs for streaming applications.

## Video Codecs

### [H.264/AVC - Advanced Video Coding](H264-Implementation.md)
The most widely supported video codec.
- **Compression**: Baseline, Main, High profiles
- **Resolution**: Up to 4K (Level 5.2)
- **Browser Support**: Universal
- **Hardware Acceleration**: Universal
- **Licensing**: MPEG-LA patent pool
- **Use Cases**: General streaming, compatibility-first

### [H.265/HEVC - High Efficiency Video Coding](H265-HEVC-Guide.md)
50% better compression than H.264.
- **Compression**: Main, Main 10 profiles
- **Resolution**: Up to 8K
- **Browser Support**: Safari, Edge (limited)
- **Hardware Acceleration**: Modern devices
- **Licensing**: Complex, multiple pools
- **Use Cases**: 4K/HDR content, bandwidth-constrained

### [VP9](VP9-Implementation.md)
Google's royalty-free codec.
- **Compression**: Similar to HEVC
- **Resolution**: Up to 8K
- **Browser Support**: Chrome, Firefox, Edge
- **Hardware Acceleration**: Limited
- **Licensing**: Royalty-free
- **Use Cases**: YouTube, WebM content

### [AV1](AV1-Guide.md)
Next-generation open codec.
- **Compression**: 30% better than HEVC
- **Resolution**: Up to 8K
- **Browser Support**: Chrome, Firefox (growing)
- **Hardware Acceleration**: Emerging
- **Licensing**: Royalty-free
- **Use Cases**: Future-proof streaming

### [VP8](VP8-Legacy.md)
Older Google codec, legacy support.
- **Status**: Superseded by VP9
- **Use Cases**: Legacy WebRTC

### [H.263](H263-Legacy.md)
Legacy video codec.
- **Status**: Obsolete
- **Use Cases**: Legacy video conferencing

## Audio Codecs

### [AAC - Advanced Audio Coding](AAC-Implementation.md)
Industry standard for streaming audio.
- **Profiles**: AAC-LC, HE-AAC, HE-AACv2
- **Bitrates**: 32-320 kbps
- **Browser Support**: Universal
- **Use Cases**: All streaming scenarios

### [Opus](Opus-Guide.md)
Modern, versatile audio codec.
- **Bitrates**: 6-510 kbps
- **Latency**: Very low
- **Browser Support**: Excellent
- **Use Cases**: WebRTC, live streaming

### [MP3](MP3-Support.md)
Legacy but widely supported.
- **Bitrates**: 32-320 kbps
- **Browser Support**: Universal
- **Use Cases**: Compatibility, podcasts

### [AC-3/E-AC-3 (Dolby Digital)](Dolby-Audio.md)
Multi-channel audio for premium content.
- **Channels**: Up to 7.1
- **Browser Support**: Limited
- **Use Cases**: Premium content, Smart TVs

### [DTS](DTS-Audio.md)
High-quality multi-channel audio.
- **Variants**: DTS, DTS-HD
- **Browser Support**: Very limited
- **Use Cases**: Premium home theater

## Codec Selection Guide

### By Use Case

#### General Web Streaming
- **Video**: H.264 (baseline) + VP9/AV1 (enhancement)
- **Audio**: AAC-LC
- **Container**: MP4 (HLS) or WebM (DASH)

#### Mobile Streaming
- **Video**: H.264 (baseline/main)
- **Audio**: HE-AACv2 (low bitrate) or AAC-LC
- **Considerations**: Battery life, data usage

#### 4K/HDR Streaming
- **Video**: HEVC (Main10) or AV1
- **Audio**: AAC-LC or E-AC-3
- **Requirements**: HDR metadata support

#### Live Streaming
- **Video**: H.264 (low latency settings)
- **Audio**: AAC-LC or Opus
- **Encoding**: Hardware acceleration recommended

#### Video Conferencing
- **Video**: VP8/VP9 (WebRTC) or H.264
- **Audio**: Opus
- **Priorities**: Low latency, error resilience

## Codec Comparison

### Video Codecs

| Codec | Compression | Quality | Device Support | Licensing | CPU Usage |
|-------|------------|---------|----------------|-----------|-----------|
| H.264 | Baseline | Good | Universal | Paid | Low |
| H.265 | Excellent | Excellent | Growing | Complex | Medium |
| VP9 | Very Good | Very Good | Good | Free | High |
| AV1 | Best | Best | Limited | Free | Very High |

### Audio Codecs

| Codec | Quality | Bitrate | Latency | Support | Use Case |
|-------|---------|---------|---------|---------|----------|
| AAC | Excellent | 128-320 | Medium | Universal | Streaming |
| Opus | Excellent | 6-510 | Very Low | Good | Real-time |
| MP3 | Good | 128-320 | Medium | Universal | Legacy |
| AC-3 | Excellent | 384-640 | Medium | Limited | Premium |

## Encoding Considerations

### Bitrate Ladders
Example adaptive bitrate ladder for H.264:
```
240p:  400 kbps
360p:  800 kbps
480p:  1,400 kbps
720p:  2,800 kbps
1080p: 5,000 kbps
```

### Encoding Settings

#### H.264 Recommended Settings
```
Profile: Main
Level: 4.0 (1080p) or 5.0 (4K)
Keyframe Interval: 2-4 seconds
B-frames: 2-3
Reference Frames: 3-4
```

#### HEVC Recommended Settings
```
Profile: Main or Main10
Level: 4.1 (1080p) or 5.1 (4K)
Keyframe Interval: 2-4 seconds
CTU Size: 64x64
```

### Hardware vs Software Encoding

#### Hardware Encoding
- **Pros**: Fast, power-efficient
- **Cons**: Less flexible, quality trade-offs
- **Use Cases**: Live streaming, real-time

#### Software Encoding
- **Pros**: Best quality, full control
- **Cons**: Slow, CPU-intensive
- **Use Cases**: VOD, premium content

## Platform-Specific Support

### Web Browsers
| Browser | H.264 | H.265 | VP9 | AV1 | AAC | Opus |
|---------|-------|-------|-----|-----|-----|------|
| Chrome | Yes | No* | Yes | Yes | Yes | Yes |
| Firefox | Yes | No | Yes | Yes | Yes | Yes |
| Safari | Yes | Yes | No | No | Yes | Yes |
| Edge | Yes | Yes* | Yes | Yes | Yes | Yes |

*Platform-dependent

### Mobile Platforms
- **iOS**: H.264, HEVC, AAC (native)
- **Android**: H.264, VP9, AAC, Opus (varies by version)

### Smart TVs
- Generally support H.264, HEVC
- Audio: AAC, AC-3/E-AC-3
- Varies significantly by manufacturer and year

## Future Trends

### Emerging Codecs
- **VVC (H.266)**: Next-gen MPEG codec
- **EVC**: Alternative MPEG codec
- **LCEVC**: Enhancement layer codec

### Machine Learning Codecs
- Neural network-based compression
- Perceptual quality optimization
- Content-aware encoding

## Best Practices

1. **Multi-Codec Strategy**: Encode in multiple codecs for compatibility
2. **Progressive Enhancement**: H.264 base with modern codec variants
3. **Device Detection**: Serve appropriate codec based on capability
4. **Quality Monitoring**: Track codec-specific quality metrics
5. **Cost Optimization**: Balance quality, compatibility, and CDN costs

## Resources

- [Encoding Tools Comparison](../../references/Encoding-Tools.md)
- [Codec Testing Methodology](../testing/Codec-Testing.md)
- [Per-Title Encoding Guide](Per-Title-Encoding.md)
- [HDR Implementation](HDR-Implementation.md)