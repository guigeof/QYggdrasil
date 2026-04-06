import os
import zipfile

def zip_directory(path, zip_file_name):
    print(f"📦 Packaging QGIS Plugin from: {path}...")
    with zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(path):
            for file in files:
                abs_path = os.path.join(root, file)
                # Ensure the path in the ZIP is relative to the internal folder
                # plugin_folder/file.py
                rel_path = os.path.relpath(abs_path, os.path.dirname(path))
                zipf.write(abs_path, rel_path)
    print(f"✅ Success! Created: {os.path.abspath(zip_file_name)}")

if __name__ == "__main__":
    # Updated paths for new project structure
    plugin_src = os.path.join("qgis_plugin", "workspace_manager")
    output_zip = os.path.join("web", "workspace_manager.zip")
    
    if os.path.exists(plugin_src):
        zip_directory(plugin_src, output_zip)
    else:
        print(f"❌ Error: Plugin directory '{plugin_src}' not found.")
