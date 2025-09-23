import React, { useState } from "react";
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
  IonLoading,
} from "@ionic/react";
import { homeOutline, addCircleOutline, constructOutline, barChartOutline, logOutOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../css/Home.css";
import { menuController } from "@ionic/core";

const AppMenu: React.FC = () => {
  const history = useHistory();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    localStorage.removeItem("authenticated");
    try { await menuController.close(); } catch {}
    setTimeout(() => {
      try { history.replace("/Toltul-ad/enter-passcode"); } catch {}
      try { window.location.href = "/Toltul-ad/enter-passcode"; } catch {}
    }, 2000);
  };

  return (
    <IonMenu contentId="main" side="start" className="sidebar-menu">
      <IonHeader className="sidebar-header">
        <div className="sidebar-brand">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp9gZnSEdoA-GxkfjMOZy_NaQPGNM2OIRu9jysFNX_g3kY3zqYz8ii8sVO7-FbywES96A&usqp=CAU"
            alt="Toltula-AR Logo"
            className="sidebar-logo"
          />
          <div className="sidebar-brand-text">
            <h1 className="sidebar-title">Toltula-AR</h1>
            <p className="sidebar-subtitle">Augmented Reality Platform</p>
          </div>
        </div>
      </IonHeader>
      <IonContent className="sidebar-content">
        {loggingOut && <div className="global-blur" />}
        <IonLoading isOpen={loggingOut} message="Signing out..." spinner="crescent" />
        <div className="sidebar-welcome">
          <h3 className="welcome-title">🎉 Welcome Back!</h3>
          <p className="welcome-subtitle">You are successfully signed in</p>
        </div>

        <IonList className="sidebar-nav">
          <IonItem routerLink="/Toltul-ad/home" button detail={false} lines="none" className="sidebar-nav-item">
            <IonIcon slot="start" icon={homeOutline} />
            <IonLabel>Home Dashboard</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/MapMarker" button detail={false} lines="none" className="sidebar-nav-item">
            <IonIcon slot="start" icon={addCircleOutline} />
            <IonLabel>Create Markers</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/builded" button detail={false} lines="none" className="sidebar-nav-item">
            <IonIcon slot="start" icon={constructOutline} />
            <IonLabel>Manage Markers</IonLabel>
          </IonItem>
          <IonItem routerLink="/Toltul-ad/report" button detail={false} lines="none" className="sidebar-nav-item">
            <IonIcon slot="start" icon={barChartOutline} />
            <IonLabel>Reports & Analytics</IonLabel>
          </IonItem>
        </IonList>

        <div className="sidebar-footer">
          <IonButton expand="full" color="danger" onClick={handleLogout} disabled={loggingOut} className="sidebar-logout-btn">
            <IonIcon slot="start" icon={logOutOutline} />
            Sign Out
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;


