# Recipes Web App

A web application with CRUD operations for recipes, including search functionality.

## Storage

### Backend

The recipe model shall have a version timestamp. The recipes endpoint shall have a version parameter. If the versions is provided only recipes that are newer shall be returned.

#### Google Cloud Storage

A recipe stored in Google Cloud Storage will set the version timestamp from the last modified of the GCS item.

### Frontend

The frontend will keep a cache of downloaded recipes. This cache is never cleared.
When the frontend asks for recipes it passes the version timestamp of the newest recipe. Only new or modified recipes will be returned and added to the local cache.

✅ **Completed**: Backend supports ?version parameter, returns only newer recipes. Frontend caches recipes persistently, fetches incrementally on load, merges new recipes, updates cache on delete.

## Completed Features

### Data Processing
- ✅ Extracted recipes from HTML files into JSON format
- ✅ Recipes stored in `recipes/` directory with structured data (title, servings, ingredients, steps)
- ✅ All recipes uploaded to the backend API (100+ recipes)

### Backend (Google App Engine + Flask)
- ✅ REST API built with Flask
- ✅ CRUD operations: GET /recipes, POST /recipes, GET /recipes/{id}, PUT /recipes/{id}, DELETE /recipes/{id}
- ✅ Google Cloud Storage integration for recipe storage (local file storage for development)
- ✅ CORS headers implemented for frontend integration
- ✅ Error handling and JSON responses
- ✅ Recipe steps trimmed of leading dashes during upload

### Frontend
- ✅ Material Design Web UI
- ✅ Recipe listing with cards
- ✅ View recipe details
- ✅ Add new recipes
- ✅ Edit existing recipes
- ✅ Delete recipes
- ✅ Responsive design
- ✅ HTML/JavaScript separation (external script files)
- ✅ Port configuration updated (using port 3001)
- ✅ Free text search across title, ingredients, steps, and attributes
- ✅ Keyword filtering with toggle buttons
- ✅ Results count display
- ✅ Debounced search input for performance

#### Pages

##### Main page

View of existing recipes.
- List all recipes
- Free text search across all recipe fields
- Quick filter buttons for the most common recipe keywords. Toggle buttons
- Results count showing filtered vs total recipes

##### Add recipe

A quick way of adding recipes
- title, at the top
- keywords, show the most common keywords. With the ability to add new ones. Use toggle buttons
- notes, general info
- steps, the steps to execute. Show as a table, there shall always be an empty row at the bottom.
- ingredients. Show as a table, there shall always be an empty row at the bottom. Use autocomplete based on existing ingredients.

### Development Environment
- ✅ Google Cloud SDK for deployment and management
- ✅ Python virtual environment for local development
- ✅ Flask development server for local testing
- ✅ Google Cloud Storage emulator (fake-gcs-server via Docker) for local development
- ✅ Google Cloud Storage bucket for recipe storage

### Infrastructure
- ✅ Google App Engine configuration with Flask app and GCS bucket
- ✅ Environment configuration for local development
- ✅ Build and deployment scripts
- ✅ Versioning system tested with recipe upload (incremental fetching working correctly)

## Remaining Features

### Authentication & Authorization
- 🔄 Google OAuth integration with Google Identity Platform
- 🔄 User access control for specific emails (carl.ericsson@gmail.com, wiklund.katrin@gmail.com)
- 🔄 Frontend authentication with Google Sign-In
- 🔄 JWT token handling and storage

### Production Deployment
- ✅ Google App Engine deployment configuration
- ✅ Google Cloud Storage for recipe storage
- ✅ Custom domain setup (carlkatrin.com)
- ✅ Google Domains DNS configuration (CNAME records for www and api subdomains)
- 🔄 Google Identity Platform authentication (planned)

### UI Enhancements
- 🔄 Improve the add recipes page with autocomplete and table inputs
- 🔄 Add pagination for large recipe lists
- ✅ Optimize frontend performance for 100+ recipes (implemented versioning and incremental caching)

## Tech Stack

* **Frontend**: HTML, CSS, JavaScript, Material Design Web
* **Backend**: Google App Engine (Python Flask), Google Cloud Storage
* **Local Development**: Google Cloud SDK, Python virtual environment, Flask dev server, fake-gcs-server (Docker-based GCP Cloud Storage emulator)
* **Authentication**: Google Identity Platform (planned)
* **Deployment**: Google App Engine, Google Cloud Storage
* **Domain**: Google Domains (carlkatrin.com)

## Local Development

### Prerequisites
- Google Cloud SDK (for Cloud Storage emulator)
  ```bash
  # Install Google Cloud SDK
  curl https://sdk.cloud.google.com | bash
  exec -l $SHELL
  
  # Initialize (choose your project or create a new one)
  gcloud init
  ```

To run the application locally:

```bash
# Set up development environment (one-time)
./setup.sh

# Start development server with GCP simulator
./run-local.sh

# Stop all services
./stop-local.sh
```

The `./run-local.sh` script will:
- Check for Google Cloud SDK and Docker
- Start fake-gcs-server (GCP Cloud Storage simulator) in Docker
- Start Flask development server in background
- Services run independently and can be stopped with `./stop-local.sh`

Access the app at:
- Frontend: http://localhost:8080
- API: http://localhost:8080/api/recipes
- Storage Emulator: http://localhost:9023
- Storage Emulator: http://localhost:9023

## Production Deployment

To deploy to Google App Engine:

```bash
# Deploy to production
gradle deployGae

# Migrate existing recipes (one-time)
gradle migrateRecipes
```

Configure DNS in Google Domains:
- www.carlkatrin.com → CNAME ghs.googlehosted.com
- api.carlkatrin.com → CNAME ghs.googlehosted.com

**Current Status**: ✅ Application is fully functional locally with 100+ recipes loaded, search functionality implemented, all CRUD operations working, versioning/caching system tested and operational, Google Cloud Storage emulator (fake-gcs-server) configured for local development with Docker, authentication system implemented, and production deployment configuration ready.

## Next Steps

1. Implement Google OAuth authentication
2. Deploy to Google App Engine production environment
3. Add user management and permissions
4. Improve the add recipes page with autocomplete and table inputs
5. Add pagination for large recipe lists to improve performance 