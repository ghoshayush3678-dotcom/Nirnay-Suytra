import React, { useState } from 'react';
import { FileImage } from 'lucide-react';
import { resolveAssetUrl } from '../data/kaveriSeed';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
  caption?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
  caption,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-[#EFECE4] border border-[#E4DFD3] flex flex-col items-center justify-center p-6 text-center ${aspectClass} ${className}`}
        role="img"
        aria-label={alt || 'Editorial illustration placeholder'}
      >
        <div className="w-10 h-10 rounded-full bg-[#0B3D3A]/10 text-[#0B3D3A] flex items-center justify-center mb-3">
          <FileImage className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-[#0B3D3A] max-w-xs">
          {alt || 'Kaveri Organics Editorial Visual Asset'}
        </p>
        {caption && (
          <p className="text-[11px] text-[#526360] mt-1">{caption}</p>
        )}
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden bg-[#EFECE4] ${className}`}>
      <img
        src={resolvedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${aspectClass}`}
      />
      {caption && (
        <figcaption className="mt-2 text-xs text-[#526360] leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
