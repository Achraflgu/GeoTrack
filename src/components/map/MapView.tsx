import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Device } from '@/lib/mock-data';
import { getStatusColor } from '@/lib/utils-geo';

interface MapViewProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onDeviceSelect?: (device: Device) => void;
  className?: string;
}

const MapView = ({ devices, selectedDevice, onDeviceSelect, className = '' }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on Algeria
    map.current = L.map(mapContainer.current, {
      center: [28.0339, 1.6596],
      zoom: 5,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when devices change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    devices.forEach(device => {
      const statusColors: Record<string, string> = {
        online: '#22c55e',
        moving: '#10b981',
        idle: '#f59e0b',
        offline: '#6b7280',
        alert: '#ef4444',
      };

      const color = statusColors[device.status] || '#6b7280';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 16px;
              height: 16px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ${device.status === 'moving' ? 'animation: pulse 2s infinite;' : ''}
            "></div>
            ${device.status === 'moving' ? `
              <div style="
                position: absolute;
                width: 24px;
                height: 24px;
                background: ${color};
                border-radius: 50%;
                opacity: 0.3;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([device.location.lat, device.location.lng], { icon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="min-width: 200px; font-family: Inter, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${device.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${device.licensePlate}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${device.enterpriseName}</p>
            <p style="margin: 0; font-size: 12px; color: #888;">${device.location.address}</p>
            ${device.status === 'moving' ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: ${color}; font-weight: 500;">${device.speed} km/h</p>` : ''}
          </div>
        `);

      marker.on('click', () => {
        onDeviceSelect?.(device);
      });

      markersRef.current.set(device.id, marker);
    });

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [devices, onDeviceSelect]);

  // Center on selected device
  useEffect(() => {
    if (!map.current || !selectedDevice) return;

    map.current.flyTo(
      [selectedDevice.location.lat, selectedDevice.location.lng],
      14,
      { duration: 1 }
    );

    // Open popup for selected device
    const marker = markersRef.current.get(selectedDevice.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedDevice]);

  return (
    <div className={`map-container ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-inset ring-border/20" />
    </div>
  );
};

export default MapView;
