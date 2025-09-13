export default function NotFoundPage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col justify-center items-center gap-[24px] px-[12px]">
        <img
          src="https://mynth-persona-prod.b-cdn.net/static/persona-oops.webp"
          alt="Not Found"
          className="
        max-w-[320px]
        "
        />

        <p className="font-onest font-[500] text-[2.3rem] leading-[2.2rem] text-center text-balance">
          Oops!
          <br className="md:hidden" /> Page Not Found
        </p>
      </div>
    </div>
  );
}
