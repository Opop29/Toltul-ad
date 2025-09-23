-- SQL ALTER statement to make group_index column nullable in ar_pois table
ALTER TABLE ar_pois ALTER COLUMN group_index DROP NOT NULL;