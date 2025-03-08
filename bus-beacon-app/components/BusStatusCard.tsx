import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, COMMON_STYLES } from '../constants/AppStyles';

type BusStatusCardProps = {
  busId: string;
  routeName: string;
  driverName: string;
  status: 'active' | 'inactive' | 'unknown';
  lastUpdated: string;
  estimatedArrival?: string;
  onPress?: () => void;
};

const BusStatusCard = ({
  busId,
  routeName,
  driverName,
  status,
  lastUpdated,
  estimatedArrival,
  onPress,
}: BusStatusCardProps) => {
  
  const formatTimeElapsed = (lastUpdatedStr: string) => {
    const lastUpdated = new Date(lastUpdatedStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastUpdated.toLocaleDateString();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'inactive':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.busInfo}>
          <Text style={styles.busId}>Bus {busId}</Text>
          <Text style={styles.routeName}>{routeName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{driverName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>Updated {formatTimeElapsed(lastUpdated)}</Text>
        </View>
        
        {estimatedArrival && (
          <View style={styles.detailRow}>
            <Ionicons name="flag" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Arrives at {estimatedArrival}</Text>
          </View>
        )}
      </View>
      
      {onPress && (
        <View style={styles.footer}>
          <Text style={styles.viewDetails}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.card,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  routeName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  details: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
  },
  viewDetails: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
});

export default BusStatusCard;