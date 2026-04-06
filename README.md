# 🔌 [QYggdrasil](https://guigeof.github.io/QYggdrasil/)

A professional, high-density workstation designed to **discover, organize, and MANAGE the QGIS plugin ecosystem** through a taxonomic tree. Built with a focus on deep technical utility, **Zero-Fatigue Neutrality**, and precise data exploration.

This project transforms the QGIS repository into an **Instrument Panel** for power users, providing advanced filtering, thematic categorization, and a companion plugin for seamless synchronization.

[https://guigeof.github.io/QYggdrasil
](https://guigeof.github.io/QYggdrasil)


[<img width="1293" height="646" alt="image" src="https://github.com/user-attachments/assets/c45b4312-1286-47d6-95de-c1feaf455143" />
](https://guigeof.github.io/QYggdrasil)

## 🚀 Key Features

### 📊 Dynamic Dashboard

* **Real-time Stats**: Track 2,900+ plugins, 110M+ total downloads, average ratings, and author participation.
* **Contextual Rankings**: Discover the **Top 10 Most Downloaded** and **Highest Rated** plugins.
* **Smart Filters**: Refine any list by **Year of Creation** (2024-2026+) or **Trending periods** (Week, Month, Quarter).
* **Interactive Tag Cloud**: Explore the 60 most popular tags with visual weight.

### 🌳 Plugin Tree (Taxonomic Map)

* **20+ Thematic Categories**: Spatial Analysis, Raster Processing, Vector & Geometry, Remote Sensing, Cartography, Database, Hydrology, Geology, and more.
* **🌍 Geographic Grouping**: Plugins organized by Continent and Country (Europe, Americas, Asia/Oceania, Africa) using automatic author/homepage detection.
* **🏛️ GOV / Institutional**: Dedicated section for government-produced plugins identified by institutional keywords.
* **Dynamic Counts**: All tree nodes update their counts based on the global Year and Trending filters.

### 🔍 Advanced Plugin Explorer

* **Full-text Search**: Instant search across names, descriptions, versions, and authors.
* **Multi-Status Filtering**: Toggle between Stable, Experimental, Trusted, and Deprecated plugins.
* **Visual Badges**: Intuitive cards featuring GOV labels, Trusted checkmarks, and Country flags.
* **Rich Detail Modals**: Access full descriptions, version history, relevant tags, and direct links to GitHub or Homepages.

### 📈 Metrics & Deep Analytics

* **Visual Distribution**: Charts showing plugins and downloads by thematic category.
* **Community Trends**: Rating distribution charts to identify top-tier community tools.
* **Creation Timeline**: Historical analysis of plugin ecosystem growth by year.
* **Prolific Authors**: Ranking of the top 20 most active contributors.

### 📋 Custom Lists & Workspaces

* **Personal Collections**: Create and manage multiple lists of plugins for different project types.
* **Extension Manager Style**: Enable/Disable plugins and export your configuration as a JSON Workspace.
* **Import/Export**: Seamlessly share JSON configurations with other users or between machines.
* **⚡ QGIS Python Script Generator**: Automatically generate Python snippets to mass-install and enable your selected plugins directly inside QGIS.

---

## 🔌 QGIS Workspace Manager (Companion Plugin)

The project includes a native QGIS Desktop plugin that acts as a companion to the web hub. It allows you to synchronize your online workspaces directly into your local QGIS environment.

### Plugin Features:

* **JSON Sync**: Import the `.json` workspace files exported from the web app.
* **One-Click Batch Install**: Automatically searches and installs all missing plugins from your workspace.
* **Workflow Toggling**: Instantly Enable or Disable entire groups of plugins to switch between different tasks (e.g., swapping from "Hydrological Analysis" to "Cartography").
* **Professional UI**: A dark-mode interface designed to match the high-end aesthetics of the Plugin Hub.

---

## 🛠️ Technology Stack

* **Frontend**: Vanilla JavaScript (ES6+), HTML5 Semantic Structure.
* **Styling**: Custom CSS with **Instrument Panel Architecture**, Graphite & Gunmetal neutral palette, and high-density workstation layouts.
* **Data Processing**: Python-based automation for metadata fetching and categorization.
* **Persistence**: `localStorage` based state management (zero database required).
* **i18n**: Fully bilingual support (**English & Portuguese**) with persistent user preferences.

---

## 📂 Project Structure

```text
qgis-plugin-hub/
├── web/                     # Web Application
│   ├── index.html           # Main entry point
│   ├── css/style.css        # Instrument Panel Design System
│   ├── js/
│   │   ├── app.js           # Core logic & State management
│   │   ├── translations.js  # i18n Dictionary (EN/PT)
│   │   └── taxonomy-config.js # Categorization & GOV rules
│   ├── data/plugins.json    # Pre-fetched plugin dataset
│   └── fetch_plugins.py     # Script to update metadata
├── qgis_plugin/             # Desktop Companion
│   └── workspace_manager/   # Source code of the QGIS Plugin
├── zip_plugin_companion.py   # Script to package the plugin for download
└── README.md                # This file
```

---

## 💻 Getting Started

### Running the Web Hub Locally

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```
2. Start a static file server (e.g., using Node.js):
   ```bash
   npx serve -l 3000
   ```
3. Open `http://localhost:3000` in your browser.

### Installing the Desktop Companion

1. Download the `workspace_manager.zip` (available via the **Workspaces** tab in the Web Hub).
2. Open QGIS.
3. Go to **Plugins** > **Manage and Install Plugins** > **Install from ZIP**.
4. Select the downloaded file and click **Install Plugin**.

---

## ⚙️ Developer Workflow

### Updating Plugin Data

To sync the local dataset with the latest metadata from the official QGIS repository:

```bash
cd web
python fetch_plugins.py
```

### Packaging the Companion Plugin

To update the `workspace_manager.zip` hosted on the web app:

```bash
python zip_plugin_companion.py
```

---

## 🌐 Deployment & Automation

### 🚀 Continuous Deployment

The project is configured for **GitHub Pages** using GitHub Actions:

1. Push the repository to GitHub.
2. In **Settings > Pages**, change the **Source** to `GitHub Actions`.
3. The server will automatically:
   - Package the latest companion plugin.
   - Deploy the `web/` directory as the site root.

### 🔄 Automatic Sync

A scheduled job (`sync_data.yml`) runs daily at midnight to:

- Pull the latest metadata from the official QGIS repository.
- Commit changes back to `web/data/plugins.json`.
- Trigger a fresh deployment.

---

*Developed with ❤️ and Google Antigravity for friends of the QGIS Community.*
