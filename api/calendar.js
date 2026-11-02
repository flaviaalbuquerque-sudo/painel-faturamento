export default async function handler(req, res) {
  // Configura os cabeçalhos de CORS
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
    // 1. Obter um access_token novo usando o refresh_token
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

    // 2. Buscar eventos do Google Calendar a partir do momento atual
    const now = new Date().toISOString();
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&orderBy=startTime&singleEvents=true&maxResults=10`;

    const calendarResponse = await fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      return res.status(calendarResponse.status).json({ error: 'Erro ao buscar eventos do Google Calendar', details: calendarData });
    }

    // Formata a resposta com os dados limpos
    const events = (calendarData.items || []).map((item) => ({
      id: item.id,
      title: item.summary || 'Sem título',
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      location: item.location || '',
      link: item.htmlLink,
    }));

    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
}
