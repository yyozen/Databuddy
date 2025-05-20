"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface FaviconImageProps {
  domain: string;
  altText?: string;
  size?: number;
  className?: string;
}

export function FaviconImage({ 
  domain, 
  altText,
  size = 16, 
  className = '' 
}: FaviconImageProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false); // Reset error on domain change
    const effectiveDomain = domain;

    if (!effectiveDomain || effectiveDomain.toLowerCase() === 'direct' || effectiveDomain.toLowerCase() === 'unknown') {
      setHasError(true); // Treat as error/no favicon case
      setFaviconUrl('');
      return;
    }

    try {
      // Ensure domain is just the hostname, and remove www. if present for better matching with some favicon services
      let hostname = new URL(`http://${effectiveDomain.replace(/^https?:\/\//, '')}`).hostname;
      hostname = hostname.replace(/^www\./, '');
      setFaviconUrl(`https://www.google.com/s2/favicons?sz=${size}&domain_url=${hostname}`);
    } catch (e) {
      console.warn("Error processing domain for favicon URL:", effectiveDomain, e);
      setHasError(true);
      setFaviconUrl('');
    }
  }, [domain, size]);

  if (hasError || !faviconUrl) {
    return <Globe className={className} style={{ width: size, height: size }} aria-label={altText || 'Fallback icon'} />;
  }

  return (
    <img
      src={faviconUrl}
      alt={altText || `${domain} favicon`}
      width={size}
      height={size}
      className={className}
      onError={() => setHasError(true)}
      style={{ imageRendering: 'pixelated' }} // Often good for small favicons
    />
  );
} 