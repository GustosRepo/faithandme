# Faith & Me Next Steps

## Current production state

- Railway API is deployed at `https://faithandme-production.up.railway.app`.
- `/health` returns `200`.
- Ask Scripture production request succeeds with `gpt-5.6-luna`.
- Anonymous usage gating is active and returns daily limit, used, remaining, and reset time.
- Railway PostgreSQL is required in production through `DATABASE_URL`.
- `IP_HASH_SECRET` is required in production for daily hashed-IP abuse buckets.
- No user accounts, authentication, RevenueCat, RAG, embeddings, or paid tier plumbing are currently in scope.

## Latest completed implementation: Phase 5A.5 Bible interaction pass

Status:

- Bible now has a local `BibleActivityState` store backed by AsyncStorage.
- Existing Continue Reading data migrates safely into the new activity store.
- Bible home shows real local stats for chapters read, bookmarks, and highlights.
- Book rows show per-book reading progress with compact progress bars.
- Book chapter lists show total completion progress, current chapter, and read/open states.
- The chapter reader tracks the last opened verse, supports tap-to-select verse rows, and persists that position locally.
- Selected verses can be highlighted or bookmarked from the reader.
- Reader settings now include local font size and serif/sans preferences.
- Chapters can be marked read from the reader to drive per-book progress.
- Me tab saved/highlighted verse counts now come from real Bible activity data.
- Saved Scripture screen now lists local bookmarks and highlights with open/remove actions.
- Bible home and Me tab link into Saved Scripture.
- No backend sync, accounts, authentication, RevenueCat, RAG, embeddings, or paid-tier changes were added.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.
- Simulator visual QA passed for Bible home, the Revelation chapter list, the Revelation 1 reader layout, and the empty Saved Scripture state.

Next Bible QA:

1. Manually validate the remaining interaction states on simulator/device:

- Verse selection
- Highlight and unhighlight
- Bookmark and unsave
- Mark chapter read
- Me tab saved/highlighted verse counts

## Previous completed implementation: Phase 5A.4 visual identity pass

Status:

- Visual identity pass is implemented across shared tokens, typography, BrandMark, Today, Bible, Ask, Welcome/onboarding, 5 Minutes, Journal, and Me.
- The palette now uses parchment, ink, deep olive, soft olive, warm stone, and restrained wine tokens.
- Dark mode now uses warmer, lower-glare colors intended to feel like a Bible at night.
- Serif typography is used for Scripture, reflection, and devotional hierarchy; sans remains for interface text.
- The original olive sprig BrandMark is implemented in React Native views and used sparingly.
- An app-wide illustrated background now adds an SVG olive branch, dove, and faint page-mark motifs so screens feel more specific to Faith & Me.
- The olive branch motif uses a reusable `react-native-svg` vector component instead of assembled View shapes. CC0/public-domain olive branch references were checked before implementation.
- Pills/cards were reduced on the highest-priority surfaces in favor of hairline dividers, typography, and whitespace.
- No backend, AI behavior, Ask Scripture retrieval, navigation, account, RevenueCat, RAG, embedding, or paid-tier changes were added in this phase.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.
- Expo iOS launch succeeds on the iPhone 17 Pro Max simulator with Metro on port `8084`.

Next visual QA:

1. Launch the Expo app against production:

```sh
EXPO_PUBLIC_FAITH_API_URL=https://faithandme-production.up.railway.app
```

2. Review light and dark mode on these surfaces:

- Today
- Bible home
- Bible reader
- Ask initial, loading, answer, error, and exhausted states
- Journal
- Me
- Welcome and onboarding selections
- 5 Minutes session and completion

3. Capture screenshots and fix any spacing, contrast, wrapping, or overlap issues.

## Carryover: Phase 5A.3 production mobile validation

Status:

- Ask Scripture UI polish is implemented in the mobile Ask tab.
- Production API validation succeeded for three representative Ask requests.
- The fourth request from the same anonymous client returned `DAILY_ASK_LIMIT`.
- Expo Go simulator validation works through LAN mode after explicit approval.
- Anonymous client ID generation now uses `expo-crypto`, which fixes SecureStore identity creation in Expo Go.
- Ask initial state and daily usage copy were validated in the simulator in light and dark mode.
- Simulator tap automation was not available in this Xcode runtime, so a full UI-submitted Ask request still needs manual tapping or a simulator automation tool that supports touch injection.

1. Run the Expo app against production:

```sh
EXPO_PUBLIC_FAITH_API_URL=https://faithandme-production.up.railway.app
```

2. Validate the Ask tab on a simulator/device:

- first Ask request succeeds
- answer renders with local BSB Scripture text
- usage count decreases after successful Ask
- exhausted state appears after the configured daily limit
- validation errors remain friendly
- network/API failures do not expose server details
- keyboard remains usable over the composer

3. Validate Railway logs for a successful Ask request:

- `status: 200`
- `model: gpt-5.6-luna`
- `reasoningEffort: low`
- `latencyMs`
- `tokenUsage`

Representative token sample from the same Luna server service path:

- anxiety: 466 input, 435 output, 901 total
- forgiveness: 487 input, 505 output, 992 total
- direction: 496 input, 436 output, 932 total
- average: 483 input, 459 output, 942 total

## Product direction after Phase 5A.3

Keep the no-account anonymous model for now. The app can support many users through anonymous install IDs plus server-side daily limits, hashed-IP backstops, global daily caps, and the emergency kill switch.

Before adding paid tiers, finish pre-launch polish:

- improve Ask empty/error/loading/exhausted states
- review pastoral/safety copy
- add basic production monitoring habits for cost and latency
- collect token usage samples to estimate real cost per Ask
- decide whether the free limit should stay at 3/day

Paid tiers can come later. If needed, a future Pro plan can raise the per-install daily limit after purchase validation while keeping global and abuse caps in place for every tier.
