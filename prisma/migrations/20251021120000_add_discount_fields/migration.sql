-- Add discountPercent to courses and recorded_courses tables
ALTER TABLE courses ADD COLUMN discountPercent REAL NOT NULL DEFAULT 0;
ALTER TABLE recorded_courses ADD COLUMN discountPercent REAL NOT NULL DEFAULT 0;
