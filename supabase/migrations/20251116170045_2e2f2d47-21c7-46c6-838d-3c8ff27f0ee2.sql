-- Create table for AQI readings
CREATE TABLE public.aqi_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  aqi INTEGER NOT NULL,
  pm25 NUMERIC,
  pm10 NUMERIC,
  no2 NUMERIC,
  o3 NUMERIC,
  co NUMERIC,
  so2 NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_aqi_readings_station_timestamp ON public.aqi_readings(station_id, timestamp DESC);
CREATE INDEX idx_aqi_readings_timestamp ON public.aqi_readings(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.aqi_readings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read AQI data (public data)
CREATE POLICY "Anyone can view AQI readings" 
ON public.aqi_readings 
FOR SELECT 
USING (true);

-- Create table for AI predictions
CREATE TABLE public.aqi_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id TEXT NOT NULL,
  predicted_aqi INTEGER NOT NULL,
  prediction_time TIMESTAMP WITH TIME ZONE NOT NULL,
  confidence NUMERIC,
  factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for predictions
CREATE INDEX idx_aqi_predictions_station ON public.aqi_predictions(station_id, prediction_time DESC);

-- Enable RLS for predictions
ALTER TABLE public.aqi_predictions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read predictions
CREATE POLICY "Anyone can view AQI predictions" 
ON public.aqi_predictions 
FOR SELECT 
USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.aqi_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aqi_predictions;