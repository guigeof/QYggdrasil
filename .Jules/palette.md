## 2024-05-15 - Accessibility: Icon buttons & focus states
**Learning:** Icon-only buttons lack ARIA labels, making them inaccessible to screen readers, and interactive elements need clear `:focus-visible` indicators for keyboard navigation.
**Action:** Always add `aria-label` to buttons without text content and define a global `:focus-visible` outline for buttons, inputs, and links.
