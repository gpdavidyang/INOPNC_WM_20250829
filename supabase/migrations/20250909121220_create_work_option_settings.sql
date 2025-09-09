-- Create work_option_settings table for dynamic management of component types and process types
CREATE TABLE IF NOT EXISTS public.work_option_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type VARCHAR(50) NOT NULL CHECK (option_type IN ('component_type', 'process_type')),
  option_value VARCHAR(100) NOT NULL,
  option_label VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_option_type_value UNIQUE(option_type, option_value)
);

-- Create index for better query performance
CREATE INDEX idx_work_option_settings_type ON public.work_option_settings(option_type);
CREATE INDEX idx_work_option_settings_active ON public.work_option_settings(is_active);
CREATE INDEX idx_work_option_settings_order ON public.work_option_settings(display_order);

-- Enable RLS
ALTER TABLE public.work_option_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read active options
CREATE POLICY "Allow authenticated users to read active work options"
  ON public.work_option_settings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow system admins to read all options (including inactive)
CREATE POLICY "Allow system admins to read all work options"
  ON public.work_option_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Allow system admins to insert work options
CREATE POLICY "Allow system admins to insert work options"
  ON public.work_option_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Allow system admins to update work options
CREATE POLICY "Allow system admins to update work options"
  ON public.work_option_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Allow system admins to delete work options
CREATE POLICY "Allow system admins to delete work options"
  ON public.work_option_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Insert default component types
INSERT INTO public.work_option_settings (option_type, option_value, option_label, display_order, is_active)
VALUES 
  ('component_type', 'slab', '슬라브', 1, true),
  ('component_type', 'girder', '거더', 2, true),
  ('component_type', 'column', '기둥', 3, true),
  ('component_type', 'other', '기타', 999, true)
ON CONFLICT (option_type, option_value) DO NOTHING;

-- Insert default process types (fixing 균일 -> 균열)
INSERT INTO public.work_option_settings (option_type, option_value, option_label, display_order, is_active)
VALUES 
  ('process_type', 'crack', '균열', 1, true),
  ('process_type', 'surface', '면', 2, true),
  ('process_type', 'finishing', '마감', 3, true),
  ('process_type', 'other', '기타', 999, true)
ON CONFLICT (option_type, option_value) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_option_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_work_option_settings_updated_at
  BEFORE UPDATE ON public.work_option_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_work_option_settings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.work_option_settings IS 'Stores configurable options for work report component types and process types';
COMMENT ON COLUMN public.work_option_settings.option_type IS 'Type of option: component_type for 부재명, process_type for 작업공정';
COMMENT ON COLUMN public.work_option_settings.option_value IS 'Internal value used in the system';
COMMENT ON COLUMN public.work_option_settings.option_label IS 'Display label shown to users';
COMMENT ON COLUMN public.work_option_settings.display_order IS 'Order in which options are displayed (lower numbers first)';
COMMENT ON COLUMN public.work_option_settings.is_active IS 'Whether this option is currently active and available for selection';