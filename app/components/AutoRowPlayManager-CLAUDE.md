# Auto-Row-Play Feature Documentation

## Overview
The Auto-Row-Play feature enables automatic sequential playback of MP3 audio files within the current row (horizontal slides) only. Unlike the global Auto-Play feature that navigates through all articles vertically and horizontally, Auto-Row-Play is constrained to the user's current vertical position and plays only the MP3s in that specific row from left to right.

## Core Functionality

### Playback Scope
- **Current Row Only**: Plays MP3s exclusively within the currently visible vertical slide
- **Left-to-Right Sequence**: Main article → Sub-articles (in order) → Stop
- **Row-Bound**: Does not navigate vertically between different rows
- **Manual Row Selection**: User must scroll to desired row before activating

### Behavior Rules
- **Slides WITH MP3**: Plays audio to completion, then advances to next horizontal slide
- **Slides WITHOUT MP3**: Skipped entirely (no delay, no processing)
- **No Overlapping**: Only one audio track plays at a time with proper cleanup
- **Auto-Stop**: Automatically stops when all MP3s in current row are complete
- **Row Changes**: Updates available tracks when user scrolls to different vertical slide

## Visual Design & User Interface

### Auto-Row-Play Button
- **Location**: Fixed header at `top-6 left-36` (positioned after auto-play button)
- **Icon**: `playlist_play` (inactive) / `stop_circle` (active)
- **Visibility**: Only appears when current row contains MP3 tracks
- **Tooltip**: Shows track count (e.g., "Play 3 MP3s in this row")
- **Admin Pages**: Hidden on all `/admin/*` routes

### Audio Player Visual Feedback
- **Auto-Play Mode**: Blue background (`bg-blue-100` / `dark:bg-blue-800`)
- **Auto-Row-Play Mode**: Green background (`bg-green-100` / `dark:bg-green-800`)
- **Inactive**: Gray background (`bg-gray-100` / `dark:bg-gray-700`)
- **Color Coding**: Prevents confusion between different auto-play modes

## Architecture

### Component Structure

```
AutoRowPlayManager.tsx
├── AutoRowPlayProvider (Context Provider)
│   ├── Fetches all articles once on mount
│   ├── Tracks current vertical slide index
│   ├── Extracts MP3 tracks from current row only
│   ├── Manages row-specific playback state
│   └── Handles track progression within row
│
├── AutoRowPlayIcon (UI Control)
│   ├── Play/Stop toggle button with distinct icon
│   ├── Located at left-36 in fixed header
│   ├── Shows track count in tooltip
│   └── Hidden on admin pages and rows without MP3s
│
└── useAutoRowPlay Hook
    └── Provides access to row-specific auto-play state
```

### Data Flow

1. **Article Collection** (on mount)
   ```typescript
   interface Article {
     id: string
     title: string
     audioUrl?: string | null
     subArticles?: Article[]
     // ... other fields
   }
   ```

2. **Row Track Extraction** (per vertical slide)
   ```typescript
   interface AudioTrack {
     url: string           // MP3 URL
     title: string         // Article title
     articleId: string     // Unique identifier
     horizontalIndex: number // 0=main, 1+=sub-articles
   }
   ```

3. **Row Detection & Updates**
   - `ArticlesSwiper` calls `updateCurrentRow(verticalIndex)` on slide change
   - AutoRowPlayProvider extracts MP3s from that specific row
   - Button visibility and track count update automatically

## Event System

### Custom Events

| Event | Description | Payload | Scope |
|-------|-------------|---------|-------|
| `autoRowPlayStart` | Start playing current row track | None | Row-specific |
| `autoRowPlayStop` | Stop row auto-play completely | None | Row-specific |
| `autoRowPlayAudioEnd` | Current row track finished | None | Row-specific |
| `stopAllAudio` | Stop all audio players (shared) | None | Global |
| `navigateToHorizontalSlide` | Navigate within row | `{ horizontalIndex }` | Row-specific |

### Event Flow Sequence

```
User scrolls to new vertical slide
    ↓
ArticlesSwiper.onSlideChange → updateCurrentRow(verticalIndex)
    ↓
AutoRowPlayProvider extracts MP3s from new row
    ↓
Button visibility updates (show/hide based on MP3 availability)
    ↓
User clicks auto-row-play button
    ↓
Navigate to first MP3's horizontal position (if needed)
    ↓
autoRowPlayStart → AudioPlayer plays first MP3 in row
    ↓
Audio ends → autoRowPlayAudioEnd
    ↓
Navigate to next horizontal slide with MP3
    ↓
Repeat until end of row → Auto-stop
```

## Implementation Details

### AutoRowPlayManager.tsx

Key responsibilities:
- Fetches all articles once and caches them
- Tracks current vertical slide index
- Extracts MP3 tracks from current row only
- Manages row-specific playback state
- Coordinates horizontal navigation within row

```typescript
const updateCurrentRow = useCallback((verticalIndex: number) => {
  setCurrentVerticalIndex(verticalIndex)

  const currentArticle = allArticles[verticalIndex]
  if (!currentArticle) return

  const rowTracks: AudioTrack[] = []

  // Add main article MP3 if exists
  if (currentArticle.audioUrl) {
    rowTracks.push({
      url: currentArticle.audioUrl,
      title: currentArticle.title,
      articleId: currentArticle.id,
      horizontalIndex: 0
    })
  }

  // Add sub-article MP3s in order
  if (currentArticle.subArticles) {
    currentArticle.subArticles.forEach((subArticle, subIndex) => {
      if (subArticle.audioUrl) {
        rowTracks.push({
          url: subArticle.audioUrl,
          title: subArticle.title,
          articleId: subArticle.id,
          horizontalIndex: subIndex + 1
        })
      }
    })
  }

  setCurrentRowAudioTracks(rowTracks)
  setCurrentRowTrackIndex(0)
}, [allArticles])
```

### AudioPlayer.tsx Integration

Enhanced to handle both auto-play modes simultaneously:

- **Dual Mode Support**: Handles both `autoPlayStart` and `autoRowPlayStart` events
- **Visual Distinction**: Blue for auto-play, green for auto-row-play
- **Event Emission**: Sends `autoRowPlayAudioEnd` when row track completes
- **Error Handling**: Failed tracks automatically advance to next in sequence

```typescript
// Check if this is the current track in auto-row-play
const currentRowTrack = currentRowAudioTracks[currentRowTrackIndex]
const isCurrentRowTrack = isAutoRowPlaying && currentRowTrack?.articleId === articleId

// Visual styling with color coding
className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
  isCurrentTrack
    ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700'
    : isCurrentRowTrack
    ? 'bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700'
    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
} disabled:opacity-50`}
```

### ArticlesSwiper.tsx Integration

Minimal integration for row detection:

```typescript
import { useAutoRowPlay } from '../AutoRowPlayManager'

const { updateCurrentRow } = useAutoRowPlay()

// Initialize row on swiper mount
onSwiper={(swiper) => {
  swiperRef.current = swiper
  updateCurrentRow(0) // Start with first row
}}

// Update row when user navigates vertically
onSlideChange={(swiper) => {
  const currentSlideIndex = swiper.activeIndex
  updateCurrentRow(currentSlideIndex)
}}
```

## Timing Considerations

| Action | Delay | Purpose |
|--------|-------|---------|
| Navigate to horizontal slide | 500ms | Allow navigation to complete |
| Track transition (same slide) | 200ms | Audio cleanup only |
| Audio stop before play | Immediate | Ensure clean audio state |
| Failed audio retry | 100ms | Quick advance to next track |

## State Management

### AutoRowPlayProvider State
```typescript
{
  isAutoRowPlaying: boolean           // Currently playing row
  currentRowTrackIndex: number        // Index in currentRowAudioTracks array
  currentRowAudioTracks: AudioTrack[] // MP3 tracks in current row only
  currentVerticalIndex: number        // Current vertical slide position
}
```

### Button Visibility Logic
```typescript
// Only show if current row has MP3 tracks and not on admin pages
const isAdminPage = pathname?.startsWith('/admin')
if (isAdminPage || currentRowAudioTracks.length === 0) return null
```

## Isolation & Non-Interference Features

### 1. **Separate Event Namespace**
- Uses distinct event names (`autoRowPlayStart` vs `autoPlayStart`)
- No cross-contamination between auto-play modes
- Both can coexist without conflicts

### 2. **Independent State Management**
- Separate React Context for row-specific state
- No shared state with global auto-play system
- Each mode tracks its own progress independently

### 3. **Visual Distinction**
- Different color coding (blue vs green) prevents user confusion
- Separate button with distinct icon (`playlist_play` vs `play_circle`)
- Clear tooltips indicate functionality scope

### 4. **Scope Limitation**
- Strictly row-bound - never navigates vertically
- Updates tracks only when user manually changes rows
- Cannot interfere with global navigation patterns

### 5. **Audio Coordination**
- Uses shared `stopAllAudio` event for clean audio management
- Proper cleanup prevents overlapping audio from both systems
- Error handling ensures failed tracks don't block progression

## Error Handling & Edge Cases

### 1. **No MP3s in Row**
- Button hidden automatically
- No error states or empty playback attempts
- Graceful degradation to manual controls only

### 2. **Failed Audio Loading**
- Automatic advancement to next track in row
- Error logged to console for debugging
- User experience uninterrupted

### 3. **Row Changes During Playback**
- Auto-row-play stops when user navigates vertically
- New row tracks loaded automatically
- Button visibility updates to reflect new row's MP3 availability

### 4. **Manual Navigation During Auto-Row-Play**
- Row playback continues on manually selected horizontal slide
- Navigation events coordinate properly between systems
- No conflicts with user-initiated slide changes

## Troubleshooting

### Common Issues

1. **Button Not Visible**
   - Check if current row has any MP3 tracks
   - Verify not on admin page (auto-hidden)
   - Ensure articles loaded properly

2. **Wrong Track Playing**
   - Check `currentVerticalIndex` matches actual slide
   - Verify `updateCurrentRow` called on slide change
   - Check console logs for track extraction

3. **Audio Not Starting**
   - Verify browser autoplay policies
   - Check MP3 URLs are valid and accessible
   - Ensure no conflicts with global auto-play

### Debug Logging

Enable console logging to trace execution:
```javascript
// Track collection per row
console.log('Found row audio tracks:', rowTracks)

// Row updates
console.log('AutoRowPlayProvider: Updating current row to vertical index:', verticalIndex)

// Audio player events
console.log(`AudioPlayer ${articleId} received autoRowPlayStart event`)
```

## Performance Considerations

### 1. **Efficient Article Fetching**
- Articles fetched once on mount, cached for entire session
- Row track extraction is lightweight (filtering only)
- No repeated API calls when changing rows

### 2. **Optimized Re-renders**
- `useCallback` for `updateCurrentRow` prevents unnecessary re-renders
- Context updates only when row actually changes
- Button visibility computed efficiently

### 3. **Memory Management**
- Proper event listener cleanup on component unmount
- No memory leaks from hanging audio references
- Efficient state updates with minimal objects

## Future Enhancement Opportunities

### Potential Improvements
1. **Row Progress Indicator**: Visual progress bar for current row
2. **Skip Controls**: Next/previous buttons for row tracks
3. **Loop Mode**: Repeat current row option
4. **Speed Controls**: Playback speed adjustment for row
5. **Keyboard Shortcuts**: Row-specific hotkeys
6. **Playlist Export**: Save current row as playlist

### Integration Points
1. **Analytics**: Track row completion rates
2. **User Preferences**: Remember auto-row-play settings
3. **Accessibility**: Enhanced screen reader support
4. **Mobile**: Touch gesture controls for row playback

## Code Locations

- **Main Component**: `/app/components/AutoRowPlayManager.tsx`
- **Audio Integration**: `/app/components/AudioPlayer.tsx` (lines 18, 25-26, 60-62, 131-162, 166-167, 209-210)
- **Swiper Integration**: `/app/components/swiper/ArticlesSwiper.tsx` (lines 10, 35, 109, 113-115)
- **Layout Integration**: `/app/layout.tsx` (lines 10-11, 65, 70)

## Testing Checklist

### Core Functionality
- [ ] Button appears only when current row has MP3s
- [ ] Button hidden on admin pages
- [ ] Tracks play in left-to-right order within row
- [ ] Auto-stop at end of row
- [ ] No vertical navigation during row playback

### Visual Feedback
- [ ] Green background on current row track button
- [ ] Button icon changes (playlist_play → stop_circle)
- [ ] Tooltip shows correct track count
- [ ] No visual conflicts with global auto-play

### Navigation & Audio
- [ ] Proper horizontal navigation to MP3 slides
- [ ] No overlapping audio between tracks
- [ ] Clean audio transitions with proper delays
- [ ] Manual navigation doesn't break row playback

### Row Changes
- [ ] Track list updates when scrolling vertically
- [ ] Button visibility changes based on new row's MP3s
- [ ] Previous row playback stops when changing rows
- [ ] New row ready for auto-row-play immediately

### Error Conditions
- [ ] Failed MP3s automatically advance to next
- [ ] Empty rows handled gracefully
- [ ] Browser autoplay restrictions handled
- [ ] No console errors during normal operation

### Integration
- [ ] No interference with global auto-play functionality
- [ ] Both auto-play modes can coexist
- [ ] Shared stopAllAudio works for both systems
- [ ] Manual audio controls work independently

## Conclusion

The Auto-Row-Play feature provides a focused, row-specific audio playback experience that complements the existing global auto-play functionality. Its careful design ensures no interference with other systems while providing users with granular control over their audio experience within individual rows of content.

The implementation follows React best practices, maintains TypeScript compliance, and includes comprehensive error handling to ensure a robust user experience across all scenarios.