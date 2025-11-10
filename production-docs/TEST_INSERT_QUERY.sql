-- Test query to verify n8n can insert into rfq_requests
-- Run this in your Supabase SQL editor to test

-- This mimics what your n8n workflow is trying to do
INSERT INTO rfq_requests (
  rfq_id,
  nine_com_number,
  project_name,
  project_id,
  material_description,
  specifications,
  quantity,
  critical_requirements,
  wbs_code,
  estimated_value,
  delivery_location,
  delivery_timeline,
  status,
  response_deadline
) VALUES (
  'BQ-TEST-' || TO_CHAR(NOW(), 'YYYYMMDDHHMMSS'),
  '450-012547',
  'Test Project',
  'PRJ-TEST-001',
  'Test Material',
  'Test Specifications',
  100,
  'SS 316L required',
  'WBS-TEST',
  50000,
  'Test Location',
  '30 days',
  'initiated',
  NOW() + INTERVAL '7 days'
);

-- If this works, your n8n workflow should work too!
-- Don't forget to clean up the test record:
-- DELETE FROM rfq_requests WHERE rfq_id LIKE 'BQ-TEST-%';
