import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'SoloQ Tracker | RATS Esports', description: 'Följ RATS-medlemmarnas rank, LP och vinster i League of Legends Solo/Duo på EUW.' };
export default function SoloLayout({ children }: { children: React.ReactNode }) {
  return <main className="sq-shell"><header className="sq-header"><Link className="brand" href="/" aria-label="RATS Esports startsida"><span className="brand-logo" aria-hidden="true" /><span>RATS <b>ESPORTS</b></span></Link><div><Link href="/">← Hemsidan</Link><Link href="/soloq">SoloQ</Link><Link href="/soloq/admin">Admin ↗</Link></div></header>{children}<footer className="sq-footer"><p>RATS Esports · Byggd tillsammans.</p><p>RATS SoloQ Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p></footer></main>;
}

