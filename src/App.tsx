import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import EnterPasscode from "./pages/EnterPasscode";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.system.css";
import "./theme/variables.css";
import TabsLayout from "./layouts/TabsLayout";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/Toltul-ad/enter-passcode" component={EnterPasscode} />
        <Route exact path="/Toltul-ad/home" component={Home} />
        <Route exact path="/Toltul-ad/">
          <Redirect to="/Toltul-ad/home" />
        </Route>
      </IonRouterOutlet>
      <Route path="/Toltul-ad" component={TabsLayout} />
    </IonReactRouter>
  </IonApp>
);

export default App;





