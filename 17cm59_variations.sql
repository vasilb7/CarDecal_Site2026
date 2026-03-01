-- Update card_images for 17cm-59 with variations
-- Run this in your Supabase SQL Editor

UPDATE products 
SET 
  card_images = '[
    "https://res.cloudinary.com/die68h4oh/image/upload/v1772380604/Site_Pics/Decals/17cm/17cm-59.jpg",
    "https://res.cloudinary.com/die68h4oh/image/upload/v1772380602/Site_Pics/Decals/17cm/17cm-59_2.jpg",
    "https://res.cloudinary.com/die68h4oh/image/upload/v1772380605/Site_Pics/Decals/17cm/17cm-59_3.jpg"
  ]'::jsonb
WHERE slug = '17cm-59';
