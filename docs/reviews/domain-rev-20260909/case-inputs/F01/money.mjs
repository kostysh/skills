const MIN=-(2n**63n),MAX=2n**63n-1n;
export function readMinor(s){if(typeof s!=='string'||! /^(0|-?[1-9][0-9]*)$/.test(s))throw new Error('FORMAT');const n=BigInt(s);if(n<MIN||n>MAX)throw new Error('RANGE');return n;}
export function mulDivMinor(v,n,d,mode){if(d<=0n)throw new Error('DENOMINATOR');const x=v*n;let q=x/d,r=x%d;if(mode==='half-away'){if((r<0n?-r:r)*2n>=d)q+=x<0n?-1n:1n;}else if(mode==='floor'){if(r<0n)q-=1n;}else throw new Error('MODE');if(q<MIN||q>MAX)throw new Error('RANGE');return q;}
