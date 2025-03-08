import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { 
  supabase, 
  updateBusLocation, 
  getChildrenWithBuses, 
  subscribeToLocationUpdates, 
  calculateEstimatedArrival 
} from '../lib/supabase';
import { LocationCoords, ChildBusInfo } from '../lib/types';

type LocationContextType = {
  driverLocation: LocationCoords | null;
  childrenBuses: ChildBusInfo[];
  busLocations: any[];
  getChildrenBuses: () => ChildBusInfo[];
  refreshChildrenBuses: () => Promise<void>;
  hasLocationPermission: boolean | null;
  isTrackingActive: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDriver, isParent } = useAuth();
  const [driverLocation, setDriverLocation] = useState<LocationCoords | null>(null);
  const [childrenBuses, setChildrenBuses] = useState<ChildBusInfo[]>([]);
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  
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
  
  // Handle driver location tracking
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    
    const startLocationTracking = async () => {
      if (isDriver && user?.isActive && locationPermission && user.busId) {
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
          
          // Send location to Supabase
          await updateBusLocation(user.busId, location.latitude, location.longitude);
          
          // Watch location changes
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 10, // Update every 10 meters
              timeInterval: 5000,   // Or at least every 5 seconds
            },
            async (newLocation) => {
              const updatedLocation = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              
              setDriverLocation(updatedLocation);
              
              // Send location to Supabase
              await updateBusLocation(user.busId!, updatedLocation.latitude, updatedLocation.longitude);
            }
          );
          
          setLocationSubscription(subscription);
        } catch (error) {
          console.log('Error starting location tracking', error);
        }
      }
    };
    
    if (isDriver && user?.isActive && user.busId) {
      startLocationTracking();
    }
    
    // Cleanup location tracking when component unmounts or driver clocks out
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isDriver, user?.isActive, locationPermission, user?.busId]);
  
  // When driver clocks out, stop location tracking
  useEffect(() => {
    if (!user?.isActive && locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  }, [user?.isActive, locationSubscription]);
  
  // Handle parent location monitoring
  useEffect(() => {
    if (!isParent || !user) return;
    
    // Initial fetch
    refreshChildrenBuses();
    
    // Set up subscription for real-time updates
    const subscription = subscribeToLocationUpdates(() => {
      refreshChildrenBuses();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [isParent, user]);
  
  // Function to fetch children's buses for parents
  const refreshChildrenBuses = async () => {
    if (!isParent || !user) return;
    
    try {
      const busesData = await getChildrenWithBuses(user.id);
      setBusLocations(busesData);
      
      const mappedBuses = busesData.map((busInfo: any) => ({
        childName: busInfo.child_name,
        bus: {
          id: busInfo.bus_id,
          name: busInfo.bus_name,
          location: {
            latitude: busInfo.latitude,
            longitude: busInfo.longitude,
          },
          driverName: busInfo.driver_name || 'Unknown Driver',
          status: busInfo.status || 'inactive',
          lastUpdated: busInfo.last_updated || new Date().toISOString(),
          estimatedArrival: busInfo.estimated_arrival || calculateEstimatedArrival(),
        }
      }));
      
      setChildrenBuses(mappedBuses);
    } catch (error) {
      console.error('Error fetching children buses:', error);
    }
  };
  
  // Helper function to get children's buses (for components)
  const getChildrenBuses = () => {
    return childrenBuses;
  };
  
  return (
    <LocationContext.Provider value={{
      driverLocation,
      childrenBuses,
      busLocations,
      getChildrenBuses,
      refreshChildrenBuses,
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