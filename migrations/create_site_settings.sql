-- Create site_settings table for global site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default hero media setting
INSERT INTO public.site_settings (key, value)
VALUES ('hero_media_url', '/Homepage/frame_000.jpg')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('hero_media_type', 'image')
ON CONFLICT (key) DO NOTHING;

-- RLS: allow public read, only authenticated service role writes
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin write" ON public.site_settings
    FOR ALL USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
