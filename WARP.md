# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Serve the PWA locally (Python)
python -m http.server 8000

# Serve the PWA locally (Node.js)
npx http-server

# Access the app
open http://localhost:8000
```

### Testing PWA Features
```bash
# Test PWA installation and service worker in Chrome
open -a "Google Chrome" http://localhost:8000 --args --enable-features=VirtualKeyboard

# Debug service worker
# Open Chrome DevTools > Application tab > Service Workers
```

### File Serving
This is a static PWA with no build step. Files are served directly from the filesystem. Any HTTP server will work for development.

## Architecture Overview

### Core Application Structure
- **App Shell Architecture**: Single-page application with cached shell for offline functionality
- **Progressive Web App**: Full PWA implementation with service worker, manifest, and offline support
- **Component-based Design**: Modular JavaScript components without frameworks
- **IndexedDB Storage**: Client-side data persistence for offline capability

### Key Components

#### Main Application (`src/js/app.js`)
- `FoodTrackerApp` class manages overall application state
- Page routing system for SPA navigation
- Event handling for user interactions
- Online/offline status management
- Service worker integration

#### Storage System (`src/js/storage.js`)
- `FoodStorage` class handles IndexedDB operations
- Three main object stores:
  - `food-entries`: User's food tracking data
  - `user-data`: User preferences and profile
  - `nutrition-cache`: Cached AI/nutrition responses
- Automatic date-based indexing for efficient queries

#### AI Vision (`src/js/ai-vision.js`)
- `AIVision` class for food recognition (mock implementation)
- Image analysis and text description processing
- Nutrition data lookup and caching
- Portion size estimation capabilities

#### Service Worker (`sw.js`)
- Cache-first strategy for static assets
- Network-first for API calls with cache fallback
- Background sync for offline data
- Comprehensive offline support

#### Camera Integration (`src/js/camera.js`)
- `CameraHandler` class for device camera access
- Photo capture with canvas conversion
- Front/back camera switching
- MediaDevices API integration

### Data Flow Architecture
1. **Input Layer**: Camera, file upload, or text input
2. **Processing Layer**: AI vision analysis (mock implementation)
3. **Storage Layer**: IndexedDB for offline data persistence
4. **Presentation Layer**: Dynamic UI updates and dashboard charts

### PWA Implementation Details
- **Manifest**: Full PWA manifest with shortcuts, share targets, and protocol handlers
- **Service Worker**: Comprehensive caching strategies and offline functionality  
- **App Shell**: Cached shell with dynamic content loading
- **Responsive Design**: Mobile-first responsive layout

### Mock vs Production Implementation
- AI vision endpoints are currently mocked in `AIVision` class
- Nutrition database is mock data in `getMockNutritionData()`
- Camera functionality is fully implemented
- Storage and PWA features are production-ready

## Key File Locations

### Entry Points
- `index.html` - Main app shell and HTML structure
- `src/js/app.js` - Application initialization and routing
- `sw.js` - Service worker for caching and offline support

### Core Modules
- `src/js/storage.js` - IndexedDB data persistence
- `src/js/ai-vision.js` - Food recognition and nutrition analysis
- `src/js/camera.js` - Device camera integration

### Styling
- `src/css/main.css` - Base styles and layout
- `src/css/components.css` - Component-specific styles  
- `src/css/responsive.css` - Mobile-responsive design

### PWA Configuration
- `manifest.json` - PWA manifest with app metadata
- `public/icons/` - App icons in multiple sizes

## Development Patterns

### Page Navigation
Pages are managed through the `showPage()` method in `FoodTrackerApp`, which:
- Hides all `.page` elements
- Shows the target page
- Updates navigation state
- Initializes page-specific functionality

### Data Persistence
All data operations go through the `FoodStorage` class:
- Food entries are stored with automatic date indexing
- User data is stored by key-value pairs
- Nutrition responses are cached to reduce API calls

### Offline Functionality
The app is designed for full offline capability:
- Static assets are cached on first visit
- User data is stored locally in IndexedDB
- Background sync queues data when offline
- Service worker provides offline page fallback

### Component Architecture
JavaScript components are class-based without frameworks:
- Each component manages its own state and DOM interactions
- Communication between components through the main app instance
- Event-driven architecture with custom event listeners

When working with this codebase, focus on maintaining the offline-first approach and the component-based architecture without introducing external frameworks.