import React from "react";
import { C } from "./theme";

type P = { size?: number; color?: string; sw?: number };

export const WifiIcon: React.FC<P & { bars?: number }> = ({ size = 56, color = C.text, sw = 4.5, bars = 3 }) => {
  const arc = (r: number) => `M${32 - r * 0.7071} ${50 - r * 0.7071} A${r} ${r} 0 0 1 ${32 + r * 0.7071} ${50 - r * 0.7071}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="50" r="4.5" fill={color} />
      {[12, 24, 36].map((r, i) => (
        <path key={r} d={arc(r)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={i < bars ? 1 : 0.22} />
      ))}
    </svg>
  );
};

export const LockIcon: React.FC<P & { open?: boolean }> = ({ size = 56, color = C.yellow, sw = 4.5, open = false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="12" y="28" width="40" height="30" rx="6" fill="none" stroke={color} strokeWidth={sw} />
    <path d={open ? "M20 28 V20 A12 12 0 0 1 42 14" : "M20 28 V20 A12 12 0 0 1 44 20 V28"} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    <circle cx="32" cy="43" r="4" fill={color} />
  </svg>
);

export const PhoneIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="18" y="6" width="28" height="52" rx="7" fill="none" stroke={color} strokeWidth={sw} />
    <path d="M28 12 H36" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    <circle cx="32" cy="50" r="2.5" fill={color} />
  </svg>
);

export const RouterIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="8" y="36" width="48" height="16" rx="5" fill="none" stroke={color} strokeWidth={sw} />
    <path d="M18 36 L14 14 M46 36 L50 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    <circle cx="18" cy="44" r="2.5" fill={color} />
    <circle cx="27" cy="44" r="2.5" fill={color} />
  </svg>
);

export const LaptopIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="12" y="14" width="40" height="28" rx="4" fill="none" stroke={color} strokeWidth={sw} />
    <path d="M5 50 H59 L54 42 H10 Z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
  </svg>
);

export const PlaneIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M6 36 L58 10 L46 56 L33 40 Z M33 40 L58 10" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

export const CaseIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="8" y="20" width="48" height="34" rx="6" fill="none" stroke={color} strokeWidth={sw} />
    <path d="M24 20 V14 H40 V20 M8 34 H56" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  </svg>
);

export const EyeIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M4 32 Q32 8 60 32 Q32 56 4 32 Z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="32" cy="32" r="8" fill={color} />
  </svg>
);

export const KeyIcon: React.FC<P> = ({ size = 56, color = C.text, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx="20" cy="32" r="12" fill="none" stroke={color} strokeWidth={sw} />
    <path d="M32 32 H58 M48 32 V42 M56 32 V40" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  </svg>
);
