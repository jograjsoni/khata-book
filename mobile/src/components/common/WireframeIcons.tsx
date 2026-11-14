import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

// 1. Header Coin / Rewards icon with gold stroke #CA8A04
export const WireframeCoinIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#CA8A04',
  strokeWidth = 2,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="8" cy="8" r="6" />
    <Path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <Path d="M7 6h1v4" />
    <Path d="m16.71 13.88.7.71-2.82 2.82" />
  </Svg>
);

// 2. Header Notifications Bell icon
export const WireframeBellIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
  filled = false,
}) => {
  if (filled) {
    return (
      <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.2c-1.078.433-2.26.724-3.496.843a4.5 4.5 0 0 1-8.15 0c-1.236-.12-2.418-.41-3.496-.843a.75.75 0 0 1-.297-1.2C6.45 13.807 7.25 11.873 7.25 9.75V9Zm4.5 10.5a3 3 0 0 0 4.5 0c-.722.18-1.488.278-2.25.278s-1.528-.098-2.25-.278Z"
        />
      </Svg>
    );
  }
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
};

// 3. Simple Clean Star Icon for Lekha AI
export const WireframeSimpleStarIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
  filled = false,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export const WireframeSparklesIcon = WireframeSimpleStarIcon;

// 4. Tab 1 Home Icon: EXACT Heroicon vector path from home.html
export const WireframeTabHome: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  filled = false,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </Svg>
);

// 5. Tab 2 Reports Icon: EXACT 3-bar chart vector path from home.html
export const WireframeTabReports: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  filled = false,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </Svg>
);

// 6. Tab 3 Settings Icon: EXACT cog vector path from home.html
export const WireframeTabSettings: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  filled = false,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.6 6.6 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <Path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </Svg>
);

// 7. Menu Book / Khata Icon with One-Sided Right Ledger Lines matching Antigravity prototype
export const WireframeBookIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.5,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    {/* Right page clean horizontal ledger lines */}
    <Path d="M14.5 9.5h3.5" />
    <Path d="M14.5 13.5h3.5" />
  </Svg>
);

// 8. Authentic WhatsApp Logo in Clean Black & White
export const WireframeWhatsAppIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
}) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5.18-1.32A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.46 14.12c-.23.64-1.33 1.23-1.84 1.28-.48.05-1.09.07-3.19-.78-2.68-1.09-4.38-3.85-4.51-4.03-.13-.18-1.08-1.44-1.08-2.75 0-1.31.69-1.95.93-2.22.25-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.6.53.23.53.78 1.9.85 2.04.07.14.11.31.02.49-.09.18-.14.29-.27.44-.14.15-.29.34-.41.46-.14.14-.28.29-.12.57.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.18.69-.8.87-1.08.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.87.27.14.45.2.52.31.06.12.06.69-.17 1.33z"
      fill={color}
    />
  </Svg>
);

// 9. Authentic Phone Call Icon in Clean Black & White
export const WireframePhoneIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

// 10. Clean Message Square / SMS Icon
export const WireframeMessageSquareIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

// 11. Clean Bank / Cashback Icon
export const WireframeBankIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3L2 10h20L12 3z" />
  </Svg>
);

// 12. Clean QR Standee Icon
export const WireframeQrIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </Svg>
);

// 13. Clean Inward Payment Vector Icon
export const WireframePaymentIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Line x1="17" y1="7" x2="7" y2="17" />
    <Polyline points="17 17 7 17 7 7" />
  </Svg>
);

// 14. Clean Due Alert Vector Icon
export const WireframeDueAlertIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

// 15. Clean Security Shield Vector Icon
export const WireframeShieldIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

// 16. Sign Out Icon
export const WireframeSignOutIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#dc2626',
  strokeWidth = 2,
}) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);
