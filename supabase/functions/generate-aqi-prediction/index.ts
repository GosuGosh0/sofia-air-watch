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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch recent AQI readings for analysis
    const { data: recentReadings, error: fetchError } = await supabase
      .from('aqi_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(24); // Last 24 readings

    if (fetchError) {
      throw fetchError;
    }

    if (!recentReadings || recentReadings.length === 0) {
      throw new Error('No historical data available for prediction');
    }

    console.log(`Analyzing ${recentReadings.length} recent readings`);

    // Prepare data for AI analysis
    const historicalData = recentReadings.map(r => ({
      timestamp: r.timestamp,
      aqi: r.aqi,
      pm25: r.pm25,
      pm10: r.pm10,
      temperature: r.temperature,
      humidity: r.humidity,
    }));

    // Call Lovable AI for prediction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an air quality prediction expert. Analyze historical AQI data and predict future values based on trends, patterns, and environmental factors. Provide predictions in JSON format only.'
          },
          {
            role: 'user',
            content: `Analyze this AQI data and predict the AQI for the next 6 hours (hourly predictions). Return ONLY a JSON object with this structure:
{
  "predictions": [
    {
      "hour": 1,
      "predicted_aqi": number,
      "confidence": number (0-100),
      "factors": ["list", "of", "contributing", "factors"]
    }
  ]
}

Historical data (most recent first):
${JSON.stringify(historicalData, null, 2)}`
          }
        ],
        tools: [
          {
            type: "function",
            name: "generate_aqi_predictions",
            description: "Generate hourly AQI predictions based on historical data",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hour: { type: "number" },
                      predicted_aqi: { type: "number" },
                      confidence: { type: "number" },
                      factors: {
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["hour", "predicted_aqi", "confidence", "factors"]
                  }
                }
              },
              required: ["predictions"]
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_aqi_predictions" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiResult));

    // Extract predictions from tool call
    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const predictions = JSON.parse(toolCall.function.arguments).predictions;
    const latestReading = recentReadings[0];

    // Store predictions in database
    const predictionRecords = predictions.map((pred: any) => ({
      station_id: latestReading.station_id,
      predicted_aqi: pred.predicted_aqi,
      prediction_time: new Date(Date.now() + pred.hour * 60 * 60 * 1000).toISOString(),
      confidence: pred.confidence,
      factors: pred.factors,
    }));

    const { error: insertError } = await supabase
      .from('aqi_predictions')
      .insert(predictionRecords);

    if (insertError) {
      console.error('Error storing predictions:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${predictions.length} predictions`);

    return new Response(
      JSON.stringify({ success: true, predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-aqi-prediction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});