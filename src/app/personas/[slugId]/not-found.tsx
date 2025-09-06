export default function NotFound() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-2">Persona not found</h1>
      <p className="text-muted-foreground">The persona you are looking for does not exist or is not published.</p>
    </div>
  );
}