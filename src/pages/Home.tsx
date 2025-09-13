import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import React from "react";
const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <h1>🎉 Welcome to Home Page</h1>
        <p>You have successfully entered the passcode!</p>
      </IonContent>
    </IonPage>
  );
};

export default Home;
