import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AQICN_API_KEY = Deno.env.get('AQICN_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!AQICN_API_KEY) {
      throw new Error('AQICN_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch AQI data for Sofia, Bulgaria
    const city = 'sofia';
    console.log(`Fetching AQI data for ${city}...`);
    
    const response = await fetch(
      `https://api.waqi.info/feed/${city}/?token=${AQICN_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`AQICN API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`AQICN API returned error: ${data.data}`);
    }

    const aqiData = data.data;
    console.log('Received AQI data:', aqiData);

    // Insert reading into database
    const { error: insertError } = await supabase
      .from('aqi_readings')
      .insert({
        station_id: String(aqiData.idx),
        station_name: aqiData.city?.name || 'Sofia',
        latitude: aqiData.city?.geo?.[0] || 42.6977,
        longitude: aqiData.city?.geo?.[1] || 23.3219,
        aqi: aqiData.aqi,
        pm25: aqiData.iaqi?.pm25?.v,
        pm10: aqiData.iaqi?.pm10?.v,
        no2: aqiData.iaqi?.no2?.v,
        o3: aqiData.iaqi?.o3?.v,
        co: aqiData.iaqi?.co?.v,
        so2: aqiData.iaqi?.so2?.v,
        temperature: aqiData.iaqi?.t?.v,
        humidity: aqiData.iaqi?.h?.v,
        timestamp: new Date(aqiData.time?.iso || new Date()),
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully stored AQI reading');

    return new Response(
      JSON.stringify({ success: true, data: aqiData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-aqi-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});