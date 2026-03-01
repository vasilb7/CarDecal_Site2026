ALTER TABLE custom_orders
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON custom_orders(user_id);
