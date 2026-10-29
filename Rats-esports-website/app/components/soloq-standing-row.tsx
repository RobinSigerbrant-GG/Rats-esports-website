'use client';
import { analyze, historyDelta } from '../../lib/soloq-analysis';
import { opgg, winrate, type Standing } from '../../lib/soloq';
import { MatchForm, matchDate } from './soloq-player-detail';

export function SoloqStandingRow({player:p,position,source,onPlayer}:{player:Standing;position?:number;source:string;onPlayer:(id:string)=>void}) {
  const stats=p.stats,a=analyze(p.recentGames),form=analyze(p.recentGames?.slice(0,5)),week=historyDelta(p,'week');
  return <tr>
    <td className={'sq-position'+(position===1?' sq-first':'')}>{position?String(position).padStart(2,'0'):'—'}</td>
    <td className="sq-player-cell"><button className="sq-name-button" onClick={()=>onPlayer(p.id)}>{p.game_name}<span className="sq-tag">#{p.tag_line}</span></button><small><span className="sq-team">{p.team}</span> · {p.role}</small></td>
    <td data-label="Rank" className="sq-rank-cell"><span className={stats?'sq-rank':'sq-muted'}>{stats?stats.tier+( ['MASTER','GRANDMASTER','CHALLENGER'].includes(stats.tier)?'':' '+stats.rank):p.status==='unranked'?'Orankad':'Data saknas'}</span>{stats&&<b className="sq-lp">{stats.leaguePoints} <span>LP</span></b>}{source==='opgg'&&p.sourceUpdatedAt&&<small title="Senaste profiluppdatering hos OP.GG">OP.GG {matchDate(p.sourceUpdatedAt)}</small>}</td>
    <td data-label="Säsong" className="sq-season-cell">{stats?<><b>{winrate(stats)}%</b><small><span className="sq-win">{stats.wins} V</span> / {stats.losses} F</small><div className="sq-progress" aria-hidden="true"><span style={{width:winrate(stats)+'%'}}/></div></>:'—'}</td>
    <td data-label="Senaste 5" className="sq-form-cell"><MatchForm matches={p.recentGames?.slice(0,5)}/><small>{form.n?form.wins+'/'+form.n+' vinster':'Inväntar matcher'}{a.streak>1?' · '+a.streak+(a.streakCapped?'+':'')+' i svit':''}</small></td>
    <td data-label="K / D / A" className="sq-average-cell">{a.n?<><b>{a.avgKills.toFixed(1)} <span>/</span> {a.avgDeaths.toFixed(1)} <span>/</span> {a.avgAssists.toFixed(1)}</b><small>KDA {a.kda===null?'Perfect':a.kda.toFixed(2)} · {a.n} matcher</small></>:'—'}</td>
    <td data-label="OP Score" className="sq-score-cell"><b>{a.opScore?.toFixed(2)??'—'}</b><small>{a.scoreGames?a.bestScoreGames+' × #1 · '+a.scoreGames+' matcher':'Inga poäng'}</small></td>
    <td data-label="7 dagar" className="sq-week-cell"><b className={week!==null&&week>0?'sq-win':week!==null&&week<0?'sq-loss':''}>{week===null?'—':(week>0?'+':'')+week+' LP'}</b><small>{week===null?'Samlar historik':'Rankutveckling'}</small></td>
    <td className="sq-actions-cell"><button className="sq-row-open" onClick={()=>onPlayer(p.id)} aria-label={'Visa detaljer för '+p.game_name}>Visa <span aria-hidden="true">↗</span></button><a className="sq-profile-link" href={opgg(p)} target="_blank" rel="noreferrer" aria-label={'Visa '+p.game_name+' på OP.GG'}>OP.GG ↗</a></td>
  </tr>;
}
