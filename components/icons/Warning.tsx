import { svgProps, type IconProps } from './_base';
export function Warning(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polygon points="12,3 22,21 2,21" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="11" y="9" width="2" height="6" fill="currentColor" />
      <rect x="11" y="17" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
