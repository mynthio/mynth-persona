import ScenarioCreatorForm from "./_components/form";

export default function ScenarioCreatorPage() {
  return (
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto space-y-[48px] pt-[48px] pb-[48px]">
        <div className="max-w-xl mx-auto">
          <ScenarioCreatorForm />
        </div>
      </div>
    </div>
  );
}
