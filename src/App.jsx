import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Busca ambos os endpoints em paralelo
        const [calendarRes, emailsRes] = await Promise.all([
          fetch('/api/calendar'),
          fetch('/api/emails')
        ]);

        const calendarData = await calendarRes.json();
        const emailsData = await emailsRes.json();

        if (!calendarRes.ok) {
          throw new Error(calendarData.error || 'Erro ao carregar o Calendário');
        }
        if (!emailsRes.ok) {
          throw new Error(emailsData.error || 'Erro ao carregar os E-mails');
        }

        setEvents(calendarData.events || []);
        setEmails(emailsData.emails || []);
      } catch (err) {
        console.error('Erro na integração com Google:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Carregando dados do Google...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 text-red-400 rounded-lg m-4 border border-red-500/30">
        <p className="font-semibold">Falha ao carregar integrações:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Central de Produtividade</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco do Google Calendar */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
            📅 Próximos Compromissos
          </h2>
          {events.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum evento próximo encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white hover:underline block"
                  >
                    {event.title}
                  </a>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.start).toLocaleString('pt-BR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bloco do Gmail */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            ✉️ E-mails Recentes
          </h2>
          {emails.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum e-mail recente encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {emails.map((email) => (
                <li key={email.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                  <p className="font-medium text-white text-sm truncate">{email.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">De: {email.from}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{email.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
