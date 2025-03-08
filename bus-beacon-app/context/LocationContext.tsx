import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { setupYjsConnection, updateLocation } from '../Utils/yjsUtils';

// Sample bus data
const SAMPLE_BUS_DATA = {
  'BUS001': { 
    id: 'BUS001', 
    name: 'Route A', 
    location: { latitude: 37.7749, longitude: -122.4194 },
    driverName: 'John Driver',
    status: 'active',
    lastUpdated: new Date().toISOString(),
    estimatedArrival: '8:30 AM',
  },
  'BUS002': { 
    id: 'BUS002', 
    name: 'Route B', 
    location: { latitude: 37.3352, longitude: -121.8811 },
    driverName: 'Sarah Driver',
    status: 'active',
    lastUpdated: new Date().toISOString(),
    estimatedArrival: '8:45 AM',
  },
};

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type BusInfo = {
  id: string;
  name: string;
  location: LocationCoords;
  driverName: string;
  status: string;
  lastUpdated: string;
  estimatedArrival: string;
};

type BusLocations = {
  [key: string]: BusInfo;
};

type ChildBusInfo = {
  childName: string;
  bus: BusInfo | { status: string };
};

type LocationContextType = {
  driverLocation: LocationCoords | null;
  busLocations: BusLocations;
  getChildrenBuses: () => ChildBusInfo[];
  hasLocationPermission: boolean | null;
  isTrackingActive: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDriver } = useAuth();
  const [busLocations, setBusLocations] = useState<BusLocations>(SAMPLE_BUS_DATA);
  const [driverLocation, setDriverLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [yjsDoc, setYjsDoc] = useState<any>(null);
  
  // Request location permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
      } catch (error) {
        console.log('Error requesting location permissions', error);
        setLocationPermission(false);
      }
    };
    
    requestPermissions();
  }, []);
  
  // Setup YJS connection
  useEffect(() => {
    const setupYjs = async () => {
      // Make sure user and user.busId exist before proceeding
      if (isDriver && user && typeof user.busId === 'string') {
        try {
          const doc = await setupYjsConnection(user.busId);
          setYjsDoc(doc);
        } catch (error) {
          console.log('Error setting up YJS connection:', error);
          // Don't set the YJSDoc if there's an error
        }
      }
    };
    
    setupYjs();
    
    return () => {
      // Cleanup YJS connection when component unmounts
      if (yjsDoc) {
        try {
          yjsDoc.destroy();
        } catch (error) {
          console.log('Error destroying YJS connection:', error);
        }
      }
    };
  }, [isDriver, user]);
  
  // Start/stop location tracking for driver
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    
    const startLocationTracking = async () => {
      // Make sure user, user.busId, and all necessary conditions are met
      if (isDriver && user?.isActive && locationPermission && typeof user.busId === 'string') {
        try {
          // Get initial location
          const initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          
          const location = {
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          };
          
          setDriverLocation(location);
          
          // Send to YJS - make sure yjsDoc and busId both exist
          if (yjsDoc && typeof user.busId === 'string') {
            try {
              updateLocation(yjsDoc, user.busId, {
                ...location,
                driverName: user.name,
                status: 'active',
                lastUpdated: new Date().toISOString(),
              });
            } catch (error) {
              console.log('Error updating YJS location:', error);
            }
          }
          
          // Watch location changes
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 10, // Update every 10 meters
              timeInterval: 5000,   // Or at least every 5 seconds
            },
            (newLocation) => {
              const updatedLocation = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              
              setDriverLocation(updatedLocation);
              
              // Send to YJS - make sure yjsDoc and busId both exist
              if (yjsDoc && typeof user.busId === 'string') {
                try {
                  updateLocation(yjsDoc, user.busId, {
                    ...updatedLocation,
                    driverName: user.name,
                    status: 'active',
                    lastUpdated: new Date().toISOString(),
                  });
                } catch (error) {
                  console.log('Error updating YJS location:', error);
                }
              }
              
              // Update local state with new driver location - make sure busId exists
              if (typeof user.busId === 'string') {
                setBusLocations(prev => ({
                  ...prev,
                  [user.busId as string]: {
                    ...prev[user.busId as string],
                    location: updatedLocation,
                    lastUpdated: new Date().toISOString(),
                  }
                }));
              }
            }
          );
          
          setLocationSubscription(subscription);
        } catch (error) {
          console.log('Error starting location tracking', error);
        }
      }
    };
    
    startLocationTracking();
    
    // Cleanup location tracking when component unmounts or driver clocks out
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isDriver, user?.isActive, locationPermission, yjsDoc]);
  
  // When driver clocks out, stop location tracking
  useEffect(() => {
    if (!user?.isActive && locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      
      // Update status in YJS - make sure yjsDoc, busId, and driverLocation all exist
      if (yjsDoc && user && typeof user.busId === 'string' && driverLocation) {
        try {
          updateLocation(yjsDoc, user.busId, {
            ...driverLocation,
            status: 'inactive',
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          console.log('Error updating YJS status on clock out:', error);
        }
      }
    }
  }, [user?.isActive, locationSubscription]);
  
  // Function to get bus data for parents
  const getChildrenBuses = (): ChildBusInfo[] => {
    if (!user || user.type !== 'parent' || !user.children) return [];
    
    return user.children.map(child => {
      return {
        childName: child.name,
        bus: busLocations[child.busId] || { status: 'unknown' }
      };
    });
  };
  
  return (
    <LocationContext.Provider value={{
      driverLocation,
      busLocations,
      getChildrenBuses,
      hasLocationPermission: locationPermission,
      isTrackingActive: !!locationSubscription,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

// Custom hook to use the location context
export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};