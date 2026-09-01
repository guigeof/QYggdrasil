## 2024-10-24 - Accessibility localization with custom i18n
**Learning:** In this application, a custom `applyI18n()` function replaces the `textContent` of elements containing `data-i18n` attributes. This breaks icon-only buttons because it replaces the inner `<svg>` icons with text.
**Action:** Do not use `data-i18n` for translating `aria-label` or `title` on icon-only buttons. Instead, manually add localized (pt-BR) `aria-label` and `title` attributes directly in the HTML to preserve functionality while avoiding WCAG accessibility violations.
