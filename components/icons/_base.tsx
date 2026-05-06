// components/icons/_base.tsx
import type { SVGAttributes } from 'react';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: number | string;
}

export function svgProps({ size = '1em', ...rest }: IconProps): SVGAttributes<SVGSVGElement> {
  const labeled = rest['aria-label'] !== undefined;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    role: labeled ? 'img' : undefined,
    'aria-hidden': labeled ? undefined : true,
    ...rest,
  } as SVGAttributes<SVGSVGElement>;
}
