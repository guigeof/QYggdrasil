## 2024-05-24 - Accessibility improvements for icon-only buttons
**Learning:** Found that `data-i18n` attributes shouldn't be used for icon-only buttons in this app because the custom `applyI18n()` translation function replaces the button's `textContent`, overwriting the inner SVG/icon elements. Instead, we must use `aria-label` attributes localized directly in Portuguese.
**Action:** Always use localized `aria-label` for icon-only buttons (like modals' close buttons or workspace delete buttons) to ensure screen readers provide context without breaking the UI.
