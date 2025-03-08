// yjsUtils.ts
// Polyfills need to be at the top
import 'react-native-get-random-values';
// Buffer polyfill
global.Buffer = require('buffer/').Buffer;

import { supabase } from '../lib/supabase';

// Add necessary process polyfill if needed
if (typeof process === 'undefined') {
  global.process = require('process/browser');
}

export const setupYjsConnection = async (busId: string): Promise<any> => {
  try {
    // Import the YJS modules - using dynamic imports to ensure polyfills load first
    const Y = await import('yjs');
    const { WebsocketProvider } = await import('y-websocket');
    const { Awareness } = await import('y-protocols/awareness');
    
    // Create a new YJS document
    const doc = new Y.Doc();
    
    // Create a proper awareness instance
    const awareness = new Awareness(doc);
    
    // Fix the WebSocket URL
    const wsServerUrl = 'ws://54.213.236.29:8080';
    
    // Connect to the WebSocket server with proper room name
    const roomName = `bus-tracker-${busId}`;
    
    console.log(`Attempting to connect to YJS WebSocket at ${wsServerUrl} for room ${roomName}`);
    
    const provider = new WebsocketProvider(wsServerUrl, roomName, doc, {
      connect: true,
      awareness: awareness,
      params: {},
      resyncInterval: 10000,
      maxBackoffTime: 2500,
    });
    
    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      // Set a timeout for connection
      const timeout = setTimeout(() => {
        console.log('YJS connection timed out');
        reject(new Error('Connection to YJS server timed out'));
      }, 10000); // 10 seconds timeout
      
      provider.on('status', (event: { status: string }) => {
        console.log(`YJS connection status: ${event.status}`);
        if (event.status === 'connected') {
          clearTimeout(timeout);
          resolve();
        }
      });
      
      // If already connected, resolve immediately
      if (provider.wsconnected) {
        console.log('YJS connection already established');
        clearTimeout(timeout);
        resolve();
      }
      
      // Handle connection error
      provider.on('connection-error', (error: any) => {
        console.error('YJS connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log(`Connected to YJS server for bus ${busId} in room ${roomName}`);
    
    // Return the doc and provider
    return {
      doc,
      provider,
      busId,
      destroy: () => {
        console.log(`Destroying YJS connection for bus ${busId}`);
        provider.disconnect();
        doc.destroy();
      }
    };
  } catch (error) {
    console.error('Error connecting to YJS server:', error);
    throw error;
  }
};

export const updateLocation = async (
  connection: any, 
  busId: string, 
  locationData: { latitude: number; longitude: number; status: string }
): Promise<void> => {
  if (!connection || !connection.doc) {
    console.error('No YJS connection available');
    return;
  }
  
  try {
    console.log(`Updating location in YJS for bus ${busId}:`, locationData);
    
    // Get or create the location map
    const locationMap = connection.doc.getMap('locations');
    
    // Add timestamp to the location data
    const updatedLocationData = {
      ...locationData,
      timestamp: Date.now(),
    };
    
    // Update the location in YJS
    locationMap.set(busId, updatedLocationData);
    
    // Also update the location in Supabase for persistence
    await supabase.from('bus_locations').insert({
      bus_id: busId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
    
    // Also update the bus status separately
    await supabase.from('buses')
      .update({ status: locationData.status })
      .eq('id', busId);
    
    console.log(`Successfully updated location for bus ${busId}`);
  } catch (error) {
    console.error('Error updating location:', error);
  }
};

export const subscribeToLocationUpdates = (
  connection: any, 
  callback: (data: any) => void
): (() => void) => {
  if (!connection || !connection.doc) {
    console.error('No YJS connection available');
    return () => {};
  }
  
  try {
    console.log(`Setting up location subscription for bus ${connection.busId}`);
    
    // Get the location map
    const locationMap = connection.doc.getMap('locations');
    
    // Listen for changes
    const observer = () => {
      const locations = Object.fromEntries(locationMap.entries());
      console.log(`Location update received via YJS for bus ${connection.busId}:`, locations);
      callback(locations);
    };
    
    // Initial call with current data
    observer();
    
    // Subscribe to changes
    locationMap.observe(observer);
    
    console.log(`Location subscription established for bus ${connection.busId}`);
    
    // Return unsubscribe function
    return () => {
      locationMap.unobserve(observer);
      console.log(`Unsubscribed from location updates for bus ${connection.busId}`);
    };
  } catch (error) {
    console.error('Error subscribing to location updates:', error);
    return () => {};
  }
};

// Handle both YJS and Supabase for maximum reliability
export const setupLocationSubscription = async (
  busId: string,
  callback: (locationData: any) => void
) => {
  console.log(`Setting up location subscription for bus ${busId} with YJS + Supabase fallback`);
  
  let yjsConnection = null;
  let yjsUnsubscribe = () => {};
  
  try {
    // Try to set up YJS connection
    yjsConnection = await setupYjsConnection(busId);
    
    // Subscribe to YJS updates
    yjsUnsubscribe = subscribeToLocationUpdates(yjsConnection, callback);
    console.log(`YJS subscription successful for bus ${busId}`);
  } catch (error) {
    console.error(`YJS setup failed for bus ${busId}, falling back to Supabase only:`, error);
    yjsConnection = null;
  }
  
  // Set up Supabase real-time subscription as a fallback/additional source
  const supabaseSubscription = supabase
    .channel(`bus_tracker_${busId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bus_locations',
        filter: `bus_id=eq.${busId}`
      }, 
      (payload) => {
        console.log(`Location update received via Supabase for bus ${busId}:`, payload.new);
        
        // When we get updates from Supabase, update YJS as well to keep them in sync
        const locationData = {
          latitude: payload.new.latitude,
          longitude: payload.new.longitude,
          timestamp: new Date(payload.new.recorded_at).getTime(),
        };
        
        // Get bus status
        supabase.from('buses')
          .select('status')
          .eq('id', busId)
          .single()
          .then(({ data }) => {
            if (data) {
              callback({
                ...locationData,
                status: data.status
              });
              
              // If YJS is connected, update YJS as well
              if (yjsConnection) {
                const locationMap = yjsConnection.doc.getMap('locations');
                locationMap.set(busId, {
                  ...locationData,
                  status: data.status
                });
              }
            }
          });
      }
    )
    .subscribe();
  
  // Also subscribe to bus status changes
  const statusSubscription = supabase
    .channel(`bus_status_${busId}`)
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'buses',
        filter: `id=eq.${busId}`
      }, 
      (payload) => {
        console.log(`Status update received via Supabase for bus ${busId}:`, payload.new.status);
        
        // When the bus status changes, update with the new status
        if (yjsConnection) {
          // First get the current location data from YJS
          const locationMap = yjsConnection.doc.getMap('locations');
          const currentLocation = locationMap.get(busId);
          
          if (currentLocation) {
            callback({
              ...currentLocation,
              status: payload.new.status
            });
          }
        } else {
          // If YJS isn't connected, get the current location from Supabase
          supabase.from('latest_bus_locations')
            .select('*')
            .eq('bus_id', busId)
            .single()
            .then(({ data }) => {
              if (data) {
                callback({
                  latitude: data.latitude,
                  longitude: data.longitude,
                  timestamp: new Date(data.recorded_at).getTime(),
                  status: payload.new.status
                });
              }
            });
        }
      }
    )
    .subscribe();
  
  // Return function to clean up all subscriptions
  return () => {
    console.log(`Cleaning up subscriptions for bus ${busId}`);
    yjsUnsubscribe();
    supabaseSubscription.unsubscribe();
    statusSubscription.unsubscribe();
    if (yjsConnection) {
      yjsConnection.destroy();
    }
  };
};