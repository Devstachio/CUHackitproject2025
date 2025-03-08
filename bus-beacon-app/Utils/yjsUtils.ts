export const setupYjsConnection = async (busId: string): Promise<any> => {
  try {
    // Import the YJS modules
    const Y = await import('yjs');
    const { WebsocketProvider } = await import('y-websocket');
    
    // Create a new YJS document
    const doc = new Y.Doc();
    
    // Connect to the WebSocket server
    const wsServerUrl = 'ws://http://54.213.236.29:8080';
    const provider = new WebsocketProvider(wsServerUrl, busId, doc);
    
    // Wait for connection
    await new Promise<void>((resolve) => {
      provider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          resolve();
        }
      });
      
      // If already connected, resolve immediately
      if (provider.wsconnected) {
        resolve();
      }
    });
    
    console.log(`Connected to YJS server for bus ${busId}`);
    
    // Return the doc and provider
    return {
      doc,
      provider,
      busId,
      destroy: () => {
        provider.disconnect();
        doc.destroy();
      }
    };
  } catch (error) {
    console.error('Error connecting to YJS server:', error);
    throw error;
  }
};

export const updateLocation = (connection: any, busId: string, locationData: any): void => {
  if (!connection || !connection.doc) {
    console.error('No YJS connection available');
    return;
  }
  
  try {
    // Get or create the location map
    const locationMap = connection.doc.getMap('locations');
    
    // Update the location
    locationMap.set(busId, locationData);
    
    console.log(`Updated location for bus ${busId}:`, locationData);
  } catch (error) {
    console.error('Error updating location in YJS:', error);
  }
};

export const subscribeToLocationUpdates = (connection: any, callback: (data: any) => void): (() => void) => {
  if (!connection || !connection.doc) {
    console.error('No YJS connection available');
    return () => {};
  }
  
  try {
    // Get the location map
    const locationMap = connection.doc.getMap('locations');
    
    // Listen for changes
    const observer = () => {
      const locations = Object.fromEntries(locationMap.entries());
      callback(locations);
    };
    
    // Initial call
    observer();
    
    // Subscribe to changes
    locationMap.observe(observer);
    
    // Return unsubscribe function
    return () => {
      locationMap.unobserve(observer);
    };
  } catch (error) {
    console.error('Error subscribing to location updates:', error);
    return () => {};
  }
};