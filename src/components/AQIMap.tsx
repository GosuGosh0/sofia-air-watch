import { useEffect, useState, useRef } from 'react';
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

export default function AQIMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (loading || !mapContainerRef.current) return;
    
    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([42.6977, 23.3219], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current);
    }

    // Clear existing markers and add new ones
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    stations.forEach((station) => {
      const aqiNum = parseInt(station.aqi);
      const displayValue = isNaN(aqiNum) ? '?' : station.aqi;
      const color = getAQIColor(aqiNum);

      const icon = L.divIcon({
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

      const marker = L.marker([station.lat, station.lon], { icon }).addTo(mapRef.current!);
      marker.bindPopup(`
        <div class="text-sm">
          <div class="font-semibold">${station.station.name}</div>
          <div class="text-lg font-bold" style="color: ${color}">
            AQI: ${station.aqi === '-' ? 'N/A' : station.aqi}
          </div>
        </div>
      `);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, stations]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background min-h-[300px]">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className="rounded-lg"
      style={{ height: '100%', width: '100%', minHeight: '300px' }}
    />
  );
}
