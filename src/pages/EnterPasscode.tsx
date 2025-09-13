import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { eye, eyeOff } from "ionicons/icons";
import "../css/EnterPasscode.css"; 

const EnterPasscode: React.FC = () => {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const history = useHistory();

  useEffect(() => {
    setPasscode("");
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleCheckPasscode = async () => {
    if (!passcode.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("passcodes")
      .select("*")
      .eq("code", passcode.trim())
      .single();

    setLoading(false);

    if (error || !data) {
      vibrate([200, 100, 200]); 
      setShake(true);
      setTimeout(() => setShake(false), 500); 

      setToastMessage("❌ Invalid Passcode");
      setToastColor("danger");
      setShowToast(true);
      setPasscode("");
    } else {
      vibrate(150); 
      setToastMessage("✅ Access Granted");
      setToastColor("success");
      setShowToast(true);
      setPasscode("");
      setTimeout(() => {
        history.push("/Toltul-ad/home");
      }, 1000);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center" fullscreen>
        <div
          style={{
            maxWidth: "90%",
            width: "400px",
            margin: "0 auto",
            marginTop: "20vh",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
            🔑 Enter Passcode
          </h1>

          <IonItem className={shake ? "shake" : ""}>
            <IonLabel position="floating">Passcode</IonLabel>
            <IonInput
              type={showPasscode ? "text" : "password"}
              value={passcode}
              onIonChange={(e) => setPasscode(e.detail.value!)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCheckPasscode();
                }
              }}
            />
            <IonIcon
              slot="end"
              icon={showPasscode ? eyeOff : eye}
              onClick={() => setShowPasscode(!showPasscode)}
              style={{ cursor: "pointer" }}
            />
          </IonItem>

          <IonButton
            expand="block"
            onClick={handleCheckPasscode}
            disabled={!passcode.trim() || loading}
          >
            {loading ? <IonSpinner name="crescent" /> : "Submit"}
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          color={toastColor}
          duration={1500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EnterPasscode;
