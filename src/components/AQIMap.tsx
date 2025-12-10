import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
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

function getAQIColor(aqi: number): string {
  if (isNaN(aqi)) return '#9ca3af';
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

function createAQIIcon(aqi: string) {
  const aqiNum = parseInt(aqi);
  const displayValue = isNaN(aqiNum) ? '?' : aqi;
  const color = getAQIColor(aqiNum);
  
  return L.divIcon({
    className: 'custom-aqi-marker',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${displayValue}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
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
    
    const interval = setInterval(fetchStations, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background min-h-[300px]">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[42.6977, 23.3219]}
      zoom={11}
      style={{ height: '100%', width: '100%', minHeight: '300px' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station) => (
        <Marker
          key={station.uid}
          position={[station.lat, station.lon]}
          icon={createAQIIcon(station.aqi)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{station.station.name}</div>
              <div className="text-lg font-bold" style={{ color: getAQIColor(parseInt(station.aqi)) }}>
                AQI: {station.aqi === '-' ? 'N/A' : station.aqi}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}