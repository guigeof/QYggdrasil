"""
Fetch QGIS plugins from the official repository and convert to JSON.
This script pre-fetches the data so the frontend can work without CORS issues.
Can be run manually or via GitHub Actions to keep data fresh.
"""
import urllib.request
import xml.etree.ElementTree as ET
import json
import os
import sys

QGIS_PLUGIN_URL = "https://plugins.qgis.org/plugins/plugins.xml?qgis=3.34"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "data", "plugins.json")

def fetch_and_parse():
    print(f"Fetching plugins from {QGIS_PLUGIN_URL}...")
    req = urllib.request.Request(QGIS_PLUGIN_URL, headers={'User-Agent': 'QYggdrasil/1.0'})
    with urllib.request.urlopen(req, timeout=60) as response:
        xml_data = response.read()
    
    print(f"Received {len(xml_data)} bytes, parsing XML...")
    root = ET.fromstring(xml_data)
    
    plugins = []
    for plugin_el in root.findall('pyqgis_plugin'):
        plugin = {
            'name': plugin_el.get('name', ''),
            'version': plugin_el.get('version', ''),
            'plugin_id': plugin_el.get('plugin_id', ''),
            'description': (plugin_el.findtext('description') or '').strip(),
            'about': (plugin_el.findtext('about') or '').strip(),
            'tags': [t.strip().lower() for t in (plugin_el.findtext('tags') or '').split(',') if t.strip()],
            'downloads': int(plugin_el.findtext('downloads') or 0),
            'average_vote': float(plugin_el.findtext('average_vote') or 0),
            'rating_votes': int(plugin_el.findtext('rating_votes') or 0),
            'author': (plugin_el.findtext('author_name') or '').strip(),
            'homepage': (plugin_el.findtext('homepage') or '').strip(),
            'repository': (plugin_el.findtext('repository') or '').strip(),
            'tracker': (plugin_el.findtext('tracker') or '').strip(),
            'create_date': (plugin_el.findtext('create_date') or '').strip(),
            'update_date': (plugin_el.findtext('update_date') or '').strip(),
            'experimental': (plugin_el.findtext('experimental') or 'False') == 'True',
            'deprecated': (plugin_el.findtext('deprecated') or 'False') == 'True',
            'trusted': (plugin_el.findtext('trusted') or 'False') == 'True',
            'icon': (plugin_el.findtext('icon') or '').strip(),
            'qgis_minimum_version': (plugin_el.findtext('qgis_minimum_version') or '').strip(),
            'qgis_maximum_version': (plugin_el.findtext('qgis_maximum_version') or '').strip(),
            'download_url': (plugin_el.findtext('download_url') or '').strip(),
            'file_name': (plugin_el.findtext('file_name') or '').strip(),
            'server': (plugin_el.findtext('server') or 'False') == 'True',
        }
        # Build icon URL
        if plugin['icon'] and not plugin['icon'].startswith('http'):
            plugin['icon'] = f"https://plugins.qgis.org{plugin['icon']}"
        plugins.append(plugin)
    
    print(f"Parsed {len(plugins)} plugins")
    return plugins

def save_json(plugins):
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    data = {
        'fetch_date': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'qgis_version': '3.34',
        'total_plugins': len(plugins),
        'plugins': plugins
    }
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(plugins)} plugins to {OUTPUT_FILE}")

if __name__ == '__main__':
    plugins = fetch_and_parse()
    save_json(plugins)
    print("Done!")
