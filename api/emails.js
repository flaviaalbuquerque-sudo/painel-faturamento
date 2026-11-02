export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(500).json({ error: 'Variáveis de ambiente do Google não configuradas na Vercel.' });
  }

  try {
    // 1. Obter um access_token novo
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ error: 'Erro ao renovar token do Google', details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // 2. Listar os últimos 5 e-mails da caixa de entrada
    const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=label:INBOX';
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const listData = await listResponse.json();

    if (!listResponse.ok) {
      return res.status(listResponse.status).json({ error: 'Erro ao listar mensagens do Gmail', details: listData });
    }

    const messages = listData.messages || [];

    // 3. Buscar os detalhes de cada e-mail em paralelo
    const emailDetails = await Promise.all(
      messages.map(async (msg) => {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const detailRes = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const detailData = await detailRes.json();

        const headers = detailData.payload?.headers || [];
        const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from');

        return {
          id: detailData.id,
          snippet: detailData.snippet,
          subject: subjectHeader ? subjectHeader.value : 'Sem assunto',
          from: fromHeader ? fromHeader.value : 'Desconhecido',
          date: detailData.internalDate,
        };
      })
    );

    return res.status(200).json({ emails: emailDetails });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
}
