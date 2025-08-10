"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_PERSONAS = [
  {
    id: 1,
    image:
      "https://mynth-persona-prod.b-cdn.net/static/persona-showcase-1.webp",
    name: "Creative Writer",
  },
  {
    id: 2,
    image:
      "https://mynth-persona-prod.b-cdn.net/static/persona-showcase-2.webp",
    name: "Tech Entrepreneur",
  },
  {
    id: 3,
    image:
      "https://mynth-persona-prod.b-cdn.net/static/persona-showcase-3.webp",
    name: "Artist",
  },
  {
    id: 4,
    image:
      "https://mynth-persona-prod.b-cdn.net/static/persona-showcase-4.webp",
    name: "Business Leader",
  },
  {
    id: 5,
    image:
      "https://mynth-persona-prod.b-cdn.net/static/persona-showcase-5.webp",
    name: "Innovator",
  },
];

export default function PersonaStack() {
  const [isHovered, setIsHovered] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationOffset((prev) => (prev + 1) % DEMO_PERSONAS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 mb-12">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center relative w-56 h-40">
          {DEMO_PERSONAS.map((persona, index) => {
            // Calculate the effective position after rotation
            const effectiveIndex =
              (index - rotationOffset + DEMO_PERSONAS.length) %
              DEMO_PERSONAS.length;

            // Define subtle spread positions for each image in different directions
            const spreadPositions = [
              { x: -35, y: -25, r: -8 }, // top-left
              { x: 35, y: -25, r: 8 }, // top-right
              { x: -35, y: 25, r: -5 }, // bottom-left
              { x: 35, y: 25, r: 5 }, // bottom-right
              { x: 0, y: -35, r: 0 }, // top-center
            ];

            return (
              <div
                key={persona.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  zIndex: DEMO_PERSONAS.length - effectiveIndex,
                  transform: isHovered
                    ? `translateX(${spreadPositions[effectiveIndex].x}px) translateY(${spreadPositions[effectiveIndex].y}px) rotate(${spreadPositions[effectiveIndex].r}deg) scale(1.05)`
                    : `translateX(${
                        effectiveIndex * 8
                      }px) translateY(0px) rotate(${
                        (effectiveIndex - 2) * 5
                      }deg) scale(0.9)`,
                }}
              >
                <Card className="size-40 p-0 overflow-hidden shadow-lg border-0">
                  <img
                    src={persona.image}
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-default-800 flex items-start justify-center">
          Craft Your Unique Persona
          <Badge variant="secondary" className="ml-2">
            2.1 BETA
          </Badge>
        </h2>
        <p className="text-default-600 max-w-md">
          Your ideal partner for role-playing, a muse for your next book or game
          character, or simply a fun new friend.
        </p>
      </div>
    </div>
  );
}
