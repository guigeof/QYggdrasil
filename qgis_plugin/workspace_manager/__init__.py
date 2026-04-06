# -*- coding: utf-8 -*-
"""
Plugin Hub Workspace Manager - QGIS Plugin
Manage plugin groups with workspaces, inspired by Chrome Extension Manager.
"""

def classFactory(iface):
    from .workspace_manager import WorkspaceManagerPlugin
    return WorkspaceManagerPlugin(iface)
