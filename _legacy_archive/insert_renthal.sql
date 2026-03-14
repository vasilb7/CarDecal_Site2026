-- INSERT missing product: Renthal 5x33cm-48
-- Run in Supabase SQL Editor

INSERT INTO products (
  slug, name, name_bg, avatar, cover_image,
  categories, location, dimensions, size,
  finish, material, description, stock_status,
  is_best_seller, is_verified,
  price, wholesale_price, price_eur, wholesale_price_eur,
  card_images, highlights, posts
)
VALUES (
  '5x33cm-48',
  'Renthal — Мото/Вело',
  'Renthal — Мото/Вело',
  'https://res.cloudinary.com/die68h4oh/image/upload/v1772381258/Site_Pics/Decals/5cm/5x33cm-48.jpg',
  'https://res.cloudinary.com/die68h4oh/image/upload/v1772381258/Site_Pics/Decals/5cm/5x33cm-48.jpg',
  '["5cm","Стикери"]'::jsonb,
  'CarDecal HQ',
  '5cm x 33cm',
  'Small',
  'Gloss / Matte',
  'High-Performance Vinyl',
  'Висококачествен винилов стикер от CarDecal.',
  'In Stock',
  false,
  true,
  null,
  null,
  0.77,
  0.77,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  name_bg          = EXCLUDED.name_bg,
  price_eur        = EXCLUDED.price_eur,
  wholesale_price_eur = EXCLUDED.wholesale_price_eur;
