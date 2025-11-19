"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        including premium image models and generous generation limits for those
        next-level scenarios.
      </p>
    ),
  },
  {
    question: "How do image credits work?",
    answer: (
      <p>
        You can choose between different image models when generating persona
        images. Standard models (like FLUX Dev) use 1 credit per generation,
        while premium models (like SeeDream) create higher-quality images but
        use 2 credits per generation. All plans have access to all models - the
        difference is just how many credits you get per day (or per hour for
        Blaze). Premium models are marked with a sparkle icon ✨ so you know
        they'll use more credits.
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
      <>
        <p>
          Yep! Refunds are based on usage since we have a free tier for testing:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Under 50% of monthly quota used = refund available (full or partial)
          </li>
          <li>
            Over 50% used = non-refundable (you've used the service
            substantially)
          </li>
          <li>Technical issues = always refunded</li>
        </ul>
        <p>
          Email{" "}
          <a href="mailto:hi@prsna.app" className="underline">
            hi@prsna.app
          </a>{" "}
          within 30 days to request one.
        </p>
        <p>
          We're doing our best to keep prices low and offer a generous free
          tier, but here's the thing - every generation costs us real money in
          AI API fees, and those costs are non-refundable on our end. When
          someone uses the service heavily and then refunds, we're stuck with
          those bills. We're a small operation trying to make this sustainable,
          so we really appreciate your understanding on this policy!
        </p>
      </>
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
      <div className="mt-4">
        <Accordion type="single" collapsible>
          {FAQ_ITEMS.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
