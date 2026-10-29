import test from 'node:test';
import assert from 'node:assert/strict';
import { rankScore, winrate, opgg } from '../lib/soloq.ts';

const rank = (tier, division, lp) => ({ tier, rank: division, leaguePoints: lp, wins: 0, losses: 0 });
test('official tier takes precedence over LP, including apex tiers', () => {
  assert.ok(rankScore(rank('GRANDMASTER','I',100)) > rankScore(rank('MASTER','I',1000)));
  assert.ok(rankScore(rank('GOLD','IV',0)) > rankScore(rank('SILVER','I',99)));
  assert.ok(rankScore(rank('EMERALD','II',0)) > rankScore(rank('EMERALD','III',99)));
  assert.ok(rankScore(rank('IRON','IV',0)) > rankScore(null));
});
test('winrate handles zero games and rounds consistently', () => {
  assert.equal(winrate({...rank('GOLD','I',0),wins:2,losses:1}),67);
  assert.equal(winrate(rank('GOLD','I',0)),0);
});
test('profile links encode Unicode and spaces and always use EUW', () => {
  assert.equal(opgg({game_name:'Nikita Rósa',tag_line:'Upir'}), 'https://www.op.gg/summoners/euw/Nikita%20R%C3%B3sa-Upir');
});
