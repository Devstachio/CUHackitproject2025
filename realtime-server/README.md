# Bus Beacon Realtime Server

This is a WebSocket server built with YJS for the Bus Beacon app, providing real-time location updates for school buses.

## Features

- Real-time synchronization of bus locations using YJS
- WebSocket communication for efficient updates
- Designed for AWS EC2 deployment
- Health check endpoint for monitoring
- Connection tracking by bus ID

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- An AWS account (for EC2 deployment)

## Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   cd realtime-server
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The server will run at http://localhost:1234

## Deployment to AWS EC2

### Preparing Your EC2 Instance

1. **Launch an EC2 Instance**
   - Log in to AWS console
   - Navigate to EC2 Dashboard
   - Launch a new instance (Amazon Linux 2 recommended)
   - Choose t2.micro (free tier) or a larger size if needed
   - Configure the network settings to allow inbound traffic on ports 22 (SSH), 80 (HTTP), 443 (HTTPS), and 1234 (WebSocket server)
   - Launch the instance with your SSH key pair

2. **SSH into Your Instance**
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@your-instance-public-ip
   ```

3. **Install Node.js and npm**
   ```bash
   # Update the system
   sudo yum update -y
   
   # Install Node.js
   curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   
   # Verify installation
   node -v
   npm -v
   
   # Install git
   sudo yum install git -y
   ```

### Deploying the Server

1. **Clone the Repository**
   ```bash
   git clone [your-repository-url]
   cd realtime-server
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Start the Server**
   
   For testing:
   ```bash
   npm start
   ```

   For production (using PM2):
   ```bash
   # Install PM2
   sudo npm install pm2 -g
   
   # Start with PM2
   pm2 start index.js --name "bus-beacon-server"
   
   # Set PM2 to startup on boot
   pm2 startup
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
   pm2 save
   ```

4. **Configure a Domain (Optional)**
   - Point your domain to your EC2 instance IP
   - Set up Nginx as a reverse proxy:
   
   ```bash
   # Install Nginx
   sudo amazon-linux-extras install nginx1 -y
   sudo systemctl start nginx
   sudo systemctl enable nginx
   
   # Configure Nginx
   sudo nano /etc/nginx/conf.d/bus-beacon.conf
   ```
   
   Add this configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:1234;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
   
   ```bash
   # Test & restart Nginx
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Set Up SSL (Recommended)**
   ```bash
   # Install certbot
   sudo yum install -y certbot python-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   
   # Follow the prompts to complete SSL setup
   ```

### Monitoring and Maintenance

- **Check Server Status**
  ```bash
  pm2 status
  pm2 logs bus-beacon-server
  ```

- **Update the Server**
  ```bash
  # Pull latest changes
  git pull
  
  # Install any new dependencies
  npm install --production
  
  # Restart the server
  pm2 restart bus-beacon-server
  ```

## Client Integration

Update the client app's `yjsUtils.ts` file to connect to the server:

```typescript
export const setupYjsConnection = async (busId: string): Promise<any> => {
  try {
    // Import the YJS modules
    const Y = await import('yjs');
    const { WebsocketProvider } = await import('y-websocket');
    
    // Create a new YJS document
    const doc = new Y.Doc();
    
    // Connect to the WebSocket server
    const wsServerUrl = 'ws://your-ec2-instance-url:1234';
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
```

## Health Monitoring

The server includes a health check endpoint that can be used for AWS EC2 health monitoring:

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2023-07-28T15:23:45.123Z"
}
```

You can set up an EC2 health check to monitor this endpoint.

## Security Considerations

- Set up AWS Security Groups to restrict access to your EC2 instance
- Consider using AWS WAF to protect against common web exploits
- Enable AWS CloudWatch for monitoring and logging
- Set up SSL/TLS for secure communication
- Consider implementing authentication for the WebSocket connections

## Troubleshooting

- **Connection Issues**: Check your EC2 security group settings and ensure ports are open
- **Server Not Starting**: Check Node.js version and ensure dependencies are installed correctly
- **Performance Issues**: Consider scaling up your EC2 instance or using a load balancer