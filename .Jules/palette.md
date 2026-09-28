## 2026-09-12 - ARIA Labels vs custom data-i18n on Icon-Only Buttons
**Learning:** Using `data-i18n` attributes on icon-only HTML buttons (e.g., buttons whose only child is a `<svg>` or an emoji text node) can cause issues because the custom `applyI18n()` function replaces the button's entire `textContent`, thus removing the icon element.
**Action:** For icon-only buttons, use hardcoded, pre-localized `aria-label` attributes instead of `data-i18n` to preserve the visual icon while maintaining screen reader accessibility, or adjust the translation function to only target specific sub-nodes.
