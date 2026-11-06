import { formatDate as formatDT } from '@intake24/admin/util';

export function useDateTime() {
  const formatDate = (date: Date | string | null, format: string = 'dd/MM/yyyy') =>
    date
      ? formatDT(date, format)
      : date;

  const formatDateTime = (date: Date | string | null, format: string = 'dd/MM/yyyy HH:mm:ss') =>
    date
      ? formatDT(date, format)
      : date;

  return { formatDate, formatDateTime };
}
