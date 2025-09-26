import { Router } from 'express';
import { streamController } from '../controllers/streamController';

const router = Router();

// Get HLS playlist
router.get('/:id/hls/playlist.m3u8', streamController.getHLSPlaylist);

// Get HLS segment
router.get('/:id/hls/:segment', streamController.getHLSSegment);

// Get DASH manifest
router.get('/:id/dash/manifest.mpd', streamController.getDASHManifest);

// Get DASH segment
router.get('/:id/dash/:segment', streamController.getDASHSegment);

// Get adaptive bitrate manifest
router.get('/:id/abr/master.m3u8', streamController.getABRManifest);

export const streamRoutes = router;