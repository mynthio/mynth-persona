import { Input } from "@base-ui-components/react/input";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

type SearchProps = {
  placeholder?: string;
  onSearchChange?: (query: string) => void;
};

export function Search({ placeholder, onSearchChange }: SearchProps) {
  return (
    <div className="relative w-full bg-foreground/15 h-[30px] rounded-[10px]">
      <Input
        autoFocus={false}
        className="pr-[28px] w-full text-foreground outline-none h-full py-[2px] px-[8px] text-[12px] placeholder:text-foreground/80"
        onValueChange={onSearchChange}
        placeholder={placeholder}
      />
      <MagnifyingGlassIcon
        size={14}
        className="absolute top-[50%] translate-y-[-50%] right-[8px] text-foreground/80"
      />
    </div>
  );
}
