import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonMenuButton } from '@ionic/react';
import '../css/MapMarker.css';

const MapMarker: React.FC = () => {
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
          <div className="map-container">
            <div className="map">map</div>
          </div>
          
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