"use client";

import Image from "next/image";
import { useState } from "react";

type ShowcaseItem = {
  title: string;
  image: string;
};

type ShowcaseCarouselProps = {
  items: ShowcaseItem[];
};

export function ShowcaseCarousel({ items }: ShowcaseCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToCard = (nextIndex: number) => {
    setActiveIndex((nextIndex + items.length) % items.length);
  };

  const getOffset = (index: number) => {
    const rawOffset = index - activeIndex;

    if (rawOffset > items.length / 2) {
      return rawOffset - items.length;
    }

    if (rawOffset < -items.length / 2) {
      return rawOffset + items.length;
    }

    return rawOffset;
  };

  return (
    <div className="mt-12 bg-ink py-12 text-white">
      <div className="mx-auto mb-8 w-full max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.34em] text-white/60">
          Servicios destacados
        </p>
      </div>

      <div className="relative mx-auto h-[560px] w-full max-w-7xl overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-28 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-28 bg-gradient-to-l from-ink to-transparent" />

        {items.map((item, index) => {
          const offset = getOffset(index);
          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          return (
            <figure
              className="absolute left-1/2 top-0 aspect-[9/16] w-[min(78vw,340px)] overflow-hidden rounded-[1.35rem] bg-black shadow-2xl transition-all duration-[850ms] ease-out"
              key={`${item.title}-${index}`}
              onClick={() => goToCard(index)}
              style={{
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? "auto" : "none",
                transform: `translateX(calc(-50% + ${offset * 360}px)) scale(${
                  isActive ? 1 : 0.86
                })`,
                zIndex: 10 - Math.abs(offset),
              }}
            >
              <Image
                alt={item.title}
                className="object-cover object-[center_18%]"
                fill
                sizes="340px"
                src={item.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/22 to-transparent" />
              <div className="absolute inset-x-6 top-7 text-center font-mono text-xs font-semibold uppercase tracking-[0.28em] text-white/82">
                
              </div>
              <figcaption className="absolute inset-x-6 bottom-8 text-center text-white">
                <p className="font-display text-4xl font-extrabold uppercase leading-[0.9] tracking-wide">
                  {item.title}
                </p>
                <p className="mx-auto mt-5 max-w-[15rem] text-base font-bold leading-6 text-white/86">
                  
                </p>
              </figcaption>
            </figure>
          );
        })}

        <button
          aria-label="Ver servicio anterior"
          className="absolute left-4 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-4xl font-semibold leading-none text-zinc-500 shadow-[0_0_32px_rgba(255,255,255,0.28)] transition hover:bg-magenta hover:text-white"
          onClick={() => goToCard(activeIndex - 1)}
          type="button"
        >
          ‹
        </button>

        <button
          aria-label="Ver siguiente servicio"
          className="absolute right-4 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-4xl font-semibold leading-none text-zinc-500 shadow-[0_0_32px_rgba(255,255,255,0.28)] transition hover:bg-magenta hover:text-white"
          onClick={() => goToCard(activeIndex + 1)}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {items.map((item, index) => (
          <button
           aria-label={`Ver ${item.title}`}
            className={`h-4 w-4 rounded-full border border-white transition hover:bg-white ${
              activeIndex === index ? "bg-white" : "bg-white/45"
            }`}
            key={`${item.title}-${index}`}
            onClick={() => goToCard(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
