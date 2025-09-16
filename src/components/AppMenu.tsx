import React from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonAvatar,
  IonButton,
} from "@ionic/react";
import { homeOutline, addCircleOutline, constructOutline, barChartOutline, logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../css/Home.css";
import { menuController } from "@ionic/core";

const AppMenu: React.FC = () => {
  const history = useHistory();

  const handleLogout = async () => {
    localStorage.removeItem("authenticated");
    try { await menuController.close(); } catch {}
    history.replace("/Toltul-ad/enter-passcode");
  };

  return (
    <IonMenu contentId="main" side="start">
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
          <IonItem routerLink="/Toltul-ad/home" button detail={false} lines="full" className="menu-item">
            <IonIcon slot="start" icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/create" button detail={false} lines="full" className="menu-item">
            <IonIcon slot="start" icon={addCircleOutline} />
            <IonLabel>Create</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/builded" button detail={false} lines="full" className="menu-item">
            <IonIcon slot="start" icon={constructOutline} />
            <IonLabel>Builded</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/report" button detail={false} lines="none" className="menu-item">
            <IonIcon slot="start" icon={barChartOutline} />
            <IonLabel>Report</IonLabel>
          </IonItem>
        </IonList>

        <div style={{ height: 24 }} />

        <IonButton expand="block" color="danger" onClick={handleLogout}>
          <IonIcon slot="start" icon={logOutOutline} />
          Logout
        </IonButton>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;


