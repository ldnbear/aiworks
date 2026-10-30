// Public GEDDON enquiries. Google Forms owns the private Sheet connection.
const FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdfPUaMOdTBgYyvEUTaNVJA8-OFa8_89FvpBfMnKawXGk9dSw/formResponse';
const completed = new Map();
function response(statusCode,body){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)};}
exports.handler = async event => {
 if(event.httpMethod!=='POST')return response(405,{error:'Use POST.'});
 const origin=event.headers?.origin;
 const allowed=new Set(['https://agentsatwork.co','https://www.agentsatwork.co']);
 for(const key of ['URL','DEPLOY_PRIME_URL']){try{if(process.env[key])allowed.add(new URL(process.env[key]).origin);}catch{}}
 if(origin&&!allowed.has(origin))return response(403,{error:'This form must be submitted from GEDDON.'});
 if(!event.headers?.['content-type']?.toLowerCase().startsWith('application/json'))return response(415,{error:'Use JSON.'});
 if(!event.body||Buffer.byteLength(event.body,'utf8')>20000)return response(400,{error:'Invalid submission.'});
 let data;try{data=JSON.parse(event.body)}catch{return response(400,{error:'Invalid submission.'})}
 if(!data||typeof data!=='object'||data.website)return response(400,{error:'Invalid submission.'});
 const name=typeof data.name==='string'?data.name.trim():'';
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(name.length<1||name.length>100||/[\r\n]/.test(name)||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return response(400,{error:'Please enter your name and a valid email address.'});
 const subject=typeof data.subject==='string'?data.subject.trim():'';
 const message=typeof data.message==='string'?data.message.trim():'';
 if(!subject||subject.length>180||/[\r\n]/.test(subject)||!message||message.length>4000)return response(400,{error:'Please enter a subject and a message of up to 4,000 characters.'});
 const requestId=typeof data.requestId==='string'&&/^[a-f0-9-]{36}$/i.test(data.requestId)?data.requestId:null;
 const now=Date.now();for(const[k,v]of completed)if(now-v>600000)completed.delete(k);
 if(requestId&&completed.has(requestId))return response(200,{success:true});
 const safe=value=>/^[=+@\-]/.test(value)?"'"+value:value;
 const fields=new URLSearchParams({'entry.1345808285':safe(name),'entry.1519737495':safe(email),'entry.2098821573':safe(subject),'entry.43713519':safe(message),'fvv':'1','pageHistory':'0'});
 try{
  const result=await fetch(FORM_ACTION,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:fields.toString(),signal:AbortSignal.timeout(18000)});
  const page=await result.text();
  if(!result.ok||!/Your response has been recorded\./i.test(page))return response(502,{error:'Google did not confirm your message. Please use the Google Forms contact link.'});
  if(requestId){if(completed.size>1000)completed.delete(completed.keys().next().value);completed.set(requestId,now);}
  return response(200,{success:true});
 }catch{return response(502,{error:'We could not confirm your message. Please use the Google Forms contact link.'});}
};
