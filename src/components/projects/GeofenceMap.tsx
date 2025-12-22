'use client';

import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Naprawia problem z domyślnymi ikonami w Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// Ustawiamy ikonę jawnie dla znacznika, zamiast modyfikować globalny prototyp (co powoduje błędy w Next.js/React StrictMode)
const customIcon = new L.Icon({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface GeofenceMapProps {
    center: [number, number];
    radius: number;
    onCenterChange: (latlng: L.LatLng) => void;
}

// Komponent pomocniczy do obsługi kliknięć na mapie
function MapEventsHandler({ onCenterChange }: { onCenterChange: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onCenterChange(e.latlng);
        },
    });
    return null;
}

export function GeofenceMap({ center, radius, onCenterChange }: GeofenceMapProps) {
    return (
        <MapContainer center={center} zoom={15} style={{ height: '400px', width: '100%' }} className="rounded-md z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
                position={center}
                draggable={true}
                icon={customIcon}
                eventHandlers={{ dragend: (e) => onCenterChange(e.target.getLatLng()) }}
            />
            <Circle center={center} radius={radius} pathOptions={{ color: 'blue' }} />
            <MapEventsHandler onCenterChange={onCenterChange} />
        </MapContainer>
    );
}