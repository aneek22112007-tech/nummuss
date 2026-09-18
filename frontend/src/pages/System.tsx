/**
 * System Page - /system
 * AWS infrastructure and health monitoring
 */

export default function System() {
  const services = [
    { name: 'EVENTBRIDGE', status: 'ONLINE', color: 'mint' },
    { name: 'LAMBDA', status: 'ONLINE', color: 'mint' },
    { name: 'S3', status: 'ONLINE', color: 'mint' },
    { name: 'DYNAMODB', status: 'ONLINE', color: 'mint' },
    { name: 'BEDROCK', status: 'CONNECTED', color: 'mint' },
    { name: 'BEDROCK GUARDRAILS', status: 'ACTIVE', color: 'mint' },
    { name: 'API GATEWAY', status: 'ONLINE', color: 'mint' },
    { name: 'CLOUDWATCH', status: 'MONITORING', color: 'amber' },
  ]

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">System Status</h1>
        <p className="text-snow/60">AWS infrastructure health and monitoring</p>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <div key={service.name} className="bg-[#111412] border border-snow/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${service.color === 'mint' ? 'bg-mint' : 'bg-amber'} animate-pulse`} />
              <p className={`text-xs font-bold uppercase tracking-wide ${service.color === 'mint' ? 'text-mint' : 'text-amber'}`}>
                {service.status}
              </p>
            </div>
            <p className="text-sm text-snow font-medium">{service.name}</p>
          </div>
        ))}
      </div>

      {/* Architecture Diagram */}
      <div>
        <p className="text-sm uppercase tracking-widest text-snow/40 mb-6">SYSTEM ARCHITECTURE</p>
        <div className="bg-[#060807] border border-snow/10 rounded-2xl p-12">
          <div className="space-y-6 max-w-md mx-auto">
            <ArchStep label="EVENTBRIDGE" sublabel="Event ingestion" />
            <ArchArrow />
            <ArchStep label="LAMBDA" sublabel="Compute layer" />
            <ArchArrow />
            <ArchStep label="S3 + DYNAMODB" sublabel="Storage" />
            <ArchArrow />
            <ArchStep label="BEDROCK" sublabel="LLM reasoning" />
            <ArchArrow />
            <ArchStep label="BEDROCK GUARDRAILS" sublabel="Security layer" />
            <ArchArrow />
            <ArchStep label="EVIDENCE GATE" sublabel="Quality check" />
            <ArchArrow />
            <ArchStep label="BEHAVIORAL GUARDRAILS" sublabel="Safety layer" />
            <ArchArrow />
            <ArchStep label="PAPER / REPLAY" sublabel="Execution" />
            <ArchArrow />
            <ArchStep label="AUDIT LEDGER" sublabel="Permanent record" />
          </div>
        </div>
      </div>

      {/* Stack Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StackCard label="COMPUTE" value="Lambda" desc="Serverless functions" />
        <StackCard label="ORCHESTRATION" value="Step Functions" desc="State machine" />
        <StackCard label="STORAGE" value="DynamoDB" desc="NoSQL database" />
        <StackCard label="IaC" value="AWS CDK" desc="Python-based" />
      </div>
    </div>
  )
}

function ArchStep({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-4 text-center">
      <p className="text-sm font-bold text-snow">{label}</p>
      <p className="text-xs text-snow/50 mt-1">{sublabel}</p>
    </div>
  )
}

function ArchArrow() {
  return (
    <div className="flex justify-center">
      <svg className="w-4 h-4 text-snow/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  )
}

function StackCard({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="bg-[#111412] border border-snow/10 rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">{label}</p>
      <p className="text-lg font-mono font-bold text-mint">{value}</p>
      <p className="text-xs text-snow/50 mt-1">{desc}</p>
    </div>
  )
}
