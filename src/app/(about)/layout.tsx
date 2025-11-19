export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose dark:prose-invert mx-auto mt-[45px] md:mt-[120px] mb-[120px]">
      {children}
    </div>
  );
}
