import type { ReactNode } from 'react';
import type { Album } from '../types';

export function HardcoverArtwork({ album, lit = false, sheen }: { album: Album; lit?: boolean; sheen?: ReactNode }) {
  return (
    <>
      <div className="hardcover-artwork w-full h-full relative overflow-hidden bg-black rounded-r-sm" data-lit={lit || undefined}>
        <img
          src={album.artwork}
          alt={album.title}
          className={`w-full h-full transition-[filter] duration-300 ${lit ? 'brightness-100' : 'brightness-[0.92]'} ${
            album.aspectRatio === 'landscape'
              ? 'object-cover object-center scale-[1.04]'
              : 'object-cover object-top'
          }`}
        />

        {sheen}

        {/* Velvety archival vignette protecting typography across dark and light modes */}
        <div className="hardcover-wash absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="hardcover-spine-shade absolute left-0 top-0 bottom-0 w-7 bg-gradient-to-r from-black/85 via-black/30 to-transparent pointer-events-none z-10" />
      <div className="hardcover-spine-line absolute left-7 top-0 bottom-0 w-[1px] bg-white/[0.12] pointer-events-none z-10 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

      <div className="hardcover-ribbon absolute -top-1.5 right-8 w-4 h-12 bg-[#c5a059] shadow-lg z-20 rounded-b-sm border-x border-[#9e7d3b] flex items-end justify-center pb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#7d6029]" />
      </div>

      <div className="hardcover-catalog absolute top-4 left-8 z-10">
        <span className="text-xs font-mono font-medium tracking-widest text-[#c5a059] bg-black/75 backdrop-blur-md px-3 py-1 rounded border border-[#c5a059]/35 shadow-md">
          {album.catalogNumber}
        </span>
      </div>

      <div className="hardcover-caption absolute bottom-[18px] left-[32px] right-[16px] z-10 space-y-1">
        <p className="hardcover-date text-xs font-mono tracking-wider text-[#d4af66] font-medium">
          {album.releaseDate}
        </p>
        <h3 className="hardcover-title font-serif font-bold text-2xl md:text-[1.7rem] text-white tracking-wide leading-tight drop-shadow-md">
          {album.title}
        </h3>
        <p className="hardcover-subtitle text-xs sm:text-[12.5px] md:text-sm font-serif font-light text-[#dedbd2] leading-snug break-words">
          {album.subtitle}
        </p>
      </div>
    </>
  );
}
