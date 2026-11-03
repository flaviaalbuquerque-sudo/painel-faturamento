import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, Calendar as CalendarIcon, CheckSquare,
  FileText, BarChart2, Plus, Search, Sun, Moon, Mail,
  X, Trash2, Video, Clock, ChevronLeft, ChevronRight,
  Paperclip, Upload, Image as ImageIcon, File as FileIcon,
  Download, Pencil, StickyNote, Check, ExternalLink, AlertCircle
} from 'lucide-react';

/* =========================================================================
   CONSTANTES
   ========================================================================= */

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SISTEMAS = ['SoulMV', 'SAW', 'EasyAudit'];

// Anexos das notas de sistema
const EXTENSOES_ACEITAS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
const ACCEPT_INPUT = '.jpg,.jpeg,.png,.pdf,.doc,.docx';
const TAMANHO_MAX_MB = 10;

const TAREFAS_INICIAIS = [
  { id: '1', title: 'Revisão SoulMV', category: 'Trabalho', priority: 'Alta', status: 'Pendente', date: '2026-11-05' },
  { id: '2', title: 'Consulta Médica', category: 'Saúde', priority: 'Média', status: 'Pendente', date: '2026-11-10' }
];

const NOTAS_INICIAIS = [
  {
    id: '1',
    system: 'SoulMV',
    title: 'Caminho de Salvamento de Imagens',
    path: '\\\\servidor\\soulmv\\anexos\\laudos',
    content: 'Configuração do módulo de faturamento. Verificar permissões da pasta de rede antes de alterar.',
    actionsTaken: '',
    attachments: [],
    date: '2026-11-01'
  },
  {
    id: '2',
    system: 'SAW',
    title: 'Tela de Parâmetros de Auditoria',
    path: 'Configurações > Auditoria > Tabela de Prazos',
    content: 'Tela pouco utilizada. Acessar apenas no início do mês para atualizar regras de glosa.',
    actionsTaken: '',
    attachments: [],
    date: '2026-11-02'
  }
];

const PROJETOS_INICIAIS = [
  { id: 'p1', title: 'Implantação Módulo EasyAudit', system: 'EasyAudit', status: 'Pendente', progress: 20 },
  { id: 'p2', title: 'Homologação SAW v4', system: 'SAW', status: 'Em Andamento', progress: 65 },
  { id: 'p3', title: 'Migração de Servidor SoulMV', system: 'SoulMV', status: 'Concluído', progress: 100 }
];

/* =========================================================================
   TEMAS (escuro / claro)
   ========================================================================= */

const TEMAS = {
  escuro: {
    app: 'bg-slate-950 text-slate-100',
    header: 'border-slate-800 bg-slate-900/80',
    card: 'bg-slate-900 border-slate-800',
    sub: 'bg-slate-950/50 border-slate-800',
    subHover: 'hover:border-slate-700',
    inner: 'bg-slate-900 border-slate-800',
    input: 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 [color-scheme:dark]',
    muted: 'text-slate-400',
    faint: 'text-slate-500',
    body: 'text-slate-300',
    strong: 'text-white',
    accent: 'text-lime-400',
    chip: 'bg-slate-800 text-slate-300',
    tabs: 'bg-slate-800/50 border-slate-700/50',
    tabOff: 'text-slate-300 hover:text-white',
    btnSec: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    iconBtn: 'border-slate-700 hover:bg-slate-800',
    cell: 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40',
    cellPad: 'bg-slate-950/20',
    dayNum: 'text-slate-300',
    dayHover: 'hover:bg-slate-700/60',
    divider: 'border-slate-800',
    track: 'bg-slate-800',
    drop: 'border-slate-700 hover:border-lime-500/60 bg-slate-950/40',
    code: 'bg-slate-900 border-slate-800'
  },
  claro: {
    app: 'bg-slate-100 text-slate-900',
    header: 'border-slate-200 bg-white/90',
    card: 'bg-white border-slate-200',
    sub: 'bg-slate-50 border-slate-200',
    subHover: 'hover:border-slate-300',
    inner: 'bg-white border-slate-200',
    input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    muted: 'text-slate-500',
    faint: 'text-slate-400',
    body: 'text-slate-700',
    strong: 'text-slate-900',
    accent: 'text-lime-600',
    chip: 'bg-slate-200 text-slate-700',
    tabs: 'bg-slate-100 border-slate-200',
    tabOff: 'text-slate-600 hover:text-slate-900',
    btnSec: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    iconBtn: 'border-slate-300 hover:bg-slate-100',
    cell: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    cellPad: 'bg-slate-200/40',
    dayNum: 'text-slate-600',
    dayHover: 'hover:bg-slate-200',
    divider: 'border-slate-200',
    track: 'bg-slate-200',
    drop: 'border-slate-300 hover:border-lime-500 bg-slate-50',
    code: 'bg-slate-100 border-slate-200'
  }
};

const CORES = {
  verde: { solid: 'bg-lime-400 text-slate-950', soft: 'bg-lime-500/15 text-lime-500 border border-lime-500/30', dot: 'bg-lime-400' },
  vermelho: { solid: 'bg-red-500 text-white', soft: 'bg-red-500/15 text-red-500 border border-red-500/30', dot: 'bg-red-500' },
  laranja: { solid: 'bg-orange-400 text-slate-950', soft: 'bg-orange-400/15 text-orange-500 border border-orange-400/30', dot: 'bg-orange-400' },
  amarelo: { solid: 'bg-yellow-400 text-slate-950', soft: 'bg-yellow-400/15 text-yellow-600 border border-yellow-400/30', dot: 'bg-yellow-400' }
};

const corDoItem = (item) => {
  if (item.source === 'google') {
    if (item.type === 'ausencia') return CORES.vermelho;
    if (item.type === 'feriado') return CORES.amarelo;
    return CORES.verde;
  }
  if (item.category === 'Saúde' || item.category === 'Ausência') return CORES.vermelho;
  if (item.category === 'Prazo') return CORES.laranja;
  return CORES.verde;
};

/* =========================================================================
   UTILITÁRIOS DE DATA
   ========================================================================= */

const pad2 = (n) => String(n).padStart(2, '0');

// Data LOCAL no formato AAAA-MM-DD.
// (O toISOString() usa UTC: depois das 21h no Brasil ele já devolve o dia seguinte.)
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const hojeStr = () => toDateStr(new Date());
const montarData = (ano, mes, dia) => `${ano}-${pad2(mes + 1)}-${pad2(dia)}`;

const formatarDataBR = (dateStr) => {
  if (!dateStr) return '';
  const [a, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

const formatarDataExtenso = (dateStr) => {
  if (!dateStr) return '';
  const [a, m, d] = dateStr.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// O Google manda "start" como "2026-11-05" (dia inteiro) ou "2026-11-05T09:00:00-03:00"
const lerInicioGoogle = (start) => {
  if (!start) return { date: '', time: '' };
  if (start.length <= 10) return { date: start, time: '' };
  const d = new Date(start);
  if (isNaN(d)) return { date: start.slice(0, 10), time: '' };
  return { date: toDateStr(d), time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}` };
};

const textoPuro = (html) => String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();

const novoId = () => (window.crypto?.randomUUID
  ? window.crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Remove campos vazios (undefined/null) para não "descontrolar" os inputs do formulário
const semVazios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));

const progressoPorStatus = (status) => (status === 'Concluído' ? 100 : status === 'Em Andamento' ? 50 : 10);

/* =========================================================================
   PERSISTÊNCIA
   - Textos (compromissos, notas, projetos, informações do dia): localStorage
   - Arquivos anexados (imagens/PDF/Word): IndexedDB, que aguenta arquivos
     grandes. O localStorage só comporta ~5 MB no total.
   ========================================================================= */

const lerLocal = (chave, padrao) => {
  try {
    const salvo = localStorage.getItem(chave);
    return salvo ? JSON.parse(salvo) : padrao;
  } catch {
    return padrao;
  }
};

const gravarLocal = (chave, valor) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (err) {
    console.error(`Não foi possível salvar "${chave}":`, err);
  }
};

const DB_NOME = 'planner_flavia_anexos';
const DB_STORE = 'arquivos';
let dbPromise = null;

const abrirBanco = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NOME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
};

const executarNoBanco = async (modo, acao) => {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, modo);
    const req = acao(tx.objectStore(DB_STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const salvarArquivo = (id, blob) => executarNoBanco('readwrite', (store) => store.put(blob, id));
const lerArquivo = (id) => executarNoBanco('readonly', (store) => store.get(id));
const apagarArquivo = (id) => executarNoBanco('readwrite', (store) => store.delete(id));

const extensao = (nome = '') => (nome.split('.').pop() || '').toLowerCase();
const ehImagem = (arq) => ['jpg', 'jpeg', 'png'].includes(extensao(arq.name)) || (arq.type || '').startsWith('image/');
const formatarTamanho = (bytes = 0) => (bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const validarArquivo = (file) => {
  if (!EXTENSOES_ACEITAS.includes(extensao(file.name))) {
    return `"${file.name}" não é aceito (use JPEG, PNG, PDF, DOC ou DOCX).`;
  }
  if (file.size > TAMANHO_MAX_MB * 1024 * 1024) {
    return `"${file.name}" passa de ${TAMANHO_MAX_MB} MB.`;
  }
  return null;
};

/* =========================================================================
   COMPONENTE: anexo já salvo (lê o arquivo do IndexedDB)
   ========================================================================= */

function AnexoSalvo({ anexo, t, onAbrirImagem }) {
  const [url, setUrl] = useState(null);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    let objectUrl = null;
    lerArquivo(anexo.id)
      .then((blob) => {
        if (!ativo) return;
        if (!blob) {
          setIndisponivel(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (ativo) setIndisponivel(true);
      });
    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [anexo.id]);

  if (indisponivel) {
    return (
      <div
        className={`flex items-center gap-2 text-[11px] p-1.5 rounded border ${t.sub} ${t.faint}`}
        title="Este arquivo foi anexado em outro navegador ou computador"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{anexo.name} (não disponível neste navegador)</span>
      </div>
    );
  }

  if (ehImagem(anexo)) {
    return (
      <button
        type="button"
        onClick={() => url && onAbrirImagem({ url, name: anexo.name })}
        className={`w-20 h-20 rounded-lg border overflow-hidden flex items-center justify-center hover:border-lime-400 transition ${t.sub}`}
        title={`${anexo.name} (clique para ampliar)`}
      >
        {url
          ? <img src={url} alt={anexo.name} className="w-full h-full object-cover" />
          : <ImageIcon className={`w-5 h-5 ${t.faint}`} />}
      </button>
    );
  }

  const ehPdf = extensao(anexo.name) === 'pdf';
  return (
    <a
      href={url || undefined}
      target={ehPdf ? '_blank' : undefined}
      rel="noreferrer"
      download={ehPdf ? undefined : anexo.name}
      className={`flex items-center gap-2 text-[11px] p-1.5 rounded border hover:border-lime-400 transition ${t.sub} ${url ? '' : 'pointer-events-none opacity-60'}`}
      title={ehPdf ? 'Abrir PDF em nova aba' : 'Baixar arquivo'}
    >
      <FileIcon className={`w-4 h-4 shrink-0 ${ehPdf ? 'text-red-400' : 'text-sky-400'}`} />
      <span className="truncate flex-1">{anexo.name}</span>
      <span className={t.faint}>{formatarTamanho(anexo.size)}</span>
      {ehPdf ? <ExternalLink className="w-3.5 h-3.5 shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0" />}
    </a>
  );
}

/* =========================================================================
   APP
   ========================================================================= */

const formularioVazio = (data = hojeStr()) => ({
  title: '',
  // compromisso
  category: 'Trabalho',
  priority: 'Média',
  date: data,
  time: '',
  meetLink: '',
  description: '',
  // nota de sistema
  system: 'SoulMV',
  path: '',
  content: '',
  actionsTaken: '',
  // projeto
  status: 'Pendente'
});

export default function App() {
  // ---------------- Interface ----------------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => lerLocal('planner_tema_escuro', true));
  const t = isDarkMode ? TEMAS.escuro : TEMAS.claro;

  // ---------------- Dados locais ----------------
  const [tasks, setTasks] = useState(() => lerLocal('planner_tasks', TAREFAS_INICIAIS));
  const [notes, setNotes] = useState(() => lerLocal('planner_notes', NOTAS_INICIAIS));
  const [projects, setProjects] = useState(() => lerLocal('planner_projects', PROJETOS_INICIAIS));
  const [infoDias, setInfoDias] = useState(() => lerLocal('planner_info_dias', {}));

  useEffect(() => { gravarLocal('planner_tasks', tasks); }, [tasks]);
  useEffect(() => { gravarLocal('planner_notes', notes); }, [notes]);
  useEffect(() => { gravarLocal('planner_projects', projects); }, [projects]);
  useEffect(() => { gravarLocal('planner_info_dias', infoDias); }, [infoDias]);
  useEffect(() => { gravarLocal('planner_tema_escuro', isDarkMode); }, [isDarkMode]);

  // ---------------- Calendário ----------------
  const hoje = hojeStr();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [calendarView, setCalendarView] = useState('mes'); // 'mes' | 'ano'
  const [filtroModo, setFiltroModo] = useState('mes'); // 'dia' | 'mes' | 'ano'
  const [selectedDay, setSelectedDay] = useState(hoje);
  const { year, month } = viewDate;

  // ---------------- Google (Calendar & Gmail) ----------------
  const [googleEvents, setGoogleEvents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [erroGmail, setErroGmail] = useState(false);

  // E-mails: carrega uma vez
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch('/api/emails');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ativo && data.emails) {
          setEmails(data.emails);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Erro ao carregar e-mails:', err);
        if (ativo) setErroGmail(true);
      } finally {
        if (ativo) setLoadingGoogle(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  // Agenda: recarrega quando o ANO exibido muda (a rota recebe o período em timeMin/timeMax)
  useEffect(() => {
    let ativo = true;
    const inicio = `${year}-01-01T00:00:00-03:00`;
    const fim = `${year + 1}-01-01T00:00:00-03:00`;
    (async () => {
      try {
        const res = await fetch(`/api/calendar?timeMin=${encodeURIComponent(inicio)}&timeMax=${encodeURIComponent(fim)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ativo && Array.isArray(data.events)) setGoogleEvents(data.events);
      } catch (err) {
        console.error('Erro ao carregar o Google Agenda:', err);
      }
    })();
    return () => { ativo = false; };
  }, [year]);

  // ---------------- Busca ----------------
  const termo = searchTerm.trim().toLowerCase();
  const combina = (...campos) => !termo || campos.some((c) => String(c ?? '').toLowerCase().includes(termo));

  // Itens do calendário (compromissos locais + Google), já filtrados pela busca
  const itensCalendario = useMemo(() => {
    const locais = tasks.map((tarefa) => ({ ...tarefa, source: 'local' }));
    const google = googleEvents.map((evt) => {
      const { date, time } = lerInicioGoogle(evt.start);
      return {
        ...evt,
        source: 'google',
        date,
        time: evt.time || time,
        meetLink: evt.meetLink || evt.hangoutLink || '',
        description: textoPuro(evt.description)
      };
    });
    return [...locais, ...google]
      .filter((item) => item.date && combina(item.title, item.description, item.category))
      .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, googleEvents, termo]);

  const itensPorDia = useMemo(() => {
    const mapa = {};
    itensCalendario.forEach((item) => {
      (mapa[item.date] = mapa[item.date] || []).push(item);
    });
    return mapa;
  }, [itensCalendario]);

  // Navegação
  const navegar = (direcao) => {
    setViewDate(({ year: a, month: m }) => {
      if (calendarView === 'ano') return { year: a + direcao, month: m };
      const nova = new Date(a, m + direcao, 1);
      return { year: nova.getFullYear(), month: nova.getMonth() };
    });
  };

  const irParaHoje = () => {
    const d = new Date();
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDay(toDateStr(d));
  };

  const irParaDia = (dateStr) => {
    if (!dateStr) return;
    const [a, m] = dateStr.split('-').map(Number);
    setViewDate({ year: a, month: m - 1 });
    setSelectedDay(dateStr);
    setCalendarView('mes');
  };

  const trocarFiltro = (modo) => {
    setFiltroModo(modo);
    setCalendarView(modo === 'ano' ? 'ano' : 'mes');
  };

  const abrirMesNaVisaoAnual = (m) => {
    setViewDate((v) => ({ ...v, month: m }));
    setCalendarView('mes');
    setFiltroModo('mes');
  };

  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let a = Math.min(anoAtual - 3, year); a <= Math.max(anoAtual + 5, year); a++) anos.push(a);

  const diasNoMes = new Date(year, month + 1, 0).getDate();
  const primeiroDiaSemana = new Date(year, month, 1).getDay();
  const totalCelulas = Math.ceil((primeiroDiaSemana + diasNoMes) / 7) * 7;

  // Informações livres do dia selecionado
  const infoDoDia = infoDias[selectedDay] || '';
  const atualizarInfoDia = (texto) => {
    setInfoDias((prev) => {
      const novo = { ...prev };
      if (texto) novo[selectedDay] = texto;
      else delete novo[selectedDay];
      return novo;
    });
  };

  // ---------------- Modais e formulário ----------------
  const [modalKind, setModalKind] = useState(null); // 'compromisso' | 'nota' | 'projeto' | null
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => formularioVazio());
  const [arquivosNovos, setArquivosNovos] = useState([]); // [{ id, file, preview }]
  const [anexosMantidos, setAnexosMantidos] = useState([]); // anexos já salvos (ao editar)
  const [anexosRemovidos, setAnexosRemovidos] = useState([]);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivoRef = useRef(null);

  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [imagemAberta, setImagemAberta] = useState(null);

  const campo = (nome) => (e) => setFormData((f) => ({ ...f, [nome]: e.target.value }));

  const limparArquivosNovos = () => {
    setArquivosNovos((lista) => {
      lista.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
      return [];
    });
  };

  const prepararModal = (kind, dados, id = null) => {
    limparArquivosNovos();
    setModalKind(kind);
    setEditingId(id);
    setFormData(dados);
    setErroForm('');
    setArrastando(false);
  };

  const abrirModal = (kind, preset = {}) => {
    prepararModal(kind, { ...formularioVazio(selectedDay || hoje), ...preset });
    setAnexosMantidos([]);
    setAnexosRemovidos([]);
  };

  const abrirEdicaoTarefa = (tarefa) => {
    setSelectedEventDetails(null);
    prepararModal('compromisso', { ...formularioVazio(), ...semVazios(tarefa) }, tarefa.id);
    setAnexosMantidos([]);
    setAnexosRemovidos([]);
  };

  const abrirEdicaoNota = (nota) => {
    prepararModal('nota', { ...formularioVazio(), ...semVazios(nota) }, nota.id);
    setAnexosMantidos(nota.attachments || []);
    setAnexosRemovidos([]);
  };

  const fecharModal = () => {
    limparArquivosNovos();
    setModalKind(null);
    setEditingId(null);
    setErroForm('');
    setArrastando(false);
  };

  const kindDoTab = activeTab === 'notas' ? 'nota' : activeTab === 'matriz' ? 'projeto' : 'compromisso';

  // ---------------- Anexos no formulário ----------------
  const adicionarArquivos = (fileList) => {
    const erros = [];
    const validos = [];
    Array.from(fileList || []).forEach((file) => {
      const erro = validarArquivo(file);
      if (erro) erros.push(erro);
      else validos.push({ id: novoId(), file, preview: ehImagem(file) ? URL.createObjectURL(file) : null });
    });
    if (validos.length) setArquivosNovos((lista) => [...lista, ...validos]);
    setErroForm(erros.join(' '));
  };

  // Ctrl+V de um print (captura de tela) dentro da janela da nota
  const colarImagem = (e) => {
    if (modalKind !== 'nota') return;
    const imagens = Array.from(e.clipboardData?.files || []).filter((f) => ['image/png', 'image/jpeg'].includes(f.type));
    if (!imagens.length) return;
    e.preventDefault();
    const carimbo = new Date();
    const base = `print-${toDateStr(carimbo)}-${pad2(carimbo.getHours())}${pad2(carimbo.getMinutes())}${pad2(carimbo.getSeconds())}`;
    adicionarArquivos(imagens.map((f, i) => new File(
      [f],
      `${base}${i ? `-${i}` : ''}.${f.type === 'image/jpeg' ? 'jpg' : 'png'}`,
      { type: f.type }
    )));
  };

  const removerArquivoNovo = (id) => {
    setArquivosNovos((lista) => {
      const alvo = lista.find((a) => a.id === id);
      if (alvo?.preview) URL.revokeObjectURL(alvo.preview);
      return lista.filter((a) => a.id !== id);
    });
  };

  const removerAnexoMantido = (anexo) => {
    setAnexosMantidos((lista) => lista.filter((a) => a.id !== anexo.id));
    setAnexosRemovidos((lista) => [...lista, anexo]);
  };

  // ---------------- Salvar formulário ----------------
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || salvando) return;
    setSalvando(true);
    setErroForm('');
    const salvosAgora = [];

    try {
      if (modalKind === 'nota') {
        // 1) grava os arquivos novos no IndexedDB
        const novosAnexos = [];
        for (const item of arquivosNovos) {
          await salvarArquivo(item.id, item.file);
          salvosAgora.push(item.id);
          novosAnexos.push({ id: item.id, name: item.file.name, type: item.file.type, size: item.file.size, addedAt: hojeStr() });
        }
        // 2) apaga os anexos que foram removidos na edição
        await Promise.all(anexosRemovidos.map((a) => apagarArquivo(a.id).catch(() => {})));

        const dadosNota = {
          title: formData.title.trim(),
          system: formData.system,
          path: formData.path,
          content: formData.content,
          actionsTaken: formData.actionsTaken,
          attachments: [...anexosMantidos, ...novosAnexos]
        };
        if (editingId) {
          setNotes((lista) => lista.map((n) => (n.id === editingId ? { ...n, ...dadosNota, updatedAt: hojeStr() } : n)));
        } else {
          setNotes((lista) => [{ id: novoId(), date: hojeStr(), ...dadosNota }, ...lista]);
        }
      } else if (modalKind === 'projeto') {
        setProjects((lista) => [...lista, {
          id: novoId(),
          title: formData.title.trim(),
          system: formData.system,
          status: formData.status,
          progress: progressoPorStatus(formData.status)
        }]);
      } else {
        const dadosTarefa = {
          title: formData.title.trim(),
          category: formData.category,
          priority: formData.priority,
          date: formData.date,
          time: formData.time,
          meetLink: formData.meetLink,
          description: formData.description
        };
        if (editingId) {
          setTasks((lista) => lista.map((x) => (x.id === editingId ? { ...x, ...dadosTarefa } : x)));
        } else {
          setTasks((lista) => [...lista, { id: novoId(), status: 'Pendente', ...dadosTarefa }]);
        }
        // leva o calendário até a data do compromisso salvo
        if (formData.date) {
          const [a, m] = formData.date.split('-').map(Number);
          setViewDate({ year: a, month: m - 1 });
          setSelectedDay(formData.date);
        }
      }
      fecharModal();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      await Promise.all(salvosAgora.map((id) => apagarArquivo(id).catch(() => {})));
      setErroForm('Não foi possível salvar os anexos. O espaço do navegador pode estar cheio: tente arquivos menores.');
    } finally {
      setSalvando(false);
    }
  };

  // ---------------- Ações ----------------
  const alternarStatusTarefa = (id) => {
    setTasks((lista) => lista.map((x) => (x.id === id
      ? { ...x, status: x.status === 'Concluído' ? 'Pendente' : 'Concluído' }
      : x)));
  };

  const moveProjectStatus = (id, newStatus) => {
    setProjects((lista) => lista.map((p) => (p.id === id
      ? { ...p, status: newStatus, progress: progressoPorStatus(newStatus) }
      : p)));
  };

  const deleteTask = (id) => {
    if (!window.confirm('Excluir este compromisso?')) return;
    setTasks((lista) => lista.filter((x) => x.id !== id));
    setSelectedEventDetails(null);
  };

  const deleteNote = async (nota) => {
    const qtd = (nota.attachments || []).length;
    const msg = qtd ? `Excluir a nota "${nota.title}" e ${qtd} anexo(s)?` : `Excluir a nota "${nota.title}"?`;
    if (!window.confirm(msg)) return;
    await Promise.all((nota.attachments || []).map((a) => apagarArquivo(a.id).catch(() => {})));
    setNotes((lista) => lista.filter((n) => n.id !== nota.id));
  };

  const deleteProject = (id) => {
    if (!window.confirm('Excluir este projeto?')) return;
    setProjects((lista) => lista.filter((p) => p.id !== id));
  };

  // Detalhe aberto: compromissos locais são lidos do estado atual (reflete edições/conclusões)
  const detalhe = (() => {
    if (!selectedEventDetails) return null;
    if (selectedEventDetails.source !== 'local') return selectedEventDetails;
    const tarefa = tasks.find((x) => x.id === selectedEventDetails.id);
    return tarefa ? { ...tarefa, source: 'local' } : null;
  })();

  // Listas filtradas
  const tarefasFiltradas = tasks
    .filter((x) => combina(x.title, x.description, x.category, x.priority))
    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));

  const notasFiltradas = notes.filter((n) => combina(
    n.title, n.system, n.path, n.content, n.actionsTaken, ...(n.attachments || []).map((a) => a.name)
  ));

  const projetosFiltrados = projects.filter((p) => combina(p.title, p.system, p.status));

  const proximasTarefas = tasks
    .filter((x) => x.status !== 'Concluído')
    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
    .slice(0, 5);

  const itensDoDiaSelecionado = itensPorDia[selectedDay] || [];

  /* =======================================================================
     RENDER
     ======================================================================= */
  return (
    <div className={`min-h-screen ${t.app} transition-colors duration-200 font-sans`}>

      {/* HEADER PRINCIPAL */}
      <header className={`border-b ${t.header} px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30 backdrop-blur-md`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Planner Flavia
            <span className="text-xs bg-lime-500/10 text-lime-500 px-2 py-0.5 rounded border border-lime-500/20 font-mono">v2.5 Pro</span>
          </h1>
          <p className={`text-xs ${t.muted}`}>Agenda, Documentações & Gestão de Projetos</p>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <nav className={`flex p-1 rounded-lg border text-xs overflow-x-auto max-w-full ${t.tabs}`}>
          {[
            ['dashboard', 'Dashboard', LayoutDashboard],
            ['compromissos', 'Compromissos & Prazos', CalendarIcon],
            ['notas', 'Notas & Sistemas', FileText],
            ['matriz', 'Matriz de Projetos', BarChart2]
          ].map(([id, rotulo, Icone]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap ${activeTab === id ? 'bg-lime-500 text-slate-950 font-bold' : t.tabOff}`}
            >
              <Icone className="w-4 h-4" /> {rotulo}
            </button>
          ))}
        </nav>

        {/* BARRA DE FERRAMENTAS */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none min-w-0">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${t.faint}`} />
            <input
              type="text"
              placeholder="Buscar tudo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full md:w-48 pl-9 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-lime-500 ${t.input}`}
            />
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition ${t.iconBtn}`}
            title={isDarkMode ? 'Tema claro' : 'Tema escuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={() => abrirModal(kindDoTab)}
            className="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition shadow-lg shadow-lime-500/10 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {kindDoTab === 'nota' ? 'Nova Nota' : kindDoTab === 'projeto' ? 'Novo Projeto' : 'Novo Compromisso'}
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="p-4 md:p-6">

        {/* ==================== ABA 1: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* CALENDÁRIO */}
            <section className={`lg:col-span-2 border rounded-xl p-4 md:p-6 shadow-xl ${t.card}`}>

              {/* Cabeçalho: setas + título + legenda */}
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navegar(-1)}
                    className={`p-1.5 rounded-lg border transition ${t.iconBtn}`}
                    title={calendarView === 'ano' ? 'Ano anterior' : 'Mês anterior'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center justify-center gap-2 whitespace-nowrap sm:min-w-[12rem]">
                    <CalendarIcon className={`w-5 h-5 ${t.accent}`} />
                    {calendarView === 'ano' ? year : `${MESES[month]} de ${year}`}
                  </h2>
                  <button
                    onClick={() => navegar(1)}
                    className={`p-1.5 rounded-lg border transition ${t.iconBtn}`}
                    title={calendarView === 'ano' ? 'Próximo ano' : 'Próximo mês'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={irParaHoje} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${t.iconBtn}`}>
                    Hoje
                  </button>
                </div>

                {/* LEGENDA DE CORES */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-lime-400"></span> Trabalho</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Saúde/Ausência</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Prazo</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Feriado</span>
                  <span className="flex items-center gap-1"><StickyNote className="w-3 h-3 text-amber-400" /> Informações</span>
                </div>
              </div>

              {/* Filtro: Dia / Mês / Ano */}
              <div className={`flex flex-wrap items-center gap-2 mb-4 p-2 rounded-lg border text-xs ${t.sub}`}>
                <span className={`font-semibold ${t.muted}`}>Buscar por:</span>
                <div className={`flex p-0.5 rounded-md border ${t.tabs}`}>
                  {[['dia', 'Dia'], ['mes', 'Mês'], ['ano', 'Ano']].map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      onClick={() => trocarFiltro(valor)}
                      className={`px-3 py-1 rounded transition ${filtroModo === valor ? 'bg-lime-500 text-slate-950 font-bold' : t.tabOff}`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>

                {filtroModo === 'dia' && (
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => irParaDia(e.target.value)}
                    className={`px-2 py-1 rounded border focus:outline-none focus:border-lime-500 ${t.input}`}
                  />
                )}

                {filtroModo === 'mes' && (
                  <select
                    value={month}
                    onChange={(e) => setViewDate((v) => ({ ...v, month: Number(e.target.value) }))}
                    className={`px-2 py-1 rounded border focus:outline-none focus:border-lime-500 ${t.input}`}
                  >
                    {MESES.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}
                  </select>
                )}

                {filtroModo !== 'dia' && (
                  <select
                    value={year}
                    onChange={(e) => setViewDate((v) => ({ ...v, year: Number(e.target.value) }))}
                    className={`px-2 py-1 rounded border focus:outline-none focus:border-lime-500 ${t.input}`}
                  >
                    {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}

                <span className={`text-[11px] sm:ml-auto ${t.faint}`}>
                  {calendarView === 'ano'
                    ? 'Clique num mês ou num dia para abrir.'
                    : 'Clique num dia para ver os detalhes; use o + para agendar.'}
                </span>
              </div>

              {/* ---------- VISÃO MENSAL ---------- */}
              {calendarView === 'mes' && (
                <>
                  <div className={`grid grid-cols-7 gap-1.5 text-center text-xs font-bold mb-2 ${t.muted}`}>
                    {DIAS_SEMANA.map((d) => <span key={d}>{d}</span>)}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: totalCelulas }).map((_, idx) => {
                      const dia = idx - primeiroDiaSemana + 1;
                      if (dia < 1 || dia > diasNoMes) {
                        return <div key={`vazio-${idx}`} className={`h-20 md:h-24 rounded-lg ${t.cellPad}`} />;
                      }

                      const ds = montarData(year, month, dia);
                      const lista = itensPorDia[ds] || [];
                      const ehHoje = ds === hoje;
                      const ehSelecionado = ds === selectedDay;

                      return (
                        <div
                          key={ds}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedDay(ds)}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedDay(ds)}
                          className={`group h-20 md:h-24 rounded-lg p-1.5 border flex flex-col gap-1 cursor-pointer transition-all hover:border-lime-400/60 ${
                            ehHoje ? 'border-lime-500 bg-lime-500/10' : t.cell
                          } ${ehSelecionado ? 'ring-2 ring-lime-400/70' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold ${ehHoje ? t.accent : t.dayNum}`}>{dia}</span>
                            <div className="flex items-center gap-0.5">
                              {infoDias[ds] && <StickyNote className="w-3 h-3 text-amber-400" />}
                              <button
                                type="button"
                                title="Novo compromisso neste dia"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDay(ds);
                                  abrirModal('compromisso', { date: ds });
                                }}
                                className={`p-0.5 rounded hover:bg-lime-500/20 transition ${ehSelecionado ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                <Plus className={`w-3 h-3 ${t.accent}`} />
                              </button>
                            </div>
                          </div>

                          {/* MARCADORES DE EVENTO */}
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            {lista.slice(0, 2).map((item) => (
                              <div
                                key={`${item.source}-${item.id}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedEventDetails(item); }}
                                title={item.title}
                                className={`text-[9px] px-1 py-0.5 rounded truncate font-medium hover:opacity-90 ${corDoItem(item).solid} ${item.status === 'Concluído' ? 'opacity-50 line-through' : ''}`}
                              >
                                {item.time ? `${item.time} ` : ''}{item.title}
                              </div>
                            ))}
                            {lista.length > 2 && (
                              <span className={`text-[9px] font-semibold ${t.muted}`}>+{lista.length - 2} mais</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ---------- VISÃO ANUAL ---------- */}
              {calendarView === 'ano' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {MESES.map((nomeMes, m) => {
                    const dias = new Date(year, m + 1, 0).getDate();
                    const inicio = new Date(year, m, 1).getDay();
                    const prefixo = `${year}-${pad2(m + 1)}-`;
                    const total = Object.keys(itensPorDia)
                      .filter((k) => k.startsWith(prefixo))
                      .reduce((soma, k) => soma + itensPorDia[k].length, 0);

                    return (
                      <div key={nomeMes} className={`border rounded-lg p-3 ${t.sub}`}>
                        <button
                          onClick={() => abrirMesNaVisaoAnual(m)}
                          className="w-full flex justify-between items-center mb-2 text-xs font-semibold hover:text-lime-500 transition"
                        >
                          <span>{nomeMes}</span>
                          {total > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.chip}`}>
                              {total} {total === 1 ? 'item' : 'itens'}
                            </span>
                          )}
                        </button>
                        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
                          {DIAS_SEMANA.map((d) => <span key={d} className={t.faint}>{d[0]}</span>)}
                          {Array.from({ length: inicio }).map((_, i) => <span key={`p-${i}`} />)}
                          {Array.from({ length: dias }, (_, i) => i + 1).map((dia) => {
                            const ds = montarData(year, m, dia);
                            const lista = itensPorDia[ds] || [];
                            return (
                              <button
                                key={ds}
                                onClick={() => { irParaDia(ds); setFiltroModo('dia'); }}
                                title={lista.length ? lista.map((i) => i.title).join(' • ') : formatarDataBR(ds)}
                                className={`relative h-6 rounded transition ${t.dayHover} ${
                                  ds === hoje ? `ring-1 ring-lime-500 font-bold ${t.accent}` : ''
                                } ${ds === selectedDay ? 'bg-lime-500/20' : ''}`}
                              >
                                {dia}
                                {lista.length > 0 && (
                                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${corDoItem(lista[0]).dot}`} />
                                )}
                                {infoDias[ds] && (
                                  <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* PAINEL LATERAL */}
            <div className="space-y-6">

              {/* DIA SELECIONADO + INFORMAÇÕES */}
              <section className={`border rounded-xl p-5 shadow-xl ${t.card}`}>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className={`w-4 h-4 ${t.accent}`} /> Dia selecionado
                    </h3>
                    <p className={`text-xs ${t.muted}`}>{formatarDataExtenso(selectedDay)}</p>
                  </div>
                  <button
                    onClick={() => abrirModal('compromisso', { date: selectedDay })}
                    className="flex items-center gap-1 bg-lime-500 hover:bg-lime-400 text-slate-950 text-[11px] font-bold px-2 py-1 rounded-md transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agendar
                  </button>
                </div>

                <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                  {itensDoDiaSelecionado.length === 0 ? (
                    <p className={`text-xs ${t.faint}`}>Nada agendado para este dia.</p>
                  ) : (
                    itensDoDiaSelecionado.map((item) => (
                      <button
                        key={`${item.source}-${item.id}`}
                        onClick={() => setSelectedEventDetails(item)}
                        className={`w-full text-left p-2 rounded-lg border text-xs flex items-center gap-2 transition ${t.sub} ${t.subHover}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${corDoItem(item).dot}`} />
                        {item.time && <span className={`font-mono ${t.muted}`}>{item.time}</span>}
                        <span className={`truncate flex-1 ${item.status === 'Concluído' ? 'line-through opacity-60' : ''}`}>{item.title}</span>
                      </button>
                    ))
                  )}
                </div>

                <label className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-amber-400" /> Informações do dia
                </label>
                <textarea
                  rows="4"
                  value={infoDoDia}
                  onChange={(e) => atualizarInfoDia(e.target.value)}
                  placeholder="Anote aqui o que for necessário para este dia: lembretes, pendências, contatos..."
                  className={`w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:border-lime-500 ${t.input}`}
                />
                <p className={`text-[10px] mt-1 ${t.faint}`}>Salvo automaticamente.</p>
              </section>

              {/* E-MAILS NÃO LIDOS */}
              <section className={`border rounded-xl p-5 shadow-xl ${t.card}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" /> E-mails Não Lidos (Gmail)
                  </h3>
                  <span className="bg-sky-500/20 text-sky-500 text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {loadingGoogle ? (
                    <p className={`text-xs ${t.faint}`}>Sincronizando com Gmail...</p>
                  ) : erroGmail ? (
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Não foi possível conectar ao Gmail.
                    </p>
                  ) : emails.length === 0 ? (
                    <p className={`text-xs ${t.faint}`}>Nenhum e-mail pendente!</p>
                  ) : (
                    emails.map((email) => (
                      <div key={email.id} className={`p-2.5 rounded-lg border text-xs ${t.sub}`}>
                        <p className={`font-semibold truncate ${t.body}`}>{email.from}</p>
                        <p className="text-sky-500 truncate font-medium">{email.subject}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* AÇÕES RÁPIDAS (próximos pendentes) */}
              <section className={`border rounded-xl p-5 shadow-xl ${t.card}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckSquare className={`w-4 h-4 ${t.accent}`} /> Ações Rápidas
                </h3>
                <div className="space-y-2">
                  {proximasTarefas.length === 0 && <p className={`text-xs ${t.faint}`}>Tudo em dia!</p>}
                  {proximasTarefas.map((tarefa) => {
                    const atrasada = tarefa.date < hoje;
                    return (
                      <div key={tarefa.id} className={`p-2 rounded border text-xs flex items-center gap-2 ${t.sub}`}>
                        <button
                          onClick={() => alternarStatusTarefa(tarefa.id)}
                          title="Marcar como concluído"
                          className="w-4 h-4 rounded border border-slate-500 hover:border-lime-400 shrink-0"
                        />
                        <button onClick={() => setSelectedEventDetails({ ...tarefa, source: 'local' })} className="truncate flex-1 text-left hover:underline">
                          {tarefa.title}
                        </button>
                        <span className={`text-[10px] shrink-0 ${atrasada ? 'text-red-400 font-semibold' : t.faint}`}>
                          {atrasada ? 'Atrasado' : formatarDataBR(tarefa.date).slice(0, 5)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${t.chip}`}>{tarefa.priority}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>
          </div>
        )}

        {/* ==================== ABA 2: COMPROMISSOS & PRAZOS ==================== */}
        {activeTab === 'compromissos' && (
          <section className={`border rounded-xl p-4 md:p-6 ${t.card}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold">Compromissos, Reuniões & Prazos</h2>
                <p className={`text-xs ${t.muted}`}>Gerencie todas as datas de entrega, reuniões e exames em um só lugar.</p>
              </div>
              <button onClick={() => abrirModal('compromisso')} className="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs">
                <Plus className="w-4 h-4" /> Adicionar Compromisso
              </button>
            </div>

            <div className="space-y-3">
              {tarefasFiltradas.length === 0 && (
                <p className={`text-xs ${t.faint}`}>{termo ? 'Nenhum compromisso encontrado para essa busca.' : 'Nenhum compromisso cadastrado.'}</p>
              )}
              {tarefasFiltradas.map((tarefa) => {
                const concluida = tarefa.status === 'Concluído';
                return (
                  <div
                    key={tarefa.id}
                    className={`p-4 border rounded-lg flex flex-wrap justify-between items-start gap-3 transition ${t.sub} ${t.subHover} ${concluida ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => alternarStatusTarefa(tarefa.id)}
                        title={concluida ? 'Reabrir' : 'Marcar como concluído'}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                          concluida ? 'bg-lime-500 border-lime-500' : 'border-slate-500 hover:border-lime-400'
                        }`}
                      >
                        {concluida && <Check className="w-3.5 h-3.5 text-slate-950" />}
                      </button>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`font-semibold text-sm ${concluida ? 'line-through' : ''}`}>{tarefa.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${corDoItem(tarefa).soft}`}>
                            {tarefa.category}
                          </span>
                        </div>
                        <div className={`flex flex-wrap items-center gap-4 text-xs ${t.muted}`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {formatarDataBR(tarefa.date)}{tarefa.time ? ` às ${tarefa.time}` : ''}
                          </span>
                          {tarefa.meetLink && (
                            <a href={tarefa.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sky-500 hover:underline">
                              <Video className="w-3.5 h-3.5" /> Entrar na Reunião
                            </a>
                          )}
                        </div>
                        {tarefa.description && (
                          <p className={`text-xs whitespace-pre-line ${t.body}`}>{tarefa.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded ${t.chip}`}>{tarefa.priority}</span>
                      <button onClick={() => abrirEdicaoTarefa(tarefa)} className={`p-1 hover:text-lime-500 ${t.faint}`} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTask(tarefa.id)} className={`p-1 hover:text-red-400 ${t.faint}`} title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== ABA 3: NOTAS & SISTEMAS ==================== */}
        {activeTab === 'notas' && (
          <section className={`border rounded-xl p-4 md:p-6 ${t.card}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold">Documentação de Sistemas (SoulMV, SAW, EasyAudit)</h2>
                <p className={`text-xs ${t.muted}`}>Guarde parâmetros, caminhos de pastas de arquivos e instruções de telas pouco utilizadas.</p>
                <p className={`text-[11px] mt-1 ${t.faint}`}>Os anexos ficam guardados neste navegador.</p>
              </div>
              <button onClick={() => abrirModal('nota')} className="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs">
                <Plus className="w-4 h-4" /> Nova Nota de Sistema
              </button>
            </div>

            {notasFiltradas.length === 0 && (
              <p className={`text-xs ${t.faint}`}>{termo ? 'Nenhuma nota encontrada para essa busca.' : 'Nenhuma nota cadastrada.'}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notasFiltradas.map((nota) => {
                const anexos = nota.attachments || [];
                const imagens = anexos.filter(ehImagem);
                const documentos = anexos.filter((a) => !ehImagem(a));
                return (
                  <article key={nota.id} className={`p-4 border rounded-lg flex flex-col gap-2 ${t.sub}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono bg-sky-500/20 text-sky-500 px-2 py-0.5 rounded border border-sky-500/30">
                        {nota.system}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirEdicaoNota(nota)} className={`hover:text-lime-500 ${t.faint}`} title="Editar nota">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteNote(nota)} className={`hover:text-red-400 ${t.faint}`} title="Excluir nota">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className={`font-bold text-sm ${t.strong}`}>{nota.title}</h4>

                    {nota.path && (
                      <p className={`text-[11px] font-mono p-1.5 rounded border break-all ${t.accent} ${t.code}`}>
                        📁 {nota.path}
                      </p>
                    )}

                    {nota.content && (
                      <p className={`text-xs leading-relaxed whitespace-pre-line ${t.body}`}>{nota.content}</p>
                    )}

                    {nota.actionsTaken && (
                      <div className="border-l-2 border-lime-500/60 pl-2.5">
                        <p className={`text-[10px] uppercase font-bold tracking-wide mb-0.5 ${t.accent}`}>O que foi feito</p>
                        <p className={`text-xs leading-relaxed whitespace-pre-line ${t.body}`}>{nota.actionsTaken}</p>
                      </div>
                    )}

                    {anexos.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className={`text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 ${t.muted}`}>
                          <Paperclip className="w-3 h-3" /> Anexos ({anexos.length})
                        </p>
                        {imagens.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {imagens.map((a) => <AnexoSalvo key={a.id} anexo={a} t={t} onAbrirImagem={setImagemAberta} />)}
                          </div>
                        )}
                        {documentos.length > 0 && (
                          <div className="space-y-1">
                            {documentos.map((a) => <AnexoSalvo key={a.id} anexo={a} t={t} onAbrirImagem={setImagemAberta} />)}
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-[10px] mt-auto pt-1 ${t.faint}`}>
                      Criada em {formatarDataBR(nota.date)}{nota.updatedAt ? ` · atualizada em ${formatarDataBR(nota.updatedAt)}` : ''}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== ABA 4: MATRIZ DE PROJETOS (KANBAN) ==================== */}
        {activeTab === 'matriz' && (
          <section className={`border rounded-xl p-4 md:p-6 ${t.card}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold">Matriz & Acompanhamento de Projetos (Kanban)</h2>
                <p className={`text-xs ${t.muted}`}>Acompanhe o escopo, status e avanço das demandas operacionais.</p>
              </div>
              <button onClick={() => abrirModal('projeto')} className="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs">
                <Plus className="w-4 h-4" /> Novo Projeto
              </button>
            </div>

            {/* COLUNAS KANBAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Pendente', 'Em Andamento', 'Concluído'].map((colStatus) => {
                const daColuna = projetosFiltrados.filter((p) => p.status === colStatus);
                return (
                  <div key={colStatus} className={`border rounded-xl p-4 ${t.sub}`}>
                    <div className={`flex justify-between items-center mb-4 border-b pb-2 ${t.divider}`}>
                      <h3 className="font-semibold text-xs flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          colStatus === 'Pendente' ? 'bg-amber-400' : colStatus === 'Em Andamento' ? 'bg-sky-400' : 'bg-lime-400'
                        }`}></span>
                        {colStatus}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${t.chip}`}>{daColuna.length}</span>
                    </div>

                    <div className="space-y-3">
                      {daColuna.map((proj) => (
                        <div key={proj.id} className={`p-3 border rounded-lg shadow space-y-2 ${t.inner}`}>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-xs">{proj.title}</h4>
                            <button onClick={() => deleteProject(proj.id)} className={`hover:text-red-400 ${t.faint}`} title="Excluir projeto">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono inline-block ${t.chip}`}>{proj.system}</span>

                          {/* BARRA DE PROGRESSO */}
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${t.track}`}>
                            <div className="bg-lime-400 h-full transition-all" style={{ width: `${proj.progress}%` }}></div>
                          </div>

                          {/* BOTÕES DE MOVER STATUS */}
                          <div className={`flex flex-wrap justify-end gap-1 pt-1 border-t ${t.divider}`}>
                            {colStatus !== 'Pendente' && (
                              <button onClick={() => moveProjectStatus(proj.id, 'Pendente')} className={`text-[10px] px-1.5 py-0.5 rounded ${t.btnSec}`}>
                                ← Pendente
                              </button>
                            )}
                            {colStatus !== 'Em Andamento' && (
                              <button onClick={() => moveProjectStatus(proj.id, 'Em Andamento')} className={`text-[10px] text-sky-500 px-1.5 py-0.5 rounded ${t.btnSec}`}>
                                Em Andamento
                              </button>
                            )}
                            {colStatus !== 'Concluído' && (
                              <button onClick={() => moveProjectStatus(proj.id, 'Concluído')} className={`text-[10px] px-1.5 py-0.5 rounded ${t.accent} ${t.btnSec}`}>
                                Concluído ✓
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ==================== MODAL DE ADIÇÃO / EDIÇÃO ==================== */}
      {modalKind && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div
            onPaste={colarImagem}
            className={`border rounded-xl p-6 w-full ${modalKind === 'nota' ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto ${t.card}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base">
                {modalKind === 'nota'
                  ? (editingId ? 'Editar Nota de Sistema' : 'Adicionar Nota de Sistema')
                  : modalKind === 'projeto'
                    ? 'Novo Projeto no Kanban'
                    : (editingId ? 'Editar Compromisso' : 'Novo Compromisso')}
              </h3>
              <button onClick={fecharModal} title="Fechar"><X className={`w-5 h-5 ${t.muted}`} /></button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">

              {/* TÍTULO */}
              <div>
                <label className="block mb-1 font-semibold">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={campo('title')}
                  className={`w-full p-2.5 rounded border focus:outline-none focus:border-lime-500 ${t.input}`}
                  placeholder={modalKind === 'nota' ? 'Ex: Local do Log de Erros' : modalKind === 'projeto' ? 'Ex: Implantação de módulo' : 'Ex: Reunião SoulMV'}
                  required
                  autoFocus
                />
              </div>

              {/* ----- CAMPOS DE COMPROMISSO ----- */}
              {modalKind === 'compromisso' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold">Categoria</label>
                      <select value={formData.category} onChange={campo('category')} className={`w-full p-2.5 rounded border ${t.input}`}>
                        <option value="Trabalho">Trabalho (Verde Limão)</option>
                        <option value="Saúde">Saúde / Médico (Vermelho)</option>
                        <option value="Ausência">Ausência de Trabalho (Vermelho)</option>
                        <option value="Prazo">Prazo de Demanda (Laranja)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Prioridade</label>
                      <select value={formData.priority} onChange={campo('priority')} className={`w-full p-2.5 rounded border ${t.input}`}>
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold">Data</label>
                      <input type="date" value={formData.date} onChange={campo('date')} required className={`w-full p-2.5 rounded border ${t.input}`} />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Horário <span className={`font-normal ${t.faint}`}>(opcional)</span></label>
                      <input type="time" value={formData.time} onChange={campo('time')} className={`w-full p-2.5 rounded border ${t.input}`} />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Link da Reunião (Google Meet)</label>
                    <input
                      type="url"
                      value={formData.meetLink}
                      onChange={campo('meetLink')}
                      className={`w-full p-2.5 rounded border ${t.input}`}
                      placeholder="https://meet.google.com/abc-defg-hij"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Informações / Observações</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={campo('description')}
                      className={`w-full p-2.5 rounded border ${t.input}`}
                      placeholder="Pauta, documentos necessários, contatos, número de chamado..."
                    />
                  </div>
                </>
              )}

              {/* ----- CAMPOS DE NOTA DE SISTEMA ----- */}
              {modalKind === 'nota' && (
                <>
                  <div>
                    <label className="block mb-1 font-semibold">Sistema</label>
                    <select value={formData.system} onChange={campo('system')} className={`w-full p-2.5 rounded border ${t.input}`}>
                      {SISTEMAS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Caminho da Tela ou Pasta de Salvamento</label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={campo('path')}
                      className={`w-full p-2.5 rounded border ${t.input}`}
                      placeholder="Ex: Opções > Anexos > Pasta de Destino"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Conteúdo / Lembrete</label>
                    <textarea
                      rows="3"
                      value={formData.content}
                      onChange={campo('content')}
                      className={`w-full p-2.5 rounded border ${t.input}`}
                      placeholder="Para que serve, como acessar, cuidados..."
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">O que foi feito</label>
                    <textarea
                      rows="4"
                      value={formData.actionsTaken}
                      onChange={campo('actionsTaken')}
                      className={`w-full p-2.5 rounded border ${t.input}`}
                      placeholder="Descreva o passo a passo do que foi feito: parâmetros alterados, valores antigos e novos, quem solicitou, chamado..."
                    />
                  </div>

                  {/* ANEXOS */}
                  <div>
                    <label className="block mb-1 font-semibold">Anexos (imagens e documentos)</label>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => inputArquivoRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' && inputArquivoRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                      onDragLeave={() => setArrastando(false)}
                      onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionarArquivos(e.dataTransfer.files); }}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${arrastando ? 'border-lime-400 bg-lime-500/10' : t.drop}`}
                    >
                      <Upload className={`w-5 h-5 mx-auto mb-1 ${t.accent}`} />
                      <p className="font-semibold">Clique, arraste os arquivos ou cole um print (Ctrl+V)</p>
                      <p className={`mt-0.5 ${t.faint}`}>JPEG, PNG, PDF, DOC ou DOCX · até {TAMANHO_MAX_MB} MB cada</p>
                    </div>
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      multiple
                      accept={ACCEPT_INPUT}
                      className="hidden"
                      onChange={(e) => { adicionarArquivos(e.target.files); e.target.value = ''; }}
                    />

                    {(anexosMantidos.length > 0 || arquivosNovos.length > 0) && (
                      <ul className="mt-2 space-y-1.5">
                        {anexosMantidos.map((a) => (
                          <li key={a.id} className={`flex items-center gap-2 p-1.5 rounded border ${t.sub}`}>
                            {ehImagem(a) ? <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" /> : <FileIcon className="w-4 h-4 text-sky-400 shrink-0" />}
                            <span className="truncate flex-1">{a.name}</span>
                            <span className={t.faint}>{formatarTamanho(a.size)}</span>
                            <button type="button" onClick={() => removerAnexoMantido(a)} className={`hover:text-red-400 ${t.faint}`} title="Remover anexo">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                        {arquivosNovos.map((a) => (
                          <li key={a.id} className={`flex items-center gap-2 p-1.5 rounded border ${t.sub}`}>
                            {a.preview
                              ? <img src={a.preview} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                              : <FileIcon className="w-4 h-4 text-sky-400 shrink-0" />}
                            <span className="truncate flex-1">{a.file.name}</span>
                            <span className={t.faint}>{formatarTamanho(a.file.size)}</span>
                            <span className="text-[10px] font-bold text-lime-500">NOVO</span>
                            <button type="button" onClick={() => removerArquivoNovo(a.id)} className={`hover:text-red-400 ${t.faint}`} title="Remover arquivo">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {/* ----- CAMPOS DE PROJETO ----- */}
              {modalKind === 'projeto' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold">Sistema Relacionado</label>
                    <select value={formData.system} onChange={campo('system')} className={`w-full p-2.5 rounded border ${t.input}`}>
                      {SISTEMAS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Status Inicial</label>
                    <select value={formData.status} onChange={campo('status')} className={`w-full p-2.5 rounded border ${t.input}`}>
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>
              )}

              {erroForm && (
                <p className="text-red-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {erroForm}
                </p>
              )}

              <div className={`flex justify-end gap-2 pt-3 border-t ${t.divider}`}>
                <button type="button" onClick={fecharModal} className={`px-3 py-2 rounded ${t.btnSec}`}>Cancelar</button>
                <button type="submit" disabled={salvando} className="px-3 py-2 rounded bg-lime-500 hover:bg-lime-400 font-bold text-slate-950 disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Salvar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DETALHES DO EVENTO ==================== */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className={`border rounded-xl p-6 w-full max-w-sm ${t.card}`}>
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${corDoItem(detalhe).solid}`}>
                {detalhe.category || detalhe.type || 'Evento'}
              </span>
              <button onClick={() => setSelectedEventDetails(null)} title="Fechar"><X className={`w-4 h-4 ${t.muted}`} /></button>
            </div>

            <h3 className={`font-bold text-base mb-2 ${detalhe.status === 'Concluído' ? 'line-through opacity-70' : ''}`}>{detalhe.title}</h3>

            <div className={`space-y-2 text-xs mb-4 ${t.body}`}>
              <p className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${t.accent}`} />
                {formatarDataBR(detalhe.date)}{detalhe.time ? ` às ${detalhe.time}` : ''}
              </p>
              {detalhe.source === 'local' && (
                <p>Prioridade: <b>{detalhe.priority}</b> · Status: <b>{detalhe.status}</b></p>
              )}
              {detalhe.source === 'google' && (
                <p className={t.faint}>Evento sincronizado do Google Agenda</p>
              )}
              {detalhe.meetLink && (
                <p className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-400" />
                  <a href={detalhe.meetLink} target="_blank" rel="noreferrer" className="text-sky-500 underline font-semibold">
                    Abrir Link do Google Meet
                  </a>
                </p>
              )}
              {detalhe.description && (
                <div className={`p-2.5 rounded border ${t.sub}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-wide mb-1 ${t.muted}`}>Informações</p>
                  <p className="whitespace-pre-line">{detalhe.description}</p>
                </div>
              )}
            </div>

            {detalhe.source === 'local' ? (
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => alternarStatusTarefa(detalhe.id)} className="py-2 rounded text-xs font-semibold bg-lime-500 hover:bg-lime-400 text-slate-950">
                  {detalhe.status === 'Concluído' ? 'Reabrir' : 'Concluir'}
                </button>
                <button onClick={() => abrirEdicaoTarefa(detalhe)} className={`py-2 rounded text-xs font-semibold ${t.btnSec}`}>
                  Editar
                </button>
                <button onClick={() => deleteTask(detalhe.id)} className="py-2 rounded text-xs font-semibold bg-red-500/15 text-red-500 hover:bg-red-500/25">
                  Excluir
                </button>
              </div>
            ) : (
              <button onClick={() => setSelectedEventDetails(null)} className={`w-full py-2 text-xs rounded font-semibold ${t.btnSec}`}>
                Fechar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== VISUALIZAR IMAGEM ANEXADA ==================== */}
      {imagemAberta && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center p-4 z-[60]"
          onClick={() => setImagemAberta(null)}
        >
          <img
            src={imagemAberta.url}
            alt={imagemAberta.name}
            className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-200" onClick={(e) => e.stopPropagation()}>
            <span className="truncate max-w-[60vw]">{imagemAberta.name}</span>
            <a href={imagemAberta.url} download={imagemAberta.name} className="flex items-center gap-1 bg-lime-500 text-slate-950 font-bold px-2.5 py-1 rounded">
              <Download className="w-3.5 h-3.5" /> Baixar
            </a>
            <button onClick={() => setImagemAberta(null)} className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded">
              <X className="w-3.5 h-3.5" /> Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
