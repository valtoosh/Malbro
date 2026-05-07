import { svgProps, type IconProps } from './_base';
export function PackOutline(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="4" y="4" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="4,4 20,4 12,11" fill="currentColor" />
    </svg>
  );
}
