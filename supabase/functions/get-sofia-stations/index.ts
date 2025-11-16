import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!AQICN_API_KEY) {
      throw new Error('AQICN_API_KEY is not configured');
    }

    // Sofia coordinates
    const lat = 42.6977;
    const lng = 23.3219;

    console.log(`Fetching stations near Sofia (${lat}, ${lng})...`);
    
    const response = await fetch(
      `https://api.waqi.info/map/bounds/?latlng=${lat-0.5},${lng-0.5},${lat+0.5},${lng+0.5}&token=${AQICN_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`AQICN API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`AQICN API returned error: ${data.data}`);
    }

    console.log(`Found ${data.data.length} stations`);

    return new Response(
      JSON.stringify({ success: true, stations: data.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-sofia-stations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});