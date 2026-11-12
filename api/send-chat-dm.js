import crypto from 'node:crypto';

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/chat.bot',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Erro OAuth Google: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { emailSolicitante, nomeSolicitante, refDemanda, parecerTexto } = req.body || {};

  if (!emailSolicitante) {
    return res.status(400).json({ error: 'E-mail do solicitante é obrigatório.' });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    return res.status(500).json({
      error: 'Variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_PRIVATE_KEY não configuradas na Vercel.',
    });
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const emailNormalizado = emailSolicitante.trim().toLowerCase();

  try {
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    const setupRes = await fetch('https://chat.googleapis.com/v1/spaces:setup', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        space: {
          spaceType: 'DIRECT_MESSAGE',
          singleUserBotDm: true,
        },
        memberships: [
          {
            member: {
              name: `users/${emailNormalizado}`,
              type: 'HUMAN',
            },
          },
        ],
      }),
    });

    const setupData = await setupRes.json();
    if (!setupRes.ok) {
      throw new Error(`Erro ao abrir DM no Chat: ${JSON.stringify(setupData)}`);
    }

    const msgRes = await fetch(`https://chat.googleapis.com/v1/${setupData.name}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '🟢 *Sua solicitação foi concluída pelo Faturamento!*',
        cardsV2: [
          {
            cardId: 'notificacaoConclusao',
            card: {
              header: {
                title: `Demanda: ${refDemanda || 'Faturamento'}`,
                subtitle: `Atendido para: ${nomeSolicitante || emailNormalizado}`,
                imageUrl: 'https://painel-faturamento-six.vercel.app/logo-unimed.png',
                imageType: 'CIRCLE',
              },
              sections: [
                {
                  header: 'Parecer Técnico do Faturamento',
                  widgets: [
                    {
                      textParagraph: {
                        text: parecerTexto || 'Demanda analisada e finalizada pelo setor.',
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      }),
    });

    const msgData = await msgRes.json();
    if (!msgRes.ok) {
      throw new Error(`Erro ao enviar mensagem: ${JSON.stringify(msgData)}`);
    }

    return res.status(200).json({ success: true, messageId: msgData.name });
  } catch (error) {
    console.error('Erro Google Chat:', error);
    return res.status(500).json({
      error: 'Falha ao enviar notificação no Google Chat.',
      details: error.message,
    });
  }
}
