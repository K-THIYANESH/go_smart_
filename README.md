# GoSmart Mobility Platform

GoSmart is a mobile-first intelligent travel assistant designed to help students and young travelers navigate unfamiliar cities using the most cost-efficient and safe multi-modal transportation routes. 

## Features
- **Multi-Modal Routing:** Combines Metro, Bus, Auto, and Walking to find the cheapest, fastest, or most comfortable routes.
- **Safety Mode:** Live location tracking, deviation detection, and SOS functionality.
- **Utility Finder:** Discover nearby amenities such as restrooms, food, and pharmacies along the route.

## How to Start the Project

### Prerequisites
- Python 3.8+
- Node.js 18+

### 1. Start the Backend (API Server)
The backend is built with Python (FastAPI/Uvicorn) and uses NetworkX for multi-modal route optimization.

1. Open a terminal and navigate to the project root directory: `c:\Users\Thiyanesh\OneDrive\Documents\go_smart`
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server (make sure you are in the directory containing `api_server.py`):
   ```bash
   python api_server.py
   ```
The backend API should be available at `http://localhost:8000`.

### 2. Start the Frontend (React App)
The frontend is a Vite + React application.

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd c:\Users\Thiyanesh\OneDrive\Documents\go_smart\frontend
   ```
2. Install the necessary NPM dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` URL (e.g., `http://localhost:5173` or `5175`) in your browser.

## Troubleshooting
- **UI looks like plain HTML:** Ensure `npm run dev` is running. If issues persist, try deleting `node_modules` and running `npm install` again.
- **Backend errors:** Ensure the virtual environment is activated and `api_server.py` is running on port 8000.
- **Map not loading:** Ensure you have an active internet connection for Leaflet tiles.

## Alignment with Ultimate Documentation
The current implementation accurately captures the core vision outlined in the `gosmart_ultimate_documentation.docx`:
- **Routing Engine:** Graph-based Multi-modal modified Dijkstra routing implementation handling Bus, Train(Metro), Auto, and walking.
- **Safety Features:** Deviation tracking simulation component with utility mapping and SOS.
- **User Interface:** Clean Map-based UI with Leaflet integration.
