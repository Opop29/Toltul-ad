import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonToggle,
} from '@ionic/react';
import mapboxgl from 'mapbox-gl';
import '../css/MapMarker.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const MapMarker: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/streets-v11');
  const [is3D, setIs3D] = useState<boolean>(false);

  const styles = [
    { label: 'Streets', url: 'mapbox://styles/mapbox/streets-v11' },
    { label: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
    { label: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
    { label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
    { label: 'Satellite Streets', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  ];

  const enable3D = () => {
    if (!mapRef.current) return;

    mapRef.current.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
    mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    mapRef.current.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6,
      },
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [124.8681005804846, 8.360074137369724],
      zoom: 16,
      pitch: is3D ? 60 : 0, 
      bearing: is3D ? -20 : 0,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      mapRef.current?.resize();
      if (is3D) enable3D();
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [mapStyle, is3D]); 

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Map Marker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY={false}>
        <div className="map-layout">
          <div className="map-wrapper">
            <div ref={mapContainerRef} className="map-container"></div>
          </div>

          <div className="options-container">
            <div className="container-options">
              {/* Map Style Selector */}
              <IonSelect
                value={mapStyle}
                placeholder="Select Map Layer"
                onIonChange={(e) => setMapStyle(e.detail.value)}
              >
                {styles.map((style) => (
                  <IonSelectOption key={style.url} value={style.url}>
                    {style.label}
                  </IonSelectOption>
                ))}
              </IonSelect>

              {/* 3D Toggle */}
              <IonItem lines="none">
                <IonLabel>Enable 3D</IonLabel>
                <IonToggle
                  checked={is3D}
                  onIonChange={(e) => setIs3D(e.detail.checked)}
                />
              </IonItem>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MapMarker;
