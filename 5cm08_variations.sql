-- Update card_images for 5cm-08 with all brand variations
-- Run this in your Supabase SQL Editor

UPDATE products 
SET 
  avatar = '/Site_Pics/Decals/Variotion_stickers/5cm-08.jpg',
  cover_image = '/Site_Pics/Decals/Variotion_stickers/5cm-08.jpg',
  card_images = '[
    "/Site_Pics/Decals/Variotion_stickers/5cm-08.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Audi.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Audi2.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Audi3.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Audi4.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Audi5.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Bmw.jpg",
    "/Site_Pics/Decals/Variotion_stickers/citroen.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Golf.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Honda.jpg",
    "/Site_Pics/Decals/Variotion_stickers/mercedes.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Mercedes2.jpg",
    "/Site_Pics/Decals/Variotion_stickers/mercedes3.jpg",
    "/Site_Pics/Decals/Variotion_stickers/mercedes4.jpg",
    "/Site_Pics/Decals/Variotion_stickers/Subaru.jpg"
  ]'::jsonb
WHERE slug = '5cm-08';
