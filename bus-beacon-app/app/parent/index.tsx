import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/CognitoAuthContext';
import { useLocation } from '../../context/LocationContext';
import { COLORS, COMMON_STYLES } from '../../constants/AppStyles';

export default function ParentHomeScreen() {
  const { user, logout } = useAuth();
  const { getChildrenBuses, busLocations } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [childrenBuses, setChildrenBuses] = useState(getChildrenBuses());
  const [selectedChild, setSelectedChild] = useState(childrenBuses[0]?.childName || '');
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  // Format current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    setChildrenBuses(getChildrenBuses());
    if (!selectedChild && childrenBuses.length > 0) {
      setSelectedChild(childrenBuses[0].childName);
    }
  }, [busLocations]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Simulate a refresh
    setTimeout(() => {
      setChildrenBuses(getChildrenBuses());
      setRefreshing(false);
    }, 1000);
  }, []);
  
  const formatTimeElapsed = (lastUpdatedStr: string) => {
    const lastUpdated = new Date(lastUpdatedStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastUpdated.toLocaleDateString();
  };
  
  // Get selected child's bus information
  const getSelectedChildBus = () => {
    return childrenBuses.find(item => item.childName === selectedChild);
  };
  
  const selectedChildBus = getSelectedChildBus();
  
  // Update map region when a bus is selected
  useEffect(() => {
    if (selectedChildBus && 'location' in selectedChildBus.bus) {
      const { latitude, longitude } = selectedChildBus.bus.location;
      setCurrentRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [selectedChild, selectedChildBus]);
  
  const getBusStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return { color: COLORS.success, text: 'Active' };
      case 'inactive':
        return { color: COLORS.error, text: 'Inactive' };
      default:
        return { color: COLORS.warning, text: 'Unknown' };
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary} 
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.nameText}>{user?.name || 'Parent'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        {childrenBuses.length > 0 ? (
          <>
            {childrenBuses.length > 1 && (
              <View style={styles.tabsContainer}>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabs}
                >
                  {childrenBuses.map((item) => (
                    <TouchableOpacity
                      key={item.childName}
                      style={[
                        styles.tab,
                        selectedChild === item.childName && styles.activeTab
                      ]}
                      onPress={() => setSelectedChild(item.childName)}
                    >
                      <Text 
                        style={[
                          styles.tabText,
                          selectedChild === item.childName && styles.activeTabText
                        ]}
                      >
                        {item.childName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {selectedChildBus && (
              <>
                <View style={styles.mapContainer}>
                  {'location' in selectedChildBus.bus ? (
                    <MapView
                      style={styles.map}
                      initialRegion={currentRegion}
                      region={currentRegion}
                    >
                      <Marker
                        coordinate={{
                          latitude: selectedChildBus.bus.location.latitude,
                          longitude: selectedChildBus.bus.location.longitude,
                        }}
                        title={`Bus ${selectedChildBus.bus.id}`}
                        description={selectedChildBus.bus.driverName}
                      >
                        <View style={styles.markerContainer}>
                          <View style={[
                            styles.marker,
                            { backgroundColor: COLORS.primary }
                          ]}>
                            <Ionicons name="bus" size={16} color="#000" />
                          </View>
                        </View>
                      </Marker>
                    </MapView>
                  ) : (
                    <View style={styles.placeholderMap}>
                      <Text style={styles.noLocationText}>
                        Bus location not available
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <View>
                      <Text style={styles.infoTitle}>
                        {selectedChild}'s Bus
                      </Text>
                      {'id' in selectedChildBus.bus && (
                        <Text style={styles.busIdText}>
                          Bus {selectedChildBus.bus.id}
                        </Text>
                      )}
                    </View>
                    
                    {'status' in selectedChildBus.bus && (
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getBusStatusIndicator(selectedChildBus.bus.status).color }
                      ]}>
                        <Text style={styles.statusText}>
                          {getBusStatusIndicator(selectedChildBus.bus.status).text}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {'driverName' in selectedChildBus.bus && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Driver:</Text>
                      <Text style={styles.infoValue}>{selectedChildBus.bus.driverName}</Text>
                    </View>
                  )}
                  
                  {'name' in selectedChildBus.bus && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Route:</Text>
                      <Text style={styles.infoValue}>{selectedChildBus.bus.name}</Text>
                    </View>
                  )}
                  
                  {'estimatedArrival' in selectedChildBus.bus && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Estimated Arrival:</Text>
                      <Text style={styles.infoValue}>{selectedChildBus.bus.estimatedArrival}</Text>
                    </View>
                  )}
                  
                  {'lastUpdated' in selectedChildBus.bus && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Updated:</Text>
                      <Text style={styles.infoValue}>
                        {formatTimeElapsed(selectedChildBus.bus.lastUpdated)}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="bus-outline" size={64} color={COLORS.primary} />
            <Text style={styles.emptyStateText}>No buses assigned to your children</Text>
          </View>
        )}
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Time</Text>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeNote}>Bus location updates every few minutes</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 10,
  },
  tabsContainer: {
    marginVertical: 16,
  },
  tabs: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#222222',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
  },
  mapContainer: {
    height: 250,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noLocationText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoCard: {
    ...COMMON_STYLES.card,
    marginHorizontal: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  busIdText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    ...COMMON_STYLES.card,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  timeNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});