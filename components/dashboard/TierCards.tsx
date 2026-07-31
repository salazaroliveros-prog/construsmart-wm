'use client';

export default function TierCards() {
  return (
    <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
      <div className="glass-panel rounded-xl p-2 flex flex-col justify-center min-w-0">
        <div className="text-[9px] md:text-xs font-semibold text-white mb-0.5">Básico</div>
        <p className="text-[8px] md:text-[10px] text-white/60 mb-0.5">Acabados económicos</p>
        <p className="text-xs font-bold text-emerald-400">Q. 3,000-3,500/m²</p>
      </div>
      <div className="glass-panel rounded-xl p-2 flex flex-col justify-center min-w-0">
        <div className="text-[9px] md:text-xs font-semibold text-white mb-0.5">Moderado</div>
        <p className="text-[8px] md:text-[10px] text-white/60 mb-0.5">Calidad media</p>
        <p className="text-xs font-bold text-amber-400">Q. 3,500-4,000/m²</p>
      </div>
      <div className="glass-panel rounded-xl p-2 flex flex-col justify-center min-w-0">
        <div className="text-[9px] md:text-xs font-semibold text-white mb-0.5">Premium</div>
        <p className="text-[8px] md:text-[10px] text-white/60 mb-0.5">Alta gama</p>
        <p className="text-xs font-bold text-violet-400">Q. 4,000-5,000/m²</p>
      </div>
    </div>
  );
}