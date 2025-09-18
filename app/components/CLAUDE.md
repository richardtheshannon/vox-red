# Auto-Play Feature Documentation

## Overview
The auto-play feature enables automatic sequential playback of MP3 audio files across all published articles in the CMS. It navigates through slides automatically, playing audio in a specific order: left-to-right through horizontal slides, then down to the next vertical row.

## Core Functionality

### Playback Order
1. **Main Article** (if has MP3) → **Sub-Articles** (left to right) → **Next Main Article**
2. Pattern repeats through all articles from top to bottom
3. Automatically stops when all MP3s have been played

### Behavior Rules
- **Slides WITH MP3**: Plays audio to completion, then advances
- **Slides WITHOUT MP3**: Skipped entirely (no delay, no navigation)
- **No Overlapping**: Only one audio track plays at a time
- **Auto-Navigation**: Automatically navigates to slides containing the next MP3

## Architecture

### Component Structure

```
AutoPlayManager.tsx
├── AutoPlayProvider (Context Provider)
│   ├── Fetches all articles and extracts MP3 tracks
│   ├── Maintains playback state and track index
│   ├── Handles track progression logic
│   └── Dispatches navigation events
│
├── AutoPlayIcon (UI Control)
│   ├── Play/Pause toggle button
│   ├── Located top-left (left-20) in header
│   └── Hidden on admin pages
│
└── useAutoPlay Hook
    └── Provides access to auto-play state
```

### Data Flow

1. **Track Collection** (on mount)
   ```typescript
   interface AudioTrack {
     url: string           // MP3 URL
     title: string         // Article title
     articleId: string     // Unique identifier
     verticalIndex: number // Main article position (0-based)
     horizontalIndex: number // 0=main, 1+=sub-articles
   }
   ```

2. **Navigation Coordination**
   - `AutoPlayManager` determines next track position
   - Dispatches `autoPlayNavigate` event with slide indices
   - `ArticlesSwiper` handles vertical navigation
   - `HorizontalSlides` handles horizontal navigation
   - Navigation completes, then audio playback starts

## Event System

### Custom Events

| Event | Description | Payload |
|-------|-------------|---------|
| `autoPlayStart` | Start playing current track | None |
| `autoPlayStop` | Stop auto-play completely | None |
| `autoPlayAudioEnd` | Current track finished | None |
| `stopAllAudio` | Stop all audio players | None |
| `autoPlayNavigate` | Navigate to specific slide | `{ verticalIndex, horizontalIndex }` |
| `navigateToHorizontalSlide` | Navigate within horizontal slides | `{ horizontalIndex }` |

### Event Flow Sequence

```
User clicks play button
    ↓
AutoPlayManager navigates to first MP3's slide
    ↓
autoPlayNavigate → ArticlesSwiper → HorizontalSlides
    ↓
Navigation complete (800ms delay)
    ↓
autoPlayStart → AudioPlayer plays MP3
    ↓
Audio ends → autoPlayAudioEnd
    ↓
AutoPlayManager checks for next track
    ↓
If next track on different slide → Navigate first
If same slide → Play immediately
If no more tracks → Stop auto-play
```

## Implementation Details

### AutoPlayManager.tsx

Key responsibilities:
- Fetches articles and builds ordered track list
- Manages current track index
- Handles play/pause toggle
- Coordinates slide navigation
- Dispatches playback events

```typescript
// Track ordering logic
articles.forEach((article, verticalIndex) => {
  // Add main article MP3 if exists
  if (article.audioUrl) {
    tracks.push({
      url: article.audioUrl,
      title: article.title,
      articleId: article.id,
      verticalIndex,
      horizontalIndex: 0
    })
  }

  // Add sub-article MP3s in order
  if (article.subArticles) {
    article.subArticles.forEach((subArticle, subIndex) => {
      if (subArticle.audioUrl) {
        tracks.push({
          url: subArticle.audioUrl,
          title: subArticle.title,
          articleId: subArticle.id,
          verticalIndex,
          horizontalIndex: subIndex + 1
        })
      }
    })
  }
})
```

### AudioPlayer.tsx Integration

- Listens for `autoPlayStart` events
- Checks if it's the current track (`isCurrentTrack`)
- Plays audio when it's the active track
- Emits `autoPlayAudioEnd` when playback completes
- Shows blue background when actively playing in auto-play mode

### Swiper Navigation

**ArticlesSwiper.tsx**
- Listens for `autoPlayNavigate` events
- Navigates to specified vertical slide
- Dispatches `navigateToHorizontalSlide` for horizontal navigation

**HorizontalSlides.tsx**
- Listens for `navigateToHorizontalSlide` events
- Navigates to specified horizontal sub-slide
- Maintains nested swiper instance reference

## Timing Considerations

| Action | Delay | Purpose |
|--------|-------|---------|
| Initial play start | 800ms | Allow navigation to complete |
| Track transition (different slide) | 800ms | Navigation + slide render |
| Track transition (same slide) | 300ms | Audio cleanup only |
| Audio stop before play | 200ms | Ensure clean audio state |
| Failed audio retry | 100ms | Quick retry on error |

## State Management

### AutoPlayProvider State
```typescript
{
  isAutoPlaying: boolean      // Currently playing
  currentTrackIndex: number   // Index in audioTracks array
  audioTracks: AudioTrack[]   // All MP3 tracks in order
}
```

### Visual Indicators
- **Play button**: Shows play_circle or pause_circle icon
- **Audio button**: Blue background when current track in auto-play
- **Manual controls**: Still work independently when auto-play is off

## Edge Cases Handled

1. **No MP3s Available**: Auto-play button still shows but does nothing
2. **Failed Audio Load**: Automatically skips to next track
3. **Manual Navigation During Auto-Play**: Audio continues playing current track
4. **Project Slides**: Respects published/unpublished state
5. **Dynamic Content Updates**: Tracks fetched fresh on each play start

## Troubleshooting

### Common Issues

1. **Audio not playing**
   - Check browser autoplay policies
   - Verify MP3 URLs are valid
   - Check console for CORS errors

2. **Wrong slide navigation**
   - Ensure articles have correct orderPosition
   - Check sub-articles are properly nested

3. **Audio overlap**
   - Verify stopAllAudio events firing
   - Check timing delays are sufficient

### Debug Logging

Enable console logging to trace execution:
- Track collection and ordering
- Navigation events and targets
- Audio player state changes
- Event dispatch and reception

## Future Enhancements

Potential improvements to consider:
1. Resume from last position after pause
2. Skip forward/backward buttons
3. Playlist visualization
4. Speed controls for audio playback
5. Keyboard shortcuts for play/pause
6. Remember last played position in localStorage

## Code Locations

- **Main Component**: `/app/components/AutoPlayManager.tsx`
- **Audio Player**: `/app/components/AudioPlayer.tsx`
- **Vertical Swiper**: `/app/components/swiper/ArticlesSwiper.tsx`
- **Horizontal Swiper**: `/app/components/swiper/HorizontalSlides.tsx`
- **Layout Integration**: `/app/layout.tsx` (AutoPlayProvider wrapper)

## Testing Checklist

- [ ] Play button starts from first MP3
- [ ] Audio plays in correct order (left-right, then down)
- [ ] Navigation happens automatically between slides
- [ ] No audio overlap occurs
- [ ] Stop button halts all playback
- [ ] Manual audio controls work when auto-play is off
- [ ] Reaches end and stops cleanly
- [ ] Handles slides without MP3s correctly
- [ ] Works with both main and sub-articles