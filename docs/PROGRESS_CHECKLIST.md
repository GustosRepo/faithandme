# Faith & Me Progress Checklist

## Phase 1 status

- [x] Project initialized with Expo + Expo Router
- [x] Core app shell and tab-based navigation created
- [x] Shared light/dark theme tokens implemented
- [x] Reusable UI primitives established
- [x] Today screen placeholder polished
- [x] Bible, Ask, Journal, and Me placeholders created
- [x] Final TypeScript validation and Expo startup check complete

## Phase 2 status

- [x] Local onboarding state model created with typed AsyncStorage persistence
- [x] Root route gating added so first-run users land in onboarding before tabs
- [x] Onboarding flow screens created for welcome, goals, situations, feeling, translation, reminder, preview, and ready states
- [x] App shell includes onboarding provider and a loading state to avoid tab flash
- [x] Local personalization applied to Today and Me based on onboarding values
- [x] Development-only reset path added for local onboarding reset
- [x] TypeScript validation passes for the completed onboarding phase
- [x] Local Expo startup smoke test launched successfully

## Phase 3 status

- [x] Local daily-session model created with typed stage, progress, and streak types
- [x] Curated local daily content library created with eight theme-driven sessions
- [x] Session selection logic added using local personalization + device local date
- [x] Daily-session persistence created using AsyncStorage with safe normalization and fallbacks
- [x] Streak logic implemented using local calendar-day boundaries
- [x] Today screen wired to dynamic daily-session state and status
- [x] Focused session route added for Scripture → Reflect → Think → Pray → Act flow
- [x] Development-only reset actions added for the daily moment and streak in __DEV__
- [x] TypeScript validation passes for the daily-session engine changes
- [x] Expo startup smoke test launched successfully
- [x] Full interactive simulator walkthrough of the completed five-stage session and streak behavior validated in a live iOS environment

## Phase 4A status

- [x] Translation: Berean Standard Bible (BSB)
- [x] Scripture source: official Berean Bible USFM download, with provenance documented
- [x] Public-domain terms verified from official Berean documentation
- [x] Local bundled BSB dataset generated and validated
- [x] Scripture provider: LocalBibleProvider behind ScriptureService
- [x] Daily sessions migrated from embedded Scripture text to canonical references
- [x] Today and 5 Minutes Scripture use the local BSB provider
- [x] Translation onboarding removed; old stored values are ignored safely
- [x] Offline Bible book, chapter, and reader foundation added
- [x] Continue Reading persists the last opened book and chapter
- [x] Full interactive Bible reader and daily-session walkthrough validated in a live iOS environment

## Phase 5A status

- [x] Ask Scripture mobile service boundary added with centralized API configuration
- [x] Deterministic local topic-to-Scripture retrieval added using canonical BSB references only
- [x] Curated Ask Scripture references validated against the bundled local BSB corpus
- [x] Ask screen composer, loading, error, and structured editorial response UI implemented
- [x] Mobile resolves displayed Scripture text locally from ScriptureService
- [x] Railway-ready Express/TypeScript server added under server/
- [x] POST /api/ask-scripture request validation, size limits, and trust-boundary checks implemented
- [x] Server-side OpenAI Responses API integration isolated behind configuration
- [x] Structured model response validation restricts returned Scripture references to supplied references
- [x] Basic server-side safety classification added for immediate-danger scenarios
- [x] Basic IP rate limiting added and smoke-tested locally
- [x] GET /health endpoint added and verified locally
- [x] server/.env.example and deployment notes added
- [x] Server TypeScript build and focused validation tests pass
- [x] Live OpenAI response validation completed with server-loaded OPENAI_API_KEY
- [x] Railway deployment validation completed with production API URL

## Phase 5A.1 status

- [x] Anonymous install identity added using expo-secure-store
- [x] Ask requests include server-validated X-Faith-Client-Id
- [x] Server-authoritative daily free Ask limit added
- [x] GET /api/ask-scripture/usage added for authoritative remaining count
- [x] Durable anonymous usage persistence implemented with PostgreSQL-compatible DATABASE_URL
- [x] Daily AI usage buckets use server UTC date, distinct from local devotional dates
- [x] Hashed daily IP abuse bucket added without storing raw IP addresses
- [x] Global daily AI cap added
- [x] ASK_SCRIPTURE_ENABLED emergency kill switch added
- [x] Per-client in-flight request guard added
- [x] Mobile Ask screen displays restrained remaining/free-exhausted state
- [x] No user accounts, authentication, cross-device sync, RevenueCat, pgvector, or embeddings added
- [x] Focused anonymous usage policy tests pass

## Phase 5A.2 status

- [x] Ask Scripture default model changed server-side to gpt-5.6-luna
- [x] OPENAI_MODEL override preserved for Railway/local operations
- [x] Mobile app cannot choose or override the OpenAI model
- [x] Reasoning effort centralized and defaulted to low
- [x] Structured Outputs retained through the Responses API JSON schema path
- [x] Output token ceiling remains centralized in serverConfig.limits.maxOutputTokens
- [x] No fallback to a more expensive model added
- [x] Privacy-safe OpenAI token usage captured in server logs only
- [x] Existing free daily, hashed-IP, global daily cap, emergency switch, and in-flight guards preserved
- [x] Railway build/runtime pinned to Node 22 for OpenAI SDK compatibility
- [x] Railway PostgreSQL DATABASE_URL required and validated for production usage persistence
- [x] Production OpenAI project granted gpt-5.6-luna access
- [x] Production Ask Scripture request validated successfully on gpt-5.6-luna with anonymous usage count returned
- [x] No RAG, embeddings, auth, RevenueCat, or paid tier plumbing added

## Phase 5A.3 status

- [x] Phase 5A.3 Ask Scripture initial, loading, error, exhausted, and editorial answer UI polish implemented
- [x] Suggested topics populate the composer without auto-submitting
- [x] Production Railway Ask usage flow validated through API: 3 to 2 to 1 to 0, then DAILY_ASK_LIMIT
- [x] Representative Luna token sample captured from the server OpenAI service
- [x] Expo Go simulator launched through LAN mode against production Railway API
- [x] Anonymous client ID generation fixed for Expo Go with expo-crypto
- [x] Ask usage banner validated in simulator: "3 questions available today"
- [x] Ask initial state validated in light and dark simulator appearances
- [ ] Submit a full Ask request through actual simulator UI controls
- [ ] Verify exhausted state, retry behavior, and app copy in the actual app UI
- [ ] Confirm Railway logs include model, reasoningEffort, latencyMs, and tokenUsage for successful Ask requests
- [ ] Capture and review screenshots for Ask loading, answer, and exhausted states
- [ ] Decide Phase 5B direction: pre-launch polish and safety/cost monitoring before adding paid tiers
- [ ] Keep no-account anonymous model unless a future feature clearly requires cross-device identity

## Phase 5A.4 status

- [x] Visual identity pass implemented without changing Ask behavior, backend behavior, Scripture retrieval, navigation, accounts, RevenueCat, widgets, RAG, embeddings, or paid tier plumbing
- [x] Shared palette refreshed to parchment, ink, deep olive, soft olive, warm stone, and restrained wine tokens
- [x] Dark mode refreshed toward a low-glare "Bible at night" palette
- [x] Shared serif/sans typography distinction added for Scripture, reflection, and interface surfaces
- [x] Original React Native olive sprig BrandMark added and used sparingly on high-signal surfaces
- [x] App-wide illustrated FaithBackground added with SVG olive branch, dove, and faint page-mark motifs
- [x] Olive branch motif replaced with a reusable react-native-svg vector component instead of assembled View shapes
- [x] Shared UI primitives updated with quieter buttons, chips, dividers, cards, Scripture display, and editorial labels
- [x] Today screen restyled with editorial hierarchy, unframed Daily Scripture, and reduced pill/card usage
- [x] Bible home, book chapter list, and chapter reader restyled around typography, hairline dividers, and BSB attribution
- [x] Ask Scripture UI restyled with the BrandMark, editorial labels, richer empty/answer states, and restrained panels
- [x] Welcome and onboarding selection screens updated to the new typography and quieter selection styling
- [x] 5 Minutes session and completion screens restyled with unframed reflection blocks and quieter completion state
- [x] Journal and Me tabs lightly aligned to the new editorial system
- [x] TypeScript validation passes after the visual identity pass
- [x] Expo iOS launch succeeded on iPhone 17 Pro Max simulator with Metro on port 8084
- [ ] Run Expo visual QA across light and dark mode after the next app launch
- [ ] Capture screenshots for Today, Bible reader, Ask, Journal, onboarding, and 5 Minutes completion

## Phase 5A.5 status

- [x] Bible activity store added with local AsyncStorage persistence and legacy Continue Reading migration
- [x] Bible home now shows real reading stats for chapters read, bookmarks, and highlights
- [x] Book list now shows per-book chapter progress with progress bars
- [x] Book chapter list now shows per-book completion progress plus current/read chapter states
- [x] Bible reader now tracks last opened verse locally
- [x] Bible reader now supports tap-to-select verses
- [x] Verse highlighting added with local persistence
- [x] Verse bookmarking added with local persistence
- [x] Reader font controls added for size and serif/sans preference
- [x] Chapter completion action added for local reading progress
- [x] Me tab saved/highlighted verse counts now read from real Bible activity state
- [x] Saved Scripture screen added for local bookmarks and highlights
- [x] Bible home and Me tab link to Saved Scripture
- [x] Bible chapter reader has a visible Back to chapters control
- [x] TypeScript validation passes after the Bible interaction pass
- [x] Simulator visual QA completed for Bible home, Revelation chapter list, and Revelation 1 reader layout
- [x] Simulator visual QA completed for empty Saved Scripture state
- [ ] Manually QA verse highlight/bookmark tap states, Mark chapter read, and Me counts on simulator/device
- [ ] QA Bible reader Back to chapters control on simulator/device

## Ask + Journal development status

- [x] Journal mock data replaced with local AsyncStorage-backed entries
- [x] Journal supports prayer, reflection, and gratitude entry types
- [x] Journal entry counts update from real local entries
- [x] Journal entries can be created and deleted locally
- [x] Journal list uses paged previews for longer archives
- [x] Long entries open in a full-entry detail view instead of expanding in the list
- [x] Ask Scripture answers can be saved to Journal as reflection entries
- [x] Saved Ask entries include the question, Scripture, reflection prompts, prayer, and next step
- [x] TypeScript validation passes after Ask + Journal changes
- [ ] QA manual Journal create/delete persistence on simulator/device
- [ ] QA long Journal entry preview/detail behavior on simulator/device
- [ ] QA Journal Show more behavior with many saved entries
- [ ] QA Ask answer save-to-Journal flow on simulator/device

## Me dashboard development status

- [x] Me tab upgraded from static profile to real personal dashboard
- [x] Me shows current streak, today progress, and Ask usage
- [x] Me shows Bible completed chapter, saved verse, highlight, and continue-reading stats
- [x] Me shows Journal prayer, reflection, gratitude, and Ask-saved counts
- [x] Me includes active shortcuts to Today, Bible, Journal, Ask, and Saved Scripture
- [x] Inactive Faith & Me Pro placeholder removed from Me
- [x] TypeScript validation passes after Me dashboard changes
- [ ] QA Me dashboard stat refresh on simulator/device
- [ ] QA Continue Reading shortcut from Me on simulator/device

## Plus upgrade development status

- [x] Dedicated Plus upgrade screen added
- [x] Me includes visible Upgrade to Plus entry points
- [x] Ask exhausted state links to Upgrade
- [x] Upgrade/restore actions use temporary setup alerts
- [x] Plus product strategy documented around depth, continuity, and convenience
- [x] Free tier protections documented: Bible, daily moment, basic Journal, saved Scripture, highlights, safety support, and small Ask limit stay free
- [x] Best first Plus gates documented: higher Ask limit, Ask follow-ups, guided Journal prompts, search/filters, weekly review, devotional paths, exports, and advanced reminder rhythms
- [x] Later Plus gates documented: sync, encrypted backup, widgets, audio/prayer mode, longer plans, and privacy-controlled AI memory
- [x] Ask follow-up actions implemented: Go deeper, Explain context, Turn into prayer, and 3-day plan
- [x] Journal guided prompts implemented for prayer, reflection, and gratitude
- [x] Journal local search implemented
- [x] Journal filters implemented for all, prayer, reflection, gratitude, and Ask-saved entries
- [x] Plus screen copy updated to match the first Plus offer
- [x] Saved Scripture local search implemented
- [x] Saved Scripture filters implemented for all, bookmarks, and highlights
- [x] First local Weekly Review screen implemented
- [x] Me shortcut added for Weekly Review
- [x] TypeScript validation passes after upgrade entry-point changes
- [ ] Create App Store Connect subscription products
- [ ] Wire RevenueCat or StoreKit purchase flow
- [ ] Add entitlement-aware Ask limits server-side
- [x] Add saved Scripture search and filters
- [x] Add first Plus weekly spiritual review
- [ ] Add Plus personalized devotional paths
- [ ] Add Plus export/share for prayers, reflections, and Ask answers
- [ ] QA Upgrade screen and exhausted Ask upgrade path on simulator/device
- [ ] QA Ask follow-up actions on simulator/device
- [ ] QA Journal guided prompts, search, and filters on simulator/device
- [ ] QA Saved Scripture search and filters on simulator/device
- [ ] QA Weekly Review on simulator/device

## Background texture development status

- [x] FaithBackground paper texture layer added
- [x] Texture uses vector grain specks, page fibers, faint margin rules, and margin dots
- [x] Texture opacity is theme-aware for light and dark mode
- [x] No image assets or heavy decorative gradients added
- [x] TypeScript validation passes after background texture changes
- [ ] QA background texture readability in light and dark mode on simulator/device

## Spanish localization development status

- [x] Local app language state added with AsyncStorage persistence
- [x] Root app shell wrapped in LanguageProvider
- [x] Bottom tab labels localized for English and Spanish
- [x] Today screen localized, including greeting, topic labels, Daily Scripture labels, session progress, and streak copy
- [x] 5 Minutes session shell localized, including stage labels, hints, close/continue actions, and completion state
- [x] Ask Scripture UI localized, including usage copy, composer, suggested topic prompts, error states, answer section labels, follow-up actions, and save-to-Journal actions
- [x] Ask suggested questions and follow-up prompts are language-aware so Spanish mode nudges AI responses toward Spanish
- [x] Journal UI localized, including composer, guided prompts, search/filter controls, archive states, date words, full-entry modal, and delete alerts
- [x] Bible home, book chapter list, chapter reader controls, and Saved Scripture screen localized
- [x] Weekly Review localized, including theme labels and Spanish-aware theme keyword detection
- [x] Onboarding screens localized while preserving existing English internal personalization values for compatibility
- [x] Me tab primary dashboard, shortcuts, preferences, Plus block, and developer actions localized
- [x] Me preferences now include an English/Español language selector
- [x] Plus upgrade screen localized, including free/Plus feature copy and temporary subscription alerts
- [x] Spanish devotional/session copy added for all current daily-session themes
- [x] Daily-session selection now localizes visible devotional copy without changing stored session ids
- [x] Ask Scripture mobile requests now include selected app language
- [x] Ask Scripture server schema accepts `language: "en" | "es"` with English default
- [x] Ask Scripture server prompt now explicitly requests natural Latin American Spanish for Spanish-mode users
- [x] Successful Ask logs now include request language
- [x] Server schema tests cover Spanish Ask request language
- [x] Spanish aliases added to local Ask Scripture reference retrieval topics
- [x] Public-domain Reina-Valera 1909 provenance documented
- [x] Reina-Valera 1909 USFM importer added
- [x] Generic scripture dataset validator added for bundled Bible corpora
- [x] Reina-Valera 1909 corpus generated at `data/rv1909.json`
- [x] Reina-Valera 1909 corpus validates with 66 books, 1,189 chapters, no duplicate references, no empty verse records, and no malformed records
- [x] ScriptureService selects BSB for English and RV1909 for Spanish
- [x] Today and 5 Minutes daily Scripture resolve through the active Bible provider
- [x] Bible home, book list, chapter reader, and Saved Scripture resolve through the active Bible provider
- [x] Ask Scripture retrieval and displayed verses resolve through the active Bible provider
- [x] Me tab Bible translation preference displays the active Bible provider
- [x] Focused runtime check confirms Spanish retrieval returns RV1909 and English retrieval still returns BSB
- [x] TypeScript validation passes after the expanded Spanish localization pass
- [x] Server typecheck and tests pass after Ask language-awareness changes
- [ ] QA language switching on simulator/device, including persistence after app restart
- [ ] QA Spanish Bible reading, saved verses, highlights, and Ask answer Scripture display
- [ ] Review RV1909 public-domain Spanish orthography and UX expectations before launch
- [ ] Review all Spanish copy with a native speaker before launch
- [ ] Add device-language detection if we decide Spanish users should see Español automatically on first launch

## Next priority

- [ ] QA Spanish language switching across Today, 5 Minutes, Ask, Journal, Bible, Saved Scripture, Weekly Review, Onboarding, Me, and Plus
- [ ] QA Spanish Ask Scripture answers using RV1909 local verse text
- [ ] QA Spanish Bible reading, bookmarks, highlights, and saved Scripture display
- [ ] QA background texture across primary screens
- [ ] Decide RevenueCat vs direct StoreKit for subscription plumbing
- [ ] Implement first devotional paths
- [ ] Implement export/share for Journal entries and Ask answers
- [ ] Complete Plus upgrade simulator/device QA
- [ ] Complete Me dashboard simulator/device QA
- [ ] Complete Ask + Journal simulator/device QA
- [ ] Complete manual Phase 5A.5 Bible interaction QA for highlight/bookmark, Mark chapter read, and Me counts
- [ ] Complete remaining Phase 5A.4 visual QA on simulator/device
- [ ] Finish the remaining Phase 5A.3 full Ask UI submission and exhausted-state validation in the actual app UI
- [ ] Confirm Railway logs include model, reasoningEffort, latencyMs, and tokenUsage for a fresh successful Ask request
- [ ] Decide whether saved/highlighted Bible verses need a dedicated Library/Saved screen before launch
- [ ] Decide Phase 5B direction: pre-launch polish and safety/cost monitoring before adding paid tiers
- [ ] Keep no-account anonymous model unless a future feature clearly requires cross-device identity

## Notes

This checklist is the source of truth for app progress. Update after each validation step.
