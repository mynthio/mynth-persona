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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Pricing
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Simple, transparent token-based pricing
          </p>
        </div>

        {/* Daily Free Tokens Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Daily Free Tokens
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Logged-in users receive 10 free tokens daily. These tokens reset
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
                  Token Cost
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
                  <span className="text-foreground font-medium">1 token</span>
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
                  <span className="text-foreground font-medium">1 token</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        Generate Image (LQ)
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Free Beta
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Low quality image generation
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">1 token</span>
                </TableCell>
              </TableRow>

              <TableRow className="border-b border-border/50">
                <TableCell className="py-6 px-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        Generate Image (MQ)
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        Generate Image (HQ)
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      High quality image generation
                    </span>
                    <span className="text-xs text-amber-600 mt-1">
                      Purchased tokens only
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <span className="text-foreground font-medium">5 tokens</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Token Packages */}
        <div className="mt-8">
          <h2 className="text-xl font-light text-foreground mb-6 text-center">
            Token Packages
          </h2>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-light text-foreground mb-2">
              100 tokens
            </div>
            <div className="text-lg text-muted-foreground mb-4">$5.00</div>
            <p className="text-sm text-muted-foreground">
              Tokens never expire and can be used for any action
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            HQ models require purchased tokens and cannot use daily free tokens
          </p>
        </div>
      </div>
    </div>
  );
}
