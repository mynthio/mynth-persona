import { PersonaData } from "@/schemas";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
      {children}
    </h3>
  );
}

function SectionContent({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
      {children}
    </p>
  );
}

export function BioSection({ data }: { data: PersonaData }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Summary */}
      {data.summary && (
        <p className="text-base md:text-lg text-muted-foreground italic leading-relaxed">
          {data.summary}
        </p>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InfoCard label="Age" value={data.age} />
        <InfoCard label="Gender" value={data.gender} />
        {data.occupation && (
          <InfoCard label="Occupation" value={data.occupation} />
        )}
      </div>

      {/* Personality */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Personality</SectionTitle>
        <SectionContent>{data.personality}</SectionContent>
      </div>

      {/* Appearance */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Appearance</SectionTitle>
        <SectionContent>{data.appearance}</SectionContent>
      </div>

      {/* Background */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Background</SectionTitle>
        <SectionContent>{data.background}</SectionContent>
      </div>

      {/* Speaking Style */}
      {data.speakingStyle && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Speaking Style</SectionTitle>
          <SectionContent>{data.speakingStyle}</SectionContent>
        </div>
      )}

      {/* Extensions */}
      {data.extensions && Object.keys(data.extensions).length > 0 && (
        <div className="flex flex-col gap-6">
          {Object.entries(data.extensions).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-2">
              <SectionTitle>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </SectionTitle>
              <SectionContent>{value}</SectionContent>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/50 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
