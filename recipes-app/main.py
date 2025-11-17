from flask import Flask, request, jsonify
import json
import uuid
import os
from datetime import datetime
from google.cloud import storage

app = Flask(__name__, static_folder='www')

# Configuration
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'recipes-storage-bucket')
PROJECT_ID = os.environ.get('GOOGLE_CLOUD_PROJECT', 'carlkatrin-com')
LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(__file__), 'local_storage')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# Check if running locally (no Google Cloud credentials)
USE_LOCAL_STORAGE = False
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    # Try to access bucket to verify credentials
    bucket.reload()
    print("Using Google Cloud Storage")
except Exception as e:
    # Check if we're using the storage emulator
    if os.environ.get('STORAGE_EMULATOR_HOST'):
        print("Using Google Cloud Storage emulator")
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        # Create bucket if it doesn't exist in emulator
        try:
            bucket.reload()
        except Exception:
            bucket.create()
    else:
        print(f"Google Cloud Storage not available ({e}), using local storage")
        USE_LOCAL_STORAGE = True
        # Create local storage directory
        os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)

def get_recipes_list():
    """Get list of all recipe files with metadata"""
    if USE_LOCAL_STORAGE:
        recipes = []
        for filename in os.listdir(LOCAL_STORAGE_DIR):
            if filename.endswith('.json'):
                try:
                    filepath = os.path.join(LOCAL_STORAGE_DIR, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        recipe = json.load(f)
                        # Use file modification time as version
                        mtime = os.path.getmtime(filepath)
                        recipe['version'] = datetime.fromtimestamp(mtime).isoformat()
                        recipes.append(recipe)
                except Exception as e:
                    print(f"Error loading recipe {filename}: {e}")
        return recipes
    else:
        blobs = bucket.list_blobs()
        recipes = []

        for blob in blobs:
            if blob.name.endswith('.json'):
                try:
                    # Download and parse recipe
                    content = blob.download_as_text()
                    recipe = json.loads(content)
                    recipe['version'] = blob.updated.isoformat()
                    recipes.append(recipe)
                except Exception as e:
                    print(f"Error loading recipe {blob.name}: {e}")

        return recipes

@app.route('/api/recipes', methods=['GET'])
def list_recipes():
    """List all recipes, optionally filtered by version"""
    version_param = request.args.get('version')

    recipes = get_recipes_list()

    if version_param:
        try:
            version_filter = datetime.fromisoformat(version_param.replace('Z', '+00:00'))
            recipes = [r for r in recipes if datetime.fromisoformat(r['version'].replace('Z', '+00:00')) > version_filter]
        except Exception as e:
            return jsonify({'error': f'Invalid version format: {e}'}), 400

    return jsonify(recipes)

@app.route('/api/recipes/<recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    """Get a specific recipe"""
    if USE_LOCAL_STORAGE:
        filepath = os.path.join(LOCAL_STORAGE_DIR, f'{recipe_id}.json')
        if not os.path.exists(filepath):
            return jsonify({'error': 'Recipe not found'}), 404

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                recipe = json.load(f)
                # Use file modification time as version
                mtime = os.path.getmtime(filepath)
                recipe['version'] = datetime.fromtimestamp(mtime).isoformat()
                return jsonify(recipe)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        try:
            blob = bucket.blob(f'{recipe_id}.json')
            if not blob.exists():
                return jsonify({'error': 'Recipe not found'}), 404

            content = blob.download_as_text()
            recipe = json.loads(content)
            # Handle case where blob.updated might be None (e.g., in emulator)
            if blob.updated:
                recipe['version'] = blob.updated.isoformat()
            else:
                recipe['version'] = datetime.now().isoformat()
            return jsonify(recipe)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/recipes', methods=['POST'])
def create_recipe():
    """Create a new recipe"""
    try:
        recipe_data = request.get_json()
        if not recipe_data:
            return jsonify({'error': 'No recipe data provided'}), 400

        recipe_id = str(uuid.uuid4())
        recipe_data['id'] = recipe_id

        if USE_LOCAL_STORAGE:
            filepath = os.path.join(LOCAL_STORAGE_DIR, f'{recipe_id}.json')
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(recipe_data, f, indent=2, ensure_ascii=False)
        else:
            # Upload to GCS
            blob = bucket.blob(f'{recipe_id}.json')
            blob.upload_from_string(json.dumps(recipe_data, indent=2), content_type='application/json')

        return jsonify({'id': recipe_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipes/<recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    """Update an existing recipe"""
    try:
        recipe_data = request.get_json()
        if not recipe_data:
            return jsonify({'error': 'No recipe data provided'}), 400

        if USE_LOCAL_STORAGE:
            filepath = os.path.join(LOCAL_STORAGE_DIR, f'{recipe_id}.json')
            if not os.path.exists(filepath):
                return jsonify({'error': 'Recipe not found'}), 404

            recipe_data['id'] = recipe_id
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(recipe_data, f, indent=2, ensure_ascii=False)
        else:
            blob = bucket.blob(f'{recipe_id}.json')
            if not blob.exists():
                return jsonify({'error': 'Recipe not found'}), 404

            recipe_data['id'] = recipe_id
            blob.upload_from_string(json.dumps(recipe_data, indent=2), content_type='application/json')

        return jsonify({'message': 'Recipe updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipes/<recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    """Delete a recipe"""
    try:
        if USE_LOCAL_STORAGE:
            filepath = os.path.join(LOCAL_STORAGE_DIR, f'{recipe_id}.json')
            if not os.path.exists(filepath):
                return jsonify({'error': 'Recipe not found'}), 404

            os.remove(filepath)
        else:
            blob = bucket.blob(f'{recipe_id}.json')
            if not blob.exists():
                return jsonify({'error': 'Recipe not found'}), 404

            blob.delete()

        return jsonify({'message': 'Recipe deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get client-side configuration"""
    return jsonify({
        'googleClientId': GOOGLE_CLIENT_ID
    })

@app.route('/')
def index():
    """Serve the frontend"""
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files"""
    return app.send_static_file(path)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)