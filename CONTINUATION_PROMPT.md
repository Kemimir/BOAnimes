# CrunchyBoa - Continuation Prompt for Another AI

## Project Overview
**CrunchyBoa** is a Manifest V3 Chrome extension that enhances anime streaming sites (Crunchyroll + 5 generic sites) with:
- Visual cleanup (removes ads, premium upsells, banners)
- Series tracking widget (★ Favorita, ✓ Assistida, ▶ Assistindo, + Pretendo assistir)
- Episode progress tracking with progress bar
- Cross-site data persistence via `chrome.storage.local`
- Popup for managing all tracked series with filters, export/import
- Context menu actions

---

## Current State (Working)
- ✅ Extension loads on Crunchyroll series pages
- ✅ Series ID detection works for `/pt-br/series/`, `/pt-br/watch/`, `/series/`, `/watch/`, query params
- ✅ Storage initialized before UI rendering
- ✅ Widget injects after series header (or before episode list) with proper positioning
- ✅ Buttons are clickable (z-index, pointer-events, stopPropagation)
- ✅ Progress bar shows when episodesWatched/totalEpisodes known
- ✅ Generic adapters for AnimesOrion, AnimesOnlineCC, AnimeFire, OtakuFlix, AnimesOneHD
- ✅ Popup with tabs (All/Favorites/Watched/Watching/Plan), site filter, settings, export/import JSON
- ✅ Background service worker with context menus

---

## Architecture

```
CrunchyBoa/
├── manifest.json           # MV3 config
├── build.js                # esbuild config (IIFE for content, ESM for popup/background)
├── popup.html              # Popup UI
├── public/icon.svg         # Source icon
├── dist/                   # Built output (load this in Chrome)
│   ├── background.js       # Service worker (contextMenus, runtime messages)
│   ├── popup.js            # Popup logic
│   ├── content/
│   │   ├── main.js         # Entry point, detection, injection, storage init
│   │   ├── crunchyroll-adapter.js  # Crunchyroll-specific selectors
│   │   └── generic-adapter.js      # Generic site adapters factory
│   ├── styles/main.css     # Visual cleanup CSS
│   └── icons/icon.svg      # Extension icon
└── src/
    ├── shared/
    │   ├── types.ts        # TypeScript interfaces (AnimeEntry, SiteAdapter, etc.)
    │   └── storage.ts      # StorageManager class (chrome.storage.local wrapper)
    ├── content/
    │   ├── main.ts         # Core logic
    │   ├── crunchyroll-adapter.ts
    │   └── generic-adapter.ts
    ├── popup/popup.ts      # Popup logic
    ├── background/service-worker.ts
    └── styles/main.css
```

### Key Types (`src/shared/types.ts`)
```typescript
type AnimeStatus = 'favorite' | 'watched' | 'watching' | 'plan_to_watch';

interface AnimeEntry {
  id: string;           // Site-specific series ID
  title: string;
  coverUrl?: string;
  site: string;         // 'crunchyroll' | 'animesorion' | ...
  siteUrl: string;      // Origin for cross-site linking
  status: AnimeStatus;
  episodesWatched?: number;
  totalEpisodes?: number;
  lastUpdated: number;
  notes?: string;
}

interface SiteAdapter {
  name: string;
  matchUrl: RegExp;
  getSeriesId(url: string): string | null;
  getSeriesTitle(doc: Document): string | null;
  getSeriesCover(doc: Document): string | null;
  getEpisodeList(doc: Document): EpisodeInfo[];
  getCurrentEpisode(doc: Document): EpisodeInfo | null;
  injectUI(container: HTMLElement, entry: AnimeEntry | null, onUpdate: (status: AnimeStatus) => void): void;
  observeMutations(callback: () => void): MutationObserver | null;
}
```

### Storage Key
- `crunchyboa_anime_data` → `Record<string, AnimeEntry>` (key = `${site}:${id}`)
- `crunchyboa_settings` → `{ enabledSites[], showBadges, autoDetectCrunchyroll, syncAcrossDevices }`

---

## Known Issues / Next Steps

### High Priority
1. **Episode list detection on Crunchyroll** - `getEpisodeList()` returns 0 episodes because selectors don't match current Crunchyroll DOM. Need to inspect `.season-episodes`, `[data-t="episode-item"]`, or GraphQL data.
2. **Current episode detection** - `getCurrentEpisode()` returns undefined on watch pages.
3. **Auto-increment on episode end** - Listen for video `ended` event or Crunchyroll's "next episode" navigation.
4. **Badge injection on series cards** - Add small status badges (★/✓/▶/+) on grid cards in home/browse pages.

### Medium Priority
5. **Settings sync** - Implement `chrome.storage.sync` when `syncAcrossDevices` enabled.
6. **Keyboard shortcuts** - `Ctrl+Shift+F` (favorite), `Ctrl+Shift+W` (watched), etc.
7. **Toast notifications** - Brief confirmation when status changes.
8. **Better generic selectors** - Current generic adapters use fallback selectors; need site-specific tuning.

### Low Priority
9. **Dark/light theme detection** - Adapt widget colors to site theme.
10. **Keyboard navigation** - Arrow keys between status buttons.
11. **Multiple profiles support** - Crunchyroll profiles.
12. **AniList/MyAnimeList sync** - Optional cloud backup.

---

## Development Commands
```bash
cd CrunchyBoa
npm install
node build.js          # Production build
node build.js --watch  # Dev with rebuild on change
```

## Testing Checklist
- [ ] Crunchyroll series page (`/series/ID`) → widget appears under header
- [ ] Crunchyroll watch page (`/watch/ID/ep-slug`) → widget appears, current episode detected
- [ ] Click status buttons → updates storage, UI reflects change
- [ ] Popup shows entry, filters work, export/import JSON works
- [ ] Context menu "Marcar assistido" / "Alternar favorito" works
- [ ] Generic sites (AnimesOrion, etc.) → widget appears

---

## Files to Inspect/Modify Next

### `src/content/crunchyroll-adapter.ts`
- `getEpisodeList()` - Update selectors for current Crunchyroll layout
- `getCurrentEpisode()` - Extract from URL or page meta
- Consider scraping `__INITIAL_STATE__` or GraphQL responses for episode data

### `src/content/main.ts`
- Add video `ended` listener for auto-increment
- Improve `findInjectionPoint()` for watch pages

### `src/shared/storage.ts`
- Add `chrome.storage.sync` support when enabled

### `src/popup/popup.ts`
- Add toast notification system
- Keyboard shortcuts handling

---

## Context for Next Session
The extension is **functional but incomplete on episode detection**. The widget renders and saves state correctly. Main blocker is Crunchyroll's dynamic DOM - episode list loads via SPA navigation, selectors need updating. Use DevTools on a series page to find current selectors for:
- Episode container: `[data-t="season-episodes"]`, `.season-episodes`, `.episodes-list`
- Episode items: `[data-t="episode-item"]`, `.episode-item`, `a[href*="/watch/"]`
- Current episode on watch page: URL pattern, `[data-t="episode-title"]`, page meta

Run `node build.js` after changes, reload extension in `chrome://extensions`, test.