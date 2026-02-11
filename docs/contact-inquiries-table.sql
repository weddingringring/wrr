-- =============================================================================
-- CONTACT INQUIRIES TABLE - Website Contact Form
-- =============================================================================
-- Run this in your Supabase SQL Editor to add contact form functionality

CREATE TABLE contact_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Contact details
  name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  
  -- Inquiry type
  interest_type TEXT NOT NULL CHECK (interest_type IN ('venue', 'couple', 'other')),
  
  -- Source tracking
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'phone', 'email', 'referral', 'other')),
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  
  -- Notes
  internal_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);
CREATE INDEX idx_contact_inquiries_interest_type ON contact_inquiries(interest_type);
CREATE INDEX idx_contact_inquiries_email ON contact_inquiries(email);

-- RLS Policies
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all inquiries
CREATE POLICY "Admins can manage contact inquiries"
ON contact_inquiries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Anyone can insert (from public website form)
CREATE POLICY "Anyone can submit contact inquiry"
ON contact_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_inquiry_updated_at
BEFORE UPDATE ON contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_contact_inquiry_updated_at();
