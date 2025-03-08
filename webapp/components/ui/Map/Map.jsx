import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = ({ busLocations }) => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
      {busLocations.map((location) => (
        <Marker key={location.bus_id} position={[location.latitude, location.longitude]}>
          <Popup>Bus ID: {location.bus_id}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;