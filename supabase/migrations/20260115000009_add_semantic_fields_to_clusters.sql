-- Add semantic fields to clusters table
alter table clusters 
add column if not exists classification text default 'WEAK',
add column if not exists summary text;

-- Add check constraint for classification if needed for data integrity (optional but good practice)
-- alter table clusters add constraint clusters_classification_check check (classification in ('STRONG', 'PROTO', 'WEAK', 'NOISE'));
