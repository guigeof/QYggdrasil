# 🤝 Contributing to QYggdrasil

Thank you for your interest in contributing to **QYggdrasil**! We welcome contributions from the QGIS community to help make this instrument panel the best tool for GIS professionals.

## 🚀 How to Contribute

### 1. Reporting Bugs

- Check the [Issues](https://github.com/guigeof/QYggdrasil/issues) to see if the bug has already been reported.
- If not, open a new issue with a clear title and description.
- Include steps to reproduce and screenshots if applicable.

### 2. Feature Requests

- We want to hear your ideas! Open an issue with the "feature request" tag.
- Describe the problem your feature would solve and how it fits the "High-Density Instrument Panel" aesthetic.

### 3. Code Contributions

1. **Fork** the repository.
2. **Create a branch** for your feature or fix (`git checkout -b feature/amazing-feature`).
3. **Follow the Design System**:
   * Maintain the **Zero-Fatigue Graphite** color palette.
   * Avoid high-contrast colors; use our muted pastel chart colors.
   * Keep padding and margins consistent (0.5rem / 6px).
   * Use **Inter** for UI text and **JetBrains Mono** for technical data.
4. **Submit a Pull Request**: Provide a detailed description of your changes.

## 🎨 UI/UX Philosophy

QYggdrasil is built for **power users**. Every pixel counts.

- **Context is King**: Group tools logically (Taxonomy).
- **Ghost UI**: Borders and backgrounds should be subtle or invisible until interaction.
- **Density over Decoration**: Don't waste space.

## 🛠️ Development Setup

- The web hub is served via a simple Python server: `python -m http.server 8000 --directory web`.
- The plugin companion code is located in the root (see `zip_plugin_companion.py`).

---

*By contributing, you agree that your contributions will be licensed under the project's license.*
