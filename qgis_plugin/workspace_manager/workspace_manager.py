# -*- coding: utf-8 -*-
"""
Plugin Hub Workspace Manager
Main plugin class that creates the toolbar and dialog.
"""

import os
import json
from qgis.PyQt.QtWidgets import (
    QAction, QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QListWidget, QListWidgetItem, QGroupBox, QCheckBox, QFileDialog,
    QInputDialog, QMessageBox, QWidget, QScrollArea, QFrame, QSplitter,
    QToolButton, QSizePolicy, QTabWidget, QProgressBar, QPlainTextEdit
)
from qgis.PyQt.QtCore import Qt, QSize, QCoreApplication
from qgis.PyQt.QtGui import QIcon, QColor, QFont
from qgis.core import QgsApplication
from qgis.utils import loadPlugin, startPlugin, unloadPlugin, active_plugins, available_plugins


class WorkspaceManagerPlugin:
    """Main QGIS Plugin class."""

    def __init__(self, iface):
        self.iface = iface
        self.plugin_dir = os.path.dirname(__file__)
        self.action = None
        self.config_path = os.path.join(
            QgsApplication.qgisSettingsDirPath(), 'plugin_hub_workspaces.json'
        )
        self.workspaces = self._load_workspaces()

    def initGui(self):
        """Called when the plugin is loaded into QGIS."""
        icon_path = os.path.join(self.plugin_dir, 'icon.png')
        self.action = QAction(
            QIcon(icon_path) if os.path.exists(icon_path) else QIcon(),
            '⚡ Plugin Workspaces',
            self.iface.mainWindow()
        )
        self.action.setToolTip('Manage plugin workspaces — enable/disable groups')
        self.action.triggered.connect(self.show_dialog)
        self.action.setShortcut('Ctrl+H')
        
        # Dedicated toolbar
        self.toolbar = self.iface.addToolBar('Plugin Hub')
        self.toolbar.setObjectName('PluginHubToolbar')
        self.toolbar.addAction(self.action)
        
        self.iface.addPluginToMenu('&Plugin Hub', self.action)

    def unload(self):
        """Called when the plugin is unloaded."""
        self.iface.removePluginMenu('&Plugin Hub', self.action)
        try:
           self.iface.mainWindow().removeToolBar(self.toolbar)
        except: pass

    def _load_workspaces(self):
        """Load workspaces from JSON config file."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def _save_workspaces(self):
        """Save workspaces to JSON config file."""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.workspaces, f, indent=2, ensure_ascii=False)

    def show_dialog(self):
        """Show the Workspace Manager dialog."""
        dlg = WorkspaceDialog(self.iface, self.workspaces, self._save_workspaces)
        dlg.exec_()
        self.workspaces = dlg.workspaces
        self._save_workspaces()


class WorkspaceDialog(QDialog):
    """Main dialog for managing plugin workspaces."""

    def __init__(self, iface, workspaces, save_callback):
        super().__init__(iface.mainWindow())
        self.iface = iface
        self.workspaces = workspaces
        self.save_callback = save_callback
        self.plugin_dir = os.path.dirname(__file__)
        self.setWindowTitle('⚡ Plugin Hub — Workspace Manager')
        self.setMinimumSize(700, 500)
        self.resize(850, 600)
        
        # Determine styling
        self.setStyleSheet("""
            QDialog { background: #111; color: white; }
            QTabWidget::pane { border: 1px solid #333; border-radius: 4px; background: #0f172a; }
            QTabBar::tab { background: #222; color: #aaa; padding: 8px 16px; border: 1px solid #333; margin-right: 2px; }
            QTabBar::tab:selected { background: #6366f1; color: white; }
            QScrollArea { border: none; background: transparent; }
            QWidget#scrollAreaContent { background: transparent; }
        """)
        
        self._build_ui()

    def _btn_style(self, color, small=False):
        padding = "4px 8px" if small else "8px 16px"
        font_size = "11px" if small else "12px"
        return f"""
            QPushButton {{
                background-color: {color};
                color: white;
                border: none;
                border-radius: 4px;
                padding: {padding};
                font-weight: bold;
                font-size: {font_size};
            }}
            QPushButton:hover {{
                background-color: {color}dd;
            }}
            QPushButton:disabled {{
                background-color: #334155;
                color: #64748b;
            }}
        """

    def _build_ui(self):
        layout = QVBoxLayout(self)

        # Header
        header = QHBoxLayout()
        title = QLabel('⚡ Plugin Workspaces')
        title.setStyleSheet('font-size: 18px; font-weight: bold; color: #6366f1;')
        header.addWidget(title)
        header.addStretch()

        btn_new = QPushButton('+ New Workspace')
        btn_new.setStyleSheet(self._btn_style('#6366f1'))
        btn_new.clicked.connect(self._create_workspace)
        header.addWidget(btn_new)

        btn_import = QPushButton('📂 Import JSON')
        btn_import.setStyleSheet(self._btn_style('#06b6d4'))
        btn_import.clicked.connect(self._import_workspace)
        header.addWidget(btn_import)

        layout.addLayout(header)

        # Tabs
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # -- TAB 1: Workspaces --
        self.tab_ws = QWidget()
        tab_ws_layout = QVBoxLayout(self.tab_ws)
        
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll_widget = QWidget()
        self.scroll_widget.setObjectName("scrollAreaContent")
        self.scroll_layout = QVBoxLayout(self.scroll_widget)
        self.scroll_layout.setAlignment(Qt.AlignTop)
        self.scroll.setWidget(self.scroll_widget)
        tab_ws_layout.addWidget(self.scroll)
        
        icon0_path = os.path.join(self.plugin_dir, 'icons', 'icone0.png')
        self.tabs.addTab(self.tab_ws, QIcon(icon0_path) if os.path.exists(icon0_path) else QIcon('📂'), "Workspaces")

        # -- TAB 2: Installed Plugins --
        self.tab_inst = QWidget()
        tab_inst_layout = QVBoxLayout(self.tab_inst)
        
        inst_tools = QHBoxLayout()
        btn_refresh_inst = QPushButton('↻ Refresh List')
        btn_refresh_inst.setStyleSheet(self._btn_style('#64748b', small=True))
        btn_refresh_inst.clicked.connect(self._refresh)
        inst_tools.addWidget(btn_refresh_inst)
        inst_tools.addStretch()
        tab_inst_layout.addLayout(inst_tools)
        
        self.scroll_inst = QScrollArea()
        self.scroll_inst.setWidgetResizable(True)
        self.scroll_inst_widget = QWidget()
        self.scroll_inst_widget.setObjectName("scrollAreaContent")
        self.scroll_inst_layout = QVBoxLayout(self.scroll_inst_widget)
        self.scroll_inst_layout.setAlignment(Qt.AlignTop)
        self.scroll_inst.setWidget(self.scroll_inst_widget)
        tab_inst_layout.addWidget(self.scroll_inst)

        icon1_path = os.path.join(self.plugin_dir, 'icons', 'icone0_1.png')
        self.tabs.addTab(self.tab_inst, QIcon(icon1_path) if os.path.exists(icon1_path) else QIcon('⚙️'), "Installed Plugins")

        self.status = QLabel()
        self.status.setStyleSheet('color: #888; font-size: 11px; padding: 4px;')
        layout.addWidget(self.status)

        self._refresh()

    def _refresh(self):
        """Rebuild UI lists."""
        import qgis.utils
        active = set(qgis.utils.active_plugins)
        installed = list(qgis.utils.available_plugins)
        installed.sort()

        # Workspaces
        while self.scroll_layout.count():
            item = self.scroll_layout.takeAt(0)
            if item.widget(): item.widget().deleteLater()
        
        for i, ws in enumerate(self.workspaces):
            card = self._create_card(ws, i, installed, active)
            self.scroll_layout.addWidget(card)

        # Installed Tab
        while self.scroll_inst_layout.count():
            item = self.scroll_inst_layout.takeAt(0)
            if item.widget(): item.widget().deleteLater()
            
        for pid in installed:
            row = QFrame()
            row.setStyleSheet("background: #1e293b; border-radius: 4px; margin-bottom: 2px;")
            h = QHBoxLayout(row)
            lbl = QLabel(pid)
            is_act = pid in active
            lbl.setStyleSheet(f"font-weight: bold; color: {'#10b981' if is_act else '#94a3b8'}")
            h.addWidget(lbl)
            h.addStretch()
            btn = QPushButton('Disable' if is_act else 'Enable')
            btn.setStyleSheet(self._btn_style('#f43f5e' if is_act else '#10b981', small=True))
            btn.clicked.connect(lambda _, p=pid: self._disable_plugin(p) if p in active_plugins else self._enable_plugin(p))
            h.addWidget(btn)
            self.scroll_inst_layout.addWidget(row)

        self.status.setText(f"Installed: {len(installed)} | Active: {len(active)} | Workspaces: {len(self.workspaces)}")

    def _create_card(self, ws, index, available, active):
        group = QGroupBox()
        color = ws.get('color', '#6366f1')
        group.setStyleSheet(f"QGroupBox {{ border: 2px solid {color}40; border-top: 4px solid {color}; border-radius: 8px; background: #0f172a; padding: 10px; margin-top: 10px; }}")
        
        v = QVBoxLayout(group)
        h = QHBoxLayout()
        
        icon_name = f'icone0_{index}.png' if index > 0 else 'icone0.png'
        ws_icon_path = os.path.join(self.plugin_dir, 'icons', icon_name)
        icon_lbl = QLabel()
        if os.path.exists(ws_icon_path):
            icon_lbl.setPixmap(QIcon(ws_icon_path).pixmap(QSize(18, 18)))
        else:
            icon_lbl.setText("📁")
        h.addWidget(icon_lbl)
        
        name = QLabel(ws['name'])
        name.setStyleSheet(f"font-size: 15px; font-weight: bold; color: {color}")
        h.addWidget(name)
        h.addStretch()
        
        btn_install = QPushButton("⬇ Install missing")
        btn_install.setStyleSheet(self._btn_style('#3b82f6', small=True))
        btn_install.clicked.connect(lambda: self._install_all_missing(index))
        h.addWidget(btn_install)

        btn_on = QPushButton("▶ Enable All")
        btn_on.setStyleSheet(self._btn_style('#10b981', small=True))
        btn_on.clicked.connect(lambda: self._toggle_all(index, True))
        h.addWidget(btn_on)

        btn_del = QPushButton("🗑")
        btn_del.setFixedWidth(30)
        btn_del.setStyleSheet(self._btn_style('#64748b', small=True))
        btn_del.clicked.connect(lambda: self._delete_workspace(index))
        h.addWidget(btn_del)
        v.addLayout(h)

        for j, p_entry in enumerate(ws.get('plugins', [])):
            pid = p_entry.get('plugin_id', '')
            enabled = p_entry.get('enabled', True)
            is_inst = pid in available
            is_act = pid in active
            
            p_row = QHBoxLayout()
            cb = QCheckBox(pid)
            cb.setChecked(enabled)
            cb.stateChanged.connect(lambda state, wi=index, pi=j: self._toggle_plugin(wi, pi, state == Qt.Checked))
            p_row.addWidget(cb)
            
            st_lbl = QLabel("active" if is_act else ("installed" if is_inst else "missing"))
            st_lbl.setStyleSheet(f"color: {'#10b981' if is_act else ('#eab308' if is_inst else '#f43f5e')}; font-size: 10px;")
            st_lbl.setFixedWidth(60)
            p_row.addWidget(st_lbl)
            p_row.addStretch()

            if is_inst:
                # Small Disable button next to OK
                btn_ok = QPushButton("OK")
                btn_ok.setEnabled(False)
                btn_ok.setStyleSheet(self._btn_style('#334155', small=True))
                p_row.addWidget(btn_ok)
                
                btn_off = QPushButton("⏸")
                btn_off.setToolTip("Disable in QGIS")
                btn_off.setEnabled(is_act)
                btn_off.setFixedWidth(24)
                btn_off.setStyleSheet(self._btn_style('#ef4444' if is_act else '#334155', small=True))
                btn_off.clicked.connect(lambda _, p=pid: self._disable_plugin(p))
                p_row.addWidget(btn_off)
            else:
                btn_get = QPushButton("Install")
                btn_get.setStyleSheet(self._btn_style('#3b82f6', small=True))
                btn_get.clicked.connect(lambda _, p=pid: self._install_plugin(p))
                p_row.addWidget(btn_get)
            
            v.addLayout(p_row)
        return group

    # -- Operations --
    def _toggle_all(self, idx, enable):
        ws = self.workspaces[idx]
        for p in ws.get('plugins', []):
            p['enabled'] = enable
            pid = p.get('plugin_id')
            if enable and pid in available_plugins:
                try: loadPlugin(pid); startPlugin(pid)
                except: pass
            elif not enable and pid in active_plugins:
                try: unloadPlugin(pid)
                except: pass
        self.save_callback()
        self._refresh()

    def _toggle_plugin(self, wi, pi, checked):
        self.workspaces[wi]['plugins'][pi]['enabled'] = checked
        self.save_callback()

    def _enable_plugin(self, pid):
        try: loadPlugin(pid); startPlugin(pid); self._refresh()
        except Exception as e: QMessageBox.warning(self, "Error", f"Failed: {e}")

    def _disable_plugin(self, pid):
        try: unloadPlugin(pid); self._refresh()
        except Exception as e: QMessageBox.warning(self, "Error", f"Failed: {e}")

    def _delete_workspace(self, i):
        if QMessageBox.question(self, "Delete", "Are you sure?") == QMessageBox.Yes:
            self.workspaces.pop(i); self.save_callback(); self._refresh()

    def _create_workspace(self):
        name, ok = QInputDialog.getText(self, "New", "Name:")
        if ok and name:
            self.workspaces.append({"name": name, "plugins": [], "color": "#6366f1"})
            self.save_callback(); self._refresh()

    def _import_workspace(self):
        path, _ = QFileDialog.getOpenFileName(self, "Import", "", "JSON (*.json)")
        if path:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                plugins = []
                # Support both Plugin Hub export formats
                details = data.get('pluginDetails', data.get('plugins', []))
                for p in details:
                    pid = p.get('qgis_name', p.get('plugin_id', p.get('name', '')))
                    if pid: plugins.append({"plugin_id": pid, "enabled": p.get('enabled', True)})
                self.workspaces.append({"name": data.get('name', 'Imported'), "plugins": plugins, "color": data.get('color', '#6366f1')})
                self.save_callback(); self._refresh()
            except Exception as e: QMessageBox.warning(self, "Error", f"Import failed: {e}")

    # -- ASYNC INSTALL ENGINE --
    def _install_plugin(self, pid):
        self.MissingPids = [pid]
        self._start_batch_install()

    def _install_all_missing(self, idx):
        ws = self.workspaces[idx]
        import qgis.utils
        self.MissingPids = [p['plugin_id'] for p in ws.get('plugins', []) if p.get('enabled', True) and p['plugin_id'] not in qgis.utils.available_plugins]
        if not self.MissingPids:
            QMessageBox.information(self, "Info", "No missing plugins!"); return
        self._start_batch_install()

    def _start_batch_install(self):
        self._batch_done = False
        self._progress = InstallProgressDialog(self, len(self.MissingPids) > 1)
        self._progress.log(f"▶ Starting install for {len(self.MissingPids)} plugins...")
        self._progress.show()
        
        try:
            from .installer_data import repositories, plugins
            repositories.load()
            plugins.clearRepoCache()
            
            # Ensure Official Repo is enabled
            for r in repositories.all().values():
                if 'plugins.qgis.org' in r.get('url', ''): r['enabled'] = True
            
            for k in repositories.allEnabled():
                self._progress.log(f"  [-] Fetching repo: {k}")
                repositories.requestFetching(k, force_reload=True)
            
            repositories.checkingDone.connect(self._on_repos_ready)
            from qgis.PyQt.QtCore import QTimer
            QTimer.singleShot(10000, lambda: self._on_repos_ready() if not self._batch_done else None)
        except Exception as e:
            self._progress.log(f"❌ Error: {e}"); self._progress.btn_close.setEnabled(True)

    def _on_repos_ready(self):
        if self._batch_done: return
        self._batch_done = True
        try:
           from .installer_data import repositories
           repositories.checkingDone.disconnect(self._on_repos_ready)
        except: pass

        self._progress.log("▶ Repositories ready. Processing...")
        from .installer_data import plugins
        import pyplugin_installer
        plugins.rebuild()
        all_p = plugins.all()
        
        def norm(s): return str(s).replace(' ','').replace('-','').replace('_','').lower()
        success = 0
        
        for i, pid in enumerate(self.MissingPids):
            self._progress.set_status(f"Installing {i+1}/{len(self.MissingPids)}...")
            self._progress.log(f"  [-] Searching for: {pid}")
            QCoreApplication.processEvents()
            
            target = None
            n_pid = norm(pid)
            for k, d in all_p.items():
                name = d.get('name','') if isinstance(d,dict) else getattr(d,'name','')
                pid_attr = d.get('id','') if isinstance(d,dict) else getattr(d,'id','')
                if norm(k) == n_pid or norm(name) == n_pid or norm(pid_attr) == n_pid:
                    target = k; break
            
            if target:
                self._progress.log(f"      [~] Found as '{target}'. Downloading...")
                QCoreApplication.processEvents()
                if pyplugin_installer.instance().installPlugin(target):
                    self._progress.log(f"      [✓] Success.")
                    success += 1
                else:
                    err = getattr(pyplugin_installer.instance(), 'message', 'Error')
                    self._progress.log(f"      [x] Fail: {err}")
            else:
                self._progress.log(f"      [x] Not found in any repo.")
        
        self._progress.log(f"▶ Finished. {success} installed."); self._progress.btn_close.setEnabled(True)
        self._refresh()


class InstallProgressDialog(QDialog):
    def __init__(self, parent, is_batch=False):
        super().__init__(parent)
        self.setWindowTitle("Installation Progress")
        self.resize(500, 400)
        self.setStyleSheet("background: #0f172a; color: white;")
        layout = QVBoxLayout(self)
        
        self.status_lbl = QLabel("Initializing...")
        self.status_lbl.setStyleSheet("font-weight: bold; color: #6366f1;")
        layout.addWidget(self.status_lbl)
        
        self.progress = QProgressBar()
        self.progress.setStyleSheet("QProgressBar { border: 1px solid #334155; border-radius: 4px; text-align: center; } QProgressBar::chunk { background: #6366f1; }")
        layout.addWidget(self.progress)
        
        self.log_area = QPlainTextEdit()
        self.log_area.setReadOnly(True)
        self.log_area.setStyleSheet("background: #020617; border: 1px solid #1e293b; color: #94a3b8; font-family: monospace;")
        layout.addWidget(self.log_area)
        
        self.btn_close = QPushButton("Close")
        self.btn_close.setEnabled(False)
        self.btn_close.clicked.connect(self.accept)
        layout.addWidget(self.btn_close)

    def log(self, txt): self.log_area.appendPlainText(txt)
    def set_status(self, txt): self.status_lbl.setText(txt)
