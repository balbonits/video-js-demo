-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_path VARCHAR(500) NOT NULL,
  preview_path VARCHAR(500),
  size BIGINT NOT NULL,
  duration DECIMAL(10, 2),
  width INTEGER,
  height INTEGER,
  format VARCHAR(50),
  codec VARCHAR(50),
  bitrate INTEGER,
  fps DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'uploaded',
  job_id VARCHAR(255),
  metadata JSONB,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video versions table (different quality/format versions)
CREATE TABLE IF NOT EXISTS video_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  profile VARCHAR(20) NOT NULL,
  path VARCHAR(500) NOT NULL,
  format VARCHAR(50) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bitrate INTEGER NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video thumbnails table
CREATE TABLE IF NOT EXISTS video_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  timestamp DECIMAL(10, 2),
  width INTEGER DEFAULT 320,
  height INTEGER DEFAULT 180,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Streaming sessions table
CREATE TABLE IF NOT EXISTS streaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  bytes_served BIGINT DEFAULT 0,
  segments_served INTEGER DEFAULT 0,
  quality_switches INTEGER DEFAULT 0,
  buffering_events INTEGER DEFAULT 0,
  average_bitrate INTEGER,
  session_data JSONB
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES streaming_sessions(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_video_versions_video_id ON video_versions(video_id);
CREATE INDEX idx_video_thumbnails_video_id ON video_thumbnails(video_id);
CREATE INDEX idx_streaming_sessions_video_id ON streaming_sessions(video_id);
CREATE INDEX idx_streaming_sessions_user_id ON streaming_sessions(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_video_id ON analytics_events(video_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();