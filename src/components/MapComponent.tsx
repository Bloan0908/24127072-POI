
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Coordinates, PointOfInterest } from '../types';

interface MapComponentProps {
  center: Coordinates;
  pois: PointOfInterest[];
  isSidebarOpen: boolean;
}

// Helper component to change map view and handle resizing
const ChangeView: React.FC<{ center: [number, number]; zoom: number; isSidebarOpen: boolean }> = ({ center, zoom, isSidebarOpen }) => {
  const map = useMap();
  useEffect(() => {
    // A small delay to allow the sidebar animation to complete before resizing the map
    const timer = setTimeout(() => {
        map.invalidateSize();
    }, 310); // The transition is 300ms

    // Only fly to new coordinates if they actually change to avoid jarring animations
    const currentCenter = map.getCenter();
    if (currentCenter.lat !== center[0] || currentCenter.lng !== center[1]) {
        map.flyTo(center, zoom, {
          animate: true,
          duration: 1.5
        });
    }

    return () => clearTimeout(timer);
    
  }, [center, zoom, map, isSidebarOpen]);
  
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ center, pois, isSidebarOpen }) => {
  const position: [number, number] = [center.lat, center.lng];
  const zoomLevel = pois.length > 0 ? 13 : 6;

  return (
    <MapContainer center={position} zoom={zoomLevel} scrollWheelZoom={true} className="h-full w-full">
      <ChangeView center={position} zoom={zoomLevel} isSidebarOpen={isSidebarOpen} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pois.map((poi, index) => (
        <Marker key={index} position={[poi.coordinates.lat, poi.coordinates.lng]}>
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold text-lg mb-1">{poi.name}</h3>
              <p>{poi.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
