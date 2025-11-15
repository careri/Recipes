# Recipes App

A Flask-based web application for managing recipes, deployed on Google App Engine.

## Features

- REST API for CRUD operations on recipes
- Search functionality across recipe titles, ingredients, and steps
- Versioning system for incremental data fetching
- Google Cloud Storage integration for data persistence
- Local file storage fallback for development
- Material Design Web frontend

## Local Development

### Prerequisites

- Python 3.9+
- Google Cloud SDK (for production deployment)

### Setup

1. Set up the development environment:
```bash
gradle setupGae
```

2. Start the local development server:
```bash
gradle runLocal
```

The application will be available at:
- Frontend: http://localhost:8080
- API: http://localhost:8080/api/recipes

### API Endpoints

- `GET /api/recipes` - List all recipes (supports ?version parameter for incremental fetching)
- `GET /api/recipes/{id}` - Get a specific recipe
- `POST /api/recipes` - Create a new recipe
- `PUT /api/recipes/{id}` - Update an existing recipe
- `DELETE /api/recipes/{id}` - Delete a recipe

## Production Deployment

### Prerequisites

- Google Cloud SDK installed and authenticated
- Google App Engine enabled in your project

### Deploy

1. Authenticate with Google Cloud:
```bash
gcloud auth login
```

2. Set your project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

3. Deploy to Google App Engine:
```bash
gradle deployGae
```

4. Migrate existing recipes (one-time):
```bash
gradle migrateRecipes
```

### DNS Configuration

Configure DNS in Google Domains:
- `www.carlkatrin.com` → CNAME `ghs.googlehosted.com`
- `api.carlkatrin.com` → CNAME `ghs.googlehosted.com`

## Project Structure

```
recipes-app/
├── main.py              # Flask application
├── app.yaml            # Google App Engine configuration
├── requirements.txt    # Python dependencies
├── local_storage/      # Local file storage for development
└── www/               # Static frontend files
```

## Development Tasks

- `gradle setupGae` - Set up Python virtual environment and install dependencies
- `gradle runLocal` - Start local development server
- `gradle deployGae` - Deploy to Google App Engine
- `gradle migrateRecipes` - Migrate recipes to Google Cloud Storage
- `gradle cleanGae` - Clean up development environment
