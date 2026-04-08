exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { name, email } = JSON.parse(event.body);
    if (!name || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and email required' }) };
    }
    const resp = await fetch('https://api.airtable.com/v0/appJ4hjTx63s80pzH/tblPsBBtX1eflaRo9', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.AIRTABLE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ fields: { Name: name, Email: email } }]
      })
    });
    if (!resp.ok) {
      const err = await resp.text();
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: err }) };
    }
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
  } catch(e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
};
