import { ComponentProps } from "react";

import NextLink from "next/link";

type LinkProps = ComponentProps<typeof NextLink>;

export function Link(props: LinkProps) {
  return <NextLink {...props} prefetch={props.prefetch ?? false} />;
}
