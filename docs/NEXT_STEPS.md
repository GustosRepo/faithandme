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

## Latest development pass: Ask + Journal local reflection loop

Status:

- Journal tab now uses local AsyncStorage-backed entries instead of mock data.
- Journal supports prayer, reflection, and gratitude entry types with local counts.
- Journal entries can be created and deleted on-device.
- Journal list now renders a paged preview archive instead of every full entry at once.
- Long journal entries open in a full-entry detail view while preserving the quiet list flow.
- Ask Scripture answers can be saved into Journal as reflection entries.
- Saved Ask entries include the original question, summary, Scripture passages, context, application, reflection prompts, prayer, and next step.
- No backend, AI model, account, authentication, RevenueCat, RAG, embeddings, or paid-tier changes were added.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Latest development pass: Me dashboard pass

Status:

- Me tab now acts as a personal dashboard instead of a static profile/preferences page.
- Me shows current streak, today's 5 Minutes progress, and Ask Scripture daily usage when available.
- Me loads real local Bible activity, including completed chapters, saved verses, highlights, and last reading position.
- Me loads real local Journal counts for prayers, reflections, gratitude, and entries saved from Ask Scripture.
- Me includes active shortcuts for Today's Moment, Continue Reading, Journal, Ask Scripture, and Saved Scripture.
- The inactive Faith & Me Pro placeholder was removed from the Me tab.
- No backend, AI model, account, authentication, RevenueCat, RAG, embeddings, or paid-tier changes were added.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Latest development pass: Plus upgrade entry points

Status:

- Added a dedicated Faith & Me Plus upgrade screen at `/upgrade`.
- Me now includes an Upgrade to Plus shortcut and a visible Faith & Me Plus section.
- Ask Scripture exhausted/free-limit state now links to the upgrade screen.
- Upgrade and restore buttons are visible but intentionally stubbed until App Store subscription products and purchase handling are wired.
- No RevenueCat, StoreKit, backend entitlement, authentication, paid-tier enforcement, or real purchase validation was added in this pass.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Latest development pass: First Plus gate implementation

Status:

- Ask answers now include follow-up actions: Go deeper, Explain context, Turn into prayer, and 3-day plan.
- Follow-up actions turn the previous answer into the next Ask Scripture question.
- Journal now includes guided prompts for prayer, reflection, and gratitude.
- Journal archive now supports local search across title, content, kind, and Ask-saved entries.
- Journal archive now supports filters for all entries, prayer, reflection, gratitude, and entries saved from Ask Scripture.
- Plus upgrade screen copy now matches the documented offer: More Ask Scripture + guided reflection tools.
- Plus screen now explicitly states what remains free: Bible, daily moment, basic Journal, saved Scripture/highlights, and safety support.
- No RevenueCat, StoreKit, backend entitlement, authentication, paid-tier enforcement, or real purchase validation was added in this pass.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Latest development pass: Saved Scripture search + weekly review

Status:

- Saved Scripture now supports local search across reference, text, and saved type.
- Saved Scripture now supports filters for all saved Scripture, bookmarks, and highlights.
- Saved Scripture now shows bookmarks and highlights together in an All view.
- Added a local Weekly Review screen at `/review/weekly`.
- Weekly Review summarizes the last seven days of Journal entries, Ask-saved reflections, saved/highlighted Scripture, and a simple theme to notice.
- Weekly Review shows all-time completed chapter count separately because chapter completion does not yet store completion timestamps.
- Me tab now links to Weekly Review from shortcuts.
- No backend, AI model, account, authentication, RevenueCat, StoreKit, paid-tier enforcement, or real purchase validation was added.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Latest development pass: Background texture pass

Status:

- App-wide FaithBackground now includes a subtle vector paper texture layer.
- Added low-opacity grain specks, page-fiber strokes, faint margin rules, and margin dots.
- Texture is theme-aware with restrained light/dark opacity.
- No image assets, gradients, backend, AI behavior, navigation, account, RevenueCat, StoreKit, or paid-tier changes were added.
- TypeScript validation passes with `npx tsc --noEmit --pretty false`.

## Plus product strategy

Principle:

- Plus should sell depth, continuity, and convenience.
- Plus should not make the free app feel spiritually crippled.
- Do not gate Bible access, basic prayer/journal, safety guidance, saved Scripture, highlights, or the basic daily devotional habit.
- Do not promise unlimited Ask Scripture until real usage costs and abuse patterns are measured.

Keep free:

- Full offline Berean Standard Bible access.
- Daily 5 Minutes With God.
- Basic local Journal.
- Saved Scripture and highlights.
- A small daily Ask Scripture limit.
- Crisis/safety responses and pastoral safety copy.

Best first Plus gates:

- Higher Ask Scripture daily limit, framed as "more Ask Scripture each day" instead of unlimited.
- Ask follow-up modes, first UI implemented:
  - Go deeper.
  - Explain the context.
  - Turn this into a prayer.
  - Give me a 3-day plan.
- Guided Journal prompts, first prayer/reflection/gratitude prompt set implemented.
- Search and filters for Journal entries, first local archive search/filter implementation complete.
- Search and filters for saved Scripture.
- Weekly spiritual review summarizing what the user asked, prayed, read, saved, and noticed.
- Personalized devotional paths for themes such as anxiety, forgiveness, marriage, grief, discipline, purpose, and trust.
- Nicely formatted export/share for prayers, reflections, and Ask answers.
- Reminder and rhythm customization beyond the basic reminder.

Possible Plus gates later:

- Cross-device sync.
- Encrypted cloud backup.
- Home screen widgets.
- Audio/prayer mode.
- Longer Bible reading plans.
- AI memory over journal history, only with explicit privacy controls and careful consent.

Initial Plus offer:

- "More Ask Scripture + guided reflection tools."
- Suggested starting policy: Free gets the current small daily limit; Plus gets a higher daily limit such as 20/day, still protected by global daily caps, hashed-IP abuse limits, in-flight guards, and the emergency kill switch.

Next subscription implementation:

1. Create App Store Connect subscription products.
2. Add RevenueCat or direct StoreKit purchase handling.
3. Add server-side entitlement validation before raising Ask limits.
4. Add entitlement-aware Ask follow-up modes and guided Journal prompts.
5. Replace the stub upgrade alerts with real purchase and restore flows.
6. Update Plus screen copy to match the implemented gates exactly.

Next Plus feature implementation:

1. Add first devotional paths for anxiety, forgiveness, purpose, and grief.
2. Add export/share for Journal entries and Ask answers.
3. Add completion timestamps to chapter reading progress so Weekly Review can show chapters read this week.
4. Add richer weekly review insights after more activity data exists.

Next Me QA:

1. Validate on simulator/device:

- Me stats update after completing daily-session stages.
- Me Bible stats update after saving/highlighting verses and marking chapters read.
- Continue Reading opens the last local Bible position.
- Me Journal counts update after creating/deleting entries and saving from Ask.
- Ask usage gracefully shows remaining count when connected and offline copy when unavailable.
- Upgrade shortcut opens the Plus screen.
- Upgrade and restore buttons show the temporary setup alert.
- Weekly Review shortcut opens the review screen.

Next Ask + Journal QA:

1. Validate on simulator/device:

- Create a manual prayer entry.
- Switch entry type and create reflection/gratitude entries.
- Create a long entry and confirm the list shows only a preview.
- Open a long entry and confirm the full text is readable in the detail view.
- Create enough entries to validate the Show more archive paging.
- Delete an entry and confirm it stays deleted after reopening Journal.
- Ask a question, save the answer to Journal, and open Journal from the answer screen.
- Confirm saved Ask entries survive app restart.
- Search and filter saved Scripture by text/reference/type.
- Weekly Review updates after recent Journal entries and saved/highlighted Scripture.

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

Background texture QA:

- Confirm the paper texture is visible enough to add warmth but does not compete with Scripture or Journal text.
- Check light and dark mode on Today, Ask, Bible reader, Journal, Me, Plus, and Weekly Review.
- If the texture reads too busy on small screens, reduce `PaperTexture` opacity in `components/FaithBackground.tsx`.

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

Paid tiers should use the Plus strategy above: sell more Ask depth, guided reflection, search/review, and personalization while keeping Bible access, basic Journal, saved Scripture, and safety support free. A future Plus plan can raise the per-install daily limit after purchase validation while keeping global and abuse caps in place for every tier.
