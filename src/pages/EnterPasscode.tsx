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
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  isPlatform
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { eye, eyeOff } from "ionicons/icons";


const EnterPasscode: React.FC = () => {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const history = useHistory();
  const isMobile = isPlatform("mobile") || isPlatform("tablet");

  useEffect(() => {
    setPasscode("");
    setPin(Array(6).fill(""));
    setActiveIndex(0);
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const checkPasscode = async (code: string) => {
    if (!code) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("passcodes")
      .select("*")
      .eq("code", code.trim())
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
      setPin(Array(6).fill(""));
      setActiveIndex(0);
    } else {
      vibrate(150);
      setToastMessage("✅ Access Granted");
      setToastColor("success");
      setShowToast(true);
      localStorage.setItem("authenticated", "true");
      setTimeout(() => history.push("/Toltul-ad/home"), 900);
    }
  };

  const onDesktopSubmit = () => {
    if (!passcode.trim()) return;
    checkPasscode(passcode);
  };

  const handleNumberPress = (num: string) => {
    if (loading) return;
    if (activeIndex < 6) {
      const newPin = [...pin];
      newPin[activeIndex] = num;
      setPin(newPin);
      setActiveIndex(activeIndex + 1);
      if (activeIndex + 1 === 6) checkPasscode(newPin.join(""));
    }
  };

  const handleDelete = () => {
    if (loading) return;
    if (activeIndex > 0) {
      const newPin = [...pin];
      newPin[activeIndex - 1] = "";
      setPin(newPin);
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <IonPage>
  <IonContent className="enter-passcode-bg" fullscreen>
    {!isMobile ? (
      <div className="glass-card desktop-container">
      
        <IonTitle className="ion-text-center tech-title">Toltul-AD</IonTitle>
        <h1 className="title gradient-title">🔑 Enter Passcode</h1>
        <IonItem className={shake ? "shake" : ""}>
          <IonLabel position="floating">Passcode</IonLabel>
          <IonInput
            type={showPasscode ? "text" : "password"}
            value={passcode}
            onIonChange={(e) => setPasscode(e.detail.value!)}
            onKeyDown={(e) => { if (e.key === "Enter") onDesktopSubmit(); }}
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
  onClick={onDesktopSubmit}
  disabled={!passcode.trim() || loading}
  style={{ display: loading ? "none" : "block" }} 
>
  {loading ? <IonSpinner name="crescent" /> : "Submit"}
</IonButton>

      </div>
    ) : (
      <div className="glass-card passcode-container">
        <IonTitle className="ion-text-center tech-title">Toltul-AD</IonTitle>
        <div className="logo-circle">🔒</div>
        <h2>Enter your PIN</h2>
        <div className={`pin-boxes ${shake ? "shake" : ""}`}>
          {pin.map((digit, i) => (
            <div
              key={i}
              className={`pin-box ${digit ? "filled" : ""} ${
                i === activeIndex ? "active" : ""
              }`}
            >
              {digit ? "●" : ""}
            </div>
          ))}
        </div>
        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <IonButton
              key={n}
              onClick={() => handleNumberPress(String(n))}
              className="keypad-btn"
            >
              {n}
            </IonButton>
          ))}
          <div className="keypad-placeholder" />
          <IonButton
            onClick={() => handleNumberPress("0")}
            className="keypad-btn"
          >
            0
          </IonButton>
          <IonButton onClick={handleDelete} className="keypad-btn keypad-back">
            ⌫
          </IonButton>
        </div>
        {loading && <IonSpinner name="crescent" />}
      </div>
    )}

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
