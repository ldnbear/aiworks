exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  try {
    let count = 0;
    let offset = null;
    do {
      const url = 'https://api.airtable.com/v0/appJ4hjTx63s80pzH/tblPsBBtX1eflaRo9?fields%5B%5D=Name&pageSize=100' + (offset ? '&offset=' + offset : '');
      const resp = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + process.env.AIRTABLE_TOKEN }
      });
      const data = await resp.json();
      count += (data.records || []).length;
      offset = data.offset || null;
    } while (offset);
    return { statusCode: 200, headers, body: JSON.stringify({ count }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
