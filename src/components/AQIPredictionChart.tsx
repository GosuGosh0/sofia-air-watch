import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Reading {
  timestamp: string;
  aqi: number;
}

interface Prediction {
  prediction_time: string;
  predicted_aqi: number;
  confidence: number;
}

export default function AQIPredictionChart() {
  const [data, setData] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      // Fetch last 12 hours of readings
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: readings, error: readError } = await supabase
        .from('aqi_readings')
        .select('timestamp, aqi')
        .gte('timestamp', twelveHoursAgo)
        .order('timestamp', { ascending: true });

      if (readError) throw readError;

      // Fetch predictions
      const { data: predictions, error: predError } = await supabase
        .from('aqi_predictions')
        .select('prediction_time, predicted_aqi, confidence')
        .gte('prediction_time', new Date().toISOString())
        .order('prediction_time', { ascending: true })
        .limit(6);

      if (predError) throw predError;

      // Combine data
      const combined = [
        ...(readings || []).map((r: Reading) => ({
          time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actual: r.aqi,
          type: 'historical'
        })),
        ...(predictions || []).map((p: Prediction) => ({
          time: new Date(p.prediction_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          predicted: p.predicted_aqi,
          confidence: p.confidence,
          type: 'prediction'
        }))
      ];

      setData(combined);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const generatePrediction = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-aqi-prediction');
      
      if (error) throw error;

      toast({
        title: 'Predictions generated',
        description: 'AI has analyzed the data and generated new predictions.',
      });

      await loadData();
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate predictions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to realtime updates
    const channel = supabase
      .channel('aqi-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'aqi_readings' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'aqi_predictions' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historical Data & AI Forecast</CardTitle>
        <Button
          onClick={generatePrediction}
          disabled={generating}
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate AI Prediction'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Actual AQI"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AI Prediction"
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}