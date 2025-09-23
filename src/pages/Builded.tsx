
import React, { useEffect, useState, useRef } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonDatetime, IonModal, IonInput, IonSelect, IonSelectOption, IonIcon, IonButton } from "@ionic/react";
import { checkmark, close } from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';
import { supabase } from "../utils/supabaseClient";
import "../css/Builded.css";

type POI = {
  id?: number;
  lat: number;
  lng: number;
  label: string;
  mark_type: string;
  color: string;
  height: number;
  dates?: string[];
  group_name?: string;
  group_index?: number;
  editing?: boolean;
};

const Builded: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [mapLocation, setMapLocation] = useState<POI | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMarkerLabel, setNewMarkerLabel] = useState<string>('');
  const [newMarkerMarkType, setNewMarkerMarkType] = useState<string>('');
  const [newMarkerColor, setNewMarkerColor] = useState<string>('#007cf0');
  const [newMarkerLat, setNewMarkerLat] = useState<string>('');
  const [newMarkerLng, setNewMarkerLng] = useState<string>('');
  const [showPermanentMarks, setShowPermanentMarks] = useState<boolean>(true);
  const [showGroupMarks, setShowGroupMarks] = useState<boolean>(true);
  const [showDatedMarks, setShowDatedMarks] = useState<boolean>(true);
  const [markTypeOptions, setMarkTypeOptions] = useState<any[]>([]);


  useEffect(() => {
    fetchPois();
    loadMarkTypes();
  }, []);

  const loadMarkTypes = async () => {
    const { data, error } = await supabase.from('mark_types').select('value, label').order('label');
    if (error) {
      console.error('Error loading mark types:', error);
    } else {
      setMarkTypeOptions(data || []);
    }
  };

  useEffect(() => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    if (mapLocation && mapContainer.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [mapLocation.lng, mapLocation.lat],
        zoom: 15
      });

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${mapLocation.label}</strong><br>Lat: ${mapLocation.lat}<br>Lng: ${mapLocation.lng}${mapLocation.group_name ? `<br>Group: ${mapLocation.group_name} #${mapLocation.group_index}` : ''}`);
      if (mapLocation.group_index) {
        // For group markers, use custom element with number
        const el = document.createElement('div');
        el.style.backgroundColor = mapLocation.color || '#007cf0';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '12px';
        el.style.fontWeight = 'bold';
        el.style.color = 'white';
        el.textContent = mapLocation.group_index.toString();
        el.setAttribute('aria-label', 'Map marker');
        new mapboxgl.Marker({ element: el })
          .setLngLat([mapLocation.lng, mapLocation.lat])
          .setPopup(popup)
          .addTo(map.current);
      } else {
        // For other markers, use default marker
        new mapboxgl.Marker({ color: mapLocation.color || '#007cf0' })
          .setLngLat([mapLocation.lng, mapLocation.lat])
          .setPopup(popup)
          .addTo(map.current);
      }
    }
  }, [mapLocation]);

  async function fetchPois() {
    const { data, error } = await supabase
      .from("ar_pois")
      .select("id, lat, lng, label, mark_type, color, height, dates, group_name, group_index");
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
       label: p.label,
       mark_type: p.mark_type,
       color: p.color,
       height: p.height,
       lat: p.lat,
       lng: p.lng,
     })
     .eq("id", p.id);

   fetchPois();
   setSelected(null);
 }

  async function setCoords(p: POI) {
    if (!p.id) return;
    const lat = prompt("Set latitude:", p.lat.toString());
    const lon = prompt("Set longitude:", p.lng.toString());
    if (!lat || !lon) return;
    await supabase
      .from("ar_pois")
      .update({ lat: Number(lat), lng: Number(lon) })
      .eq("id", p.id);
    fetchPois();
  }

  async function deletePoi(p: POI) {
  if (!p.id) return;
  await supabase
    .from("ar_pois")
    .delete()
    .eq("id", p.id);
  fetchPois();
  setSelected(null);
}


  // Select all checkbox handler
  useEffect(() => {
    if (selectAll) {
      setCheckedIds(getFilteredPois().map(p => p.id!));
    } else {
      setCheckedIds([]);
    }
  }, [selectAll, pois, showPermanentMarks, showGroupMarks, showDatedMarks]);

  // Individual checkbox handler
  const handleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

 async function deleteSelected() {
  if (checkedIds.length === 0) return;
  await supabase
    .from("ar_pois")
    .delete()
    .in("id", checkedIds);
  fetchPois();
  setCheckedIds([]);
  setSelectAll(false);
}


async function deleteAll() {
  const filtered = getFilteredPois();
  if (filtered.length === 0) return;
  await supabase
    .from("ar_pois")
    .delete()
    .in("id", filtered.map(p => p.id ?? ""));
  fetchPois();
  setCheckedIds([]);
  setSelectAll(false);
}

const getFilteredPois = () => {
  return pois.filter(poi => {
    const isGroup = !!poi.group_name;
    const isDated = poi.dates && poi.dates.length > 0 && !isGroup;
    const isPermanent = !poi.dates || poi.dates.length === 0 && !isGroup;

    const matchesCategory = (showGroupMarks && isGroup) ||
                            (showDatedMarks && isDated) ||
                            (showPermanentMarks && isPermanent);

    return matchesCategory;
  });
};

const handleSaveNewMarker = async () => {
  if (!newMarkerLabel || !newMarkerMarkType || !newMarkerLat || !newMarkerLng) {
    alert('Please fill all fields');
    return;
  }
  const { error } = await supabase.from('ar_pois').insert({
    lat: parseFloat(newMarkerLat),
    lng: parseFloat(newMarkerLng),
    label: newMarkerLabel,
    mark_type: newMarkerMarkType,
    color: newMarkerColor,
    height: 1,
  });
  if (error) {
    console.error('Error saving marker:', error);
  } else {
    setShowAddModal(false);
    setNewMarkerLabel('');
    setNewMarkerMarkType('');
    setNewMarkerColor('#007cf0');
    setNewMarkerLat('');
    setNewMarkerLng('');
    fetchPois();
  }
};


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
          <div className="calendar-container">
            <div className="builded-card">
              <h3>Calendar</h3>
              <IonDatetime
                presentation="date"
                value={selectedDate}
                onIonChange={(e) => setSelectedDate(e.detail.value as string)}
              />
            </div>
          </div>
          <div className="details-container">
            {selected ? (
              <div className="builded-card">
                <h4>Marker Details</h4>
                <p><strong>Mark Type:</strong> {selected.mark_type}</p>
                <p><strong>Color:</strong> <span style={{backgroundColor: selected.color, display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '8px'}}></span> {selected.color}</p>
                <p><strong>Label:</strong> {selected.label}</p>
                <p><strong>Coordinates:</strong> {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
                <p><strong>Height:</strong> {selected.height}m</p>
                <div style={{marginTop:12}}>
                  <button className="btn edit" onClick={() => setSelected({ ...selected, editing: true })}>Edit</button>
                  <button className="btn" style={{marginLeft:8}} onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            ) : (
              <div className="builded-card">
                <h4>Marker Details</h4>
                <p>Select a marker to view details</p>
              </div>
            )}
            {selected && (selected as any).editing && (
              <div className="builded-card">
                <h4>Edit Marker</h4>
                <label>Label</label>
                <input
                  className="input"
                  value={selected.label}
                  onChange={(e) => setSelected({ ...selected, label: e.target.value })}
                />
                <label>Mark Type</label>
                <select
                  className="input"
                  value={selected.mark_type}
                  onChange={(e) => setSelected({ ...selected, mark_type: e.target.value })}
                >
                  <option value="building">Building</option>
                  <option value="department">Department</option>
                  <option value="events">Events</option>
                  <option value="rooms">Rooms</option>
                  <option value="hazard">Hazard</option>
                </select>
                <label>Color</label>
                <input
                  className="input"
                  type="color"
                  value={selected.color}
                  onChange={(e) => setSelected({ ...selected, color: e.target.value })}
                />
                <label>Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.00001"
                  value={selected.lat}
                  onChange={(e) => setSelected({ ...selected, lat: Number(e.target.value) })}
                />
                <label>Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.00001"
                  value={selected.lng}
                  onChange={(e) => setSelected({ ...selected, lng: Number(e.target.value) })}
                />
                <label>Height (m)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={selected.height}
                  onChange={(e) => setSelected({ ...selected, height: Number(e.target.value) })}
                />
                <div style={{marginTop:12}}>
                  <button className="btn primary" onClick={() => updatePoi(selected)}>
                    Save
                  </button>
                  <button className="btn danger" style={{marginLeft:8}} onClick={() => deletePoi(selected)}>
                    Delete
                  </button>
                  <button className="btn" style={{marginLeft:8}} onClick={() => setSelected({ ...selected, editing: false })}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="list-container">
            <div className="builded-card">
              <h3>All Saved Markers</h3>
              <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:12}}>
                <div style={{display:'flex', gap:8}}>
                  <label><input type="checkbox" checked={showPermanentMarks} onChange={e => setShowPermanentMarks(e.target.checked)} /> Permanent</label>
                  <label><input type="checkbox" checked={showGroupMarks} onChange={e => setShowGroupMarks(e.target.checked)} /> Groups</label>
                  <label><input type="checkbox" checked={showDatedMarks} onChange={e => setShowDatedMarks(e.target.checked)} /> Dated</label>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <label><input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} /> Select All</label>
                  <button className="btn danger" onClick={deleteAll}>Delete All</button>
                  <button className="btn danger" onClick={deleteSelected} disabled={checkedIds.length === 0}>Delete Selected</button>
                </div>
              </div>
              <div className="poi-list">
                {getFilteredPois().map((p) => (
                  <div key={p.id} className="poi-item">
                    <input type="checkbox" checked={checkedIds.includes(p.id!)} onChange={() => handleCheck(p.id!)} style={{marginRight:8}} />
                    <div className="poi-meta">
                      <span className="poi-label">{p.label}</span>
                      <span className="poi-coords">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                      <span className="poi-type">{p.mark_type}</span>
                      <span className="poi-color" style={{backgroundColor: p.color, display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '8px'}}></span>
                      <span className="poi-height">Height: {p.height}m</span>
                    </div>
                    <div className="poi-actions">
                      <button className="btn view" onClick={() => setSelected(p)}>Details</button>
                      <button className="btn edit" onClick={() => setSelected({ ...p, editing: true })}>Edit</button>
                      <button className="btn view" onClick={() => setMapLocation(p)}>View</button>
                      <button className="btn danger" onClick={() => deletePoi(p)}>Delete</button>
                    </div>
                  </div>
                ))}
                {pois.length === 0 && <div className="empty">No markers saved yet.</div>}
              </div>
            </div>
          </div>
          <div className="map-container">
            <div className="builded-card">
              <h3>Map View</h3>
              {mapLocation ? (
                <div ref={mapContainer} style={{height: '400px'}} />
              ) : (
                <div style={{height: '400px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <p>Map integration placeholder</p>
                  <p>Select a marker to view on map</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)} onDidPresent={() => {
        setTimeout(() => {
          const input = document.querySelector('ion-input input') as HTMLInputElement;
          if (input) input.focus();
        }, 100);
      }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add Marker</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonInput value={newMarkerLabel} onIonChange={e => setNewMarkerLabel(e.detail.value!)} placeholder="Enter marker label" />
          <IonSelect value={newMarkerMarkType} placeholder="Select mark type" onIonChange={e => setNewMarkerMarkType(e.detail.value!)}>
            {markTypeOptions.map(option => (
              <IonSelectOption key={option.value} value={option.value}>{option.label}</IonSelectOption>
            ))}
          </IonSelect>
          <input type="color" value={newMarkerColor} onChange={e => setNewMarkerColor(e.target.value)} style={{width: '100%', height: '40px'}} />
          <IonInput type="number" value={newMarkerLat} onIonChange={e => setNewMarkerLat(e.detail.value!)} placeholder="Latitude" />
          <IonInput type="number" value={newMarkerLng} onIonChange={e => setNewMarkerLng(e.detail.value!)} placeholder="Longitude" />
          <IonButton expand="full" onClick={handleSaveNewMarker} color="primary">
            <IonIcon icon={checkmark} slot="start" />
            Done
          </IonButton>
          <IonButton expand="full" onClick={() => setShowAddModal(false)} color="danger">
            <IonIcon icon={close} slot="start" />
            Cancel
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Builded;


