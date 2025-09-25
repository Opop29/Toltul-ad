import React, { useEffect, useState } from "react";
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
} from "@ionic/react";
import {
  barChartOutline,
  locationOutline,
  calendarOutline,
  colorPaletteOutline,
  statsChartOutline,
  trendingUpOutline,
  mapOutline,
  timeOutline,
} from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import "../css/Home.css";
interface MarkType {
  id: number;
  value: string;
  label: string;
  category: string;
}

interface Marker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  mark_type: string;
  color: string;
  height: number;
  dates: any[]; // JSONB array
  created_at: string;
  updated_at: string;
  group_name?: string;
  group_index?: number;
}


interface ReportStats {
  totalMarkers: number;
  totalGroups: number;
  markersByType: { [key: string]: number };
  markersByColor: { [key: string]: number };
  markersByCategory: { [key: string]: number };
  recentActivity: Marker[];
  topLocations: { coords: string; count: number }[];
  dateDistribution: { month: string; count: number }[];
  averageHeight: number;
}

const Report: React.FC = () => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useIonViewDidEnter(() => {
    loadReportData();
  });

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get mark types for category mapping
      const { data: markTypes, error: markTypesError } = await supabase
        .from("mark_types")
        .select("*");

      if (markTypesError) throw markTypesError;

      // Create type to category map
      const typeToCategory: { [key: string]: string } = {};
      markTypes?.forEach(mt => {
        typeToCategory[mt.value] = mt.category;
      });

      // Get total markers count
      const { data: markers, error: markersError } = await supabase
        .from("ar_pois")
        .select("*");

      if (markersError) throw markersError;

      // Calculate statistics
      const totalMarkers = markers?.length || 0;

      // Sort markers for recent activity
      const sortedMarkers = markers
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

      const recentActivity = sortedMarkers.slice(0, 10);

      // Initialize counters
      const markersByType: { [key: string]: number } = {};
      const markersByColor: { [key: string]: number } = {};
      const markersByCategory: { [key: string]: number } = {};
      const locationGroups: { [key: string]: number } = {};
      const dateGroups: { [key: string]: number } = {};
      let totalGroups = 0;
      let totalHeight = 0;

      // Process all markers in a single loop for performance
      markers?.forEach(marker => {
        // Count by type
        const type = marker.mark_type || 'Unknown';
        markersByType[type] = (markersByType[type] || 0) + 1;

        // Count by color
        const color = marker.color || '#007cf0';
        markersByColor[color] = (markersByColor[color] || 0) + 1;

        // Count by category
        const category = typeToCategory[type] || 'Other';
        markersByCategory[category] = (markersByCategory[category] || 0) + 1;

        // Count groups
        if (marker.group_name) totalGroups++;

        // Sum heights for average
        totalHeight += marker.height || 1;

        // Location distribution
        const lat = Math.round(marker.lat * 10) / 10;
        const lng = Math.round(marker.lng * 10) / 10;
        const key = `${lat},${lng}`;
        locationGroups[key] = (locationGroups[key] || 0) + 1;

        // Date distribution
        const date = new Date(marker.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        dateGroups[monthKey] = (dateGroups[monthKey] || 0) + 1;
      });

      const averageHeight = totalMarkers > 0 ? totalHeight / totalMarkers : 0;

      const topLocations = Object.entries(locationGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([coords, count]) => ({ coords, count }));

      const dateDistribution = Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      setStats({
        totalMarkers,
        totalGroups,
        markersByType,
        markersByColor,
        markersByCategory,
        recentActivity,
        topLocations,
        dateDistribution,
        averageHeight,
      });

    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadReportData();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getColorName = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      '#007cf0': 'Blue',
      '#00dfd8': 'Teal',
      '#ffc107': 'Yellow',
      '#dc3545': 'Red',
      '#28a745': 'Green',
      '#6f42c1': 'Purple',
      '#fd7e14': 'Orange',
      '#6c757d': 'Gray',
    };
    return colorMap[hexColor] || hexColor;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Reports & Analytics</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="home-content">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading report data...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Reports & Analytics</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="home-content">
          <div className="loading-container">
            <IonIcon icon={statsChartOutline} size="large" color="danger" />
            <h3>Error Loading Reports</h3>
            <p>{error}</p>
            <button className="btn" onClick={loadReportData}>Try Again</button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Reports & Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* EPIC BACKGROUND ANIMATIONS */}
        <div className="floating-shapes">
          <div className="shape-1"></div>
          <div className="shape-2"></div>
          <div className="shape-3"></div>
          <div className="shape-4"></div>
          <div className="shape-5"></div>
        </div>
        <div className="wave-overlay"></div>

        {/* Main Dashboard Container */}
        <div className="dashboard-container">

          {/* Hero Section */}
          <div className="dashboard-section hero-section">
            <div className="home-hero">
              <div className="floating-particles"></div>
              <div className="hero-content">
                <div className="hero-logo">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp9gZnSEdoA-GxkfjMOZy_NaQPGNM2OIRu9jysFNX_g3kY3zqYz8ii8sVO7-FbywES96A&usqp=CAU" alt="Logo" className="app-logo enhanced-logo" />
                </div>
                <h1 className="home-title">
                  <span className="title-main">📊 Analytics</span>
                  <span className="title-accent">& Reports</span>
                </h1>
                <div className="hero-taglines">
                  <p className="tagline-primary">Comprehensive insights into your AR marker ecosystem</p>
                  <p className="tagline-secondary">📈 Analyze • Track • Optimize</p>
                  <p className="tagline-tertiary">📊 Data-driven decisions for better AR experiences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Section */}
          <div className="dashboard-section stats-section">
            <div className="section-header">
              <h2 className="section-title">📈 Key Metrics</h2>
              <p className="section-subtitle">Essential statistics and performance indicators</p>
            </div>
            <div className="section-content">
              <IonGrid className="stats-grid">
                <IonRow>
                  <IonCol size="6" sizeMd="6" sizeLg="3">
                    <IonCard className="stat-card total-markers">
                      <IonCardContent>
                        <div className="stat-icon">
                          <IonIcon icon={locationOutline} />
                        </div>
                        <div className="stat-content">
                          <h2>{stats?.totalMarkers || 0}</h2>
                          <p>Total Markers</p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="6" sizeMd="6" sizeLg="3">
                    <IonCard className="stat-card marker-types">
                      <IonCardContent>
                        <div className="stat-icon">
                          <IonIcon icon={barChartOutline} />
                        </div>
                        <div className="stat-content">
                          <h2>{Object.keys(stats?.markersByType || {}).length}</h2>
                          <p>Marker Types</p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="6" sizeMd="6" sizeLg="3">
                    <IonCard className="stat-card recent-activity">
                      <IonCardContent>
                        <div className="stat-icon">
                          <IonIcon icon={timeOutline} />
                        </div>
                        <div className="stat-content">
                          <h2>{stats?.totalGroups || 0}</h2>
                          <p>Grouped Markers</p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="6" sizeMd="6" sizeLg="3">
                    <IonCard className="stat-card quick-actions">
                      <IonCardContent>
                        <div className="stat-icon">
                          <IonIcon icon={colorPaletteOutline} />
                        </div>
                        <div className="stat-content">
                          <h2>{Object.keys(stats?.markersByColor || {}).length}</h2>
                          <p>Color Variations</p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="6" sizeMd="6" sizeLg="3">
                    <IonCard className="stat-card total-markers">
                      <IonCardContent>
                        <div className="stat-icon">
                          <IonIcon icon={trendingUpOutline} />
                        </div>
                        <div className="stat-content">
                          <h2>{stats?.averageHeight ? stats.averageHeight.toFixed(1) : '0'}</h2>
                          <p>Average Height</p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          </div>

          {/* Analytics Charts Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">📊 Detailed Analytics</h2>
              <p className="section-subtitle">In-depth analysis of your AR marker data</p>
            </div>
            <div className="section-content">
              <IonGrid>
                <IonRow>
                  {/* Marker Types Distribution */}
                  <IonCol size="12" sizeLg="6">
                    <IonCard className="action-card">
                      <IonCardContent>
                        <div className="action-content">
                          <IonIcon icon={barChartOutline} />
                          <div>
                            <h3>Marker Types Distribution</h3>
                            <p>Breakdown of markers by type</p>
                          </div>
                        </div>
                        <div className="chart-container" style={{marginTop: '16px'}}>
                          {Object.entries(stats?.markersByType || {}).map(([type, count]) => (
                            <div key={type} className="chart-item" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                              <div className="chart-label" style={{flex: 1, fontSize: '14px'}}>{type}</div>
                              <div className="chart-bar" style={{flex: 2, height: '8px', background: '#e0e0e0', borderRadius: '4px', margin: '0 8px'}}>
                                <div
                                  className="chart-fill"
                                  style={{
                                    width: `${(count / (stats?.totalMarkers || 1)) * 100}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #007cf0, #00dfd8)',
                                    borderRadius: '4px'
                                  }}
                                ></div>
                              </div>
                              <div className="chart-value" style={{width: '30px', textAlign: 'right', fontSize: '14px'}}>{count}</div>
                            </div>
                          ))}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  {/* Color Distribution */}
                  <IonCol size="12" sizeLg="6">
                    <IonCard className="action-card">
                      <IonCardContent>
                        <div className="action-content">
                          <IonIcon icon={colorPaletteOutline} />
                          <div>
                            <h3>Color Distribution</h3>
                            <p>Markers grouped by color</p>
                          </div>
                        </div>
                        <div className="color-distribution" style={{marginTop: '16px'}}>
                          {Object.entries(stats?.markersByColor || {}).map(([color, count]) => (
                            <div key={color} className="color-item" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                              <div
                                className="color-swatch"
                                style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: color, marginRight: '12px' }}
                              ></div>
                              <span className="color-name" style={{flex: 1}}>{getColorName(color)}</span>
                              <span className="color-count">{count} markers</span>
                            </div>
                          ))}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>

                <IonRow>
                  {/* Recent Activity */}
                  <IonCol size="12" sizeLg="6">
                    <IonCard className="action-card">
                      <IonCardContent>
                        <div className="action-content">
                          <IonIcon icon={timeOutline} />
                          <div>
                            <h3>Recent Activity</h3>
                            <p>Latest marker additions</p>
                          </div>
                        </div>
                        <div className="activity-list" style={{marginTop: '16px'}}>
                          {stats?.recentActivity.slice(0, 5).map((marker, index) => (
                            <div key={marker.id || index} className="activity-item" style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                              <div className="activity-icon" style={{marginRight: '12px'}}>
                                <IonIcon icon={locationOutline} />
                              </div>
                              <div className="activity-content">
                                <div className="activity-title" style={{fontWeight: '600', fontSize: '14px'}}>{marker.label}</div>
                                <div className="activity-meta" style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>
                                  {marker.mark_type} • {formatDate(marker.created_at)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  {/* Top Locations */}
                  <IonCol size="12" sizeLg="6">
                    <IonCard className="action-card">
                      <IonCardContent>
                        <div className="action-content">
                          <IonIcon icon={trendingUpOutline} />
                          <div>
                            <h3>Popular Locations</h3>
                            <p>Most active marker areas</p>
                          </div>
                        </div>
                        <div className="location-list" style={{marginTop: '16px'}}>
                          {stats?.topLocations.map((location, index) => (
                            <div key={index} className="location-item" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                              <div className="location-rank" style={{width: '30px', fontWeight: 'bold', color: '#60a5fa'}}>#{index + 1}</div>
                              <div className="location-content" style={{flex: 1}}>
                                <div className="location-coords" style={{fontSize: '14px'}}>{location.coords}</div>
                                <div className="location-count" style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>{location.count} markers</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>

                {/* Date Distribution Timeline */}
                <IonRow>
                  <IonCol size="12">
                    <IonCard className="action-card">
                      <IonCardContent>
                        <div className="action-content">
                          <IonIcon icon={calendarOutline} />
                          <div>
                            <h3>Marker Creation Timeline</h3>
                            <p>Monthly marker creation trends</p>
                          </div>
                        </div>
                        <div className="timeline-container" style={{marginTop: '16px'}}>
                          {stats?.dateDistribution.map((item, index) => (
                            <div key={item.month} className="timeline-item" style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                              <div className="timeline-month" style={{width: '80px', fontSize: '14px'}}>{item.month}</div>
                              <div className="timeline-bar" style={{flex: 1, height: '12px', background: '#e0e0e0', borderRadius: '6px', margin: '0 12px'}}>
                                <div
                                  className="timeline-fill"
                                  style={{
                                    width: `${Math.max((item.count / (stats?.totalMarkers || 1)) * 100, 5)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #43e97b, #38f9d7)',
                                    borderRadius: '6px'
                                  }}
                                ></div>
                              </div>
                              <div className="timeline-count" style={{width: '30px', textAlign: 'right', fontSize: '14px'}}>{item.count}</div>
                            </div>
                          ))}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Report;


