import React from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/react";

const Report: React.FC = () => {
  return (
    <IonPage id="main">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Report</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Reports and analytics</h2>
        <p>This is the Report tab content.</p>
      </IonContent>
    </IonPage>
  );
};

export default Report;


