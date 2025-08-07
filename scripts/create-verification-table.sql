-- Create verification_codes table for storing email verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique constraint to prevent duplicate codes with overlapping validity periods
-- This will be enforced at the application level instead of database level to avoid complexity
-- ALTER TABLE verification_codes ADD CONSTRAINT unique_active_codes EXCLUDE USING gist (code WITH =, tsrange(created_at, expires_at) WITH &&);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
-- Remove the conditional index as NOW() is not IMMUTABLE
-- CREATE INDEX IF NOT EXISTS idx_verification_codes_active ON verification_codes(code) WHERE expires_at > NOW();

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to do everything
CREATE POLICY "Service role can manage verification codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Clean up expired codes automatically (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired codes every hour (optional)
-- This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');
