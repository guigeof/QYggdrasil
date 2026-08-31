## 2025-05-18 - Localized ARIA labels on Icon-only Buttons
**Learning:** Icon-only buttons with `&times;` (or SVG) require localized `aria-label` attributes. We cannot use `data-i18n` on them because the custom translation script replaces `textContent`, which destroys the inner HTML/icons.
**Action:** Hardcode the `aria-label` attribute in the primary language (pt-BR), e.g. `aria-label="Fechar"`.