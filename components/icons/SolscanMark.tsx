import { svgProps, type IconProps } from './_base';
export function SolscanMark(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="6" width="18" height="3" fill="currentColor" />
      <rect x="3" y="11" width="14" height="3" fill="currentColor" />
      <rect x="7" y="16" width="14" height="3" fill="currentColor" />
    </svg>
  );
}
