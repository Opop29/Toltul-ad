import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../css/Home.css";

const Home: React.FC = () => {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem("authenticated");

    history.push("/Toltul-ad/enter-passcode");
  };

  return (
    <>
      <IonPage id="main">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Home</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center home-content">
          <div className="home-hero">
            <h1 className="home-title">Welcome to Toltul AD</h1>
            <p className="home-subtitle">You have successfully entered the passcode</p>
          </div>

          <div className="home-card">
            <h2>Quick Actions</h2>
            <p>Use the menu to explore and logout when you’re done.</p>
            <div className="home-actions">
              <IonButton color="primary" fill="solid">Open Menu</IonButton>
              <IonButton color="light" fill="outline" onClick={handleLogout}>Logout</IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Home;
