export default async function ScenarioPage({
  params,
}: PageProps<"/scenarios/[id]">) {
  const { id } = await params;

  return (
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto space-y-[48px] pt-[48px]">
        <h1 className="text-center font-onest text-[2.7rem]">
          Scenario {id}
        </h1>
      </div>
    </div>
  );
}
