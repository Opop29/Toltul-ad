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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const MapMarker: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11', 
        center: [124.8681005804846, 8.360074137369724],
      zoom: 16,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    

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

      <IonContent>
        <div className="map-layout">
          {/* Map Full Container */}
          <div className="map-wrapper">
            <div ref={mapContainerRef} className="map-container"></div>
          </div>

          {/* Options Panel */}
          <div className="options-container">
            <div className="container-options">container options</div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MapMarker;
