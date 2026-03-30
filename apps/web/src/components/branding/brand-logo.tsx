import type { ImgHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

type BrandLogoVariant = 'mark' | 'markLight' | 'primary' | 'horizontal' | 'monochrome'

const sources: Record<BrandLogoVariant, string> = {
  mark: '/branding/logos/tuinventario-logo-mark.svg',
  markLight: '/branding/logos/tuinventario-logo-mark-light.svg',
  primary: '/branding/logos/tuinventario-logo-primary.svg',
  horizontal: '/branding/logos/tuinventario-logo-horizontal.svg',
  monochrome: '/branding/logos/tuinventario-logo-monochrome.svg',
}

export function BrandLogo({
  variant = 'primary',
  alt = 'TuInventario',
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { variant?: BrandLogoVariant }) {
  return <img alt={alt} className={cn('select-none', className)} src={sources[variant]} {...props} />
}
