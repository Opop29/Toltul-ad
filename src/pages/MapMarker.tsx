import React, { useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
} from '@ionic/react';
import mapboxgl from 'mapbox-gl';
import '../css/MapMarker.css';

// ✅ Use your token from Vite env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const MapMarker: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Mapbox map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11', // you can change to satellite, dark, light, etc.
      center: [124.747, 8.376], // Example: Valencia, Bukidnon (change to your area)
      zoom: 13,
    });

    // Add navigation controls (zoom in/out)
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Example marker
    new mapboxgl.Marker({ color: 'red' })
      .setLngLat([124.747, 8.376]) // same coords as center
      .setPopup(new mapboxgl.Popup().setHTML('<h4>Hello Mapbox!</h4>'))
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

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

      {/* Main Content */}
      <IonContent>
        <div className="map-layout">
          {/* Map Area */}
          <div ref={mapContainerRef} className="map-container"></div>

          {/* Container Options */}
          <div className="options-container">
            <div className="container-options">container options</div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MapMarker;
