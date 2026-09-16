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
- [ ] Full interactive simulator walkthrough of the completed five-stage session and streak behavior remains to be validated in a live iOS environment

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
- [ ] Full interactive Bible reader and daily-session walkthrough remains to be validated in a live iOS environment

## Notes

This checklist is the source of truth for app progress. Update after each validation step.
