# Streaming Protocols Guide

Comprehensive documentation for video streaming protocols, their implementations, and use cases.

## Adaptive Streaming Protocols

### [HLS - HTTP Live Streaming](HLS-Deep-Dive.md)
Apple's adaptive bitrate streaming protocol, now an industry standard.
- **Use Cases**: VOD, Live streaming, Low latency streaming
- **Platforms**: iOS (native), Android, Web (via HLS.js)
- **Latency**: 6-30 seconds (standard), 2-5 seconds (LL-HLS)
- **DRM**: FairPlay, Widevine, PlayReady

### [DASH - Dynamic Adaptive Streaming](DASH-Implementation.md)
MPEG standard for adaptive bitrate streaming over HTTP.
- **Use Cases**: VOD, Live streaming, Multi-DRM
- **Platforms**: Android (native), Web (via dash.js)
- **Latency**: 3-30 seconds
- **DRM**: Widevine, PlayReady, Marlin

### [MSS - Microsoft Smooth Streaming](MSS-Guide.md)
Microsoft's adaptive streaming technology.
- **Use Cases**: Enterprise streaming, Xbox
- **Platforms**: Windows, Xbox, Silverlight
- **Latency**: 5-10 seconds
- **DRM**: PlayReady

## Real-Time Protocols

### [WebRTC](WebRTC-Implementation.md)
Peer-to-peer real-time communication protocol.
- **Use Cases**: Video conferencing, Ultra-low latency streaming
- **Platforms**: All modern browsers
- **Latency**: < 500ms
- **Scalability**: Limited without media servers

### [RTMP - Real-Time Messaging Protocol](RTMP-Streaming.md)
Adobe's protocol for real-time streaming.
- **Use Cases**: Live streaming ingest, Legacy Flash players
- **Platforms**: Streaming encoders, Media servers
- **Latency**: 1-3 seconds
- **Status**: Deprecated for playback, still used for ingest

### [SRT - Secure Reliable Transport](SRT-Protocol.md)
Open-source protocol for low-latency streaming.
- **Use Cases**: Broadcast contribution, Remote production
- **Platforms**: Professional broadcasting
- **Latency**: < 1 second
- **Security**: Built-in encryption

### [RTSP - Real-Time Streaming Protocol](RTSP-Guide.md)
Control protocol for streaming media servers.
- **Use Cases**: IP cameras, Surveillance systems
- **Platforms**: VLC, Professional equipment
- **Latency**: < 1 second
- **Transport**: Usually with RTP

## Low Latency Protocols

### [LL-HLS - Low-Latency HLS](LL-HLS-Implementation.md)
Apple's extension to HLS for reduced latency.
- **Target Latency**: 2-5 seconds
- **Key Features**: Partial segments, Preload hints
- **Compatibility**: iOS 14+, Latest browsers

### [LL-DASH - Low-Latency DASH](LL-DASH-Guide.md)
DASH extension for low-latency streaming.
- **Target Latency**: 3-5 seconds
- **Key Features**: Chunked transfer encoding
- **Compatibility**: Modern DASH players

### [CMAF - Common Media Application Format](CMAF-Implementation.md)
Unified format for HLS and DASH.
- **Benefits**: Single encoding, Reduced storage
- **Low Latency**: Chunked CMAF for LL-HLS/LL-DASH
- **Adoption**: Growing industry support

## Traditional Protocols

### [Progressive Download](Progressive-Download.md)
Simple HTTP-based video delivery.
- **Use Cases**: Short videos, Simple implementations
- **Pros**: Simple, Wide compatibility
- **Cons**: No adaptivity, Inefficient for long videos

### [HTTP Pseudostreaming](HTTP-Pseudostreaming.md)
Byte-range requests for seeking support.
- **Use Cases**: MP4 delivery with seeking
- **Requirements**: Byte-range support on server
- **Limitations**: No quality adaptation

## Protocol Comparison

| Protocol | Latency | Adaptivity | DRM Support | Browser Support | Use Case |
|----------|---------|------------|-------------|-----------------|----------|
| HLS | 6-30s | Yes | Yes | Good* | VOD, Live |
| LL-HLS | 2-5s | Yes | Yes | Limited | Low-latency live |
| DASH | 3-30s | Yes | Yes | Good* | VOD, Live |
| WebRTC | <500ms | No | No | Excellent | Real-time |
| RTMP | 1-3s | No | Limited | None** | Ingest only |
| Progressive | N/A | No | No | Excellent | Simple VOD |

*Requires JavaScript player
**Flash deprecated

## Implementation Considerations

### Latency vs Quality Trade-offs
- Lower latency = smaller buffers = more rebuffering risk
- Consider use case requirements (sports vs VOD)
- Implement adaptive latency based on network conditions

### CDN Compatibility
- HLS/DASH work with any HTTP CDN
- WebRTC requires specialized infrastructure
- Consider geographic distribution needs

### Player Support
- Native support varies by platform
- JavaScript players add overhead but increase compatibility
- Consider fallback strategies

### DRM Requirements
- HLS supports FairPlay (Apple devices)
- DASH better for multi-DRM scenarios
- CMAF enables unified DRM delivery

## Choosing the Right Protocol

### For VOD Content
1. **HLS + DASH** with CMAF packaging
2. Progressive download for short videos
3. Consider CDN costs and caching

### For Live Streaming
1. **Standard latency (10-30s)**: HLS or DASH
2. **Low latency (2-5s)**: LL-HLS or LL-DASH
3. **Ultra-low latency (<1s)**: WebRTC or SRT

### For Interactive Content
1. **WebRTC** for bidirectional communication
2. LL-HLS/LL-DASH for one-way with chat
3. Custom protocols for specific requirements

## Best Practices

1. **Multi-Protocol Strategy**: Support multiple protocols for maximum reach
2. **Fallback Chains**: Implement graceful degradation
3. **Monitor Performance**: Track protocol-specific metrics
4. **Test Thoroughly**: Different protocols behave differently under stress
5. **Stay Updated**: Protocol specifications evolve regularly

## Advanced Topics

- [Protocol Switching Strategies](Protocol-Switching.md)
- [Custom Protocol Development](Custom-Protocols.md)
- [Protocol Security Considerations](Protocol-Security.md)
- [Performance Optimization by Protocol](Protocol-Performance.md)

## Resources

- [Protocol Specifications](../../references/Protocol-Specs.md)
- [Implementation Libraries](../../references/Protocol-Libraries.md)
- [Testing Tools](../testing/Protocol-Testing-Tools.md)
- [Debugging Guide](Protocol-Debugging.md)