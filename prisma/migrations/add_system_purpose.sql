-- Add system_purpose column to information systems table
ALTER TABLE intgr1_information_systems 
ADD COLUMN IF NOT EXISTS system_purpose VARCHAR(1000);
