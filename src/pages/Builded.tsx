
import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "../css/Builded.css";

type POI = {
  id?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  is_active?: boolean;
  pen_type?: string;
  color?: string;
  group_name?: string;
  group_index?: number;
  height?: number;
};

const Builded: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | null>(null);

  useEffect(() => {
    fetchPois();
  }, []);

  async function fetchPois() {
    const { data, error } = await supabase
      .from("ar_pois")
      .select("*")
      .eq("is_active", true);
    if (error) {
      console.error(error);
      return;
    }
    setPois((data as POI[]) || []);
  }

  async function updatePoi(p: POI) {
    if (!p.id) return;
    await supabase
      .from("ar_pois")
      .update({
        name: p.name,
        description: p.description,
        radius_meters: p.radius_meters,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    fetchPois();
    setSelected(null);
  }

  async function setCoords(p: POI) {
    if (!p.id) return;
    const lat = prompt("Set latitude:", p.latitude.toString());
    const lon = prompt("Set longitude:", p.longitude.toString());
    if (!lat || !lon) return;
    await supabase
      .from("ar_pois")
      .update({ latitude: Number(lat), longitude: Number(lon) })
      .eq("id", p.id);
    fetchPois();
  }

  async function deletePoi(p: POI) {
    if (!p.id) return;
    await supabase
      .from("ar_pois")
      .update({ is_active: false })
      .eq("id", p.id);
    fetchPois();
    setSelected(null);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Builded Pens</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="builded-wrap">
          <div className="builded-card">
            <h3>All Saved Pens</h3>
            <div className="poi-list">
              {pois.map((p) => (
                <div key={p.id} className="poi-item">
                  <div className="poi-meta">
                    <span className="poi-name">{p.name}</span>
                    <span className="poi-coords">{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</span>
                    <span className="poi-type">{p.pen_type || "Point"}</span>
                    <span className="poi-height">Height: {p.height ?? 1}m</span>
                    {p.color && <span className="poi-color" style={{background:p.color,display:'inline-block',width:18,height:18,borderRadius:4,marginLeft:8}} title={p.color}></span>}
                    {p.group_name && <span className="poi-group">Group: {p.group_name} #{p.group_index ?? ''}</span>}
                  </div>
                  <div className="poi-actions">
                    <button className="btn view" onClick={() => window.open(`https://www.google.com/maps?q=${p.latitude},${p.longitude}`, "_blank")}>View</button>
                    <button className="btn edit" onClick={() => setSelected(p)}>Edit</button>
                    <button className="btn coords" onClick={() => setCoords(p)}>Set Coords</button>
                    <button className="btn danger" onClick={() => deletePoi(p)}>Delete</button>
                  </div>
                </div>
              ))}
              {pois.length === 0 && <div className="empty">No pens saved yet.</div>}
            </div>
          </div>
          {selected && (
            <div className="builded-card">
              <h4>Edit Pen</h4>
              <label>Name</label>
              <input
                className="input"
                value={selected.name}
                onChange={(e) => setSelected({ ...selected, name: e.target.value })}
              />
              <label>Description</label>
              <textarea
                className="textarea"
                value={selected.description || ""}
                onChange={(e) => setSelected({ ...selected, description: e.target.value })}
              />
              <label>Radius (m)</label>
              <input
                className="input"
                type="number"
                value={selected.radius_meters ?? 5}
                onChange={(e) => setSelected({ ...selected, radius_meters: Number(e.target.value) })}
              />
              <label>Pen Type</label>
              <select
                className="input"
                value={selected.pen_type || "Point"}
                onChange={(e) => setSelected({ ...selected, pen_type: e.target.value })}
              >
                <option value="Point">Point</option>
                <option value="Beacon">Beacon</option>
                <option value="Zone">Zone</option>
              </select>
              <label>Height (m)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={selected.height ?? 1}
                onChange={(e) => setSelected({ ...selected, height: Number(e.target.value) })}
              />
              <label>Color</label>
              <input
                className="input"
                type="color"
                value={selected.color || "#0b2e66"}
                onChange={(e) => setSelected({ ...selected, color: e.target.value })}
              />
              <label>Group Name</label>
              <input
                className="input"
                value={selected.group_name || ""}
                onChange={(e) => setSelected({ ...selected, group_name: e.target.value })}
              />
              <label>Group Index</label>
              <input
                className="input"
                type="number"
                value={selected.group_index ?? ''}
                onChange={(e) => setSelected({ ...selected, group_index: Number(e.target.value) })}
              />
              <div style={{marginTop:12}}>
                <button className="btn primary" onClick={() => updatePoi(selected)}>
                  Save
                </button>
                <button className="btn danger" style={{marginLeft:8}} onClick={() => deletePoi(selected)}>
                  Delete
                </button>
                <button className="btn" style={{marginLeft:8}} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Builded;


