import React from 'react'
import { getApiUrl } from '@/utils';
import { Logo } from '@/components/ui'

interface TextLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export default function TextLogo({ size = 'md', showIcon = true, className = '' }: TextLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const iconSizes = {
    sm: { width: 24, height: 16 },
    md: { width: 32, height: 21 },
    lg: { width: 40, height: 27 }
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0">
          <Logo 
            width={iconSizes[size].width} 
            height={iconSizes[size].height} 
            className="logo-svg"
          />
        </div>
      )}
      <div>
        <h1 className={`font-bold text-gray-900 ${sizeClasses[size]}`}>Felix</h1>
        <p className="text-sm text-gray-600">Корпоративная платформа</p>
      </div>
    </div>
  )
}
