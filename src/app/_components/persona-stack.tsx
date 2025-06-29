"use client";

import { useState } from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";

const DEMO_PERSONAS = [
  {
    id: 1,
    image:
      "https://cdn.persona.mynth.io/personas/ps_cqpotrlqrj60eg1nqcng/l2kTAGeawvr-.webp",
    name: "Creative Writer",
  },
  {
    id: 2,
    image:
      "https://cdn.persona.mynth.io/personas/ps_cqgkcmlqrj67bhjgrq4g/persona-ps_cqgkcmlqrj67bhjgrq4g.webp",
    name: "Tech Entrepreneur",
  },
  {
    id: 3,
    image: "https://cdn.persona.mynth.io/persona-ps_cqdpnodqrj63f8ojub30.png",
    name: "Artist",
  },
  {
    id: 4,
    image: "https://cdn.persona.mynth.io/persona-ps_cqepk3dqrj64lj0taelg.png",
    name: "Business Leader",
  },
  {
    id: 5,
    image:
      "https://cdn.persona.mynth.io/personas/ps_crjb03tqrj64ft21vfm0/AqGrtwZSaScJ.webp",
    name: "Innovator",
  },
];

export default function PersonaStack() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 mb-12">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-default-800 flex items-start justify-center">
          Craft Your Unique Persona
          <Chip className="ml-2" size="sm" variant="shadow" color="warning">
            2.0 BETA
          </Chip>
        </h2>
        <p className="text-default-600 max-w-md">
          Your ideal partner for role-playing, a muse for your next book or game
          character, or simply a fun new friend.
        </p>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center relative w-40 h-32">
          {DEMO_PERSONAS.map((persona, index) => {
            // Define subtle spread positions for each image in different directions
            const spreadPositions = [
              { x: -20, y: -15, r: -5 }, // top-left
              { x: 20, y: -15, r: 5 }, // top-right
              { x: -20, y: 15, r: -3 }, // bottom-left
              { x: 20, y: 15, r: 3 }, // bottom-right
              { x: 0, y: -20, r: 0 }, // top-center
            ];

            return (
              <div
                key={persona.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  zIndex: DEMO_PERSONAS.length - index,
                  transform: isHovered
                    ? `translateX(${spreadPositions[index].x}px) translateY(${spreadPositions[index].y}px) rotate(${spreadPositions[index].r}deg) scale(1)`
                    : `translateX(${index * 6}px) translateY(0px) rotate(${
                        (index - 2) * 5
                      }deg) scale(0.9)`,
                }}
              >
                <Card className="size-32 p-0 overflow-hidden shadow-lg">
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
    </div>
  );
}
