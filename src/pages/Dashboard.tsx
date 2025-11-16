import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Wind, Droplets, Thermometer, LogOut, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
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

  // Mock data - will be replaced with real API data
  const mockAQI = {
    value: 78,
    level: "Moderate",
    color: "aqi-moderate",
    pm25: 25.4,
    pm10: 45.2,
    co: 0.4,
    no2: 15.3,
    so2: 8.1,
    o3: 42.7,
    temp: 18,
    humidity: 65,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">AirWatch Sofia</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Location Header */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Sofia, Bulgaria</h1>
        </div>

        {/* Current AQI Card */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <CardTitle>Current Air Quality</CardTitle>
            <CardDescription>Live data updated hourly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-6xl font-bold text-${mockAQI.color}`}>{mockAQI.value}</div>
                <div className={`text-lg font-medium text-${mockAQI.color}`}>{mockAQI.level}</div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">PM2.5</div>
                  <div className="text-xl font-semibold">{mockAQI.pm25}</div>
                  <div className="text-xs text-muted-foreground">µg/m³</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">PM10</div>
                  <div className="text-xl font-semibold">{mockAQI.pm10}</div>
                  <div className="text-xs text-muted-foreground">µg/m³</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">NO₂</div>
                  <div className="text-xl font-semibold">{mockAQI.no2}</div>
                  <div className="text-xs text-muted-foreground">µg/m³</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">O₃</div>
                  <div className="text-xl font-semibold">{mockAQI.o3}</div>
                  <div className="text-xs text-muted-foreground">µg/m³</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Carbon Monoxide</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAQI.co}</div>
              <p className="text-xs text-muted-foreground">mg/m³</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAQI.temp}°C</div>
              <p className="text-xs text-muted-foreground">Current temperature</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAQI.humidity}%</div>
              <p className="text-xs text-muted-foreground">Relative humidity</p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for charts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Historical Data & Predictions</CardTitle>
            <CardDescription>Coming soon: 24h, 72h, and 7-day AI forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Chart visualization will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
