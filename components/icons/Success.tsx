import { svgProps, type IconProps } from './_base';
export function Success(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <polyline points="7,12 11,16 17,8" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
