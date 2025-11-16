import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { Cloud, LogOut, Droplets, Wind, Thermometer, RefreshCw } from "lucide-react";
import AQIMap from "@/components/AQIMap";
import AQIPredictionChart from "@/components/AQIPredictionChart";

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<any>(null);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCurrentData = async () => {
    try {
      const { data, error } = await supabase
        .from('aqi_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setCurrentData(data);
    } catch (error) {
      console.error('Error fetching current data:', error);
    }
  };

  const refreshData = async () => {
    setFetching(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-aqi-data');
      
      if (error) throw error;

      toast({
        title: 'Data updated',
        description: 'Latest air quality data has been fetched.',
      });

      await fetchCurrentData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch latest data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCurrentData();

    const interval = setInterval(refreshData, 10 * 60 * 1000);

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'aqi_readings' },
        () => fetchCurrentData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">AirWatch Sofia</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={refreshData} variant="outline" size="sm" disabled={fetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">Sofia, Bulgaria</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Current Air Quality Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary">
                    {currentData?.aqi || '--'}
                  </div>
                  <div className="text-lg text-muted-foreground mt-2">
                    {currentData?.aqi ? (
                      currentData.aqi <= 50 ? 'Good' :
                      currentData.aqi <= 100 ? 'Moderate' :
                      currentData.aqi <= 150 ? 'Unhealthy for Sensitive' :
                      currentData.aqi <= 200 ? 'Unhealthy' :
                      currentData.aqi <= 300 ? 'Very Unhealthy' : 'Hazardous'
                    ) : 'No data'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentData?.timestamp ? 
                      `Updated: ${new Date(currentData.timestamp).toLocaleString()}` : 
                      'No recent data'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">PM2.5</div>
                    <div className="text-2xl font-semibold">{currentData?.pm25 || '--'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">PM10</div>
                    <div className="text-2xl font-semibold">{currentData?.pm10 || '--'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">NO₂</div>
                    <div className="text-2xl font-semibold">{currentData?.no2 || '--'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">O₃</div>
                    <div className="text-2xl font-semibold">{currentData?.o3 || '--'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wind className="h-4 w-4" />
                Carbon Monoxide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{currentData?.co || '--'}</div>
              <div className="text-sm text-muted-foreground">μg/m³</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="h-4 w-4" />
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currentData?.temperature ? `${currentData.temperature}°C` : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Current</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="h-4 w-4" />
                Humidity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currentData?.humidity ? `${currentData.humidity}%` : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Current</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wind className="h-4 w-4" />
                SO₂ Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{currentData?.so2 || '--'}</div>
              <div className="text-sm text-muted-foreground">μg/m³</div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Sofia Air Quality Monitoring Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <AQIMap />
            </div>
          </CardContent>
        </Card>

        <AQIPredictionChart />
      </main>
    </div>
  );
}