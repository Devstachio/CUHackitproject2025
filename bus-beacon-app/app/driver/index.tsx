import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  SafeAreaView
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/CognitoAuthContext';
import { useLocation } from '../../context/LocationContext';
import { COLORS, COMMON_STYLES, DARK_MAP_STYLE } from '../../constants/AppStyles';

export default function DriverHomeScreen() {
  const { user, logout, clockIn } = useAuth();
  const { driverLocation, hasLocationPermission, isTrackingActive } = useLocation();
  const [isActive, setIsActive] = useState(user?.isActive || false);
  
  // Format current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleClockInOut = async () => {
    if (!hasLocationPermission && !isActive) {
      Alert.alert(
        'Location Permission Required',
        'You need to grant location permission to clock in and track your bus.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const newActiveState = !isActive;
    
    if (!newActiveState) {
      // Confirm clock out
      Alert.alert(
        'Clock Out',
        'Are you sure you want to clock out? Location tracking will stop.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clock Out', 
            style: 'destructive',
            onPress: async () => {
              await clockIn(false);
              setIsActive(false);
            }
          }
        ]
      );
    } else {
      await clockIn(true);
      setIsActive(true);
    }
  };
  
  const handleLogout = () => {
    if (isActive) {
      Alert.alert(
        'Active Session',
        'Please clock out before logging out.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.nameText}>{user?.name || 'Driver'}</Text>
            <Text style={styles.busInfo}>Bus: {user?.busId || 'Unknown'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Driver Status</Text>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          </View>
          
          <View style={styles.statusContent}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusValue, 
                { color: isActive ? COLORS.success : COLORS.error }
              ]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Tracking:</Text>
              <Switch
                trackColor={{ false: '#767577', true: COLORS.success }}
                thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleClockInOut}
                value={isActive}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.mapContainer}>
          {driverLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              region={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              customMapStyle={DARK_MAP_STYLE}
            >
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                }}
                title={`Bus ${user?.busId || 'Unknown'}`}
                description={isActive ? 'Active' : 'Inactive'}
              >
                <View style={styles.markerContainer}>
                  <View style={[
                    styles.marker,
                    { backgroundColor: isActive ? COLORS.primary : COLORS.inactive }
                  ]}>
                    <Ionicons name="bus" size={16} color="#000" />
                  </View>
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={styles.placeholderMap}>
              {!hasLocationPermission ? (
                <Text style={styles.noLocationText}>
                  Location permission is required to track your bus
                </Text>
              ) : (
                <Text style={styles.noLocationText}>
                  {isActive ? 'Getting your location...' : 'Clock in to start tracking'}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Bus Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bus ID:</Text>
            <Text style={styles.infoValue}>{user?.busId || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Route:</Text>
            <Text style={styles.infoValue}>Route {user?.busId?.replace('BUS', '') || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tracking Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: isTrackingActive ? COLORS.success : COLORS.error }
            ]}>
              {isTrackingActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: isActive ? COLORS.error : COLORS.success }
          ]}
          onPress={handleClockInOut}
        >
          <Text style={styles.actionButtonText}>
            {isActive ? 'Clock Out' : 'Clock In'}
          </Text>
        </TouchableOpacity>
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
  busInfo: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  logoutButton: {
    padding: 10,
  },
  statusCard: {
    ...COMMON_STYLES.card,
    marginHorizontal: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statusContent: {
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
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
  actionButton: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});