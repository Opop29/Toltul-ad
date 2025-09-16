import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonLoading,
} from "@ionic/react";
import { logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../css/Home.css";

const Home: React.FC = () => {
  const history = useHistory();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    localStorage.removeItem("authenticated");
    setTimeout(() => {
      try { history.replace("/Toltul-ad/enter-passcode"); } catch {}
      try { window.location.href = "/Toltul-ad/enter-passcode"; } catch {}
    }, 2000);
  };

  return (
    <>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Home</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center home-content">
          <IonLoading isOpen={loggingOut} message="Signing out..." spinner="crescent" />
          <div className="home-hero">
            <h1 className="home-title">Welcome to Toltul AD</h1>
            <p className="home-subtitle">You have successfully entered the passcode</p>
          </div>

          <div className="home-card">
            <h2>Quick Actions</h2>
            <p>Use the menu to explore and logout when you’re done.</p>
            <div className="home-actions">
              <IonButton color="primary" fill="solid">Open Menu</IonButton>
              <IonButton color="light" fill="outline" onClick={handleLogout} disabled={loggingOut}>Logout</IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Home;
