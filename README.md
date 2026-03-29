🧠 Clario: Your Gen Z AI Bestie
Clario is your personal, private AI buddy designed to help you navigate brain fog, anxiety, and loneliness. Unlike a regular therapist or a judgmental friend, Clario talks back in Gen Z slang to keep things real while providing genuine guidance for your mental well-being.

🌟 Features
Gen Z Personality: No stiff "AI-speak." Clario keeps it 100.

Privacy First: Built on Supabase for secure, private conversations.

Voice Integration: Talk to your buddy naturally.

Mind Refreshment: Specifically tailored to combat burnout and depression.
📸 Screenshots:
![Alt text](/public/main.png?raw=true "main")
![Alt text](/public/auth.png?raw=true "auth")
![Alt text](/public/intro.png?raw=true "intro")
![Alt text](/public/voice.png?raw=true "voice")

🛠 Tech Stack
Frontend: Vite, React, Tailwind CSS

Backend: Python (FastAPI/Flask), PostgreSQL

Database & Auth: Supabase

AI Engine: Google Gemini AI

1. frontend setup
cd clario-frontend

# Install dependencies
npm i

# Create a .env file and add your keys:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_key
# VITE_BACKEND_BASE_URL=http://localhost:8000

# Run the dev server
npm run dev

2.backend setup

cd clario-backend

# Configure your environment variables in .env:
# POSTGRES_USER=your_user
# POSTGRES_PASSWORD=your_password
# POSTGRES_DB='clario'
# POSTGRES_PORT=5432
# POSTGRES_HOST='localhost'
# SECRET_KEY=your_secret
# SUPABASE_URL=your_supabase_url
# SUPABASE_SECRET_KEY=your_supabase_key
# GEMINI_API_KEY=your_gemini_key

# Run the application
python run.py


🤝 Contributors
Meet the team behind Clario:

Aroma KC

Suwubham

Aaditya Kumar Sah