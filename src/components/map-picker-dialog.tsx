"use client";

import { useState, useEffect } from "react";
import type { MapContainerProps } from 'react-leaflet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

// Import images at the top level
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialPosition: { lat: number; lng: number };
  radius: number;
}

export function MapPickerDialog({
  isOpen,
  onClose,
  onLocationSelect,
  initialPosition,
  radius,
}: MapPickerDialogProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition.lat && initialPosition.lng ? initialPosition : null
  );
  const [mapKey, setMapKey] = useState(Date.now());

  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<MapContainerProps>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
    useMapEvents: any;
    Circle: React.ComponentType<any>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMapKey(Date.now()); // Gera uma nova chave a cada abertura
      import('leaflet').then(L => {
        // Fix Leaflet's default icon issue with Webpack
        let DefaultIcon = L.icon({
            iconUrl: icon.src,
            shadowUrl: iconShadow.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        L.Marker.prototype.options.icon = DefaultIcon;

        import('react-leaflet').then(components => {
          setMapComponents({
            MapContainer: components.MapContainer,
            TileLayer: components.TileLayer,
            Marker: components.Marker,
            useMapEvents: components.useMapEvents,
            Circle: components.Circle,
          });
        });
      });
    }
  }, [isOpen]);


  const handleSave = () => {
    if (position) {
      onLocationSelect(position);
    }
  };
  
  if (!isOpen || !MapComponents) {
    return null;
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, Circle } = MapComponents;

  function LocationMarker({ position, setPosition, radius }: { position: any, setPosition: any, radius: number }) {
    const map = useMapEvents({
      click(e: { latlng: any; }) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });
  
    return position === null ? null : (
      <>
        <Marker position={position}></Marker>
        <Circle center={position} radius={radius} />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Localização no Mapa</DialogTitle>
          <DialogDescription>
            Clique no mapa para definir o centro da área permitida. O círculo representa o raio de alcance.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow rounded-md overflow-hidden">
          <MapContainer
            key={mapKey}
            center={position || [-14.235, -51.9253]} // Centro do Brasil se não houver posição
            zoom={position ? 15 : 4}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} radius={radius} />
          </MapContainer>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!position}>
            Salvar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
