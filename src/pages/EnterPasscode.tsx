import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonTitle,
  IonLoading,
  IonAlert,
  useIonViewDidEnter,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import "../css/Home.css";
import "../css/EnterPasscode.css";

const EnterPasscode: React.FC = () => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "">("");

  const inputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  useIonViewDidEnter(() => {
    // Focus only when this page is active and not aria-hidden
    setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      let ancestor = input.parentElement;
      let hiddenAncestor = false;
      while (ancestor) {
        if (ancestor.getAttribute && ancestor.getAttribute('aria-hidden') === 'true') {
          hiddenAncestor = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!hiddenAncestor) input.focus();
    }, 0);
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("authenticated") === "true";
    if (isAuth) {
      history.replace("/Toltul-ad/home");
    }
  }, [history]);

  useEffect(() => {
   
    setPin(Array(6).fill(""));
    setActiveIndex(0);
    setModalMessage("");
    setModalType("");
    if (inputRef.current) inputRef.current.value = "";
  
  }, []);

  useEffect(() => {
    if (modalMessage) {
      const timer = setTimeout(() => {
        setPin(Array(6).fill(""));
        setActiveIndex(0);
        setModalMessage("");
        setModalType("");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [modalMessage]);

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const showModal = (message: string, type: "success" | "error") => {
    setModalMessage(message);
    setModalType(type);
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
      showModal("❌ Incorrect Passcode", "error");
    } else {
      vibrate(150);
      showModal("✅ Access Granted", "success");
      localStorage.setItem("authenticated", "true");
      setSuccessLoading(true);
      setTimeout(() => {
        setSuccessLoading(false);
        setShowWelcome(true);
      }, 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 6) value = value.slice(0, 6);

    const newPin = value.split("");
    while (newPin.length < 6) newPin.push("");

    setPin(newPin);
    setActiveIndex(newPin.findIndex((d) => d === ""));

    if (value.length === 6) {
      checkPasscode(value);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    };
    const input = inputRef.current;
    if (input) {
      input.addEventListener("focus", handleFocus);
    }
    return () => {
      if (input) {
        input.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  return (
    <IonPage>
  <IonContent className="home-content" fullscreen inert={!!document.querySelector('ion-router-outlet[aria-hidden="true"]')}>
        {/* EPIC BACKGROUND ANIMATIONS */}
        <div className="floating-shapes">
          <div className="shape-1"></div>
          <div className="shape-2"></div>
          <div className="shape-3"></div>
          <div className="shape-4"></div>
          <div className="shape-5"></div>
        </div>
        <div className="wave-overlay"></div>

        <IonLoading isOpen={successLoading} message="Preparing your experience..." spinner="crescent" translucent />
        <IonAlert
          isOpen={showWelcome}
          header="Welcome"
          message="You have successfully logged in."
          buttons={[
            {
              text: "OK",
              handler: () => {
                try { window.location.href = "/Toltul-ad/home"; } catch {}
              },
            },
          ]}
          onDidDismiss={() => {
            if (showWelcome) {
              try { window.location.href = "/Toltul-ad/home"; } catch {}
            }
          }}
        />
        <div className="glass-card passcode-pin-container enhanced-card" style={{background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'}}>
          {/* Logo at the top */}
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp9gZnSEdoA-GxkfjMOZy_NaQPGNM2OIRu9jysFNX_g3kY3zqYz8ii8sVO7-FbywES96A&usqp=CAU" alt="Logo" className="app-logo enhanced-logo" />

          {/* Bigger Title */}
          <IonTitle className="tech-title enhanced-title" style={{color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>Toltul-AD</IonTitle>

          {/* "Enter Passcode" just below the title */}
          <h1 className="gradient-title enhanced-gradient-title" style={{color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>🔑 Enter Passcode</h1>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={pin.join("")}
            onChange={handleChange}
            className="hidden-pass-input"
            aria-label="Enter 6-digit passcode"
          />

          {/* PIN Boxes */}
          <div className={`pin-boxes enhanced-pin-boxes ${shake ? "shake" : ""}`}>
            {pin.map((digit, i) => (
              <div
                key={i}
                className={`pin-box enhanced-pin-box ${digit ? "filled" : ""} ${
                  i === activeIndex ? "active" : ""
                }`}
                onClick={() => {
                  // Only focus if not hidden
                  let ancestor = inputRef.current?.parentElement;
                  let hiddenAncestor = false;
                  while (ancestor) {
                    if (ancestor.getAttribute && ancestor.getAttribute('aria-hidden') === 'true') {
                      hiddenAncestor = true;
                      break;
                    }
                    ancestor = ancestor.parentElement;
                  }
                  if (!hiddenAncestor) inputRef.current?.focus();
                }}
                tabIndex={0}
                aria-label={digit ? "Filled" : "Empty"}
              >
                {digit ? (
                  <span className="pin-dot" />
                ) : (
                  <span className="pin-placeholder" />
                )}
              </div>
            ))}
          </div>

          {/* Loading Spinner */}
          {loading && <IonSpinner name="crescent" className="loading-spinner enhanced-spinner" />}
        </div>

        {/* Modal Notification */}
        {modalMessage && (
          <div
            className={`passcode-modal enhanced-modal ${modalType === "success" ? "success" : "error"}`}
            style={{
              background: modalType === "success" ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(10px)',
              border: modalType === "success" ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: modalType === "success" ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}
          >
            {modalMessage}
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default EnterPasscode;