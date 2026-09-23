// Deliberately inactive until the owner chooses and enables a payment setup.
exports.handler = async () => ({statusCode:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({error:'Payments are coming soon. No payment has been taken.'})});
