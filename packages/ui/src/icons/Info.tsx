import { svgProps, type IconProps } from './_base';
export function Info(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="11" y="7" width="2" height="2" fill="currentColor" />
      <rect x="11" y="11" width="2" height="6" fill="currentColor" />
    </svg>
  );
}
