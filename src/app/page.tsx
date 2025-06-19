import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { ShootingStarIcon } from "@phosphor-icons/react/ssr";

export default function Home() {
  return (
    <main className="w-full h-full">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <Textarea
            minRows={1}
            size="lg"
            placeholder="Write about your persona"
            endContent={
              <Button isIconOnly>
                <ShootingStarIcon />
              </Button>
            }
          />
        </div>
      </div>
    </main>
  );
}
