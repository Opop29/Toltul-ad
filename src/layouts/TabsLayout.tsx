import React, { useState, useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import { homeOutline, addCircleOutline, constructOutline, barChartOutline } from "ionicons/icons";
import Home from "../pages/Home";
import MapMarker from "../pages/MapMarker";
import Builded from "../pages/Builded";
import Report from "../pages/Report";
import "../css/Tabs.css";
import AppMenu from "../components/AppMenu";
import { menuController } from "@ionic/core";

const TabsLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuOpen = () => setMenuOpen(true);
    const handleMenuClose = () => setMenuOpen(false);

    document.addEventListener('ionMenuDidOpen', handleMenuOpen);
    document.addEventListener('ionMenuDidClose', handleMenuClose);

    return () => {
      document.removeEventListener('ionMenuDidOpen', handleMenuOpen);
      document.removeEventListener('ionMenuDidClose', handleMenuClose);
    };
  }, []);

  useEffect(() => {
    const mainOutlet = document.getElementById('main');
    if (mainOutlet) {
      if (menuOpen) {
        mainOutlet.setAttribute('inert', '');
      } else {
        mainOutlet.removeAttribute('inert');
      }
    }
  }, [menuOpen]);
  return (
    <>
      <AppMenu />
      <IonTabs>
      <IonRouterOutlet id="main">
        <Route exact path="/Toltul-ad">
          <Redirect to="/Toltul-ad/home" />
        </Route>
        <Route exact path="/Toltul-ad/home" component={Home} />
        <Route exact path="/Toltul-ad/MapMarker" component={MapMarker} />
        <Route exact path="/Toltul-ad/builded" component={Builded} />
        <Route exact path="/Toltul-ad/report" component={Report} />
        <Route exact path="/Toltul-ad/tabs">
          <Redirect to="/Toltul-ad/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="tabs-bar">
        <IonTabButton tab="home" href="/Toltul-ad/home" className="tab-btn">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
          <span className="tab-indicator" />
        </IonTabButton>
        <IonTabButton tab="create" href="/Toltul-ad/MapMarker" className="tab-btn">
          <IonIcon icon={addCircleOutline} />
          <IonLabel>MapMarker</IonLabel>
          <span className="tab-indicator" />
        </IonTabButton>
        <IonTabButton tab="builded" href="/Toltul-ad/builded" className="tab-btn">
          <IonIcon icon={constructOutline} />
          <IonLabel>Builded</IonLabel>
          <span className="tab-indicator" />
        </IonTabButton>
        <IonTabButton tab="report" href="/Toltul-ad/report" className="tab-btn">
          <IonIcon icon={barChartOutline} />
          <IonLabel>Report</IonLabel>
          <span className="tab-indicator" />
        </IonTabButton>
      </IonTabBar>
      </IonTabs>
    </>
  );
};

export default TabsLayout;


