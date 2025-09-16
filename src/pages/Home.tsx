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
        <IonContent className="ion-padding">
          <div className="ion-text-center" style={{ margin: "16px 0" }}>
            <IonAvatar style={{ margin: "0 auto", width: "72px", height: "72px" }}>
              <img src="https://i.pravatar.cc/150?img=13" alt="User" />
            </IonAvatar>
            <h2 style={{ marginTop: 12 }}>🎉 Welcome</h2>
            <p style={{ color: "var(--ion-color-medium)" }}>You are signed in</p>
          </div>

          <IonList>
            <IonItem button detail={false} lines="full">
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonItem>
            <IonItem button detail={false} lines="none">
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
        <IonContent className="ion-padding ion-text-center">
          <h1>🎉 Welcome to Home Page</h1>
          <p>You have successfully entered the passcode!</p>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Home;
