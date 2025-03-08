import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { DriverBus, Profile, ParentChildBusView } from './types';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://cwrvozqaumqrbnhufiff.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cnZvenFhdW1xcmJuaHVmaWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NjEwNjgsImV4cCI6MjA1NzAzNzA2OH0.BIJTFaJsrzlPwuq9iFdxhYY2Jl_zVYZCYbpM2o-aCSk';

// Create a custom Supabase client with AsyncStorage for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

// Profile functions
export const createProfile = async (id: string, name: string, email: string, userType: 'driver' | 'parent') => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      name,
      email,
      user_type: userType
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  return data;
};

export const updateProfile = async (userId: string, updates: {name?: string, email?: string}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Bus functions
export const getAllBuses = async () => {
  const { data, error } = await supabase
    .from('buses')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const getBusById = async (busId: string) => {
  const { data, error } = await supabase
    .from('buses')
    .select('*')
    .eq('id', busId)
    .single();
    
  if (error) throw error;
  return data;
};

// Driver functions
export const getDriverBus = async (driverId: string): Promise<DriverBus | null> => {
  const { data, error } = await supabase
    .from('driver_buses')
    .select(`
      id,
      driver_id,
      bus_id,
      is_active,
      clocked_in_at,
      clocked_out_at,
      buses (
        id,
        name,
        route_name,
        status
      )
    `)
    .eq('driver_id', driverId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the code for no rows returned
    console.error('Error fetching driver bus:', error);
    throw error;
  }
  
  return data as DriverBus | null;
};

export const assignDriverToBus = async (driverId: string, busId: string) => {
  const { data, error } = await supabase
    .from('driver_buses')
    .insert({
      driver_id: driverId,
      bus_id: busId
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const clockInOut = async (driverId: string, isActive: boolean) => {
  const { error } = await supabase
    .rpc('driver_clock_in_out', {
      p_driver_id: driverId,
      p_is_active: isActive
    });
    
  if (error) {
    console.error('Error clocking in/out:', error);
    throw error;
  }
  
  return true;
};

// Location functions
export const updateBusLocation = async (busId: string, latitude: number, longitude: number) => {
  const { error } = await supabase
    .from('bus_locations')
    .insert({
      bus_id: busId,
      latitude: latitude,
      longitude: longitude
    });
    
  if (error) {
    console.error('Error updating bus location:', error);
    throw error;
  }
  
  return true;
};

export const getLatestBusLocations = async () => {
  const { data, error } = await supabase
    .from('latest_bus_locations')
    .select('*');
    
  if (error) throw error;
  return data;
};

export const getLatestBusLocation = async (busId: string) => {
  const { data, error } = await supabase
    .from('latest_bus_locations')
    .select('*')
    .eq('bus_id', busId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Parent and Children functions
export const addChild = async (parentId: string, childName: string) => {
  const { data, error } = await supabase
    .from('children')
    .insert({
      parent_id: parentId,
      name: childName
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getParentChildren = async (parentId: string) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', parentId);
    
  if (error) throw error;
  return data;
};

export const assignChildToBus = async (childId: string, busId: string) => {
  const { data, error } = await supabase
    .from('child_bus_assignments')
    .insert({
      child_id: childId,
      bus_id: busId
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getChildrenWithBuses = async (parentId: string): Promise<ParentChildBusView[]> => {
  const { data, error } = await supabase
    .from('parent_child_buses')
    .select('*')
    .eq('parent_id', parentId);
    
  if (error) {
    console.error('Error fetching children buses:', error);
    throw error;
  }
  
  return data;
};

// Subscription function for real-time updates
export const subscribeToLocationUpdates = (callback: () => void) => {
  return supabase
    .channel('bus_locations_changes')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bus_locations'
      }, 
      () => {
        callback();
      }
    )
    .subscribe();
};

// Utility function to estimate arrival time (placeholder)
export const calculateEstimatedArrival = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + Math.floor(Math.random() * 30) + 10);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};