"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Gift02, Lightning01 } from "@untitledui/icons";

interface HeroSlideData {
  id: string;
  content: React.ReactNode;
  backgroundClass: string;
  backgroundImage?: string;
}

export function HeroCarousel() {
  const slides: HeroSlideData[] = [
    {
      id: "free-tier",
      backgroundClass: "bg-gradient-to-tr from-black via-black/50 to-black/90",
      backgroundImage: "/free_plan_bg-1.jpg",
      content: (
        <div className="flex flex-col max-w-xl justify-end gap-2 h-full">
          <h3 className="text-3xl font-bold text-white/90">
            Start Chatting for Free
          </h3>

          <p className="text-sm leading-relaxed text-white/80">
            Enjoy <strong>20 messages every 2 hours</strong> with standard
            models, or <strong>100 messages every 2 hours</strong> with our Eco
            models. No credit card required.
          </p>
        </div>
      ),
    },
    {
      id: "hermes-eco",
      backgroundClass: "bg-gradient-to-tr from-black via-black/50 to-black/90",
      backgroundImage: "/hermes-bg.jpg",
      content: (
        <div className="flex flex-col max-w-xl justify-end gap-2 h-full">
          <h3 className="text-3xl font-bold text-white/90">
            Introducing Hermes 4 70B
          </h3>

          <p className="text-sm leading-relaxed text-white/80">
            Experience our first Eco tier model. Fast, intelligent, and
            completely free with <strong>100 messages every 2 hours</strong>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-4 pt-4 md:px-8">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="h-[240px]">
              <div className="group relative overflow-hidden rounded-xl shadow-sm h-full">
                {/* Background Image */}
                {slide.backgroundImage && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={slide.backgroundImage}
                      alt=""
                      loading="lazy"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 z-10 transition-opacity duration-300",
                    slide.backgroundClass
                  )}
                />

                {/* Abstract shapes/overlay for premium feel */}
                {/* <div className="absolute -mr-10 -mt-10 right-0 top-0 z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -mb-10 -ml-10 bottom-0 left-0 z-10 h-40 w-40 rounded-full bg-black/10 blur-2xl" /> */}

                <div className="relative z-20 flex w-full items-center px-6 py-8 md:px-20 h-full">
                  {slide.content}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Position navigation buttons */}
        <div className="hidden md:block">
          <CarouselPrevious className="left-4 border-white/20 bg-black/20 text-white hover:bg-black/40 hover:border-white/40 hover:text-white" />
          <CarouselNext className="right-4 border-white/20 bg-black/20 text-white hover:bg-black/40 hover:border-white/40 hover:text-white" />
        </div>
      </Carousel>
    </div>
  );
}
