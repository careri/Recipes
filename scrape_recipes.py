import os
import requests
from bs4 import BeautifulSoup
import time

# Path to the saved HTML file
html_file = 'inkopslistan.html'

# Directory to save recipes
output_dir = 'raw/recipes'

# Read the HTML file
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Parse the HTML
soup = BeautifulSoup(html_content, 'html.parser')

# Find all links starting with https://www.inkopslista.se/matrecept/
links = set()  # Use set to remove duplicates
for a in soup.find_all('a', href=True):
    href = a['href']
    if href.startswith('https://www.inkopslista.se/matrecept/'):
        links.add(href)

print(f"Found {len(links)} unique recipe links.")

# Download each recipe
for link in links:
    try:
        response = requests.get(link)
        response.raise_for_status()
        
        # Get the filename from the URL
        filename = link.split('/')[-1] + '.html'
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"Saved {filename}")
        
        # Be polite, add a delay
        time.sleep(1)
        
    except Exception as e:
        print(f"Error downloading {link}: {e}")

print("Done.")