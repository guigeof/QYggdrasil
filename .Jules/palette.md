## 2024-05-18 - Added ARIA labels in Portuguese
**Learning:** Found several icon-only buttons (like modal close buttons and dynamically generated quick action buttons) that lacked accessibility labels. Since the application's primary UI language is Portuguese (pt-BR), it is crucial to provide translated `aria-label`s for screen reader support to avoid WCAG violations and user confusion.
**Action:** When adding ARIA labels or standard accessibility descriptions, ensure they are localized to match the primary language of the application (Portuguese).
