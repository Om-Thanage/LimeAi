#  LimeAI – Personalized Learning with AI  

<img src="https://res.cloudinary.com/dzsscqf6t/image/upload/v1742701808/Screenshot_2025-03-23_091835_cpxw1q.png" alt="Landing Page" />

##  Overview  
LimeAI is an AI-powered educational platform designed to provide personalized learning experiences. Traditional "one-size-fits-all" education often leaves students struggling. Our solution adapts to individual learning styles, helping users grasp concepts effectively through AI-driven tools.  

##  Features  
- **Google Authentication** – Secure login via Google Auth.  
- **Personalized Dashboard** – A tailored learning space for every user.  
- **Whiteboard** – Take notes and save them as PNG images.  
- **AI Note Summarization** – Get concise summaries of your notes.  
- **AI Chatbot** – Ask doubts from your notes and get instant answers.  
- **Diagram Visualizer AI** – Uses Mermaid.js to generate concept diagrams.  
- **Podcast AI** – Converts notes into audio for better retention.  

##  Tech Stack  
- **Frontend:** Vite + React + TailwindCSS 
- **Backend:** Axios, Node.js, Express.js
- **Authentication:** Google Auth  
- **AI Features:** Google Generative AI, DeepSeek R1  
- **Diagram Rendering:** Mermaid.js  
- **Whiteboard Rendering:** Konva.js 
- **Text Extraction (OCR):** Mammoth.js 
- **Text to Speech (Podcast):** PlayDialogue 

##  Setup & Installation  
```sh
# Clone the Repository
git clone https://github.com/your-username/LimeAI.git
cd LimeAI

# Install Frontend Dependencies
cd frontend
npm install

# Start Frontend
npm run dev

# Install Backend Dependencies
cd backend
npm install

# Start Backend
npm run dev

```

## ENV Setup
Create a .env in Frontend Folder also create a FireBase Project to get these credentials
```sh
VITE_APP_API_KEY=YOUR_API_KEY_HERE
VITE_APP_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_HERE
VITE_APP_PROJECT_ID=YOUR_PROJECT_ID_HERE
VITE_APP_STORAGE_BUCKET=YOUR_STORAGE_BUCKET_HERE
VITE_APP_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID_HERE
VITE_APP_APP_ID=YOUR_APP_ID_HERE
VITE_APP_MEASUREMENT_ID=YOUR_MEASUREMENT_ID_HERE
VITE_DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
```
Create a .env in Backend Folder
```sh
PLAYDIALOG_USER_ID=YOUR_PLAYDIALOG_USER_ID_HERE
PLAYDIALOG_SECRET_KEY=YOUR_PLAYDIALOG_SECRET_KEY_HERE
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
#Keep the PORT 3001 for first time working
PORT=3001
```

<h3 align="center">Made with ❤️ by team bootWinXP</h3>
