import { svgProps, type IconProps } from './_base';
export function Error(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2" />
      <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
