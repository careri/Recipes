import os
import requests
import json

folder = 'recipes'
url = 'http://localhost:8080/api/recipes'

for file in os.listdir(folder):
    if file.endswith('.json'):
        with open(os.path.join(folder, file), 'r', encoding='utf-8') as f:
            data = json.load(f)
        if 'steps' in data:
            data['steps'] = [step.lstrip('-').lstrip() for step in data['steps']]
        response = requests.post(url, json=data)
        print(f"Uploaded {file}: {response.status_code} - {response.text}")

print("All recipes uploaded!")