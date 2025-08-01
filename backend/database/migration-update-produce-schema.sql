-- Migration to update produce_listings table to match improved frontend form
-- Run this to align database with new form fields

BEGIN;

-- Add the new harvest_date column
ALTER TABLE produce_listings ADD COLUMN harvest_date DATE;

-- Rename columns to match new form fields
ALTER TABLE produce_listings RENAME COLUMN farmer_name TO title;
ALTER TABLE produce_listings RENAME COLUMN produce_type TO category;

-- Update existing data to have reasonable defaults
-- Set harvest_date to current date for existing listings (you may want to adjust this)
UPDATE produce_listings SET harvest_date = CURRENT_DATE WHERE harvest_date IS NULL;

-- Make harvest_date NOT NULL after setting defaults
ALTER TABLE produce_listings ALTER COLUMN harvest_date SET NOT NULL;

-- Update category values to match our new dropdown options
-- Map old produce_type values to new category values
UPDATE produce_listings SET category = 'vegetables' WHERE category IN ('Tomatoes', 'Cabbage', 'Onions', 'Carrots');
UPDATE produce_listings SET category = 'fruits' WHERE category IN ('Apples', 'Oranges', 'Bananas', 'Mangoes');  
UPDATE produce_listings SET category = 'grains' WHERE category IN ('Maize', 'Rice', 'Wheat', 'Sorghum');
UPDATE produce_listings SET category = 'dairy' WHERE category IN ('Milk', 'Cheese', 'Butter');
UPDATE produce_listings SET category = 'meat' WHERE category IN ('Beef', 'Chicken', 'Pork', 'Goat');
-- Set any remaining categories to 'other'
UPDATE produce_listings SET category = 'other' WHERE category NOT IN ('vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other');

COMMIT;

-- Verify the changes
SELECT * FROM produce_listings LIMIT 5;
