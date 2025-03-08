import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { BiSolidBusSchool } from "react-icons/bi";
import Image from "next/image"
// import Map from '../Map/Map';

const Dashboard = () => {
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [buses, setBuses] = useState([]);
    const [busLocations, setBusLocations] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [busPosition, setBusPosition] = useState({ top: 50, left: 20 }); // New state for bus position

    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF'];
    const busPositions = [
        { top: 345, left: 508 },
        { top: 180, left: 160 },
        { top: 240, left: 575 },
        { top: 450, left: 320 },
    ];

    const fetchBuses = async (schoolId) => {
        const { data, error } = await supabase.from('buses').select('*');
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

    const handleBusSelect = (bus, index) => {
        setSelectedBus(bus); // Update selected bus state
        fetchBusLocations(bus.id);
        // Update bus position based on the selected bus's index
        setBusPosition(busPositions[index]);
    };

    return (
        <div className="flex h-full min-h-screen">
            <div className="w-1/4 bg-gray-100 p-4">
                <h2 className="text-lg font-bold mb-4">Schools</h2>
                <ul>
                    <li className="cursor-pointer hover:bg-gray-200 p-2 rounded border border-gray-300 my-2" onClick={() => handleSchoolSelect({ id: 1, name: 'School 1' })}>
                        School 1
                    </li>
                </ul>
                {selectedSchool && (
                    <div className="mt-4">
                        <h3 className="text-md font-bold mb-2">Buses</h3>
                        <ul className="pl-4">
                            {buses.map((bus, index) => (
                                <li
                                    key={bus.id}
                                    className="cursor-pointer hover:bg-gray-200 p-2 rounded flex justify-between items-center border border-gray-300 my-2"
                                    onClick={() => handleBusSelect(bus, index)} // Pass the index to the handler

                                >
                                    {bus.name}
                                    <BiSolidBusSchool style={{ color: colors[index % colors.length] }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {selectedSchool ? (
                <div className="w-3/4 flex justify-center items-center relative">
                    <Image
                        src="/images/mockImage.png"
                        alt="Map"
                        width={1000}
                        height={600}
                    />
                    {selectedBus && (
                        <div
                            className="absolute border border-yellow-300 border-4 w-8 h-8"
                            style={{ top: `${busPosition.top}px`, left: `${busPosition.left}px` }}
                        ></div> // Yellow border box
                    )}
                </div>
            ) : (
                <div className="w-3/4 flex justify-center items-center">
                    <h2 className="text-3xl text-white font-bold">Select a School</h2>
                </div>
            )}
        </div>
    );
};

export default Dashboard;