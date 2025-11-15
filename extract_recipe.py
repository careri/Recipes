import json
from bs4 import BeautifulSoup
import os
import glob

def extract_recipe_data(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract title
    title_meta = soup.find('meta', {'property': 'og:title'})
    title = title_meta['content'].strip() if title_meta else ""

    # Extract steps
    description_meta = soup.find('meta', {'property': 'og:description'})
    steps_text = description_meta['content'].strip() if description_meta else ""
    steps = [step.strip() for step in steps_text.split('\n') if step.strip()]

    # Extract ingredients
    ingredients = []
    ingredient_spans = soup.find_all('span', id=lambda x: x and x.startswith('mp_contentBody_ucMatrecept_rpt_receptVaror_') and x.endswith('_lbl_receptVaror'))
    for span in ingredient_spans:
        text = span.get_text().strip()
        parts = text.split()
        if len(parts) >= 2:
            amount = parts[0]
            unit = parts[1]
            name = ' '.join(parts[2:])
            ingredients.append({
                "amount": amount,
                "unit": unit,
                "name": name
            })

    # Extract servings
    servings_span = soup.find('span', {'id': 'mp_contentBody_lbl_port'})
    servings_text = servings_span.get_text().strip() if servings_span else ""
    servings_parts = servings_text.split()
    if len(servings_parts) >= 2:
        servings = {
            "amount": servings_parts[0],
            "unit": servings_parts[1]
        }
    else:
        servings = {}

    # Extract attributes
    attributes_span = soup.find('span', {'id': 'mp_contentBody_ucMatrecept_lbl_attributeInfo'})
    attributes = attributes_span.get_text().strip() if attributes_span else ""

    # Create JSON structure
    recipe_data = {
        "title": title,
        "steps": steps,
        "ingredients": ingredients,
        "servings": servings,
        "attributes": attributes
    }

    return recipe_data

# Main processing
raw_dir = '/Users/carl.ericsson/repos/_private/inkopslistan/raw/recipes'
output_dir = '/Users/carl.ericsson/repos/_private/inkopslistan/receips'
os.makedirs(output_dir, exist_ok=True)

html_files = glob.glob(os.path.join(raw_dir, '*.html'))
for html_file in html_files:
    recipe_data = extract_recipe_data(html_file)
    base_name = os.path.basename(html_file).replace('.html', '.json')
    output_file = os.path.join(output_dir, base_name)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(recipe_data, f, ensure_ascii=False, indent=4)
    print(f"Processed {html_file} -> {output_file}")