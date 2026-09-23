const { OFFERS } = require('./_offers');
exports.handler = async () => ({statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({paymentsEnabled:false,offers:Object.fromEntries(Object.entries(OFFERS).map(([id,offer])=>[id,{...offer,available:false}]))})});
