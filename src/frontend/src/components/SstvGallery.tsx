/**
 * Phase 1: SSTV decoding is not implemented yet, so this is an empty-state
 * placeholder. Will show decoded images fetched from /api/sstv/images once
 * Phase 2 lands.
 */
export default function SstvGallery() {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">SSTV Gallery</h2>
      <p className="text-slate-400 text-sm">
        No SSTV activity detected yet — decoding arrives in a later phase.
      </p>
    </section>
  );
}
