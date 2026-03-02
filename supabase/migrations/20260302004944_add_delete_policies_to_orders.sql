CREATE POLICY "Allow admins to delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Allow admins to delete custom orders"
ON public.custom_orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
  )
);
