import { svgProps, type IconProps } from './_base';
export function ExternalLink(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polyline points="14,4 20,4 20,10" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="20" y1="4" x2="11" y2="13" stroke="currentColor" strokeWidth="2" />
      <polyline points="18,14 18,20 4,20 4,6 10,6" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
