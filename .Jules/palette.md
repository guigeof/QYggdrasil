## 2024-05-24 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a recurring pattern in the UI where icon-only buttons (like modal close "x", list item remove "✕", and workspace delete "🗑") lack `aria-label`s. This makes them inaccessible to screen readers, violating WCAG standards. Some buttons only use text inside the element like "×" or rely entirely on icons.
**Action:** Adding `aria-label`s localized in Portuguese (pt-BR) as per the app's default UI language. Ensuring future icon-only buttons require an `aria-label` attribute during PR reviews.
