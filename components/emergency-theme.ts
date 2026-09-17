export type EmergencyTheme = {
  color: string;
  fillColor: string;
  label: string;
};

const themes: Record<string, EmergencyTheme> = {
  Flood: { color: '#0284C7', fillColor: '#0284C733', label: 'Flood danger zone' },
  Fire: { color: '#F97316', fillColor: '#F9731633', label: 'Fire danger zone' },
  Accident: { color: '#F59E0B', fillColor: '#F59E0B33', label: 'Accident danger zone' },
  Trapped: { color: '#F59E0B', fillColor: '#F59E0B33', label: 'Danger zone' },
  Medical: { color: '#DC2626', fillColor: '#DC262633', label: 'Medical emergency zone' },
  Other: { color: '#7C3AED', fillColor: '#7C3AED33', label: 'Danger zone' },
};

export const familyPinColor = '#0284C7';

export function emergencyTheme(type?: string): EmergencyTheme {
  return themes[type || ''] || themes.Other;
}
