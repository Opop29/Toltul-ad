import React, { useEffect, useRef, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../utils/supabaseClient";
import "mapbox-gl/dist/mapbox-gl.css";
import "../css/Create.css";

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) ||
  "pk.eyJ1Ijoib3BvcDI5IiwiYSI6ImNtZm8za3Q1NjAxcTEyanF4ZjZraWowdjEifQ.jNxrXsiX7Davmhjmp4ihWw";

const Create: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapLoadedRef = useRef(false);

  // Pen configuration UI state
  const [penType, setPenType] = useState<string>("Point");
  const [penColor, setPenColor] = useState<string>("#0b2e66");
  const [penRadius, setPenRadius] = useState<number>(5);
  const [singleName, setSingleName] = useState<string>("New POI");
  const [groupMode, setGroupMode] = useState<boolean>(false);
  const [groupBaseName, setGroupBaseName] = useState<string>("Pen");
  const [groupIndex, setGroupIndex] = useState<number>(1);

  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [124.86808678286121, 8.360172178342996],
      zoom: 17,
    });
    mapRef.current = map;

    const onMapLoad = () => {
      mapLoadedRef.current = true;
      try {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          } as any);
        }
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 } as any);
        if (!map.getLayer("sky")) {
          map.addLayer({
            id: "sky",
            type: "sky",
            paint: {
              "sky-type": "atmosphere",
              "sky-atmosphere-sun": [0.0, 0.0],
              "sky-atmosphere-sun-intensity": 15,
            },
          } as any);
        }
        const layers = map.getStyle().layers || [];
        const labelLayerId = layers.find((l: any) => l.type === "symbol" && l.layout && l.layout["text-field"])?.id;
        if (!map.getLayer("3d-buildings")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              },
            } as any,
            labelLayerId || undefined
          );
        }
        map.setPitch(60);
        map.setBearing(-20);
      } catch {}
      map.on("click", async (e) => {
        const lon = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const name = groupMode ? `${groupBaseName} ${groupIndex}` : (singleName?.trim() || "New POI");
        const radius = penRadius > 0 ? penRadius : 5;
        const { error } = await supabase.from("ar_pois").insert([
          { name, description: "", latitude: lat, longitude: lon, radius_meters: radius },
        ]);
        if (error) {
          alert("Failed to save: " + error.message);
          return;
        }
        if (groupMode) setGroupIndex((i) => i + 1);
      });
    };
    map.on("load", onMapLoad);
    return () => {
      map.off("load", onMapLoad);
      map.remove();
    };
  }, [groupMode, groupBaseName, groupIndex, penRadius, penColor, singleName, penType]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Create</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="create-wrap">
          <div ref={mapContainer} className="map-panel" />
          <div className="pen-create-card">
            <h3 className="panel-title">Create Pen</h3>
            <div className="pen-config">
              <div className="row">
                <label>Type</label>
                <select className="input" value={penType} onChange={(e) => setPenType(e.target.value)}>
                  <option>Point</option>
                  <option>Beacon</option>
                  <option>Zone</option>
                </select>
              </div>
              <div className="row">
                <label>Color</label>
                <input className="input" type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} />
              </div>
              <div className="row">
                <label>Radius (m)</label>
                <input className="input" type="number" min={1} value={penRadius} onChange={(e) => setPenRadius(Number(e.target.value))} />
              </div>
              <div className="row">
                <label>Mode</label>
                <div className="mode">
                  <label className="chk"><input type="checkbox" checked={groupMode} onChange={(e) => setGroupMode(e.target.checked)} /> Group</label>
                </div>
              </div>
              {!groupMode && (
                <div className="row">
                  <label>Name</label>
                  <input className="input" value={singleName} onChange={(e) => setSingleName(e.target.value)} />
                </div>
              )}
              {groupMode && (
                <div className="row grid2">
                  <div>
                    <label>Group Name</label>
                    <input className="input" value={groupBaseName} onChange={(e) => setGroupBaseName(e.target.value)} />
                  </div>
                  <div>
                    <label>Next #</label>
                    <input className="input" type="number" min={1} value={groupIndex} onChange={(e) => setGroupIndex(Number(e.target.value))} />
                  </div>
                </div>
              )}
              <div className="hint">Tap the map to place the pen using these settings.</div>
              <div className="pen-preview">
                <div
                  className="pen-preview-marker"
                  style={{ background: penColor, width: penRadius * 2, height: penRadius * 2 }}
                />
                <span className="pen-preview-name">{groupMode ? `${groupBaseName} ${groupIndex}` : singleName}</span>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Create;