import { Avatar as AvatarPrimitive } from "@base-ui-components/react/avatar";

export type AvatarProps = {
  src?: string;
  fallback: string;
};

export function Avatar(props: AvatarProps) {
  return (
    <AvatarPrimitive.Root className="inline-flex shrink-0 size-[38px] items-center justify-center overflow-hidden rounded-[16px] bg-surface-200 align-middle text-base font-medium text-black select-none">
      <AvatarPrimitive.Image
        src={props.src}
        className="size-full object-cover"
      />
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center text-base">
        {props.fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
