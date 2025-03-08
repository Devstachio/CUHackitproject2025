// Bus Beacon Realtime Server
// This server uses y-websocket to provide real-time location updates

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const express = require('express')
const cors = require('cors')

// Configuration
const PORT = process.env.PORT || 80
const HOST = process.env.HOST || '0.0.0.0'

// Create an express app for health checks and basic info
const app = express()
app.use(cors())

// Add a health check endpoint for EC2 health monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Add an info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Bus Beacon Realtime Server',
    description: 'YJS WebSocket server for real-time bus location updates',
    version: '1.0.0',
    status: 'running',
    connections: wss.clients.size
  })
})

// Create HTTP server
const server = http.createServer(app)

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// Track active connections by busId
const activeBuses = new Map()

// Setup YJS WebSocket connection
wss.on('connection', (conn, req) => {
  // Extract bus ID from URL if present (e.g., /yjs/BUS001)
  const busId = req.url.split('/').pop()
  
  if (busId && busId.startsWith('BUS')) {
    console.log(`New connection for bus ${busId}`)
    
    // Track the connection
    if (!activeBuses.has(busId)) {
      activeBuses.set(busId, new Set())
    }
    activeBuses.get(busId).add(conn)
    
    // Remove from tracking when closed
    conn.on('close', () => {
      if (activeBuses.has(busId)) {
        activeBuses.get(busId).delete(conn)
        if (activeBuses.get(busId).size === 0) {
          activeBuses.delete(busId)
        }
      }
      console.log(`Connection closed for bus ${busId}`)
    })
  }

  // Setup YJS connection
  setupWSConnection(conn, req, { docName: busId })
})

// Log active connections every minute
setInterval(() => {
  const totalConnections = wss.clients.size
  console.log(`Active connections: ${totalConnections}`)
  
  console.log('Active buses:')
  for (const [busId, connections] of activeBuses.entries()) {
    console.log(`  - ${busId}: ${connections.size} connections`)
  }
}, 60000)

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Bus Beacon Realtime Server running at http://${HOST}:${PORT}`)
  console.log(`WebSocket server listening for connections`)
})

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  // Close the server
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown after timeout')
    process.exit(1)
  }, 10000)
})