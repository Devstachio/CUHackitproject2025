import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { 
  supabase, 
  updateBusLocation, 
  getChildrenWithBuses, 
  calculateEstimatedArrival 
} from '../lib/supabase';
import { 
  setupYjsConnection, 
  updateLocation as updateYjsLocation,
  subscribeToLocationUpdates,
  setupLocationSubscription
} from '../Utils/yjsUtils';
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
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(false);
  
  const locationSubscriptionRef = useRef<any>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const yjsConnectionRef = useRef<any>(null);
  
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
  
  // Clean up subscriptions when component unmounts
  useEffect(() => {
    return () => {
      // Clean up location watcher
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
      
      // Clean up YJS connection
      if (yjsConnectionRef.current) {
        yjsConnectionRef.current.destroy();
        yjsConnectionRef.current = null;
      }
      
      // Clean up location subscription
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current();
        locationSubscriptionRef.current = null;
      }
    };
  }, []);
  
  // Handle driver location tracking
  useEffect(() => {
    const startDriverLocationTracking = async () => {
      // Only proceed if this is a driver, they're active, have location permission, and a busId
      if (!(isDriver && user?.isActive && locationPermission && user.busId)) {
        setIsTrackingActive(false);
        return;
      }
      
      try {
        // Clean up any existing watchers
        if (locationWatcherRef.current) {
          locationWatcherRef.current.remove();
        }
        
        // Set up YJS connection if not already established
        if (!yjsConnectionRef.current) {
          yjsConnectionRef.current = await setupYjsConnection(user.busId);
        }
        
        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const location = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        };
        
        setDriverLocation(location);
        
        // Send initial location to both Supabase and YJS
        await updateBusLocation(user.busId, location.latitude, location.longitude);
        await updateYjsLocation(yjsConnectionRef.current, user.busId, {
          ...location,
          status: 'active'
        });
        
        // Start watching location
        locationWatcherRef.current = await Location.watchPositionAsync(
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
            
            // Send updated location to both Supabase and YJS
            await updateBusLocation(user.busId!, updatedLocation.latitude, updatedLocation.longitude);
            await updateYjsLocation(yjsConnectionRef.current, user.busId!, {
              ...updatedLocation,
              status: 'active'
            });
          }
        );
        
        setIsTrackingActive(true);
        
      } catch (error) {
        console.error('Error setting up driver location tracking:', error);
        setIsTrackingActive(false);
      }
    };
    
    // Start tracking for active drivers
    if (isDriver && user?.isActive && user.busId) {
      startDriverLocationTracking();
    } else if (isDriver && !user?.isActive) {
      // If driver clocks out, stop tracking and update status
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
      
      if (yjsConnectionRef.current && user?.busId) {
        // Update status to inactive in YJS when driver clocks out
        updateYjsLocation(yjsConnectionRef.current, user.busId, {
          ...(driverLocation || { latitude: 0, longitude: 0 }),
          status: 'inactive'
        });
      }
      
      setIsTrackingActive(false);
    }
    
    // Cleanup function
    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
    };
  }, [isDriver, user?.isActive, locationPermission, user?.busId]);
  
  // Handle parent view for children's buses
  useEffect(() => {
    const setupParentView = async () => {
      if (!isParent || !user) return;
      
      try {
        // Initial fetch of data
        await refreshChildrenBuses();
        
        // Set up Supabase subscription for parent
        const subscription = supabase
          .channel('bus_locations_changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'bus_locations'
            }, 
            () => {
              // When there's a new location, refresh the data
              refreshChildrenBuses();
            }
          )
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'buses'
            },
            () => {
              // When a bus status changes, refresh the data
              refreshChildrenBuses();
            }
          )
          .subscribe();
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up parent view:', error);
      }
    };
    
    setupParentView();
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
  
  // Helper function to get children's buses
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
      isTrackingActive,
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