# -*- coding: utf-8 -*-
"""
Plugin Hub Workspace Manager (QYggdrasil Companion)
Main plugin class that creates the toolbar, dialog, workspace export/import engine,
and direct Web Hub URL integration.
Enhanced UI/UX following 'make-interfaces-feel-better' guidelines.
"""

import os
import json
from qgis.PyQt.QtWidgets import (
    QAction, QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QListWidget, QListWidgetItem, QGroupBox, QCheckBox, QFileDialog,
    QInputDialog, QMessageBox, QWidget, QScrollArea, QFrame, QSplitter,
    QToolButton, QSizePolicy, QTabWidget, QProgressBar, QPlainTextEdit,
    QLineEdit
)
from qgis.PyQt.QtCore import Qt, QSize, QCoreApplication, QUrl
from qgis.PyQt.QtGui import QIcon, QColor, QFont, QDesktopServices
from qgis.core import QgsApplication
from qgis.utils import loadPlugin, startPlugin, unloadPlugin, active_plugins, available_plugins

WEB_HUB_URL = "https://guigeof.github.io/QYggdrasil"


class WorkspaceManagerPlugin:
    """Main QGIS Plugin class."""

    def __init__(self, iface):
        self.iface = iface
        self.plugin_dir = os.path.dirname(__file__)
        self.action = None
        self.web_action = None
        self.toolbar = None
        self.config_path = os.path.join(
            QgsApplication.qgisSettingsDirPath(), 'plugin_hub_workspaces.json'
        )
        self.workspaces = self._load_workspaces()

    def initGui(self):
        """Called when the plugin is loaded into QGIS."""
        icon_path = os.path.join(self.plugin_dir, 'icon.png')
        icon = QIcon(icon_path) if os.path.exists(icon_path) else QIcon()

        self.action = QAction(
            icon,
            '⚡ Plugin Workspaces',
            self.iface.mainWindow()
        )
        self.action.setToolTip('Manage plugin workspaces — enable/disable groups with one click')
        self.action.triggered.connect(self.show_dialog)
        self.action.setShortcut('Ctrl+H')

        # Web Hub Direct Access Action
        self.web_action = QAction(
            icon,
            '🌐 Open QYggdrasil Web Hub',
            self.iface.mainWindow()
        )
        self.web_action.setToolTip(f'Open QYggdrasil Web Hub in browser ({WEB_HUB_URL})')
        self.web_action.triggered.connect(self.open_web_hub)

        # Dedicated toolbar
        self.toolbar = self.iface.addToolBar('Plugin Hub')
        self.toolbar.setObjectName('PluginHubToolbar')
        self.toolbar.addAction(self.action)
        self.toolbar.addAction(self.web_action)

        self.iface.addPluginToMenu('&Plugin Hub', self.action)
        self.iface.addPluginToMenu('&Plugin Hub', self.web_action)

    def unload(self):
        """Called when the plugin is unloaded."""
        self.iface.removePluginMenu('&Plugin Hub', self.action)
        self.iface.removePluginMenu('&Plugin Hub', self.web_action)
        try:
            if self.toolbar:
                self.iface.mainWindow().removeToolBar(self.toolbar)
        except Exception:
            pass

    def open_web_hub(self):
        """Open the QYggdrasil GitHub Pages website directly."""
        QDesktopServices.openUrl(QUrl(WEB_HUB_URL))

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
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.workspaces, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[QYggdrasil] Error saving workspaces: {e}")

    def show_dialog(self):
        """Show the Workspace Manager dialog."""
        dlg = WorkspaceDialog(self.iface, self.workspaces, self._save_workspaces)
        dlg.exec_()
        self.workspaces = dlg.workspaces
        self._save_workspaces()


class WorkspaceDialog(QDialog):
    """Main dialog for managing and exporting plugin workspaces with polished UI/UX."""

    def __init__(self, iface, workspaces, save_callback):
        super().__init__(iface.mainWindow())
        self.iface = iface
        self.workspaces = workspaces
        self.save_callback = save_callback
        self.plugin_dir = os.path.dirname(__file__)
        self.setWindowTitle('⚡ QYggdrasil — Plugin Workspace Manager')
        self.setMinimumSize(850, 580)
        self.resize(960, 650)

        # Styling matching QYggdrasil Dark Instrument Panel with micro-interactions
        self.setStyleSheet("""
            QDialog { background: #0b0f19; color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; }
            QTabWidget::pane { border: 1px solid #1e293b; border-radius: 8px; background: #0f172a; }
            QTabBar::tab {
                background: #1e293b; color: #94a3b8;
                padding: 10px 22px; margin-right: 4px;
                border: 1px solid #334155; border-bottom: none;
                border-top-left-radius: 6px; border-top-right-radius: 6px;
                font-weight: 600; min-width: 140px; text-align: center;
            }
            QTabBar::tab:selected { background: #6366f1; color: #ffffff; border-color: #6366f1; }
            QTabBar::tab:hover:!selected { background: #334155; color: #f8fafc; }
            QScrollArea { border: none; background: transparent; }
            QWidget#scrollAreaContent { background: transparent; }
            QCheckBox { color: #f1f5f9; font-weight: 500; }
            QCheckBox::indicator { width: 18px; height: 18px; border-radius: 4px; border: 1px solid #475569; background: #1e293b; }
            QCheckBox::indicator:checked { background: #6366f1; border-color: #818cf8; image: none; }
            QLineEdit {
                background: #1e293b; color: #f8fafc; border: 1px solid #334155;
                border-radius: 6px; padding: 6px 12px; font-size: 13px;
            }
            QLineEdit:focus { border-color: #6366f1; outline: none; }
        """)

        self._build_ui()

    def _btn_style(self, color, small=False, outline=False):
        padding = "5px 12px" if small else "8px 18px"
        font_size = "11px" if small else "12px"
        if outline:
            return f"""
                QPushButton {{
                    background-color: transparent;
                    color: {color};
                    border: 1px solid {color};
                    border-radius: 6px;
                    padding: {padding};
                    font-weight: 600;
                    font-size: {font_size};
                }}
                QPushButton:hover {{
                    background-color: {color}22;
                }}
            """
        return f"""
            QPushButton {{
                background-color: {color};
                color: white;
                border: none;
                border-radius: 6px;
                padding: {padding};
                font-weight: 600;
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
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # Header bar
        header = QHBoxLayout()
        header.setSpacing(8)

        title_box = QHBoxLayout()
        title = QLabel('⚡ QYggdrasil Workspace Hub')
        title.setStyleSheet('font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;')
        title_box.addWidget(title)
        header.addLayout(title_box)
        header.addStretch()

        # Action Buttons in Header
        btn_web = QPushButton('🌐 Web Hub Site')
        btn_web.setToolTip(f'Open QYggdrasil Web Hub in browser ({WEB_HUB_URL})')
        btn_web.setStyleSheet(self._btn_style('#8b5cf6'))
        btn_web.clicked.connect(lambda: QDesktopServices.openUrl(QUrl(WEB_HUB_URL)))
        header.addWidget(btn_web)

        btn_from_active = QPushButton('⚡ From Active')
        btn_from_active.setToolTip('Create workspace from currently active QGIS plugins')
        btn_from_active.setStyleSheet(self._btn_style('#10b981'))
        btn_from_active.clicked.connect(self._create_workspace_from_active)
        header.addWidget(btn_from_active)

        btn_new = QPushButton('+ New Workspace')
        btn_new.setStyleSheet(self._btn_style('#6366f1'))
        btn_new.clicked.connect(self._create_workspace)
        header.addWidget(btn_new)

        btn_import = QPushButton('📂 Import JSON')
        btn_import.setStyleSheet(self._btn_style('#06b6d4'))
        btn_import.clicked.connect(self._import_workspace)
        header.addWidget(btn_import)

        btn_export_all = QPushButton('📤 Export All')
        btn_export_all.setToolTip('Export all workspaces as a JSON file')
        btn_export_all.setStyleSheet(self._btn_style('#f59e0b'))
        btn_export_all.clicked.connect(self._export_all_workspaces)
        header.addWidget(btn_export_all)

        layout.addLayout(header)

        # Main Tab Widget
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # -- TAB 1: Workspaces --
        self.tab_ws = QWidget()
        tab_ws_layout = QVBoxLayout(self.tab_ws)
        tab_ws_layout.setContentsMargins(12, 12, 12, 12)

        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll_widget = QWidget()
        self.scroll_widget.setObjectName("scrollAreaContent")
        self.scroll_layout = QVBoxLayout(self.scroll_widget)
        self.scroll_layout.setAlignment(Qt.AlignTop)
        self.scroll_layout.setSpacing(12)
        self.scroll.setWidget(self.scroll_widget)
        tab_ws_layout.addWidget(self.scroll)

        self.tabs.addTab(self.tab_ws, "⚡ Workspaces")

        # -- TAB 2: Installed Plugins --
        self.tab_inst = QWidget()
        tab_inst_layout = QVBoxLayout(self.tab_inst)
        tab_inst_layout.setContentsMargins(12, 12, 12, 12)

        inst_tools = QHBoxLayout()
        inst_tools.setSpacing(8)

        self.search_inst = QLineEdit()
        self.search_inst.setPlaceholderText("🔍 Search installed plugins...")
        self.search_inst.textChanged.connect(self._refresh_installed_list)
        inst_tools.addWidget(self.search_inst)

        btn_refresh_inst = QPushButton('↻ Refresh List')
        btn_refresh_inst.setStyleSheet(self._btn_style('#64748b', small=True))
        btn_refresh_inst.clicked.connect(self._refresh)
        inst_tools.addWidget(btn_refresh_inst)

        btn_open_site_tab = QPushButton('🌐 Visit guigeof.github.io/QYggdrasil')
        btn_open_site_tab.setStyleSheet(self._btn_style('#8b5cf6', small=True))
        btn_open_site_tab.clicked.connect(lambda: QDesktopServices.openUrl(QUrl(WEB_HUB_URL)))
        inst_tools.addWidget(btn_open_site_tab)

        tab_inst_layout.addLayout(inst_tools)

        self.scroll_inst = QScrollArea()
        self.scroll_inst.setWidgetResizable(True)
        self.scroll_inst_widget = QWidget()
        self.scroll_inst_widget.setObjectName("scrollAreaContent")
        self.scroll_inst_layout = QVBoxLayout(self.scroll_inst_widget)
        self.scroll_inst_layout.setAlignment(Qt.AlignTop)
        self.scroll_inst_layout.setSpacing(4)
        self.scroll_inst.setWidget(self.scroll_inst_widget)
        tab_inst_layout.addWidget(self.scroll_inst)

        self.tabs.addTab(self.tab_inst, "⚙️ Installed Plugins")

        # Footer Status bar
        self.status = QLabel()
        self.status.setStyleSheet('color: #94a3b8; font-size: 12px; padding: 8px 12px; background: #020617; border-radius: 6px; border: 1px solid #1e293b;')
        layout.addWidget(self.status)

        self._refresh()

    def _refresh(self):
        """Rebuild UI lists."""
        import qgis.utils
        self.active_set = set(qgis.utils.active_plugins)
        self.installed_list = list(qgis.utils.available_plugins)
        self.installed_list.sort()

        # Workspaces tab
        while self.scroll_layout.count():
            item = self.scroll_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for i, ws in enumerate(self.workspaces):
            card = self._create_card(ws, i, self.installed_list, self.active_set)
            self.scroll_layout.addWidget(card)

        # Installed Plugins Tab
        self._refresh_installed_list()

        self.status.setText(
            f"Installed: {len(self.installed_list)} | Active: {len(self.active_set)} | Workspaces: {len(self.workspaces)} | Web Hub: {WEB_HUB_URL}"
        )

    def _refresh_installed_list(self):
        """Filter and render Installed Plugins tab."""
        while self.scroll_inst_layout.count():
            item = self.scroll_inst_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        filter_text = getattr(self, 'search_inst', None)
        query = filter_text.text().strip().lower() if filter_text else ""

        for pid in getattr(self, 'installed_list', []):
            if query and query not in pid.lower():
                continue

            row = QFrame()
            is_act = pid in self.active_set
            row.setStyleSheet(f"background: #1e293b; border-radius: 6px; margin-bottom: 2px; padding: 6px 12px; border-left: 3px solid {'#10b981' if is_act else '#475569'};")
            h = QHBoxLayout(row)
            h.setContentsMargins(4, 2, 4, 2)
            
            lbl = QLabel(pid)
            lbl.setStyleSheet(f"font-weight: 600; color: {'#f8fafc' if is_act else '#94a3b8'}; font-size: 13px;")
            h.addWidget(lbl)
            
            st = QLabel("● Active" if is_act else "○ Inactive")
            st.setStyleSheet(f"color: {'#10b981' if is_act else '#64748b'}; font-size: 11px; font-weight: bold; margin-left: 8px;")
            h.addWidget(st)
            
            h.addStretch()

            btn = QPushButton('⏸ Disable' if is_act else '▶ Enable')
            btn.setStyleSheet(self._btn_style('#ef4444' if is_act else '#10b981', small=True))
            btn.clicked.connect(lambda _, p=pid, act=is_act: self._disable_plugin(p) if act else self._enable_plugin(p))
            h.addWidget(btn)
            
            self.scroll_inst_layout.addWidget(row)

    def _create_card(self, ws, index, available, active):
        group = QGroupBox()
        color = ws.get('color', '#6366f1')
        group.setStyleSheet(
            f"QGroupBox {{ border: 1px solid #1e293b; border-top: 4px solid {color}; border-radius: 8px; background: #0f172a; padding: 14px; margin-top: 4px; }}"
        )

        v = QVBoxLayout(group)
        v.setSpacing(10)

        # Card Header
        h = QHBoxLayout()
        h.setSpacing(8)

        icon_lbl = QLabel("📁")
        icon_lbl.setStyleSheet("font-size: 18px;")
        h.addWidget(icon_lbl)

        name = QLabel(ws['name'])
        name.setStyleSheet(f"font-size: 17px; font-weight: 800; color: {color}")
        h.addWidget(name)
        
        count_badge = QLabel(f"{len(ws.get('plugins', []))} plugins")
        count_badge.setStyleSheet("color: #64748b; font-size: 11px; font-weight: 600; background: #1e293b; padding: 2px 8px; border-radius: 10px;")
        h.addWidget(count_badge)

        h.addStretch()

        # Batch Operations for Workspace
        btn_install = QPushButton("⬇ Install missing")
        btn_install.setStyleSheet(self._btn_style('#3b82f6', small=True))
        btn_install.clicked.connect(lambda: self._install_all_missing(index))
        h.addWidget(btn_install)

        btn_on = QPushButton("▶ Enable All")
        btn_on.setToolTip("Enable all plugins in this workspace")
        btn_on.setStyleSheet(self._btn_style('#10b981', small=True))
        btn_on.clicked.connect(lambda: self._toggle_all(index, True))
        h.addWidget(btn_on)

        btn_off = QPushButton("⏸ Disable All")
        btn_off.setToolTip("Disable all plugins in this workspace")
        btn_off.setStyleSheet(self._btn_style('#ef4444', small=True))
        btn_off.clicked.connect(lambda: self._toggle_all(index, False))
        h.addWidget(btn_off)

        btn_export = QPushButton("💾 Export")
        btn_export.setToolTip("Export this workspace to a JSON file")
        btn_export.setStyleSheet(self._btn_style('#f59e0b', small=True))
        btn_export.clicked.connect(lambda: self._export_single_workspace(index))
        h.addWidget(btn_export)

        btn_del = QPushButton("🗑")
        btn_del.setToolTip("Delete workspace")
        btn_del.setFixedWidth(34)
        btn_del.setStyleSheet(self._btn_style('#64748b', small=True))
        btn_del.clicked.connect(lambda: self._delete_workspace(index))
        h.addWidget(btn_del)
        v.addLayout(h)

        if ws.get('description'):
            desc_lbl = QLabel(ws['description'])
            desc_lbl.setStyleSheet("color: #64748b; font-size: 12px; margin-bottom: 4px;")
            v.addWidget(desc_lbl)

        # Plugin Rows Box
        rows_container = QVBoxLayout()
        rows_container.setSpacing(4)

        for j, p_entry in enumerate(ws.get('plugins', [])):
            pid = p_entry.get('plugin_id', '')
            enabled = p_entry.get('enabled', True)
            is_inst = pid in available
            is_act = pid in active

            p_frame = QFrame()
            p_frame.setStyleSheet(
                f"background: #1e293b; border-radius: 6px; padding: 4px 10px; border-left: 3px solid {'#10b981' if is_act else ('#eab308' if is_inst else '#f43f5e')};"
            )
            p_row = QHBoxLayout(p_frame)
            p_row.setContentsMargins(4, 2, 4, 2)

            cb = QCheckBox(pid)
            cb.setChecked(enabled)
            cb.setToolTip("Include plugin in workspace active group")
            cb.stateChanged.connect(lambda state, wi=index, pi=j: self._toggle_plugin(wi, pi, state == Qt.Checked))
            p_row.addWidget(cb)

            # Badge Indicator
            if is_act:
                st_txt, st_clr = "● Active", "#10b981"
            elif is_inst:
                st_txt, st_clr = "○ Inactive", "#eab308"
            else:
                st_txt, st_clr = "× Missing", "#f43f5e"

            st_lbl = QLabel(st_txt)
            st_lbl.setStyleSheet(f"color: {st_clr}; font-size: 11px; font-weight: bold;")
            st_lbl.setFixedWidth(75)
            p_row.addWidget(st_lbl)

            p_row.addStretch()

            # Dynamic Action Button per row
            if is_act:
                btn_act = QPushButton("⏸ Disable")
                btn_act.setToolTip("Disable this plugin in QGIS")
                btn_act.setStyleSheet(self._btn_style('#ef4444', small=True))
                btn_act.clicked.connect(lambda _, p=pid: self._disable_plugin(p))
                p_row.addWidget(btn_act)
            elif is_inst:
                btn_act = QPushButton("▶ Enable")
                btn_act.setToolTip("Enable this plugin in QGIS")
                btn_act.setStyleSheet(self._btn_style('#10b981', small=True))
                btn_act.clicked.connect(lambda _, p=pid: self._enable_plugin(p))
                p_row.addWidget(btn_act)
            else:
                btn_act = QPushButton("⬇ Install")
                btn_act.setToolTip("Install this plugin from QGIS Repository")
                btn_act.setStyleSheet(self._btn_style('#3b82f6', small=True))
                btn_act.clicked.connect(lambda _, p=pid: self._install_plugin(p))
                p_row.addWidget(btn_act)

            rows_container.addWidget(p_frame)

        v.addLayout(rows_container)
        return group

    # -- Operations --
    def _toggle_all(self, idx, enable):
        ws = self.workspaces[idx]
        for p in ws.get('plugins', []):
            p['enabled'] = enable
            pid = p.get('plugin_id')
            if enable and pid in available_plugins:
                try:
                    loadPlugin(pid)
                    startPlugin(pid)
                except Exception:
                    pass
            elif not enable and pid in active_plugins:
                try:
                    unloadPlugin(pid)
                except Exception:
                    pass
        self.save_callback()
        self._refresh()

    def _toggle_plugin(self, wi, pi, checked):
        self.workspaces[wi]['plugins'][pi]['enabled'] = checked
        self.save_callback()

    def _enable_plugin(self, pid):
        try:
            loadPlugin(pid)
            startPlugin(pid)
            self._refresh()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"Failed to enable {pid}: {e}")

    def _disable_plugin(self, pid):
        try:
            unloadPlugin(pid)
            self._refresh()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"Failed to disable {pid}: {e}")

    def _delete_workspace(self, i):
        ws_name = self.workspaces[i].get('name', 'Workspace')
        if QMessageBox.question(self, "Delete Workspace", f"Are you sure you want to delete '{ws_name}'?") == QMessageBox.Yes:
            self.workspaces.pop(i)
            self.save_callback()
            self._refresh()

    def _create_workspace(self):
        name, ok = QInputDialog.getText(self, "New Workspace", "Workspace Name:")
        if ok and name.strip():
            self.workspaces.append({"name": name.strip(), "plugins": [], "color": "#6366f1"})
            self.save_callback()
            self._refresh()

    def _create_workspace_from_active(self):
        import qgis.utils
        active = sorted(list(qgis.utils.active_plugins))
        if not active:
            QMessageBox.information(self, "Info", "No plugins are currently active in QGIS.")
            return

        name, ok = QInputDialog.getText(
            self,
            "New Workspace from Active Plugins",
            f"Workspace Name ({len(active)} plugins active):",
            text="Active QGIS Snapshot"
        )
        if ok and name.strip():
            plugins_list = [{"plugin_id": pid, "enabled": True} for pid in active]
            self.workspaces.append({
                "name": name.strip(),
                "description": f"Created from {len(active)} active QGIS plugins",
                "color": "#10b981",
                "plugins": plugins_list
            })
            self.save_callback()
            self._refresh()
            QMessageBox.information(self, "Success", f"Workspace '{name.strip()}' created with {len(active)} active plugins!")

    def _import_workspace(self):
        path, _ = QFileDialog.getOpenFileName(self, "Import Workspace JSON", "", "JSON Files (*.json)")
        if path:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Check if file contains multiple workspaces
                if isinstance(data, dict) and "workspaces" in data and isinstance(data["workspaces"], list):
                    added_count = 0
                    for ws in data["workspaces"]:
                        if isinstance(ws, dict) and "name" in ws:
                            self.workspaces.append(ws)
                            added_count += 1
                    self.save_callback()
                    self._refresh()
                    QMessageBox.information(self, "Import Complete", f"Successfully imported {added_count} workspaces!")
                    return

                # Single workspace import
                plugins = []
                details = data.get('pluginDetails', data.get('plugins', []))
                for p in details:
                    if isinstance(p, dict):
                        pid = p.get('qgis_name', p.get('plugin_id', p.get('name', '')))
                        if pid:
                            plugins.append({"plugin_id": pid, "enabled": p.get('enabled', True)})
                    elif isinstance(p, str):
                        plugins.append({"plugin_id": p, "enabled": True})

                ws_name = data.get('name', 'Imported Workspace')
                self.workspaces.append({
                    "name": ws_name,
                    "description": data.get('description', ''),
                    "plugins": plugins,
                    "color": data.get('color', '#6366f1')
                })
                self.save_callback()
                self._refresh()
                QMessageBox.information(self, "Imported", f"Workspace '{ws_name}' imported with {len(plugins)} plugins!")
            except Exception as e:
                QMessageBox.warning(self, "Import Failed", f"Could not import workspace JSON: {e}")

    def _export_single_workspace(self, idx):
        if idx < 0 or idx >= len(self.workspaces):
            return
        ws = self.workspaces[idx]
        safe_name = "".join(c if c.isalnum() else "_" for c in ws.get('name', 'workspace')).lower()
        default_file = f"qgis-workspace-{safe_name}.json"

        path, _ = QFileDialog.getSaveFileName(self, "Export Workspace JSON", default_file, "JSON Files (*.json)")
        if path:
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(ws, f, indent=2, ensure_ascii=False)
                QMessageBox.information(self, "Exported", f"Workspace '{ws.get('name')}' exported to:\n{path}")
            except Exception as e:
                QMessageBox.warning(self, "Export Error", f"Failed to export workspace: {e}")

    def _export_all_workspaces(self):
        if not self.workspaces:
            QMessageBox.information(self, "Info", "No workspaces available to export.")
            return

        path, _ = QFileDialog.getSaveFileName(self, "Export All Workspaces JSON", "qyggdrasil-all-workspaces.json", "JSON Files (*.json)")
        if path:
            try:
                export_data = {
                    "generator": "QYggdrasil QGIS Plugin",
                    "version": "1.1.0",
                    "web_hub": WEB_HUB_URL,
                    "workspaces": self.workspaces
                }
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                QMessageBox.information(self, "Exported", f"All {len(self.workspaces)} workspaces exported to:\n{path}")
            except Exception as e:
                QMessageBox.warning(self, "Export Error", f"Failed to export workspaces: {e}")

    # -- ASYNC INSTALL ENGINE --
    def _install_plugin(self, pid):
        self.MissingPids = [pid]
        self._start_batch_install()

    def _install_all_missing(self, idx):
        ws = self.workspaces[idx]
        import qgis.utils
        self.MissingPids = [
            p['plugin_id'] for p in ws.get('plugins', [])
            if p.get('enabled', True) and p['plugin_id'] not in qgis.utils.available_plugins
        ]
        if not self.MissingPids:
            QMessageBox.information(self, "Info", "No missing plugins in this workspace!")
            return
        self._start_batch_install()

    def _start_batch_install(self):
        self._batch_done = False
        self._progress = InstallProgressDialog(self, len(self.MissingPids) > 1)
        self._progress.log(f"▶ Starting install for {len(self.MissingPids)} plugins...")
        self._progress.show()

        try:
            try:
                from pyplugin_installer.installer_data import repositories, plugins
            except ImportError:
                try:
                    from pyplugin_installer import repositories, plugins
                except ImportError:
                    import pyplugin_installer
                    repositories = getattr(pyplugin_installer, 'repositories', None)
                    plugins = getattr(pyplugin_installer, 'plugins', None)

            if repositories:
                repositories.load()
                if hasattr(plugins, 'clearRepoCache'):
                    plugins.clearRepoCache()

                for r in repositories.all().values():
                    if isinstance(r, dict) and 'plugins.qgis.org' in r.get('url', ''):
                        r['enabled'] = True

                for k in repositories.allEnabled():
                    self._progress.log(f"  [-] Fetching repository: {k}")
                    repositories.requestFetching(k, force_reload=True)

                if hasattr(repositories, 'checkingDone'):
                    repositories.checkingDone.connect(self._on_repos_ready)
            
            from qgis.PyQt.QtCore import QTimer
            QTimer.singleShot(8000, lambda: self._on_repos_ready() if not self._batch_done else None)
        except Exception as e:
            self._progress.log(f"❌ Error setting up installer: {e}")
            self._progress.btn_close.setEnabled(True)

    def _on_repos_ready(self):
        if getattr(self, '_batch_done', False):
            return
        self._batch_done = True

        try:
            try:
                from pyplugin_installer.installer_data import repositories, plugins
            except ImportError:
                from pyplugin_installer import repositories, plugins

            if hasattr(repositories, 'checkingDone'):
                try:
                    repositories.checkingDone.disconnect(self._on_repos_ready)
                except Exception:
                    pass
        except Exception:
            pass

        self._progress.log("▶ Repositories ready. Searching plugins...")
        try:
            try:
                from pyplugin_installer.installer_data import plugins
            except ImportError:
                from pyplugin_installer import plugins

            import pyplugin_installer

            if hasattr(plugins, 'rebuild'):
                plugins.rebuild()
            all_p = plugins.all() if hasattr(plugins, 'all') else {}

            def norm(s):
                return str(s).replace(' ', '').replace('-', '').replace('_', '').lower()

            success = 0
            for i, pid in enumerate(self.MissingPids):
                self._progress.set_status(f"Installing {i+1}/{len(self.MissingPids)}: {pid}...")
                self._progress.log(f"  [-] Searching repository for: {pid}")
                QCoreApplication.processEvents()

                target = None
                n_pid = norm(pid)
                for k, d in all_p.items():
                    name = d.get('name', '') if isinstance(d, dict) else getattr(d, 'name', '')
                    pid_attr = d.get('id', '') if isinstance(d, dict) else getattr(d, 'id', '')
                    if norm(k) == n_pid or norm(name) == n_pid or norm(pid_attr) == n_pid:
                        target = k
                        break

                if target:
                    self._progress.log(f"      [~] Found '{target}'. Downloading & installing...")
                    QCoreApplication.processEvents()
                    installer_inst = pyplugin_installer.instance()
                    if installer_inst.installPlugin(target):
                        self._progress.log(f"      [✓] Installed successfully: {target}")
                        success += 1
                    else:
                        err = getattr(installer_inst, 'message', 'Installation error')
                        self._progress.log(f"      [x] Failed: {err}")
                else:
                    self._progress.log(f"      [x] Plugin '{pid}' not found in QGIS repository.")

            self._progress.log(f"▶ Batch complete. Successfully installed {success}/{len(self.MissingPids)} plugins.")
        except Exception as e:
            self._progress.log(f"❌ Error during installation: {e}")

        self._progress.btn_close.setEnabled(True)
        self._refresh()


class InstallProgressDialog(QDialog):
    """Progress feedback dialog for batch installation."""

    def __init__(self, parent, is_batch=False):
        super().__init__(parent)
        self.setWindowTitle("Plugin Installation Engine")
        self.resize(540, 440)
        self.setStyleSheet("""
            QDialog { background: #0b0f19; color: white; font-family: 'Segoe UI', system-ui, sans-serif; }
            QLabel { color: #818cf8; }
            QPlainTextEdit { background: #020617; border: 1px solid #1e293b; color: #38bdf8; font-family: monospace; font-size: 12px; border-radius: 6px; }
            QProgressBar { border: 1px solid #334155; border-radius: 6px; text-align: center; color: white; }
            QProgressBar::chunk { background: #6366f1; border-radius: 4px; }
            QPushButton { background: #334155; color: white; border-radius: 6px; padding: 6px 18px; font-weight: 600; }
            QPushButton:hover { background: #475569; }
        """)
        layout = QVBoxLayout(self)

        self.status_lbl = QLabel("Initializing installer...")
        self.status_lbl.setStyleSheet("font-weight: 700; color: #818cf8; font-size: 14px;")
        layout.addWidget(self.status_lbl)

        self.progress = QProgressBar()
        self.progress.setRange(0, 0)
        layout.addWidget(self.progress)

        self.log_area = QPlainTextEdit()
        self.log_area.setReadOnly(True)
        layout.addWidget(self.log_area)

        self.btn_close = QPushButton("Close")
        self.btn_close.setEnabled(False)
        self.btn_close.clicked.connect(self.accept)
        layout.addWidget(self.btn_close)

    def log(self, txt):
        self.log_area.appendPlainText(txt)

    def set_status(self, txt):
        self.status_lbl.setText(txt)
