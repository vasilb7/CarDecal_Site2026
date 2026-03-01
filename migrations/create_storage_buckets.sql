-- Create the storage bucket for site media
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public reading
CREATE POLICY "Public Access to site-media" ON storage.objects
FOR SELECT USING (bucket_id = 'site-media');

-- Policies for admin management
CREATE POLICY "Admin Manage site-media" ON storage.objects
FOR ALL USING (
    bucket_id = 'site-media' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
)
WITH CHECK (
    bucket_id = 'site-media' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
);
