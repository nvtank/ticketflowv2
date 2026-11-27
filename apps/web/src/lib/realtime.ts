export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'unavailable';

export function initialRealtimeConnectionStatus(
  configuredUrl: string | undefined,
  isDevelopment: boolean,
): RealtimeConnectionStatus {
  return configuredUrl?.trim() || isDevelopment ? 'connecting' : 'unavailable';
}

export function resolveRealtimeOrigin(
  configuredUrl: string | undefined,
  isDevelopment: boolean,
  location: Pick<Location, 'protocol' | 'hostname'>,
): string | null {
  const configured = configuredUrl?.trim();
  if (configured) return configured;
  if (isDevelopment) return `${location.protocol}//${location.hostname}:4100`;
  return null;
}
