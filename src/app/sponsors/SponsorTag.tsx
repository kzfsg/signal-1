/** "Powered by" label on each sponsor integration. */
export function SponsorTag({ name }: { name: string }) {
  return <span className="sponsor-tag t-label">with {name}</span>;
}
