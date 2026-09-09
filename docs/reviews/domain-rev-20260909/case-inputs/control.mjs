const source = new Map([['synthetic-7', {email:'person@example.invalid', expiresAt:30}]]);
const exports = new Map([['synthetic-7', 'person@example.invalid']]);
const events=[];
function expire(now) { for (const [id,row] of source) if (row.expiresAt<=now) {source.delete(id);exports.delete(id);events.push({kind:'expiry',count:1});} }
expire(30);
console.log(JSON.stringify({sourceRows:source.size,exportRows:exports.size,events},null,2));
