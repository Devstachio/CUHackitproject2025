// lib/types.ts

// Auth & User Types
export type UserType = 'driver' | 'parent';

export interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  busId?: string;
  isActive?: boolean;
}

// Bus Types
export interface Bus {
    id: string;
    name: string;
    route_name: string;
    status: string;
  }


export interface BusLocation {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface DriverBus {
    id: string;
    driver_id: string;
    bus_id: string;
    is_active: boolean;
    clocked_in_at?: string | null;
    clocked_out_at?: string | null;
    buses: Bus; // Note: This needs to be a single Bus object, not an array
  }

// Child & Parent Types
export interface Child {
  id: string;
  parent_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChildBusAssignment {
  id: string;
  child_id: string;
  bus_id: string;
  created_at?: string;
}

// View Types
export interface ParentChildBusView {
  parent_id: string;
  child_id: string;
  child_name: string;
  bus_id: string;
  bus_name: string;
  route_name: string;
  status: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  driver_name: string;
}

// Types for the LocationContext
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface BusInfo {
  id: string;
  name: string;
  location: LocationCoords;
  driverName: string;
  status: string;
  lastUpdated: string;
  estimatedArrival?: string;
}

export interface ChildBusInfo {
  childName: string;
  bus: BusInfo;
}