import type { Condition } from '../types'

interface IconProps { size?: number }

export const Icons = {
  Sun: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" />
    </svg>
  ),
  Moon: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="currentColor" fillOpacity="0.25"/>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>
    </svg>
  ),
  Cloud: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 10 4.5 4.5 0 0 0 7 18Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 10 4.5 4.5 0 0 0 7 18Z"/>
    </svg>
  ),
  PartlyCloudy: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="9" cy="9" r="3.2" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="9" cy="9" r="3.2"/>
      <line x1="9" y1="3.5" x2="9" y2="5" />
      <line x1="3.5" y1="9" x2="5" y2="9" />
      <line x1="5.3" y1="5.3" x2="6.3" y2="6.3" />
      <path d="M11 19h6a3.5 3.5 0 0 0 .3-6.95A4.5 4.5 0 0 0 9 13a3.5 3.5 0 0 0 2 6Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M11 19h6a3.5 3.5 0 0 0 .3-6.95A4.5 4.5 0 0 0 9 13a3.5 3.5 0 0 0 2 6Z"/>
    </svg>
  ),
  Rain: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 6 4.5 4.5 0 0 0 7 14Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 6 4.5 4.5 0 0 0 7 14Z"/>
      <line x1="9" y1="17" x2="8" y2="20" />
      <line x1="13" y1="17" x2="12" y2="20" />
      <line x1="17" y1="17" x2="16" y2="20" />
    </svg>
  ),
  Storm: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 13h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 5 4.5 4.5 0 0 0 7 13Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M7 13h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 5 4.5 4.5 0 0 0 7 13Z"/>
      <path d="M13 14l-3 5h3l-2 4 5-6h-3l2-3z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  ),
  Snow: ({ size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 13h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 5 4.5 4.5 0 0 0 7 13Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M7 13h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 5 4.5 4.5 0 0 0 7 13Z"/>
      <circle cx="9" cy="18" r="1" fill="currentColor"/>
      <circle cx="13" cy="20" r="1" fill="currentColor"/>
      <circle cx="17" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  Wind: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 8h12a2.5 2.5 0 1 0-2.5-2.5"/>
      <path d="M3 14h16a3 3 0 1 1-3 3"/>
      <path d="M3 11h8"/>
    </svg>
  ),
  Drop: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M12 3c3.5 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-7 6-11Z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M12 3c3.5 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-7 6-11Z"/>
    </svg>
  ),
  Pin: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 21s-6-6-6-11a6 6 0 1 1 12 0c0 5-6 11-6 11Z"/>
      <circle cx="12" cy="10" r="2" fill="currentColor"/>
    </svg>
  ),
  Chev: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10l4 4 4-4"/>
    </svg>
  ),
  Arrow: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  Menu: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="17" x2="20" y2="17"/>
    </svg>
  ),
  Search: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
}

export function CondIcon({ cond, size = 24, night = false }: { cond: Condition; size?: number; night?: boolean }) {
  if (cond === 'clear' && night) return <Icons.Moon size={size} />
  if (cond === 'clear') return <Icons.Sun size={size} />
  if (cond === 'partly') return night ? <Icons.Moon size={size} /> : <Icons.PartlyCloudy size={size} />
  if (cond === 'cloudy') return <Icons.Cloud size={size} />
  if (cond === 'rain') return <Icons.Rain size={size} />
  if (cond === 'storm') return <Icons.Storm size={size} />
  if (cond === 'snow') return <Icons.Snow size={size} />
  return <Icons.Sun size={size} />
}
