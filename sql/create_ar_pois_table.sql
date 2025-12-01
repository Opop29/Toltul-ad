-- SQL to create the ar_pois table for storing map markers
CREATE TABLE IF NOT EXISTS public.ar_pois (
  id SERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  label TEXT NOT NULL,
  mark_type TEXT NOT NULL,
  color TEXT DEFAULT '#007cf0',
  height INTEGER DEFAULT 1,
  dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.ar_pois ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to insert/select/delete/update their own markers
-- Adjust based on your authentication setup
CREATE POLICY "Users can view all markers" ON public.ar_pois FOR SELECT USING (true);
CREATE POLICY "Users can insert markers" ON public.ar_pois FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update markers" ON public.ar_pois FOR UPDATE USING (true);
CREATE POLICY "Users can delete markers" ON public.ar_pois FOR DELETE USING (true);