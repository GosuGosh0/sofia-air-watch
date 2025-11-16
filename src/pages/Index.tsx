import { Button } from "@/components/ui/button";
import { Cloud, Wind, Droplets, MapPin, ArrowRight, Activity, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">AirWatch Sofia</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button className="gap-2">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="h-4 w-4" />
              <span>Monitoring Sofia, Bulgaria</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Breathe Easy with{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">Real-Time</span>{" "}
              Air Quality Data
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track air pollution levels, get AI-powered forecasts, and make informed decisions about your outdoor activities in Sofia.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 shadow-soft">
                  View Live Data <Activity className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why AirWatch Sofia?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advanced monitoring and forecasting to help you stay healthy
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-soft transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Live AQI data including PM2.5, PM10, CO, NO₂, SO₂, and O₃ levels updated hourly
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-soft transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Forecasts</h3>
              <p className="text-muted-foreground">
                24-hour, 72-hour, and 7-day predictions using advanced machine learning models
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-soft transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Health Recommendations</h3>
              <p className="text-muted-foreground">
                Color-coded alerts and personalized advice based on current air quality levels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Air Quality Levels Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Understanding Air Quality Index</h2>
            <p className="text-muted-foreground">Learn what different AQI levels mean for your health</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { level: "Good", range: "0-50", color: "aqi-good", desc: "Air quality is satisfactory" },
              { level: "Moderate", range: "51-100", color: "aqi-moderate", desc: "Acceptable for most people" },
              { level: "Unhealthy for Sensitive", range: "101-150", color: "aqi-unhealthy-sensitive", desc: "Sensitive groups may experience effects" },
              { level: "Unhealthy", range: "151-200", color: "aqi-unhealthy", desc: "Everyone may begin to experience effects" },
              { level: "Very Unhealthy", range: "201-300", color: "aqi-very-unhealthy", desc: "Health alert: everyone may experience more serious effects" },
              { level: "Hazardous", range: "301+", color: "aqi-hazardous", desc: "Health warning of emergency conditions" },
            ].map((item) => (
              <div key={item.level} className="bg-card rounded-lg p-4 border border-border">
                <div className={`h-2 w-full rounded-full bg-${item.color} mb-3`}></div>
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-semibold">{item.level}</h4>
                  <span className="text-sm text-muted-foreground">{item.range}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Monitor Sofia's Air Quality?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of residents making informed decisions about their health
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">AirWatch Sofia</span>
          </div>
          <p className="text-sm">Real-time air quality monitoring for Sofia, Bulgaria</p>
          <p className="text-xs mt-2">Data provided by AQICN • Forecasts powered by AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
