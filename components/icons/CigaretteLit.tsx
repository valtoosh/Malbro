import { svgProps, type IconProps } from './_base';
export function CigaretteLit(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="2" y="13" width="14" height="3" fill="currentColor" />
      <rect x="2" y="13" width="3" height="3" fill="currentColor" opacity="0.5" />
      <rect x="16" y="13" width="2" height="3" fill="currentColor" />
      <path d="M19 12 Q 21 9 19 6 Q 17 3 19 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
