import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';

interface Station {
  uid: number;
  aqi: string;
  lat: number;
  lon: number;
  station: {
    name: string;
  };
}

// Fix for default marker icon
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

function MapUpdater({ stations }: { stations: Station[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (stations.length > 0) {
      const bounds = stations.map(s => [s.lat, s.lon] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stations, map]);
  
  return null;
}

export default function AQIMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-sofia-stations');
      
      if (error) throw error;
      
      if (data?.stations) {
        setStations(data.stations);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchStations, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[42.6977, 23.3219]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater stations={stations} />
      {stations.map((station) => {
        const aqi = parseInt(station.aqi);
        const markerIcon = new Icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${getAQIColor(aqi)}" stroke="white" stroke-width="2"/>
              <text x="16" y="21" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${aqi}</text>
            </svg>
          `)}`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        return (
          <Marker
            key={station.uid}
            position={[station.lat, station.lon]}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{station.station.name}</div>
                <div className="text-lg font-bold" style={{ color: getAQIColor(aqi) }}>
                  AQI: {aqi}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}