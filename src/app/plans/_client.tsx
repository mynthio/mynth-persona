"use client";

import { CheckmarkCircle02Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckoutButton,
  SubscriptionDetailsButton,
  useSubscription,
} from "@clerk/nextjs/experimental";
import { CLERK_PLAN_SLUG_TO_PLAN_ID } from "@/config/shared/plans";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { motion } from "motion/react";
import { SignedIn } from "@clerk/nextjs";

export function Plans() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div>
      <div className="flex justify-center">
        <div className="relative">
          <motion.button
            onClick={() =>
              setPeriod(period === "monthly" ? "annual" : "monthly")
            }
            className="relative z-0 h-[56px] text-white border-[2px] border-white/20 font-mono text-[0.95rem] rounded-[14px] overflow-hidden min-w-[320px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient overlay */}
            <div className="absolute -z-5 top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-black/20" />

            {/* Animated background image */}
            <motion.img
              className="-z-10 absolute bottom-0 left-0 w-full h-full object-cover"
              src="/period_bg.jpg"
              loading="lazy"
              alt="Period background"
              animate={{
                scale: period === "annual" ? 1.05 : 1,
                filter:
                  period === "annual" ? "brightness(1.1)" : "brightness(0.9)",
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Content container with proper z-index */}
            <div className="relative z-10 flex items-center h-full">
              <div className="flex items-center w-full">
                {(["monthly", "annual"] as const).map((option) => (
                  <div
                    key={option}
                    className="flex-1 flex items-center justify-center"
                  >
                    <motion.span
                      className={`font-medium tracking-wide transition-colors duration-300 capitalize text-shadow-xs/70 ${
                        period === option
                          ? "text-white drop-shadow-sm text-[1.05rem]"
                          : "text-white"
                      }`}
                      animate={{
                        scale: period === option ? 1.05 : 0.95,
                      }}
                    >
                      {option}
                    </motion.span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-6 bg-white/20" />
            </div>

            {/* Subtle glow effect */}
            <motion.div
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              animate={{
                boxShadow:
                  period === "annual"
                    ? "0 0 20px rgba(59, 130, 246, 0.3)"
                    : "0 0 10px rgba(59, 130, 246, 0.15)",
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>

          {/* Floating savings badge for annual */}
          <motion.div
            className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: period === "annual" ? 1 : 0,
              opacity: period === "annual" ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            SAVE
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-[3px] w-full max-w-6xl mt-[24px]">
        <Plan
          id={CLERK_PLAN_SLUG_TO_PLAN_ID.free}
          name="Free"
          period={period}
          price={{ monthly: 0, annual: 0 }}
          imageUrl="/free_plan_bg.jpg"
          features={[
            "Models: Non-premium models only",
            "Messages: 20/2h (non-premium models only)",
            "Images: 5 credits/day",
            "Purpose: Trial to build habit — upgrade anytime",
          ]}
        />
        <Plan
          id={CLERK_PLAN_SLUG_TO_PLAN_ID.spark}
          name="Spark"
          period={period}
          price={{ monthly: 7.99, annual: 79.9 }}
          imageUrl="/sparks_plan_bg.jpg"
          features={[
            "Models: Non-premium + limited premium access",
            "Messages: 120/2h non-premium models, 20/2h premium models",
            "Images: 10 credits/day",
            "Best for: Casual roleplay users",
          ]}
        />
        <Plan
          id={CLERK_PLAN_SLUG_TO_PLAN_ID.flame}
          name="Flame"
          period={period}
          price={{ monthly: 16.99, annual: 169.9 }}
          imageUrl="/flame_plan_bg.jpg"
          features={[
            "Models: Non-premium + premium access (limited rates)",
            "Messages: 180/2h non-premium models, 80/2h premium models",
            "Images: 30 credits/day",
            "Best for: Regular users & creators",
          ]}
        />
        <Plan
          id={CLERK_PLAN_SLUG_TO_PLAN_ID.blaze}
          name="Blaze"
          period={period}
          price={{ monthly: 29.99, annual: 299.9 }}
          imageUrl="/blaze_plan_bg.jpg"
          features={[
            "Models: Non-premium + premium access (high limits)",
            "Messages: 200/2h non-premium models, 120/2h premium models",
            "Images: 30 credits/hour",
            "Best for: Power users",
          ]}
        />
      </div>
    </div>
  );
}

type PlanProps = {
  id: string;
  name: string;

  imageUrl: string;

  price: {
    monthly: number;
    annual: number;
  };

  period: "monthly" | "annual";

  features?: string[];
};

function Plan(props: PlanProps) {
  const { data, isLoading } = useSubscription();

  const isActive = data?.subscriptionItems?.[0]?.plan?.id === props.id;

  return (
    <div
      className={`h-auto flex flex-col relative z-0 w-full min-w-0 min-h-[220px] rounded-[16px] overflow-hidden border-[3px] ${
        isActive
          ? "border-green-400 shadow-lg shadow-green-400/20"
          : "border-surface-100"
      }`}
    >
      <div className="flex items-center justify-between py-[1rem]">
        <div className="flex items-center gap-3 px-[2rem]">
          <h3 className="text-primary-foreground font-[200] text-[2.2rem] font-onest">
            {props.name}
          </h3>
          {isActive && (
            <motion.div
              className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              ACTIVE
            </motion.div>
          )}
        </div>

        {/* Animated prices */}
        <motion.div className="px-[1rem]" layout>
          {(props.period === "annual"
            ? [
                { type: "annual", price: props.price.annual, suffix: "/year" },
                {
                  type: "monthly",
                  price: props.price.monthly,
                  suffix: "/month",
                },
              ]
            : [
                {
                  type: "monthly",
                  price: props.price.monthly,
                  suffix: "/month",
                },
                { type: "annual", price: props.price.annual, suffix: "/year" },
              ]
          ).map((item, index) => (
            <motion.p
              key={item.type}
              layout
              initial={false}
              className={`font-mono text-primary-foreground ${
                index === 0
                  ? "text-[1.2rem] opacity-90"
                  : "text-[1rem] opacity-80"
              }`}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              {item.price}${item.suffix}
            </motion.p>
          ))}
        </motion.div>
      </div>

      {props.features && (
        <div className="px-[2rem] pb-[1.5rem] mt-[1.3rem] h-full space-y-[8px]">
          {props.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-[10px] text-primary-foreground/90"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 mt-[2px] opacity-90 flex-shrink-0" />
              <span className="text-[0.85rem] leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center px-[2rem] py-[1rem]">
        {props.id === "free" ? null : isLoading ? (
          <HugeiconsIcon icon={Loading02Icon} className="animate-spin" />
        ) : isActive ? (
          <SignedIn>
            <SubscriptionDetailsButton>
              <Button variant="outline" className="text-primary-foreground">
                Manage
              </Button>
            </SubscriptionDetailsButton>
          </SignedIn>
        ) : (
          <SignedIn>
            <CheckoutButton
              planId={props.id}
              planPeriod={props.period === "annual" ? "annual" : "month"}
            >
              <Button variant="outline" className="text-primary-foreground">
                Subscribe for {props.period === "annual" ? "Year" : "Month"}
              </Button>
            </CheckoutButton>
          </SignedIn>
        )}
      </div>

      <StarsBackground className="absolute -z-3 top-0 left-0 w-full h-full" />

      <div className="absolute -z-5 top-0 left-0 w-full h-full bg-gradient-to-tr from-primary/50 via-primary-80 to-primary" />
      <img
        className="-z-10 absolute bottom-0 left-0 w-full h-full object-cover"
        src={props.imageUrl}
        loading="lazy"
        alt={`${props.name} plan background`}
      />
    </div>
  );
}
