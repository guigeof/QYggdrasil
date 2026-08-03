import os
import sys
import zipfile

# Ensure stdout uses utf-8 on Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def zip_directory(path, zip_file_name):
    print(f"📦 Packaging QGIS Plugin from: {path}...")
    with zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(path):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, os.path.dirname(path))
                zipf.write(abs_path, rel_path)
    print(f"✅ Success! Created: {os.path.abspath(zip_file_name)}")

if __name__ == "__main__":
    plugin_src = os.path.join("qgis_plugin", "workspace_manager")
    output_zip = "workspace_manager.zip"

    if os.path.exists(plugin_src):
        zip_directory(plugin_src, output_zip)
        
        # Also copy to web/ folder for GitHub Pages deployment
        web_dir = "web"
        if os.path.exists(web_dir):
            import shutil
            web_zip = os.path.join(web_dir, "workspace_manager.zip")
            shutil.copy2(output_zip, web_zip)
            print(f"📦 Copied to web deployment folder: {os.path.abspath(web_zip)}")
    else:
        print(f"❌ Error: Plugin directory '{plugin_src}' not found.")
