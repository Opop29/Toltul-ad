import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonButtons,
  IonMenuButton,
  IonAvatar,
} from "@ionic/react";
import { logOutOutline, homeOutline, settingsOutline } from "ionicons/icons";
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
      <IonMenu contentId="home-content" side="start">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding home-menu">
          <div className="menu-header ion-text-center">
            <IonAvatar className="menu-avatar">
              <img src="https://i.pravatar.cc/150?img=13" alt="User" />
            </IonAvatar>
            <h2 className="menu-title">🎉 Welcome</h2>
            <p className="menu-subtitle">You are signed in</p>
          </div>

          <IonList className="menu-list">
            <IonItem button detail={false} lines="full" className="menu-item">
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonItem>
            <IonItem button detail={false} lines="none" className="menu-item">
              <IonIcon slot="start" icon={settingsOutline} />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonList>

          <div style={{ height: 24 }} />

          <IonButton expand="block" color="danger" onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} />
            Logout
          </IonButton>
        </IonContent>
      </IonMenu>

      <IonPage id="home-content">
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
