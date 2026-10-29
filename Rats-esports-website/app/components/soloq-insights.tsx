'use client';
import { awards, historyDelta, minimumAwardGames } from '../../lib/soloq-analysis';
import type { Standing } from '../../lib/soloq';

export function SoloqInsights({players,onPlayer}:{players:Standing[];onPlayer:(id:string)=>void}) {
  const climbing=players.flatMap(player=>{const delta=historyDelta(player,'week');return delta!==null&&delta>0?[{player,delta}]:[];});
  const best=Math.max(0,...climbing.map(p=>p.delta));
  return <section className="sq-insights" aria-labelledby="awards-heading">
    <p className="section-label">HALL OF RATS</p><h2 id="awards-heading">RATS <em>UTMÄRKELSER.</em></h2>
    <p className="sq-muted">Utmärkelser för hela föreningen. Bygger på hämtade Solo/Duo-matcher bland OP.GG:s senaste tio matcher, inte hela säsongen. Minst {minimumAwardGames} avslutade matcher krävs. Delad förstaplats ger flera vinnare.</p>
    <div className="sq-awards">{awards(players).map(award=><article className={`sq-award sq-award-${award.id}`} key={award.id}><span className="sq-award-icon" aria-hidden="true">{award.icon}</span><h3>{award.name}</h3><p>{award.description}</p>{award.winners.length?award.winners.map(({player,metrics})=><div className="sq-award-winner" key={player.id}><button onClick={()=>onPlayer(player.id)}>{player.game_name}</button><strong>{award.metric==='avgDeaths'?`${metrics.avgDeaths.toFixed(1)} deaths`:award.metric==='uniqueChampions'?`${metrics.uniqueChampions} champions`:award.metric==='onetrick'?`${Math.round(metrics.onetrick*100)}% ${metrics.champions[0].name}`:`${Math.round(metrics.winRate*100)}% vinster`}</strong><small>{metrics.n} matcher</small></div>):<small>Inväntar tillräckligt matchunderlag.</small>}</article>)}</div>
    <div className="sq-climber"><div><p className="section-label">VECKANS KLÄTTRARE</p><p className="sq-muted">Rank och LP jämfört med en sparad synk för 7–8 dagar sedan. Historik samlas när någon öppnar eller uppdaterar sidan.</p></div><div>{best>0?climbing.filter(p=>p.delta===best).map(({player,delta})=><p key={player.id}><button className="sq-name-button" onClick={()=>onPlayer(player.id)}>{player.game_name}</button> <strong className="sq-win">+{delta} LP</strong></p>):<p className="sq-muted">{players.some(p=>historyDelta(p,'week')!==null)?'Ingen positiv klättring i veckans underlag ännu.':'Visas när minst en veckas historik har samlats.'}</p>}</div></div>
  </section>;
}
