import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonToast } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient"; // ✅ make sure supabase client is set up

const EnterPasscode: React.FC = () => {
  const [passcode, setPasscode] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();


  useEffect(() => {
    setPasscode("");
  }, []);

  const handleCheckPasscode = async () => {
    const { data, error } = await supabase
      .from("passcodes")
      .select("*")
      .eq("code", passcode)
      .single();

    if (error || !data) {
      setToastMessage("❌ Invalid Passcode");
      setShowToast(true);
    } else {
      setToastMessage("✅ Access Granted");
      setShowToast(true);
      setTimeout(() => {
        history.push("/Toltul-ad/home"); // ✅ redirect to Home
      }, 1000);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <h1>🔑 Enter Passcode</h1>

        <IonInput
          type="password"
          placeholder="Enter your passcode"
          value={passcode}
          onIonChange={(e) => setPasscode(e.detail.value!)}
        />

        <IonButton expand="block" onClick={handleCheckPasscode}>
          Submit
        </IonButton>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={1500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EnterPasscode;
