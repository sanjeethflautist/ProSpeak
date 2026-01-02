# U'llai 🎤

**Speak with confidence, powered by AI**

## Why U'llai?

The name is a bridge between two worlds. In Konkani, **Ullai** means "to speak." In English, it sounds like **You'll AI**—a promise that with the help of artificial intelligence, you will find your voice.

We built this for the global professional who has the knowledge but needs the confidence to speak it.

## About

Improve your IT business communication skills with AI-powered daily practice sessions using voice recognition and feedback.

## Features

- 🤖 **AI-Generated Sentences**: Daily IT business communication sentences powered by Google Gemini
- 🎤 **Voice Practice**: Record and compare your pronunciation using Web Speech API
- 📊 **Progress Tracking**: Visual dashboards showing your improvement over time
- 🔐 **User Authentication**: Secure login and user management with Supabase
- 📅 **Daily Practice**: New sentences generated once per day

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **AI**: Google Gemini API
- **Voice**: Web Speech API (Speech Recognition & Text-to-Speech)
- **Backend/DB**: Supabase (Authentication + PostgreSQL)
- **Charts**: Chart.js + Vue-ChartJS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

**Get your API keys:**
- **Supabase**: https://supabase.com (Create a project)
- **Gemini API**: https://makersuite.google.com/app/apikey

### 3. Set Up Supabase Database

Run the SQL schema in your Supabase SQL Editor (see README for full SQL).

### 4. Deploy Supabase Edge Function (Recommended)

**Instead of running a separate Node.js backend**, use Supabase Edge Functions + pg_cron:

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete instructions.

This approach:
- ✅ No separate server needed
- ✅ Serverless and scalable
- ✅ Built-in cron scheduling with pg_cron

### 5. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

```sql
-- Create daily_sentences table
CREATE TABLE daily_sentences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sentence TEXT NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'intermediate',
  category VARCHAR(50),
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice_sessions table
CREATE TABLE practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES daily_sentences(id),
  user_text TEXT,
  accuracy_score DECIMAL(5,2),
  duration_seconds INTEGER,
  attempts INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_sentences INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at);
CREATE INDEX idx_daily_sentences_date ON daily_sentences(date);

-- Enable Row Level Security
ALTER TABLE daily_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for daily_sentences (readable by all authenticated users)
CREATE POLICY "Daily sentences are readable by authenticated users" 
  ON daily_sentences FOR SELECT 
  TO authenticated 
  USING (true);

-- Policies for practice_sessions (users can only access their own)
CREATE POLICY "Users can view their own practice sessions" 
  ON practice_sessions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" 
  ON practice_sessions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" 
  ON practice_sessions FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policies for user_progress
CREATE POLICY "Users can view their own progress" 
  ON user_progress FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON user_progress FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON user_progress FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## How It Works

1. **Sign Up/Login**: Create an account or login with Supabase authentication
2. **Daily Sentence**: Get a new AI-generated IT business sentence each day
3. **Practice**: 
   - Listen to the sentence using Text-to-Speech
   - Record yourself saying it
   - Get instant feedback on accuracy
4. **Track Progress**: View your improvement over time with visual charts

## Browser Requirements

- Modern browser with Web Speech API support (Chrome, Edge recommended)
- Microphone access for speech recognition

## License

MIT
