import { svgProps, type IconProps } from './_base';
export function Chevron(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polygon points="0,0 24,0 12,24" fill="currentColor" />
    </svg>
  );
}
