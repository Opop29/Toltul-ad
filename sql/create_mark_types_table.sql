-- Create mark_types table
CREATE TABLE IF NOT EXISTS public.mark_types (
  id SERIAL PRIMARY KEY,
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Insert mark type options
INSERT INTO public.mark_types (value, label, category) VALUES
  ('academic-building', 'Academic - Building', 'Academic'),
  ('academic-classroom', 'Academic - Classroom / Lecture Hall', 'Academic'),
  ('academic-laboratory', 'Academic - Laboratory', 'Academic'),
  ('academic-library', 'Academic - Library', 'Academic'),
  ('academic-auditorium', 'Academic - Auditorium / Hall', 'Academic'),
  ('admin-office', 'Administrative - Administration Office', 'Administrative'),
  ('admin-faculty', 'Administrative - Faculty / Department Offices', 'Administrative'),
  ('admin-info', 'Administrative - Information Desk / Help Center', 'Administrative'),
  ('student-cafeteria', 'Student Facilities - Cafeteria / Dining Hall', 'Student Facilities'),
  ('student-center', 'Student Facilities - Student Center / Lounge', 'Student Facilities'),
  ('health-clinic', 'Health & Safety - Clinic / Health Center', 'Health & Safety'),
  ('health-security', 'Health & Safety - Security / Police Post', 'Health & Safety'),
  ('health-safety', 'Health & Safety - Fire Exit / Safety Points', 'Health & Safety'),
  ('events-room', 'Events & Activities - Event / Meeting Room', 'Events & Activities'),
  ('events-auditorium', 'Events & Activities - Auditorium / Theater', 'Events & Activities'),
  ('events-outdoor', 'Events & Activities - Outdoor Event Area', 'Events & Activities'),
  ('transport-parking', 'Transport & Access - Parking Lot', 'Transport & Access'),
  ('services-wifi', 'Services - Wi-Fi Hotspot', 'Services'),
  ('services-shops', 'Services - Shops / Bookstore', 'Services'),
  ('services-restroom', 'Services - Restroom', 'Services')
ON CONFLICT (value) DO NOTHING;

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.mark_types ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read mark types
CREATE POLICY "Users can view mark types" ON public.mark_types FOR SELECT USING (true);