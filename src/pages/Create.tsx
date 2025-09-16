const ArrowBackground: React.FC = () => {
    const [arrows, setArrows] = useState<Array<{left: number, delay: number, size: number}>>([]);
    useEffect(() => {
      const arr = Array.from({length: 8}, () => ({
        left: Math.random() * 90, 
        delay: Math.random() * 10, 
        size: 30 + Math.random() * 40 
      }));
      setArrows(arr);
    }, []);
    return (
      <div className="arrow-bg">
        {arrows.map((a, i) => (
          <div
            key={i}
            className="arrow"
            style={{
              left: `${a.left}vw`,
              animationDelay: `${a.delay}s`,
              width: `${a.size}px`,
              height: `${a.size}px`,
            }}
          />
        ))}
      </div>
    );
  };
  import React, { useState, useEffect, useRef } from "react";
  import {
    IonPage,
    IonContent,
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
  
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState<"success" | "error" | "">("");
  
    const inputRef = useRef<HTMLInputElement>(null);
    const history = useHistory();
  
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
        setTimeout(() => history.push("/Toltul-ad/home"), 1200);
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
        <IonContent className="enter-passcode-bg" fullscreen>
          <ArrowBackground />
          <div className="glass-card passcode-pin-container enhanced-card">
            {/* Logo at the top */}
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp9gZnSEdoA-GxkfjMOZy_NaQPGNM2OIRu9jysFNX_g3kY3zqYz8ii8sVO7-FbywES96A&usqp=CAU" alt="Logo" className="app-logo enhanced-logo" />
  
            {/* Bigger Title */}
            <IonTitle className="tech-title enhanced-title">Toltul-AD</IonTitle>
  
            {/* "Enter Passcode" just below the title */}
            <h1 className="gradient-title enhanced-gradient-title">🔑 Enter Passcode</h1>
  
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
              autoFocus
            />
  
            {/* PIN Boxes */}
            <div className={`pin-boxes enhanced-pin-boxes ${shake ? "shake" : ""}`}>
              {pin.map((digit, i) => (
                <div
                  key={i}
                  className={`pin-box enhanced-pin-box ${digit ? "filled" : ""} ${
                    i === activeIndex ? "active" : ""
                  }`}
                  onClick={() => inputRef.current?.focus()}
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
            >
              {modalMessage}
            </div>
          )}
  
          {/* Animated Arrows Background */}
          <div className="arrows">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="arrow"
                style={{
                  left: `${Math.random() * 100}vw`,
                  animationDelay: `${Math.random() * 100}s`,
                  width: `${30 + Math.random() * 40}px`,
                  height: `${30 + Math.random() * 40}px`,
                }}
              />
            ))}
          </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default EnterPasscode;