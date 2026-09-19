/**
 * System Page - /system
 * AWS infrastructure and health monitoring
 */

export default function System() {
  const services: any[] = []

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-display text-snow mb-4">System Status</h1>
        <p className="text-snow/60">AWS infrastructure health and monitoring</p>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.name} className="bg-[#111412] border border-snow/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${service.color === 'mint' ? 'bg-mint' : 'bg-snow/60'} animate-pulse`} />
                <p className="text-xs font-bold uppercase tracking-wide text-snow/60">
                  {service.status}
                </p>
              </div>
              <p className="text-sm text-snow font-medium">{service.name}</p>
            </div>
          ))
        ) : (
          <div className="text-snow/40 text-sm py-4 col-span-full">No system metrics available.</div>
        )}
      </div>

    </div>
  )
}

