import React from "react";
import { IonPage, IonContent, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";

const Home: React.FC = () => {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem("authenticated");

    history.push("/Toltul-ad/enter-passcode");
  };

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <h1>🎉 Welcome to Home Page</h1>
        <p>You have successfully entered the passcode!</p>

        <IonButton expand="block" color="danger" onClick={handleLogout}>
          🚪 Logout
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
