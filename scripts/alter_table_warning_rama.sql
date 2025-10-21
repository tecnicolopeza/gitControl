ALTER TABLE branches 
ADD COLUMN has_warning BOOLEAN DEFAULT FALSE AFTER fecha_mergeo,
ADD COLUMN warning_comment TEXT NULL AFTER has_warning;