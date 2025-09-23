import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonTextarea,
} from '@ionic/react';
import { chevronForward, chevronBack, add, close, checkmark } from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from "../utils/supabaseClient";
import '../css/MapMarker.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const MapMarker: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
   const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);

  const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/streets-v11');
  const [is3D, setIs3D] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(true);
  const [markerCoords, setMarkerCoords] = useState<[number, number] | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [markerLabel, setMarkerLabel] = useState<string>('');
  const [markerMarkType, setMarkerMarkType] = useState<string>('');
  const [markerColor, setMarkerColor] = useState<string>('#007cf0');
  const [markers, setMarkers] = useState<any[]>([]);
  const [showMarkersList, setShowMarkersList] = useState<boolean>(false);
  const [selectedViewType, setSelectedViewType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const markTypeOptions = [
    // Academic / Learning
    { label: 'Academic - Building', value: 'academic-building' },
    { label: 'Academic - Classroom / Lecture Hall', value: 'academic-classroom' },
    { label: 'Academic - Laboratory', value: 'academic-laboratory' },
    { label: 'Academic - Library', value: 'academic-library' },
    { label: 'Academic - Auditorium / Hall', value: 'academic-auditorium' },
    // Administrative
    { label: 'Administrative - Administration Office', value: 'admin-office' },
    { label: 'Administrative - Faculty / Department Offices', value: 'admin-faculty' },
    { label: 'Administrative - Information Desk / Help Center', value: 'admin-info' },
    // Student Facilities
    { label: 'Student Facilities - Cafeteria / Dining Hall', value: 'student-cafeteria' },
    { label: 'Student Facilities - Student Center / Lounge', value: 'student-center' },
    // Health & Safety
    { label: 'Health & Safety - Clinic / Health Center', value: 'health-clinic' },
    { label: 'Health & Safety - Security / Police Post', value: 'health-security' },
    { label: 'Health & Safety - Fire Exit / Safety Points', value: 'health-safety' },
    // Events & Activities
    { label: 'Events & Activities - Event / Meeting Room', value: 'events-room' },
    { label: 'Events & Activities - Auditorium / Theater', value: 'events-auditorium' },
    { label: 'Events & Activities - Outdoor Event Area', value: 'events-outdoor' },
    // Transport & Access
    { label: 'Transport & Access - Parking Lot', value: 'transport-parking' },
    // Miscellaneous / Services
    { label: 'Services - Wi-Fi Hotspot', value: 'services-wifi' },
    { label: 'Services - Shops / Bookstore', value: 'services-shops' },
    { label: 'Services - Restroom', value: 'services-restroom' },
  ];


  const [cameraState, setCameraState] = useState({
    center: [124.8681005804846, 8.360074137369724] as [number, number],
    zoom: 16,
    pitch: 0,
    bearing: 0,
  });

  const styles = [
    { label: 'Streets', url: 'mapbox://styles/mapbox/streets-v11' },
    { label: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
    { label: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
    { label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
    { label: 'Satellite Streets', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  ];

  const enable3D = () => {
    if (!mapRef.current) return;

    if (!mapRef.current.getSource('mapbox-dem')) {
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    }

    if (!mapRef.current.getLayer('3d-buildings')) {
      mapRef.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6,
        },
      });
    }else {
   
    mapRef.current.setLayoutProperty("3d-buildings", "visibility", "visible");
  }

    mapRef.current.flyTo({
      pitch: 60,
      bearing: -20,
      duration: 2000,
      essential: true,
    });
  };
  

  const disable3D = () => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      pitch: 0,
      bearing: 0,
      duration: 2000,
      essential: true,
    });
      if (mapRef.current.getLayer("3d-buildings")) {
    mapRef.current.setLayoutProperty("3d-buildings", "visibility", "none");
  }
   
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      try {
        setCameraState({
          center: mapRef.current.getCenter().toArray() as [number, number],
          zoom: mapRef.current.getZoom(),
          pitch: mapRef.current.getPitch(),
          bearing: mapRef.current.getBearing(),
        });
        mapRef.current.remove();
      } catch (err) {
        console.warn("Map cleanup failed:", err);
      }
      mapRef.current = null;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: cameraState.center,
      zoom: cameraState.zoom,
      pitch: cameraState.pitch,
      bearing: cameraState.bearing,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

   

    mapRef.current.on('load', () => {
      mapRef.current?.resize();
      if (is3D) {
        enable3D();
      }
      loadMarkers(); // Load markers after map is loaded
    });

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (err) {
          console.warn("Error while removing map:", err);
        }
        mapRef.current = null;
      }
    };
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (is3D) {
      enable3D();
    } else {
      disable3D();
    }
  }, [is3D]);

  useEffect(() => {
    addMarkersToMap(markers);
  }, [selectedViewType, searchQuery, markers]);

  useEffect(() => {
    if (!mapRef.current) return;
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isAddingMarker) return;
      const coords = e.lngLat.toArray() as [number, number];
      setSelectedCoords(coords);
      setShowInputModal(true);
      setIsAddingMarker(false);
    };
    if (isAddingMarker) {
      mapRef.current.on('click', handleMapClick);
    } else {
      mapRef.current.off('click', handleMapClick);
    }
    return () => {
      if (mapRef.current) mapRef.current.off('click', handleMapClick);
    };
  }, [isAddingMarker]);
 const handleAddMarker = () => {
   if (!mapRef.current) return;

   const lngLat = mapRef.current.getCenter();
   if (markerRef.current) {
     markerRef.current.remove();
   }
   markerRef.current = new mapboxgl.Marker({ color: 'red' })
     .setLngLat(lngLat)
     .addTo(mapRef.current);

   setMarkerCoords(lngLat.toArray() as [number, number]);
 };

 const loadMarkers = async () => {
   const { data, error } = await supabase.from('ar_pois').select('id, lat, lng, label, mark_type, color, height');
   if (error) {
     console.error('Error loading markers:', error);
   } else {
     setMarkers(data || []);
     addMarkersToMap(data || []);
   }
 };

 const getFilteredMarkers = () => {
   return markers.filter(marker => {
     const matchesType = selectedViewType === 'all' || marker.mark_type.startsWith(selectedViewType);
     const query = searchQuery.toLowerCase().trim();
     const matchesSearch = query === '' ||
       marker.label.toLowerCase().includes(query) ||
       marker.mark_type.toLowerCase().includes(query) ||
       marker.lat.toString().includes(query) ||
       marker.lng.toString().includes(query);
     return matchesType && matchesSearch;
   });
 };

 const addMarkersToMap = (markersData: any[]) => {
   if (!mapRef.current) return;
   // Remove existing markers
   markerRefs.current.forEach(marker => marker.remove());
   markerRefs.current = [];
   const filtered = getFilteredMarkers();
   filtered.forEach(marker => {
     const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${marker.label}</strong><br>Type: ${marker.mark_type}<br>Lat: ${marker.lat}<br>Lng: ${marker.lng}`);
     const mapMarker = new mapboxgl.Marker({ color: marker.color || '#007cf0' })
       .setLngLat([marker.lng, marker.lat])
       .setPopup(popup)
       .addTo(mapRef.current!);
     markerRefs.current.push(mapMarker);
   });
 };

 const handleSaveMarker = async () => {
   if (!selectedCoords || !markerLabel || !markerMarkType) {
     alert('Please fill all fields');
     return;
   }
   const { error } = await supabase.from('ar_pois').insert({
     lat: selectedCoords[1],
     lng: selectedCoords[0],
     label: markerLabel,
     mark_type: markerMarkType,
     color: markerColor,
   });
   if (error) {
     console.error('Error saving marker:', error);
   } else {
     setShowInputModal(false);
     setMarkerLabel('');
     setMarkerMarkType('');
     setMarkerColor('#007cf0');
     setSelectedCoords(null);
     loadMarkers();
   }
 };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Map Marker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY={false}>
        <div className="map-layout">
          <div className="map-wrapper">
            <div ref={mapContainerRef} className="map-container"></div>
          </div>

          {/* Slide Options Container */}
          <div className={`options-wrapper ${showOptions ? "open" : "closed"}`}>
            <div className="options-card">
              {/* Slide toggle button inside */}
              <IonButton
                className="slide-toggle-btn"
                onClick={() => setShowOptions(!showOptions)}
                fill="clear"
              >
                <IonIcon icon={showOptions ? chevronForward : chevronBack} />
              </IonButton>

              {showOptions && (
                <>
                  <IonItem lines="none">
                    <IonLabel>Map Style</IonLabel>
                    <IonSelect
                      value={mapStyle}
                      placeholder="Select Map Layer"
                      onIonChange={(e) => setMapStyle(e.detail.value)}
                    >
                      {styles.map((style) => (
                        <IonSelectOption key={style.url} value={style.url}>
                          {style.label}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="none">
                    <IonLabel>Enable 3D</IonLabel>
                    <IonToggle
                      checked={is3D}
                      onIonChange={(e) => setIs3D(e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem lines="none">
                    <IonLabel>View Type</IonLabel>
                    <IonSelect
                      value={selectedViewType}
                      placeholder="Select view type"
                      onIonChange={(e) => setSelectedViewType(e.detail.value)}
                    >
                      <IonSelectOption value="all">View All</IonSelectOption>
                      <IonSelectOption value="academic">Academic</IonSelectOption>
                      <IonSelectOption value="admin">Administrative</IonSelectOption>
                      <IonSelectOption value="student">Student Facilities</IonSelectOption>
                      <IonSelectOption value="health">Health & Safety</IonSelectOption>
                      <IonSelectOption value="events">Events & Activities</IonSelectOption>
                      <IonSelectOption value="transport">Transport & Access</IonSelectOption>
                      <IonSelectOption value="services">Services</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="none">
                    <IonLabel position="stacked">Search Markers</IonLabel>
                    <IonInput
                      value={searchQuery}
                      placeholder="Search by label"
                      onIonChange={(e) => setSearchQuery(e.detail.value!)}
                    />
                  </IonItem>

                  <IonButton expand="block" onClick={() => setIsAddingMarker(!isAddingMarker)}>
                    <IonIcon icon={isAddingMarker ? close : add} slot="start" />
                    {isAddingMarker ? 'Cancel Adding Marker' : 'Add Marker'}
                  </IonButton>
                  {isAddingMarker && <p style={{ textAlign: 'center', color: 'red' }}>Click on the map to place a marker</p>}

                  <IonButton expand="block" onClick={() => setShowMarkersList(!showMarkersList)}>
                    <IonIcon icon={showMarkersList ? chevronBack : chevronForward} slot="start" />
                    {showMarkersList ? 'Hide Markers' : 'View All Markers'}
                  </IonButton>

                  {showMarkersList && (
                    <div className="markers-list">
                      {getFilteredMarkers().map(marker => (
                        <div key={marker.id} className="marker-item">
                          <span className="marker-label">{marker.label}</span>
                          <IonButton
                            size="small"
                            onClick={() => {
                              if (mapRef.current) {
                                mapRef.current.flyTo({
                                  center: [marker.lng, marker.lat],
                                  zoom: 18,
                                  duration: 2000,
                                  essential: true,
                                });
                              }
                            }}
                          >
                            View
                          </IonButton>
                        </div>
                      ))}
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <IonModal isOpen={showInputModal} onDidDismiss={() => setShowInputModal(false)} onDidPresent={() => {
        // Focus the label input when modal opens
        setTimeout(() => {
          const input = document.querySelector('ion-input input') as HTMLInputElement;
          if (input) input.focus();
        }, 100);
      }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add Marker</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowInputModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonItem>
            <IonLabel position="stacked">Label</IonLabel>
            <IonInput value={markerLabel} onIonChange={e => setMarkerLabel(e.detail.value!)} placeholder="Enter marker label" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Mark Type</IonLabel>
            <IonSelect value={markerMarkType} placeholder="Select mark type" onIonChange={e => setMarkerMarkType(e.detail.value!)}>
              {markTypeOptions.map(option => (
                <IonSelectOption key={option.value} value={option.value}>{option.label}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Color</IonLabel>
            <input type="color" value={markerColor} onChange={e => setMarkerColor(e.target.value)} style={{width: '100%', height: '40px'}} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Latitude</IonLabel>
            <IonInput type="number" value={selectedCoords ? selectedCoords[1].toString() : ''} onIonChange={e => {
              const val = parseFloat(e.detail.value!);
              setSelectedCoords(prev => prev ? [prev[0], val] : null);
            }} placeholder="Latitude" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput type="number" value={selectedCoords ? selectedCoords[0].toString() : ''} onIonChange={e => {
              const val = parseFloat(e.detail.value!);
              setSelectedCoords(prev => prev ? [val, prev[1]] : null);
            }} placeholder="Longitude" />
          </IonItem>
          <IonButton expand="full" onClick={handleSaveMarker} color="primary">
            <IonIcon icon={checkmark} slot="start" />
            Done
          </IonButton>
          <IonButton expand="full" onClick={() => setShowInputModal(false)} color="danger">
            <IonIcon icon={close} slot="start" />
            Cancel
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default MapMarker;

