"use client";

import * as React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/mynth-ui/base/accordion";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What's included in Free?",
    answer: (
      <p>
        The Free plan is perfect for dipping your toes in and testing out the
        app's chat vibes. It's got enough juice for casual roleplaying when the
        mood strikes. No pressure to upgrade if you're digging what you've got!
        😊
      </p>
    ),
  },
  {
    question: "Which plan is best for me?",
    answer: (
      <p>
        Kick things off with the Free plan to see if you vibe with the
        experience. For most role-playing adventures, we'd nudge you toward the
        Spark plan - it's super affordable and hooks you up with the most
        popular models. The limits feel pretty much unlimited (120 messages
        every 2 hours = basically 1 per minute), so it handles epic chat
        sessions like a champ. If you're all about those premium models and
        aren't fussed about image generation, Flame plan's your jam. Blaze is
        for the hardcore roleplayers who want all the bells and whistles,
        including image generation for those next-level scenarios.
      </p>
    ),
  },
  {
    question: "How do subscriptions work?",
    answer: (
      <p>
        Pick your billing rhythm (monthly or annual), and boom - your plan kicks
        in right away. It'll keep the good times rolling automatically until you
        decide to bail.
      </p>
    ),
  },
  {
    question: "Can I switch plans?",
    answer: (
      <p>
        Absolutely! Feel free to level up or dial it back whenever the mood
        strikes.
      </p>
    ),
  },
  {
    question: "Do you offer refunds?",
    answer: (
      <p>
        You bet we do! Just hit us up manually for now - shoot an email to{" "}
        <a href="mailto:hi@prsna.app" className="underline">
          hi@prsna.app
        </a>{" "}
        and we'll sort you out.
      </p>
    ),
  },
  {
    question: "What happens if I cancel?",
    answer: (
      <p>
        No worries - your plan keeps the party going until your current billing
        period wraps up. After that, you'll slide back to the Free plan. Easy
        peasy!
      </p>
    ),
  },
];

export function PlansFAQ() {
  return (
    <section className="mt-16">
      <h2 className="text-lg font-medium text-surface-foreground">
        Frequently Asked Questions
      </h2>
      <div className="mt-4 rounded-[16px] border border-surface-200 overflow-hidden">
        <Accordion>
          {FAQ_ITEMS.map((item, idx) => (
            <AccordionItem key={idx}>
              <AccordionHeader>
                <AccordionTrigger>
                  <span className="pr-2">{item.question}</span>
                  <PlusIcon className="mr-1 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:rotate-45 group-data-[panel-open]:scale-110" />
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionPanel>{item.answer}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
