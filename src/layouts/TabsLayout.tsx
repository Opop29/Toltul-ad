import React from "react";
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
import Create from "../pages/Create";
import Builded from "../pages/Builded";
import Report from "../pages/Report";
import "../css/Tabs.css";
import AppMenu from "../components/AppMenu";

const TabsLayout: React.FC = () => {
  return (
    <>
      <AppMenu />
      <IonTabs>
      <IonRouterOutlet id="main">
        <Route exact path="/Toltul-ad">
          <Redirect to="/Toltul-ad/home" />
        </Route>
        <Route exact path="/Toltul-ad/home" component={Home} />
        <Route exact path="/Toltul-ad/create" component={Create} />
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
        <IonTabButton tab="create" href="/Toltul-ad/create" className="tab-btn">
          <IonIcon icon={addCircleOutline} />
          <IonLabel>Create</IonLabel>
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


