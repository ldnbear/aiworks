// Public GEDDON waitlist. Google Forms owns the private Sheet connection.
const FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfyI-suKtoXRVKRjlFNDMAFH0XX5avBNZl91n5OGpLFckKV7w/formResponse';
const CONSENT = 'I agree to receive GEDDON launch emails. I can unsubscribe at any time.';
const choices = {fit:["Men's","Women's","Not sure"],size:['XS','S','M','L','XL','XXL','Not sure'],thickness:['5.5 mm — Prawle','7.5 mm — Start','Not sure'],colourway:['Moor','Kelp','Night','Not sure']};
const completed = new Map();
function response(statusCode,body){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)};}
exports.handler = async event => {
 if(event.httpMethod!=='POST')return response(405,{error:'Use POST.'});
 const origin=event.headers?.origin;
 const allowed=new Set(['https://agentsatwork.co','https://www.agentsatwork.co']);
 for(const key of ['URL','DEPLOY_PRIME_URL']){try{if(process.env[key])allowed.add(new URL(process.env[key]).origin);}catch{}}
 if(origin&&!allowed.has(origin))return response(403,{error:'This form must be submitted from GEDDON.'});
 if(!event.headers?.['content-type']?.toLowerCase().startsWith('application/json'))return response(415,{error:'Use JSON.'});
 if(!event.body||Buffer.byteLength(event.body,'utf8')>4096)return response(400,{error:'Invalid submission.'});
 let data;try{data=JSON.parse(event.body)}catch{return response(400,{error:'Invalid submission.'})}
 if(!data||typeof data!=='object'||data.website)return response(400,{error:'Invalid submission.'});
 const name=typeof data.name==='string'?data.name.trim():'';
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(name.length<1||name.length>100||/[\r\n]/.test(name)||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return response(400,{error:'Please enter your name and a valid email address.'});
 if(data.consent!==true)return response(400,{error:'Please agree to receive launch emails.'});
 for(const [key,values]of Object.entries(choices))if(!values.includes(data[key]))return response(400,{error:'Please choose your fit, size, thickness and colourway.'});
 const requestId=typeof data.requestId==='string'&&/^[a-f0-9-]{36}$/i.test(data.requestId)?data.requestId:null;
 const now=Date.now();for(const[k,v]of completed)if(now-v>600000)completed.delete(k);
 if(requestId&&completed.has(requestId))return response(200,{success:true});
 const safe=value=>/^[=+@\-]/.test(value)?"'"+value:value;
 const fields=new URLSearchParams({'entry.430789589':safe(name),'entry.1400563767':safe(email),'entry.1848638400':data.fit,'entry.119536413':data.size,'entry.2017302128':data.thickness,'entry.1825243199':data.colourway,'entry.929905603':CONSENT,'fvv':'1','pageHistory':'0'});
 try{
  const result=await fetch(FORM_ACTION,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:fields.toString(),signal:AbortSignal.timeout(18000)});
  const page=await result.text();
  if(!result.ok||!/Your response has been recorded\./i.test(page))return response(502,{error:'Google did not confirm your sign-up. Please use the Google form below.'});
  if(requestId){if(completed.size>1000)completed.delete(completed.keys().next().value);completed.set(requestId,now);}
  return response(200,{success:true});
 }catch{return response(502,{error:'We could not confirm your sign-up. Please use the Google form below.'});}
};
