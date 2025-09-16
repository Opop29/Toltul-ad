import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonToast,
  IonSpinner,
  IonTitle,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import "../css/EnterPasscode.css";

const EnterPasscode: React.FC = () => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");

  const inputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // only numbers
    if (value.length > 6) value = value.slice(0, 6);

    const newPin = value.split("");
    while (newPin.length < 6) newPin.push("");

    setPin(newPin);
    setActiveIndex(newPin.findIndex((d) => d === ""));

    if (value.length === 6) {
      checkPasscode(value);
    }
  };

  return (
    <IonPage>
      <IonContent className="enter-passcode-bg" fullscreen>
        <div className="glass-card passcode-pin-container">
          {/* Logo */}
          <img src="../assets/logo.png" alt="Logo" className="app-logo" />

          {/* Title */}
          <IonTitle className="ion-text-center tech-title">Toltul-AD</IonTitle>
          <h1 className="gradient-title">🔑 Enter Passcode</h1>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={pin.join("")}
            onChange={handleChange}
            className="hidden-pass-input"
          />

          {/* PIN Boxes */}
          <div className={`pin-boxes ${shake ? "shake" : ""}`}>
            {pin.map((digit, i) => (
              <div
                key={i}
                className={`pin-box ${digit ? "filled" : ""} ${
                  i === activeIndex ? "active" : ""
                }`}
                onClick={() => inputRef.current?.focus()}
              >
                {digit ? "●" : ""}
              </div>
            ))}
          </div>

          {/* Loading Spinner */}
          {loading && <IonSpinner name="crescent" className="loading-spinner" />}
        </div>

        {/* Toast */}
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
