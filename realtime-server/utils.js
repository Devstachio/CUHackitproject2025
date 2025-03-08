// Utility functions for the Bus Beacon Realtime Server

/**
 * Format a log message with timestamp
 * @param {string} message - The message to log
 * @returns {string} - Formatted log message
 */
function formatLogMessage(message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }
  
  /**
   * Log a message with the given level
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Message to log
   */
  function log(level, message) {
    const formattedMessage = formatLogMessage(message);
    
    switch (level.toLowerCase()) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
      default:
        console.log(formattedMessage);
        break;
    }
  }
  
  /**
   * Get bus ID from WebSocket request URL
   * @param {string} url - WebSocket URL
   * @returns {string|null} - Bus ID or null if not found
   */
  function getBusIdFromUrl(url) {
    if (!url) return null;
    
    // Extract bus ID from URL (e.g., /yjs/BUS001)
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    
    // Check if it's a valid bus ID format
    if (lastPart && lastPart.startsWith('BUS')) {
      return lastPart;
    }
    
    return null;
  }
  
  /**
   * Get server metrics
   * @param {WebSocket.Server} wss - WebSocket server instance
   * @param {Map} activeBuses - Map of active buses
   * @returns {Object} - Server metrics
   */
  function getServerMetrics(wss, activeBuses) {
    const totalConnections = wss.clients.size;
    const busCount = activeBuses.size;
    
    const busMetrics = Array.from(activeBuses.entries()).map(([busId, connections]) => ({
      busId,
      connectionCount: connections.size
    }));
    
    return {
      timestamp: new Date().toISOString(),
      totalConnections,
      busCount,
      buses: busMetrics
    };
  }
  
  module.exports = {
    log,
    getBusIdFromUrl,
    getServerMetrics
  };