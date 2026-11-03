import { MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useDashboard } from '../store/useDashboard';

/**
 * Jump to the map, zoom to the record's coordinate and open its marker.
 * Works from any register table; stops the row click so the drawer does not
 * open on top of the map transition.
 */
export function MapButton({
  lat,
  lon,
  label,
  siteId,
  className,
}: {
  lat: number | null | undefined;
  lon: number | null | undefined;
  label: string;
  siteId?: string | null;
  className?: string;
}) {
  const openMapAt = useDashboard((state) => state.openMapAt);
  const disabled = lat === null || lat === undefined || lon === null || lon === undefined;

  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? 'No usable coordinate for this record' : `Show ${label} on the map`}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        openMapAt({ lat, lon, label, siteId: siteId ?? null });
      }}
      className={clsx('btn btn-xs whitespace-nowrap', disabled && 'cursor-not-allowed opacity-40', className)}
    >
      <MapPin size={11} /> Map
    </button>
  );
}
