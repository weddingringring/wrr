-- WeddingRingRing Database Schema - FINAL VERSION
-- Incorporates all decisions from comprehensive review
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES TABLE - All Users (Admin, Venue Staff, Customers)
-- =============================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  
  -- User type: 
  -- 'admin' = WRR staff (you and your team) - full platform access
  -- 'venue' = Wedding venues - create events, view their events only
  -- 'customer' = End users - view their event and messages only
  role TEXT NOT NULL CHECK (role IN ('admin', 'venue', 'customer')),
  
  -- Personal info
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- Contact preferences
  communication_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
  timezone TEXT DEFAULT 'Europe/London',
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  password_reset_required BOOLEAN DEFAULT false, -- Force password change on next login
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT, -- Admin notes about this user
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- VENUES TABLE - Wedding Venue Businesses
-- =============================================================================

CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) NOT NULL, -- Primary contact (role='venue')
  
  -- Business info
  name TEXT NOT NULL,
  business_type TEXT, -- 'wedding_venue', 'hotel', 'barn', 'manor', etc.
  logo_url TEXT, -- Venue logo (Supabase storage: venue-logos/{venue_id}.png)
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'UK',
  country_code TEXT DEFAULT 'GB' CHECK (country_code IN ('GB', 'US', 'CA', 'AU', 'NZ', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI')), -- ISO 3166-1 alpha-2 codes for Twilio
  
  -- Contact details
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  secondary_contact_name TEXT,
  secondary_contact_email TEXT,
  secondary_contact_phone TEXT,
  
  -- Online presence
  website TEXT,
  instagram_handle TEXT,
  facebook_page TEXT,
  
  -- Business details
  company_number TEXT, -- UK Companies House number
  vat_number TEXT,
  
  -- Subscription (all handled offline, just for reference)
  subscription_type TEXT CHECK (subscription_type IN ('rental', 'owned', 'trial')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'suspended')),
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Account status
  is_active BOOLEAN DEFAULT true, -- Deactivate instead of delete
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivation_reason TEXT,
  
  -- Settings
  max_concurrent_events INTEGER DEFAULT 10,
  
  -- Metadata
  notes TEXT, -- Internal admin notes
  onboarding_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PHONES TABLE - Physical Hardware Inventory (Admin manages)
-- =============================================================================

CREATE TABLE phones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id), -- Which venue has this phone
  
  -- Device info
  serial_number TEXT,
  imei TEXT, -- Device IMEI
  sim_number TEXT, -- Regular phone number of the SIM card
  sim_provider TEXT, -- EE, Vodafone, O2, Three, etc.
  
  -- Hardware details
  color TEXT,
  model TEXT DEFAULT 'Opis 60s Mobile',
  status TEXT CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  purchase_date DATE,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- EVENTS TABLE - Individual Event Bookings
-- =============================================================================

CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) NOT NULL,
  phone_id UUID REFERENCES phones(id), -- Which physical phone (optional - boring inventory)
  customer_id UUID REFERENCES profiles(id), -- Links to customer's account (single account per event)
  
  -- Event details
  event_type TEXT DEFAULT 'wedding' CHECK (event_type IN ('wedding', 'christening', 'birthday', 'anniversary', 'corporate', 'other')),
  event_type_other TEXT, -- If event_type = 'other', store custom type here
  event_date DATE NOT NULL,
  venue_location TEXT, -- Specific location at venue (e.g., "Garden Marquee")
  
  -- Customer/Client info (collected at booking)
  -- CHANGED: Separate first/last names for better data management
  partner_1_first_name TEXT NOT NULL,
  partner_1_last_name TEXT NOT NULL,
  partner_2_first_name TEXT,
  partner_2_last_name TEXT,
  customer_email TEXT NOT NULL, -- Single email for account creation
  customer_phone TEXT,
  customer_user_id UUID REFERENCES profiles(id), -- Link to created customer account
  
  -- Additional customer details for different event types
  age INTEGER, -- For birthdays
  years_together INTEGER, -- For anniversaries
  company_name TEXT, -- For corporate events
  
  -- Legacy fields (for traditional weddings)
  bride_name TEXT,
  groom_name TEXT,
  
  -- Twilio configuration (UNIQUE NUMBER PER EVENT)
  twilio_phone_number TEXT UNIQUE, -- e.g., +441234567890
  twilio_phone_sid TEXT, -- Twilio's identifier
  twilio_number_purchased_at TIMESTAMP WITH TIME ZONE,
  twilio_number_released_at TIMESTAMP WITH TIME ZONE,
  twilio_number_release_scheduled_for TIMESTAMP WITH TIME ZONE, -- Auto-calculated: event_date + 37 days
  
  -- Greeting configuration
  greeting_text TEXT, -- Auto-generated text greeting (fallback)
  greeting_audio_url TEXT, -- Customer-uploaded MP3 greeting (optional, overrides text)
  greeting_uploaded_at TIMESTAMP WITH TIME ZONE,
  max_message_duration INTEGER DEFAULT 240, -- seconds (4 min)
  
  -- Guest expectations
  expected_guest_count INTEGER,
  
  -- Status workflow
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT, -- Internal admin/venue notes
  special_requirements TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MESSAGES TABLE - Voice Recordings
-- =============================================================================

CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) NOT NULL,
  
  -- Twilio data
  twilio_call_sid TEXT UNIQUE NOT NULL,
  twilio_recording_sid TEXT UNIQUE,
  twilio_recording_url TEXT, -- Backup URL from Twilio (expires after 90 days)
  
  -- Message details
  caller_number TEXT, -- Phone number that called in
  caller_name TEXT, -- Customer can add name later (e.g., "Uncle Bob")
  duration INTEGER, -- seconds
  recording_url TEXT NOT NULL, -- PRIMARY: Supabase storage URL (permanent)
  
  -- Customer organization features
  notes TEXT, -- Customer's notes about the message
  guest_photo_url TEXT, -- Photo of the guest who left the message (Supabase storage)
  is_favorite BOOLEAN DEFAULT FALSE,
  is_heard BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete (moved to trash)
  deleted_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[], -- Array: ['family', 'friends', 'funny', 'emotional', 'heartfelt', 'work', 'surprise', 'drunk', 'kids']
  
  -- Timestamps (stored in UTC, displayed in UK timezone)
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TWILIO NUMBER HISTORY - Track Numbers to Avoid Repurchasing
-- =============================================================================

CREATE TABLE twilio_number_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  phone_sid TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES events(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS EVENTS - Usage Tracking
-- =============================================================================

CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'message_recorded', 'message_played', 'message_downloaded', etc.
  event_id UUID REFERENCES events(id),
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_venues_owner ON venues(owner_id);
CREATE INDEX idx_venues_active ON venues(is_active);

CREATE INDEX idx_phones_venue ON phones(venue_id);
CREATE INDEX idx_phones_status ON phones(status);

CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_twilio_number ON events(twilio_phone_number);
CREATE INDEX idx_events_release_scheduled ON events(twilio_number_release_scheduled_for);

CREATE INDEX idx_messages_event ON messages(event_id);
CREATE INDEX idx_messages_recorded_at ON messages(recorded_at);
CREATE INDEX idx_messages_deleted ON messages(is_deleted);
CREATE INDEX idx_messages_favorite ON messages(is_favorite);

CREATE INDEX idx_twilio_history_number ON twilio_number_history(phone_number);
CREATE INDEX idx_twilio_history_released ON twilio_number_history(released_at);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Profiles: Users can view own profile, admins can view all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Venues: Venue staff see their venue, admins see all
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue staff can view their venue"
  ON venues FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'venue' AND id IN (
        SELECT owner_id FROM venues WHERE id = venues.id
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Venue staff can update their venue"
  ON venues FOR UPDATE
  USING (
    auth.uid() = owner_id 
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'venue' AND id IN (
        SELECT owner_id FROM venues WHERE id = venues.id
      )
    )
  );

CREATE POLICY "Admins can manage all venues"
  ON venues FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Events: Customers see their event, venues see their events, admins see all
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their event"
  ON events FOR SELECT
  USING (auth.uid() = customer_user_id);

CREATE POLICY "Customers can update their greeting"
  ON events FOR UPDATE
  USING (auth.uid() = customer_user_id)
  WITH CHECK (auth.uid() = customer_user_id);

CREATE POLICY "Venues can view their events"
  ON events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM venues WHERE id = events.venue_id
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'venue' AND id IN (
        SELECT owner_id FROM venues WHERE id = events.venue_id
      )
    )
  );

CREATE POLICY "Venues can manage their events"
  ON events FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM venues WHERE id = events.venue_id
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'venue' AND id IN (
        SELECT owner_id FROM venues WHERE id = events.venue_id
      )
    )
  );

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Messages: Customers can view/manage their messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their messages"
  ON messages FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE customer_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update their messages"
  ON messages FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE customer_user_id = auth.uid()
    )
  );

CREATE POLICY "Venues can view event messages"
  ON messages FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN venues v ON v.id = e.venue_id
      WHERE v.owner_id = auth.uid()
        OR auth.uid() IN (
          SELECT id FROM profiles WHERE role = 'venue' AND id = v.owner_id
        )
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Phones: Admin only
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all phones"
  ON phones FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Venues can view their phones"
  ON phones FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM venues WHERE id = phones.venue_id
    )
  );

-- Twilio Number History: Admin only
ALTER TABLE twilio_number_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view number history"
  ON twilio_number_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Analytics Events: Admin only (system logging)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to check if Twilio number was previously owned
CREATE OR REPLACE FUNCTION was_number_previously_owned(number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM twilio_number_history WHERE phone_number = number
  );
END;
$$ LANGUAGE plpgsql;

-- Function to generate event display name
CREATE OR REPLACE FUNCTION get_event_display_name(event_row events)
RETURNS TEXT AS $$
DECLARE
  display_name TEXT;
BEGIN
  CASE event_row.event_type
    WHEN 'wedding' THEN
      IF event_row.partner_2_name IS NOT NULL THEN
        display_name := event_row.partner_1_name || ' & ' || event_row.partner_2_name || '''s Wedding';
      ELSE
        display_name := event_row.partner_1_name || '''s Wedding';
      END IF;
    WHEN 'birthday' THEN
      IF event_row.age IS NOT NULL THEN
        display_name := event_row.partner_1_name || '''s ' || event_row.age || 'th Birthday';
      ELSE
        display_name := event_row.partner_1_name || '''s Birthday Party';
      END IF;
    WHEN 'christening' THEN
      display_name := event_row.partner_1_name || '''s Christening';
    WHEN 'anniversary' THEN
      IF event_row.years_together IS NOT NULL THEN
        display_name := event_row.partner_1_name || ' & ' || event_row.partner_2_name || '''s ' || event_row.years_together || 'th Anniversary';
      ELSE
        display_name := event_row.partner_1_name || ' & ' || event_row.partner_2_name || '''s Anniversary';
      END IF;
    WHEN 'corporate' THEN
      IF event_row.company_name IS NOT NULL THEN
        display_name := event_row.company_name || ' Event';
      ELSE
        display_name := 'Corporate Event';
      END IF;
    WHEN 'other' THEN
      IF event_row.event_type_other IS NOT NULL THEN
        display_name := event_row.event_type_other;
      ELSE
        display_name := event_row.partner_1_name || '''s Event';
      END IF;
  END CASE;
  
  RETURN display_name;
END;
$$ LANGUAGE plpgsql;

-- Function to generate auto greeting text
CREATE OR REPLACE FUNCTION generate_greeting_text(event_row events)
RETURNS TEXT AS $$
DECLARE
  greeting TEXT;
BEGIN
  CASE event_row.event_type
    WHEN 'wedding' THEN
      IF event_row.partner_2_name IS NOT NULL THEN
        greeting := 'Welcome to ' || event_row.partner_1_name || ' and ' || event_row.partner_2_name || '''s wedding. Please leave a message after the beep!';
      ELSE
        greeting := 'Welcome to ' || event_row.partner_1_name || '''s wedding. Please leave a message after the beep!';
      END IF;
    WHEN 'birthday' THEN
      greeting := 'Welcome to ' || event_row.partner_1_name || '''s birthday party. Please leave a message after the beep!';
    WHEN 'christening' THEN
      greeting := 'Welcome to ' || event_row.partner_1_name || '''s christening. Please leave a message after the beep!';
    WHEN 'anniversary' THEN
      greeting := 'Welcome to ' || event_row.partner_1_name || ' and ' || event_row.partner_2_name || '''s anniversary celebration. Please leave a message after the beep!';
    WHEN 'corporate' THEN
      greeting := 'Welcome to our event. Please leave a message after the beep!';
    WHEN 'other' THEN
      IF event_row.event_type_other IS NOT NULL THEN
        greeting := 'Welcome to ' || event_row.event_type_other || '. Please leave a message after the beep!';
      ELSE
        greeting := 'Welcome. Please leave a message after the beep!';
      END IF;
  END CASE;
  
  RETURN greeting;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set greeting text and release date on event creation
CREATE OR REPLACE FUNCTION set_event_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate greeting text if not provided
  IF NEW.greeting_text IS NULL THEN
    NEW.greeting_text := generate_greeting_text(NEW);
  END IF;
  
  -- Calculate Twilio number release date (event_date + 37 days)
  IF NEW.event_date IS NOT NULL THEN
    NEW.twilio_number_release_scheduled_for := NEW.event_date + INTERVAL '37 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update release date when event date changes
CREATE OR REPLACE FUNCTION update_release_date_on_event_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If event date changed, recalculate release date
  IF NEW.event_date IS DISTINCT FROM OLD.event_date THEN
    NEW.twilio_number_release_scheduled_for := NEW.event_date + INTERVAL '37 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle event cancellation
CREATE OR REPLACE FUNCTION handle_event_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- If event is being cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at := NOW();
    
    -- If Twilio number exists and hasn't been released, mark for immediate release
    IF NEW.twilio_phone_number IS NOT NULL AND NEW.twilio_number_released_at IS NULL THEN
      NEW.twilio_number_release_scheduled_for := NOW();
    END IF;
    
    -- Deactivate customer account
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE profiles 
      SET is_active = false 
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phones_updated_at BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Event-specific triggers
CREATE TRIGGER set_event_defaults_trigger BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION set_event_defaults();

CREATE TRIGGER update_event_release_date BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_release_date_on_event_change();

CREATE TRIGGER handle_event_cancellation_trigger BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_event_cancellation();

-- =============================================================================
-- SEED DATA - REMOVED
-- =============================================================================
-- NOTE: Create your admin user through Supabase Auth Dashboard instead
-- Go to Authentication → Users → Add User
-- Then update that user's profile to set role='admin'

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- NOTES
-- =============================================================================

-- Key Design Decisions:
-- 1. One customer account per event (single email)
-- 2. Twilio numbers purchased immediately on event creation
-- 3. Numbers released 37 days after event (1 month + 1 week buffer)
-- 4. Venues are deactivated, not deleted (preserves historical data)
-- 5. Customer accounts deactivated when event cancelled before event date
-- 6. Messages soft-deleted (moved to trash, can be restored)
-- 7. All timestamps stored in UTC, displayed in UK timezone
-- 8. Greeting text auto-generated, can be overridden with MP3 upload

-- =============================================================================
-- ERROR LOGGING
-- =============================================================================

CREATE TABLE error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL, -- 'cron:purchase-numbers', 'api:recording', 'webhook:voice', etc.
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB, -- Additional context (event_id, user_id, country_code, etc.)
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_source ON error_logs(source);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- RLS for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all errors
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update errors (mark as resolved)
CREATE POLICY "Admins can update error logs"
  ON error_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- CONTACT INQUIRIES TABLE
-- =============================================================================

CREATE TABLE contact_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('venue', 'customer', 'general')),
  source TEXT DEFAULT 'website', -- 'website', 'phone', 'email', etc.
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_inquiries_email ON contact_inquiries(email);
CREATE INDEX idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);
CREATE INDEX idx_contact_inquiries_interest_type ON contact_inquiries(interest_type);

-- RLS for contact_inquiries
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for contact form)
-- No SELECT policy needed - only admins should view

-- Admin can view all inquiries
CREATE POLICY "Admins can view all contact inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update inquiries
CREATE POLICY "Admins can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
