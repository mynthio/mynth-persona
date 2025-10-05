export const metadata = {
  title: "Pay with Crypto on prsna.app",
};

export default function HelpCryptoPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero */}
      <div className="bg-surface rounded-2xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tight text-surface-foreground mb-3">
            Pay with Crypto on prsna.app
          </h1>
          <p className="text-surface-foreground/80 text-lg font-light">
            Quick guide to buying Sparks with crypto
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 bg-surface rounded-2xl p-8">
        <div className="space-y-6">
          <p className="text-surface-foreground text-[1.1rem] leading-relaxed">
            Hey, prsna.app explorer! We're keeping things simple and private here – your AI personas,
            chats, and universes stay just yours. No chat logs we snoop on (stored securely in NeonDB,
            only touched if you say so for bugs or fixes). That's why we go crypto-only: It's fast,
            anonymous, and skips nosy banks or processors. Your privacy, your way – no tracking, just
            pure creation fun.
          </p>

          <p className="text-surface-foreground/90 leading-relaxed">
            Buying Sparks (our fuel for chats and images) is straightforward. We use NOWPayments for
            seamless, secure transactions. New to crypto? No worries – it's easier than it sounds.
            Here's how:
          </p>

          <h2 className="text-2xl font-medium text-surface-foreground mt-8">Quick Steps to Get Sparks</h2>
          <ol className="list-decimal pl-6 space-y-4 text-surface-foreground/90">
            <li>
              <span className="font-semibold text-surface-foreground">Grab a Wallet:</span> Download a free, trusted app like
              {" "}
              <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                MetaMask
              </a>
              {" "}
              (great for Ethereum-based assets),
              {" "}
              <a href="https://trustwallet.com/" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                Trust Wallet
              </a>
              {" "}
              (user-friendly with broad support), or
              {" "}
              <a href="https://www.exodus.com/" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                Exodus
              </a>
              {" "}
              (multi-platform and beginner-focused). Buy some USDT (stable like dollars) on an exchange
              like Binance – quick swap from your card or bank.
            </li>
            <li>
              <span className="font-semibold text-surface-foreground">Pick Your Sparks Pack:</span> In prsna.app, head to your dashboard, choose a bundle,
              and hit "Buy with Crypto."
            </li>
            <li>
              <span className="font-semibold text-surface-foreground">Checkout with NOWPayments:</span> Scan the QR or copy the address into your wallet.
              Send the amount – done in minutes!
            </li>
            <li>
              <span className="font-semibold text-surface-foreground">Sparks Arrive:</span> Refresh your balance, and you're set to create and chat.
            </li>
          </ol>

          <p className="text-surface-foreground/80 text-sm italic mt-2">
            Side note: On the NOWPayments checkout, the minimum amount shown can be too low for
            certain coins due to network rules and fees. If your transaction won’t send or shows as
            invalid, try selecting a different supported crypto or choose a larger Sparks pack so the
            total meets the required minimum for that network.
          </p>

          <div className="rounded-xl p-4 bg-surface mt-6">
            <p className="text-surface-foreground/90">
              NOWPayments handles 300+ coins with low fees (about 0.5%) and no user data grabs – aligning
              with our privacy vibe. Questions? We're here. Let's spark those universes! ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}