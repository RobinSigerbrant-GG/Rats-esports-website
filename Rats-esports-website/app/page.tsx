import HomeContent from './components/home-content';
import { players } from '../lib/soloq-server';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const roster = await players().then(members=>({members,rosterError:false})).catch(()=>({members:[],rosterError:true}));
  return <HomeContent {...roster}/>;
}
