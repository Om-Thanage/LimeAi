# Concept Flowchart Generator

An application that generates visual flowcharts to help understand complex concepts using Gemini AI and Mermaid.js.

## Project Structure

```
.
├── frontend/     # React frontend application
└── backend/      # Express backend server (handles Gemini API)
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the backend server:
   ```
   npm run dev
   ```
   The server will run on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```
   The application will run on http://localhost:5173 (or another port if 5173 is in use)

## How to Use

1. Enter a concept you want to understand in the text area
2. Click "Generate Flowchart" to create a visual representation
3. The application will use Gemini AI to analyze the concept and generate a flowchart
4. You can also click "See Example" to view a sample flowchart

## Technologies Used

- **Frontend**: React, Mermaid.js
- **Backend**: Node.js, Express
- **AI**: Google Gemini AI 