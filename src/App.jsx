import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, Clock, PlusCircle, Search, ShieldAlert, 
  FileCode, ChevronRight, X, Edit3, MessageSquare, Paperclip,
  Home, Send, Filter, HelpCircle, CheckCircle2, ArrowRight,
  Mail, Download, Image as ImageIcon, Bell, BellRing,
  BarChart3, Activity, CheckCircle, Tag
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal para Visualizar Anexo
  const [viewAnexo, setViewAnexo] = useState(null);

  // Sistema de Notificação
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const previousTotalRef = useRef({});

  // Estatísticas Globais do Dashboard
  const [dashStats, setDashStats] = useState({
    criticas: { total: 0, pendente: 0, andamento: 0, aguardandoTi: 0, concluido: 0 },
    sem_valor: { total: 0, pendente: 0, andamento: 0, concluido: 0, slaEstourado: 0 },
    sem_tuss: { total: 0, pendente: 0, andamento: 0, concluido: 0, slaEstourado: 0 },
    chamados: { total: 0, pendente: 0, andamento: 0, concluido: 0, altaPrioridade: 0 }
  });

  // Estados dos Filtros Avançados
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterProfat, setFilterProfat] = useState('');
  const [filterSistema, setFilterSistema] = useState('Todos');
  const [filterChamado, setFilterChamado] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Form State
  const [formData, setFormData] = useState({});
  const [filePreview, setFilePreview] = useState(null);

  // Form Feedback State
  const [feedback, setFeedback] = useState({ nome: '', email: '', tipo: 'Sugestão de Melhoria', mensagem: '' });
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

  // Listener para o Dashboard Global e Notificações em Tempo Real
  useEffect(() => {
    const collections = ['criticas', 'sem_valor', 'sem_tuss', 'chamados'];
    const unsubscribes = collections.map(colName => {
      const q = query(collection(db, colName));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data());
        const total = docs.length;
        const pendente = docs.filter(d => (d.status || 'Pendente') === 'Pendente' || d.status === 'Aberto').length;
        const andamento = docs.filter(d => d.status === 'Em Andamento').length;
        const aguardandoTi = docs.filter(d => d.status === 'Aguardando TI').length;
        const concluido = docs.filter(d => d.status === 'Concluído').length;

        let slaEstourado = 0;
        if (colName === 'sem_valor') {
          slaEstourado = docs.filter(d => {
            if (d.status === 'Concluído' || !d.dtSolicitacao) return false;
            return ((new Date() - new Date(d.dtSolicitacao)) / 3600000) > 48;
          }).length;
        }
        if (colName === 'sem_tuss') {
          slaEstourado = docs.filter(d => {
            if (d.status === 'Concluído' || !d.dtSolicitacao) return false;
            return ((new Date() - new Date(d.dtSolicitacao)) / 3600000) > 24;
          }).length;
        }

        let altaPrioridade = 0;
        if (colName === 'chamados') {
          altaPrioridade = docs.filter(d => d.prioridade === 'Alta' && d.status !== 'Concluído').length;
        }

        // Checar se entrou nova demanda para disparar notificação
        if (previousTotalRef.current[colName] !== undefined && total > previousTotalRef.current[colName]) {
          if (Notification.permission === 'granted') {
            new Notification('🔔 Nova Demanda Registrada!', {
              body: `Novo registro inserido no módulo: ${colName.toUpperCase()}`,
              icon: '/logo-unimed.png'
            });
          }
        }
        previousTotalRef.current[colName] = total;

        setDashStats(prev => ({
          ...prev,
          [colName]: { total, pendente, andamento, aguardandoTi, concluido, slaEstourado, altaPrioridade }
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Listener para a Tabela Ativa
  useEffect(() => {
    if (activeTab === 'inicio') return;

    const q = query(collection(db, activeTab), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    }, (error) => {
      console.error("Erro ao buscar dados do Firebase:", error);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const toggleNotifications = () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de área de trabalho.');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      alert('Alertas de novas demandas já estão ativos!');
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification('Faturamento Unimed', {
            body: 'Notificações ativadas! Você será avisada quando chegar uma nova demanda.',
            icon: '/logo-unimed.png'
          });
        }
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 700 * 1024) {
        alert("O arquivo é muito grande! Selecione um arquivo de até 700KB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          anexoUrl: reader.result,
          anexoNome: file.name,
          anexoTipo: file.type
        }));
        setFilePreview(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAnexo = (anexo) => {
    if (!anexo || !anexo.anexoUrl) return;

    if (anexo.anexoUrl.startsWith('data:')) {
      try {
        const arr = anexo.anexoUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        if (mime.startsWith('image/')) {
          setViewAnexo({ url: blobUrl, nome: anexo.anexoNome, tipo: mime });
        } else {
          window.open(blobUrl, '_blank');
        }
      } catch (err) {
        console.error("Erro ao processar anexo:", err);
        alert("Não foi possível abrir o anexo.");
      }
    } else {
      window.open(anexo.anexoUrl, '_blank');
    }
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    setFilePreview(null);
    const novoCodigoChamado = `CH-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({ codChamado: novoCodigoChamado, prioridade: 'Média', sistema: 'SoulMV', tipoChamado: 'Falha', status: 'Pendente' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setFilePreview(item.anexoNome || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const itemRef = doc(db, activeTab, editingId);
        const { id, ...dataToUpdate } = formData;
        await updateDoc(itemRef, dataToUpdate);
      } else {
        await addDoc(collection(db, activeTab), {
          ...formData,
          status: formData.status || 'Pendente',
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFilePreview(null);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, activeTab, id), { status: newStatus });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    const mailtoUrl = `mailto:flavia.albuquerque@hospitalunimedcaruaru.com.br?subject=[Painel Faturamento] ${feedback.tipo} de ${feedback.nome}&body=Nome: ${feedback.nome}%0D%0AE-mail: ${feedback.email}%0D%0ATipo: ${feedback.tipo}%0D%0A%0D%0AMensagem:%0D%0A${encodeURIComponent(feedback.mensagem)}`;
    window.location.href = mailtoUrl;
    setFeedbackEnviado(true);
    setTimeout(() => setFeedbackEnviado(false), 5000);
  };

  const getSLAStatus = (dateString, maxHours = 48) => {
    if (!dateString) return null;
    const requestDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now - requestDate) / (1000 * 60 * 60);

    if (diffHours > maxHours) {
      return { label: `SLA Estourado (+${maxHours}h)`, color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (diffHours > maxHours * 0.75) {
      return { label: `Atenção SLA (${maxHours * 0.75}h+)`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
    return { label: 'Dentro do SLA', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const statusPriority = { 
    'Pendente': 1, 
    'Aberto': 1,
    'Em Andamento': 2, 
    'Aguardando TI': 3,
    'Aguardando Retorno': 4,
    'Concluído': 5,
    'Cancelado': 6
  };

  const filteredAndSortedItems = items
    .filter((item) => {
      if (filterStatus !== 'Todos' && (item.status || 'Pendente') !== filterStatus) return false;

      if (filterProfat.trim() !== '') {
        const queryStr = filterProfat.toLowerCase();
        const profatMatch = String(item.profat || '').toLowerCase().includes(queryStr) ||
                            String(item.criticaErro || '').toLowerCase().includes(queryStr) ||
                            String(item.numChamado || '').toLowerCase().includes(queryStr) ||
                            String(item.codAtendimento || '').toLowerCase().includes(queryStr);
        if (!profatMatch) return false;
      }

      if (filterChamado.trim() !== '') {
        const chamadoMatch = String(item.codChamado || '').toLowerCase().includes(filterChamado.toLowerCase()) ||
                             String(item.tituloChamado || '').toLowerCase().includes(filterChamado.toLowerCase()) ||
                             String(item.numChamado || '').toLowerCase().includes(filterChamado.toLowerCase());
        if (!chamadoMatch) return false;
      }

      if (filterSistema !== 'Todos' && item.sistema !== filterSistema) return false;

      if (item.createdAt) {
        const itemDate = item.createdAt.substring(0, 10);
        if (filterDateStart && itemDate < filterDateStart) return false;
        if (filterDateEnd && itemDate > filterDateEnd) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const priorityA = statusPriority[a.status || 'Pendente'] || 99;
      const priorityB = statusPriority[b.status || 'Pendente'] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const clearFilters = () => {
    setFilterStatus('Todos');
    setFilterProfat('');
    setFilterSistema('Todos');
    setFilterChamado('');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const totalPendenciasGeral = dashStats.criticas.pendente + dashStats.sem_valor.pendente + dashStats.sem_tuss.pendente + dashStats.chamados.pendente;
  const totalEmAndamentoGeral = dashStats.criticas.andamento + dashStats.sem_valor.andamento + dashStats.sem_tuss.andamento + dashStats.chamados.andamento;
  const totalConcluidosGeral = dashStats.criticas.concluido + dashStats.sem_valor.concluido + dashStats.sem_tuss.concluido + dashStats.chamados.concluido;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-emerald-950 text-white flex flex-col justify-between shadow-xl">
        <div>
          <div className="p-6 border-b border-emerald-900 flex flex-col items-start gap-2">
            <img 
              src="/logo-unimed.png" 
              alt="Unimed Caruaru" 
              className="h-10 w-auto object-contain mb-1"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <h1 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-400" /> Faturamento
            </h1>
            <p className="text-xs text-emerald-200/70 font-medium">Painel Operacional e Chamados Internos</p>
          </div>

          <div className="p-4 border-b border-emerald-900/50">
            <button
              onClick={toggleNotifications}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                notificationsEnabled 
                  ? 'bg-emerald-800 text-emerald-200 border border-emerald-700' 
                  : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-800'
              }`}
            >
              {notificationsEnabled ? <BellRing className="w-4 h-4 text-emerald-300 animate-pulse" /> : <Bell className="w-4 h-4" />}
              {notificationsEnabled ? 'Alertas Ativos' : 'Ativar Alerta de Demandas'}
            </button>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => { setActiveTab('inicio'); clearFilters(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'inicio' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-emerald-300" />
                <span>Página Principal</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => { setActiveTab('criticas'); clearFilters(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'criticas' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Críticas e Erros (NTI)</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => { setActiveTab('sem_valor'); clearFilters(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'sem_valor' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-300" />
                <span>Proced. Sem Valor</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => { setActiveTab('sem_tuss'); clearFilters(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'sem_tuss' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <span>Proced. Sem TUSS</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => { setActiveTab('chamados'); clearFilters(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'chamados' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-300" />
                <span>Chamados Internos</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-emerald-900 text-xs text-emerald-400/60 text-center font-medium">
          Unimed Caruaru • Faturamento
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* PÁGINA PRINCIPAL */}
        {activeTab === 'inicio' ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
            
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-emerald-700/50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-600">
                  <ShieldAlert className="w-4 h-4 text-emerald-300" /> Gestão Integrada do Faturamento
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Painel Operacional & Chamados Internos</h1>
                <p className="text-emerald-100/90 text-sm leading-relaxed">
                  Bem-vindo à central de inteligência e acompanhamento do Faturamento da Unimed Caruaru.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center min-w-[220px]">
                <img src="/logo-unimed.png" alt="Unimed Caruaru" className="h-12 mx-auto mb-2 object-contain filter drop-shadow" onError={(e) => e.target.style.display = 'none'} />
                <span className="text-xs font-bold text-emerald-200 block uppercase tracking-wider">Unimed Caruaru</span>
              </div>
            </div>

            {/* DASHBOARD EM TEMPO REAL */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" /> Status Geral das Demandas (Tempo Real)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Total Pendências</span>
                    <span className="text-3xl font-extrabold text-amber-950">{totalPendenciasGeral}</span>
                    <span className="text-xs text-slate-500 block mt-1">Aguardando atendimento</span>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                    <Clock className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Em Andamento / TI</span>
                    <span className="text-3xl font-extrabold text-blue-950">{totalEmAndamentoGeral}</span>
                    <span className="text-xs text-slate-500 block mt-1">Em tratativa técnica</span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Concluídos</span>
                    <span className="text-3xl font-extrabold text-emerald-950">{totalConcluidosGeral}</span>
                    <span className="text-xs text-slate-500 block mt-1">Demandas finalizadas</span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* Detalhamento por Módulo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-xs text-slate-800">Críticas e Erros (Chamados NTI)</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{dashStats.criticas.total} total</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between"><span>Pendentes:</span> <strong className="text-amber-600">{dashStats.criticas.pendente}</strong></div>
                    <div className="flex justify-between"><span>Em Andamento:</span> <strong className="text-blue-600">{dashStats.criticas.andamento}</strong></div>
                    <div className="flex justify-between"><span>Aguardando TI:</span> <strong className="text-purple-600">{dashStats.criticas.aguardandoTi}</strong></div>
                    <div className="flex justify-between"><span>Concluídos:</span> <strong className="text-emerald-600">{dashStats.criticas.concluido}</strong></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-xs text-slate-800">Proced. Sem Valor (SLA 48h)</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{dashStats.sem_valor.total} total</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between"><span>Pendentes:</span> <strong className="text-amber-600">{dashStats.sem_valor.pendente}</strong></div>
                    <div className="flex justify-between"><span>SLA Estourado (+48h):</span> <strong className="text-red-600">{dashStats.sem_valor.slaEstourado}</strong></div>
                    <div className="flex justify-between"><span>Concluídos:</span> <strong className="text-emerald-600">{dashStats.sem_valor.concluido}</strong></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-xs text-slate-800">Proced. Sem TUSS (SLA 24h)</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{dashStats.sem_tuss.total} total</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between"><span>Pendentes:</span> <strong className="text-amber-600">{dashStats.sem_tuss.pendente}</strong></div>
                    <div className="flex justify-between"><span>SLA Estourado (+24h):</span> <strong className="text-red-600">{dashStats.sem_tuss.slaEstourado}</strong></div>
                    <div className="flex justify-between"><span>Concluídos:</span> <strong className="text-emerald-600">{dashStats.sem_tuss.concluido}</strong></div>
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-300 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                    <span className="font-bold text-xs text-emerald-900 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Chamados Internos
                    </span>
                    <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">{dashStats.chamados.total} total</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-700">
                    <div className="flex justify-between"><span>Pendentes:</span> <strong className="text-amber-700">{dashStats.chamados.pendente}</strong></div>
                    <div className="flex justify-between"><span>Alta Prioridade:</span> <strong className="text-red-600">{dashStats.chamados.altaPrioridade}</strong></div>
                    <div className="flex justify-between"><span>Concluídos:</span> <strong className="text-emerald-700">{dashStats.chamados.concluido}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atalhos Rápidos */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-emerald-600" /> Módulos Operacionais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div onClick={() => setActiveTab('criticas')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Críticas e Erros (NTI)</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Acompanhamento de críticas e controle de chamados abertos junto à NTI.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                <div onClick={() => setActiveTab('sem_valor')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Proced. Sem Valor</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Procedimentos sem precificação com alerta de SLA de 48 horas.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                <div onClick={() => setActiveTab('sem_tuss')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Proced. Sem TUSS</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Depara de códigos PROFAT com tabelas XML, TUSS, Mat./Med. e SLA 24h.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                <div onClick={() => setActiveTab('chamados')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Chamados Internos</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Central de chamados da equipe com código único e suporte a anexos.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </div>

            {/* Canal de Sugestões / Feedback */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl">
              <div className="flex items-center gap-3 border-b pb-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Canal de Sugestões, Críticas e Elogios</h3>
                  <p className="text-xs text-slate-500">Envie suas observações diretamente para a liderança de faturamento.</p>
                </div>
              </div>

              {feedbackEnviado && (
                <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold">
                  ✓ Abrindo gerenciador de e-mail para envio para Flávia Albuquerque!
                </div>
              )}

              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome *</label>
                    <input required type="text" value={feedback.nome} onChange={(e) => setFeedback({ ...feedback, nome: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seu E-mail *</label>
                    <input required type="email" value={feedback.email} onChange={(e) => setFeedback({ ...feedback, email: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm" placeholder="seu.email@hospitalunimedcaruaru.com.br" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo *</label>
                    <select value={feedback.tipo} onChange={(e) => setFeedback({ ...feedback, tipo: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                      <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                      <option value="Crítica">Crítica</option>
                      <option value="Elogio">Elogio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sua Mensagem *</label>
                  <textarea required rows="3" value={feedback.mensagem} onChange={(e) => setFeedback({ ...feedback, mensagem: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Escreva aqui..."></textarea>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">Destinatário: flavia.albuquerque@hospitalunimedcaruaru.com.br</span>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow flex items-center gap-2 transition">
                    <Send className="w-4 h-4" /> Enviar Mensagem
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* TABELAS E FILTROS */
          <>
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {activeTab === 'criticas' && 'Gestão de Críticas, Erros e Chamados NTI'}
                  {activeTab === 'sem_valor' && 'Procedimentos Sem Valor (Alerta SLA 48h)'}
                  {activeTab === 'sem_tuss' && 'Procedimentos Sem TUSS (Alerta SLA 24h & Mat./Med.)'}
                  {activeTab === 'chamados' && 'Central de Chamados e Suporte Interno'}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeTab === 'criticas' ? 'Acompanhamento integrado de inconsistências e suporte junto à NTI' : 
                   activeTab === 'chamados' ? 'Abertura, controle e acompanhamento de solicitações internas' : 
                   'Acompanhamento e resolução de chamados e pendências'}
                </p>
              </div>

              <button
                onClick={handleOpenNewModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition"
              >
                <PlusCircle className="w-5 h-5" /> {activeTab === 'chamados' ? 'Abrir Novo Chamado' : 'Novo Registro'}
              </button>
            </header>

            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              
              {/* Filtros */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" /> Filtros de Pesquisa
                  </span>
                  <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-emerald-700 underline font-medium">Limpar Filtros</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                      <option value="Todos">Todos os Status</option>
                      <option value="Pendente">1. Pendente / Aberto</option>
                      <option value="Em Andamento">2. Em Andamento</option>
                      <option value="Aguardando TI">3. Aguardando TI</option>
                      <option value="Aguardando Retorno">4. Aguardando Retorno do Usuário</option>
                      <option value="Concluído">5. Concluído</option>
                      <option value="Cancelado">6. Cancelado</option>
                    </select>
                  </div>

                  {activeTab === 'chamados' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cód. Chamado / Título</label>
                        <input type="text" placeholder="Ex: CH-849201" value={filterChamado} onChange={(e) => setFilterChamado(e.target.
