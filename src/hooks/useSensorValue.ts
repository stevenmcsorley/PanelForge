/**
 * Hook to get current sensor value
 * Automatically updates when sensor changes
 */

import { useSensorStore } from '@/stores';
import { SensorKey } from '@/types';

export function useSensorValue(sensorKey: SensorKey | null): number {
  const value = useSensorStore((state) =>
    sensorKey ? state.sensors[sensorKey]?.value ?? 0 : 0
  );
  return value;
}
