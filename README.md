#  LimeAI – Personalized Learning with AI
<a href="https://youtu.be/F7Y3gW7VAbU">Video Link</a>

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
git clone https://github.com/om-thanage/LimeAI.git
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

Create a `.env` file in both the **frontend** and **backend** directories.

- For the **frontend**, set up a Firebase project and use the credentials as specified in `.env.example`.
- For the **backend**, follow the `.env.example` file to configure the required environment variables.


<h3 align="center">Made with ❤️ by Team bootWinXp</h3>
