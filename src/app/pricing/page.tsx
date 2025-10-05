import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  return (
    <div className="h-full bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Pricing
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Simple, transparent spark-based pricing
          </p>
        </div>

        {/* Daily Free Sparks Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Daily Free Sparks
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Logged-in users receive 10 free sparks daily. These sparks reset
                every day and don't accumulate - use them or lose them.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="font-medium text-foreground py-6 px-6">
                  Action
                </TableHead>
                <TableHead className="font-medium text-foreground py-6 px-6 text-right">
                  Spark Cost
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Create Persona
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Generate a new persona profile
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">1 spark</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Update Persona
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Modify existing persona details
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">1 spark</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Generate Image (Low)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Low quality image generation
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">1 spark</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Generate Image (Medium)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Medium quality image generation
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">3 tokens</span>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Generate Image (High)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      High quality image generation
                    </span>
                    <span className="text-xs text-amber-600 mt-1">
                      Purchased Sparks only
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">5 sparks</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-t border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      NSFW generation
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Available for Medium and High quality
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">
                    No additional cost
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Spark Packages */}
        <div className="mt-8">
          <h2 className="text-xl font-light text-foreground mb-6 text-center">
            Spark Packages
          </h2>
          <div className="bg-card rounded-lg border border-border p-6 text-center relative">
            {/* Promotional Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white"
              >
                🔥 Limited Time Offer
              </Badge>
            </div>

            <div className="text-3xl font-light text-foreground mb-2">
              100 sparks
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="text-lg text-muted-foreground line-through">
                $5.00
              </div>
              <div className="text-2xl font-semibold text-red-500">$1.99</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Sparks never expire and can be used for any action
            </p>
            <p className="text-xs text-red-600 mt-2 font-medium">
              Save 60% with this temporary promotion!
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            High quality generations require purchased Sparks and cannot use
            daily free Sparks
          </p>
        </div>
      </div>
    </div>
  );
}
