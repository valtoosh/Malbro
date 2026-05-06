import { svgProps, type IconProps } from './_base';
export function CopyMark(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="8" y="4" width="12" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="4" y="8" width="12" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
