-- Coller dans Supabase > SQL Editor > New Query

CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('film', 'serie')),
  title TEXT NOT NULL,
  year INTEGER,
  watched BOOLEAN DEFAULT FALSE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  poster_url TEXT,
  tmdb_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX idx_entries_user_email ON entries (user_email);
CREATE INDEX idx_entries_type ON entries (type);
