import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
// import Map from '../Map/Map';

const Dashboard = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [buses, setBuses] = useState([]);
  const [busLocations, setBusLocations] = useState([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) console.error('Error fetching schools:', error);
    else setSchools(data);
  };

  const fetchBuses = async (schoolId) => {
    const { data, error } = await supabase.from('buses').select('*').eq('school_id', schoolId);
    if (error) console.error('Error fetching buses:', error);
    else setBuses(data);
  };

  const fetchBusLocations = async (busId) => {
    const { data, error } = await supabase.from('bus_locations').select('*').eq('bus_id', busId);
    if (error) console.error('Error fetching bus locations:', error);
    else setBusLocations(data);
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    fetchBuses(school.id);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">Schools</h2>
        <ul>
          {schools.map((school) => (
            <li key={school.id} onClick={() => handleSchoolSelect(school)} className="cursor-pointer hover:bg-gray-200 p-2 rounded">
              {school.name}
            </li>
          ))}
        </ul>
        {selectedSchool && (
          <div className="mt-4">
            <h3 className="text-md font-bold mb-2">Buses</h3>
            <ul className="pl-4">
              {buses.map((bus) => (
                <li key={bus.id} className="cursor-pointer hover:bg-gray-200 p-2 rounded" onClick={() => fetchBusLocations(bus.id)}>
                  {bus.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="w-3/4">
        {/* <Map busLocations={busLocations} /> */}
      </div>
    </div>
  );
};

export default Dashboard;