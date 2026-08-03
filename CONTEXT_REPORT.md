# 🔌 QYggdrasil — Functional Map, Context Report & Roadmap

> **Version**: v1.1.0 (2026-08-03)
> **Author**: Automated Audit + Antigravity Agent
> **Scope**: Full-stack ecosystem — Web Hub + QGIS Desktop Companion Plugin
> **Site**: [https://guigeof.github.io/QYggdrasil](https://guigeof.github.io/QYggdrasil)

---

## 1. Ecosystem Architecture

```
QYggdrasil/
├── web/                              # GitHub Pages Web Application
│   ├── index.html                    # Main entry (618 lines, semantic HTML5)
│   ├── css/style.css                 # Instrument Panel design system (~29K)
│   ├── js/
│   │   ├── app.js                    # Core logic, state, rendering (~55K, 1098 lines)
│   │   ├── taxonomy-config.js        # Category/tag/country classification rules (~13K)
│   │   └── translations.js           # i18n dictionary EN/PT (~6K, 173 lines)
│   ├── data/plugins.json             # Pre-fetched QGIS repo metadata (auto-synced daily)
│   ├── assets/
│   │   └── yggdrasil_bg.png          # Background image (~1MB)
│   └── fetch_plugins.py              # Python scraper for plugins.qgis.org XML
│
├── qgis_plugin/                      # Desktop QGIS Companion Plugin
│   └── workspace_manager/
│       ├── __init__.py               # classFactory entry point
│       ├── metadata.txt              # QGIS plugin registry metadata
│       ├── workspace_manager.py      # Full plugin source (PyQt5 + QGIS API)
│       └── icon.png                  # Plugin icon (~693K)
│
├── .github/workflows/
│   ├── deploy.yml                    # GitHub Pages deployment (packages ZIP + deploys web/)
│   └── sync_data.yml                 # Daily QGIS repo metadata sync (midnight UTC)
│
├── zip_plugin_companion.py           # Packages workspace_manager/ → web/workspace_manager.zip
├── README.md                         # Project documentation
├── CONTRIBUTING.md                   # Contributor guidelines
├── 1_Quick_Start.md                  # Quick start guide
├── 2_User_Manual.md                  # User manual
├── 3_FULL_Manual_WEB.md              # Full web manual
├── 4_FULL_Manual_DESKTOP.md          # Full desktop manual
└── .gitignore                        # Ignores *.zip, __pycache__, .gemini/
```

---

## 2. Data Pipeline

```
plugins.qgis.org (XML API, QGIS 3.34)
         │
         ▼
  fetch_plugins.py  ──────►  web/data/plugins.json
         │                        │
  [GitHub Action: sync_data.yml]  │  (daily midnight UTC cron)
         │                        │
         ▼                        ▼
  git commit + push          index.html reads via fetch()
         │                        │
         ▼                        ▼
  [GitHub Action: deploy.yml]    Browser renders Dashboard/Explorer/Tree/Metrics/Workspaces
         │
         ▼
  GitHub Pages (guigeof.github.io/QYggdrasil)
```

---

## 3. Functional Component Map

### 3.1 Web Hub (`web/`)

| View/Feature | Function | Files Involved | Status |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Stats cards (total, downloads, rating, authors, tags, updated), Top 10 Downloads, Top 10 Rated, Tag Cloud | `app.js:renderDashboard()`, `index.html` | ✅ Working |
| **Plugin Tree** | 3-level taxonomy (Realm → Category → Tag), Geographic grouping (Continent → Country), GOV/Institutional filter | `app.js:renderTaxonomyTree()`, `taxonomy-config.js` | ✅ Working |
| **Explorer** | Full-text search, multi-status filter (Stable/Exp/Trusted/Deprecated), sort (Downloads/Rating/Name/Date/Votes), card grid + list toggle, pagination | `app.js:setupExplorer()`, `applyFilters()`, `renderPluginGrid()` | ✅ Working |
| **Plugin Detail Modal** | Full metadata, badges (GOV/Trusted/Exp/Country), tags, dates, links (Homepage/Repo/Tracker/Download), quick-add to Favorites/Workspace/List | `app.js:showPluginDetail()` | ✅ Working |
| **Metrics** | Bar charts: Category distribution, Downloads by category, Rating distribution, Creation timeline, Top 20 authors | `app.js:renderMetrics()`, `renderBarChart()` | ✅ Working |
| **Custom Lists** | Create, import JSON, export JSON, add/remove plugins | `app.js:setupLists()`, `renderLists()`, `exportList()`, `importList()` | ✅ Working |
| **Workspaces** | Create with color picker, master ON/OFF toggle, plugin search+add, per-plugin enable/disable toggle, import/export JSON, Python script generator | `app.js:setupWorkspaces()`, `renderWorkspaces()` | ✅ Working |
| **QGIS Script Generator** | 3 modes: Install+Enable / Enable Only / Disable All, copy to clipboard, download .py | `app.js:generateQGISScript()` | ✅ Working |
| **i18n** | EN/PT bilingual, persistent via localStorage, full coverage of static labels | `translations.js`, `app.js:applyI18n()` | ✅ Working |
| **Companion Download** | Button triggers download of `workspace_manager.zip` from site root | `app.js:setupWorkspaces()` line 736 | ✅ Working |

### 3.2 Desktop Plugin (`qgis_plugin/workspace_manager/`)

| Feature | Function | Status |
| :--- | :--- | :--- |
| **Plugin registration** | `classFactory()` → toolbar + menu (`&Plugin Hub`) + keyboard shortcut (`Ctrl+H`) | ✅ Working |
| **Workspace management** | Create empty, create from active plugins, import JSON (single/batch), delete | ✅ Working (v1.1) |
| **Workspace export** | Export single workspace JSON, export all workspaces as batch JSON | ✅ Working (v1.1) |
| **Plugin toggling** | Enable/Disable individual plugins or entire workspace groups via `loadPlugin`/`startPlugin`/`unloadPlugin` | ✅ Working |
| **Batch installer** | Search + install missing plugins from QGIS official repository via `pyplugin_installer` | ✅ Fixed (v1.1) |
| **Web Hub direct link** | `🌐 Open QYggdrasil Web Hub` button in toolbar, menu, and dialog header | ✅ Added (v1.1) |
| **Progress dialog** | Indeterminate progress bar, monospace log area, status label | ✅ Working |
| **Dark theme** | Instrument Panel palette (#0f172a, #1e293b, #6366f1) matching Web Hub aesthetics | ✅ Working |

---

## 4. Issues Fixed in v1.1.0

| # | Component | Issue | Fix Applied |
| :--- | :--- | :--- | :--- |
| 1 | **Plugin** | `from .installer_data import ...` crashed with `ImportError` — no such relative module | Changed to `from pyplugin_installer.installer_data import ...` with 3-level fallback chain |
| 2 | **Plugin** | No workspace export capability (import-only) | Added `_export_single_workspace()` and `_export_all_workspaces()` methods |
| 3 | **Plugin** | No way to snapshot active plugins into a workspace | Added `_create_workspace_from_active()` via `qgis.utils.active_plugins` |
| 4 | **Plugin** | No direct link to GitHub Pages site | Added `WEB_HUB_URL` constant + `QDesktopServices.openUrl()` in toolbar, menu, and dialog |
| 5 | **Plugin** | Import only supported single-workspace JSON | Enhanced to auto-detect and import batch `{"workspaces": [...]}` format |
| 6 | **Plugin** | Bare `except: pass` anti-pattern in several methods | Replaced with `except Exception:` for proper exception handling |
| 7 | **Plugin** | Icon path references to non-existent `icons/` subdirectory | Simplified to use emoji fallbacks and `icon.png` directly |
| 8 | **Script** | `zip_plugin_companion.py` crashed on Windows cp1252 due to emoji in print | Added `sys.stdout.reconfigure(encoding='utf-8')` |

---

## 5. Remaining Issues & Suggestions (Roadmap)

### 🔴 Critical (Should Fix Before Next Release)

| # | Area | Issue | Suggested Fix |
| :--- | :--- | :--- | :--- |
| C1 | **Web** | `yggdrasil_icon.png` referenced in `index.html` (lines 18, 27) but **missing** from `web/assets/`. Only `yggdrasil_bg.png` exists. This causes a broken favicon and broken loading screen logo. | Either rename `yggdrasil_bg.png` → `yggdrasil_icon.png`, or create a proper icon and add it to `web/assets/`. |
| C2 | **Plugin** | `metadata.txt` contains placeholder URLs: `your-repo/qgis-plugin-hub` for tracker, repository, and homepage. | Update to `https://github.com/guigeof/QYggdrasil` and `https://guigeof.github.io/QYggdrasil`. |
| C3 | **Plugin** | `metadata.txt` uses placeholder email `pluginhub@example.com` and generic author `QGIS Plugin Hub`. | Update to real author name and contact. |
| C4 | **Plugin** | Plugin version still `1.0.0` despite significant feature additions. | Bump to `1.1.0` to reflect workspace export, active snapshot, and Web Hub features. |
| C5 | **Web** | `app.js` line 919 references `window.allPluginsData` which is never set — `importWorkspace()` from QGIS JSON will fail the `qgis_name` reverse-lookup. | Replace with `allPlugins` (the actual global variable). |

### 🟡 Medium Priority (Polish & UX)

| # | Area | Suggestion |
| :--- | :--- | :--- |
| M1 | **Web** | Add workspace **drag-and-drop reordering** for better UX. Currently, workspace order is fixed by creation time. |
| M2 | **Web** | Add **workspace duplication** button ("Clone") — power users often want a base workspace they can fork. |
| M3 | **Web** | The `explorer-count` label uses hardcoded Portuguese (`"plugins encontrados"` on line 322). Should use `TRANSLATIONS[currentLang].plugins_found`. |
| M4 | **Plugin** | Add a **"Disable All"** button alongside "Enable All" per workspace card. Currently only "Enable All" exists. |
| M5 | **Plugin** | Add a **plugin search/filter** in the Installed Plugins tab. With 50+ plugins, scrolling through the entire list is tedious. |
| M6 | **Plugin** | Add **color picker** to workspace creation dialog (currently hardcoded to `#6366f1` for new workspaces). |
| M7 | **Web** | Add a **"Copy plugin_id"** button in the detail modal — useful for script generators and developers. The translation key `copy_id` exists but is unused. |
| M8 | **Data** | `fetch_plugins.py` fetches only QGIS 3.34 plugins. Consider adding `3.36` and `3.38` support or a version selector. |

### 🟢 Enhancement Ideas (Future Versions)

| # | Area | Idea |
| :--- | :--- | :--- |
| E1 | **Web** | **Workspace sharing via URL hash** — encode workspace as base64 in URL fragment so users can share a link that auto-imports. |
| E2 | **Web** | **Plugin dependency graph** — visualize which plugins depend on each other using Mermaid or D3.js. |
| E3 | **Web** | **Comparison mode** — select 2-3 plugins side-by-side to compare features, downloads, ratings, and tags. |
| E4 | **Plugin** | **Auto-sync from Web Hub** — periodically check `guigeof.github.io/QYggdrasil/data/workspaces/` for shared community workspaces and offer to import. |
| E5 | **Plugin** | **Plugin health dashboard** — show which plugins in each workspace have updates available, are deprecated, or incompatible with the current QGIS version. |
| E6 | **CI/CD** | Add a GitHub Action step that runs `py_compile` on the plugin source before packaging the ZIP, to catch syntax errors before deployment. |
| E7 | **Web** | **OpenGraph / social media cards** — add `og:image`, `og:title`, `og:description` meta tags for better sharing previews. |
| E8 | **Web** | **PWA support** — add a `manifest.json` and service worker for offline access and installability. |

---

## 6. Git Commit History (v1.1.0)

```
4760f16 fix(script): resolve UTF-8 output encoding in zip_plugin_companion.py
61c4078 feat(plugin): add workspace export, active plugin snapshot, pyplugin_installer fix, and direct Web Hub site link
01c5c03 chore: sync plugin metadata [skip ci]
```

---

## 7. Key File Reference

| File | Purpose | Lines |
| :--- | :--- | :--- |
| [workspace_manager.py](qgis_plugin/workspace_manager/workspace_manager.py) | Full QGIS plugin source (v1.1) | ~540 |
| [app.js](web/js/app.js) | Web Hub core logic | 1098 |
| [taxonomy-config.js](web/js/taxonomy-config.js) | Category classification rules | ~350 |
| [translations.js](web/js/translations.js) | EN/PT i18n dictionary | 173 |
| [style.css](web/css/style.css) | Instrument Panel CSS system | ~900 |
| [index.html](web/index.html) | Main HTML structure | 618 |
| [fetch_plugins.py](web/fetch_plugins.py) | QGIS XML → JSON scraper | 76 |
| [zip_plugin_companion.py](zip_plugin_companion.py) | Plugin → ZIP packager | 26 |
| [deploy.yml](.github/workflows/deploy.yml) | GitHub Pages deployment | 50 |
| [sync_data.yml](.github/workflows/sync_data.yml) | Daily metadata sync | 48 |
| [metadata.txt](qgis_plugin/workspace_manager/metadata.txt) | QGIS plugin registry metadata | 18 |

---

*Generated by Antigravity Agent — 2026-08-03T17:55 BRT*
