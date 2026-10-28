import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, Clock, PlusCircle, Search, ShieldAlert, 
  FileCode, ChevronRight, X, Edit3, MessageSquare, Paperclip,
  Home, Send, Calendar, Filter, HelpCircle, CheckCircle2, ArrowRight,
  Mail, MessageSquarePlus
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio'); // Padrão: Página Principal
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Estados dos Filtros Avançados
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterProfat, setFilterProfat] = useState('');
  const [filterSistema, setFilterSistema] = useState('Todos');
  const [filterChamado, setFilterChamado] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Formulário Estado Inicial
  const [formData, setFormData] = useState({});
  const [filePreview, setFilePreview] = useState(null);

  // Estado do Formulário de Feedback
  const [feedback, setFeedback] = useState({ nome: '', email: '', tipo: 'Sugestão', mensagem: '' });
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("O arquivo deve ter no máximo 4MB.");
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

  const handleOpenNewModal = () => {
    setEditingId(null);
    setFilePreview(null);
    const novoCodigoChamado = `CH-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({ codChamado: novoCodigoChamado, prioridade: 'Média', sistema: 'SoulMV', tipoChamado: 'Falha' });
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

  const getSLAStatus = (dateString) => {
    if (!dateString) return null;
    const requestDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now - requestDate) / (1000 * 60 * 60);

    if (diffHours > 48) {
      return { label: 'SLA Estourado (+48h)', color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (diffHours > 36) {
      return { label: 'Atenção SLA (Próximo das 48h)', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
    return { label: 'Dentro do SLA', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  // Ordenação Estrita por Status: Pendente ➔ Em Andamento ➔ Concluído
  const statusPriority = { 'Pendente': 1, 'Em Andamento': 2, 'Concluído': 3 };

  const filteredAndSortedItems = items
    .filter((item) => {
      // Filtro por Status
      if (filterStatus !== 'Todos' && (item.status || 'Pendente') !== filterStatus) return false;

      // Filtro por PROFAT (Para abas sem_valor e sem_tuss)
      if (filterProfat.trim() !== '') {
        const profatMatch = String(item.profat || '').toLowerCase().includes(filterProfat.toLowerCase());
        if (!profatMatch) return false;
      }

      // Filtro por Código de Chamado (Para aba chamados)
      if (filterChamado.trim() !== '') {
        const chamadoMatch = String(item.codChamado || '').toLowerCase().includes(filterChamado.toLowerCase()) ||
                             String(item.tituloChamado || '').toLowerCase().includes(filterChamado.toLowerCase());
        if (!chamadoMatch) return false;
      }

      // Filtro por Sistema (Para aba chamados)
      if (filterSistema !== 'Todos' && item.sistema !== filterSistema) return false;

      // Filtro por Período de Data
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
                <span>Críticas e Erros</span>
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
        
        {/* ==================== PÁGINA PRINCIPAL (INÍCIO) ==================== */}
        {activeTab === 'inicio' ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
            
            {/* Banner de Boas-Vindas */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-emerald-700/50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-600">
                  <ShieldAlert className="w-4 h-4 text-emerald-300" /> Gestão Integrada do Faturamento
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Painel Operacional & Chamados Internos</h1>
                <p className="text-emerald-100/90 text-sm leading-relaxed">
                  Bem-vindo à central de inteligência e acompanhamento do Faturamento da Unimed Caruaru. Este painel centraliza a resolução de críticas em sistemas (SoulMV / SAW), monitoramento rigoroso de SLAs e canal direto de suporte para solicitações internas.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center min-w-[220px]">
                <img src="/logo-unimed.png" alt="Unimed Caruaru" className="h-12 mx-auto mb-2 object-contain filter drop-shadow" />
                <span className="text-xs font-bold text-emerald-200 block uppercase tracking-wider">Unimed Caruaru</span>
              </div>
            </div>

            {/* Atalhos Rápidos para as Páginas */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-emerald-600" /> Módulos Operacionais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Card 1 */}
                <div 
                  onClick={() => setActiveTab('criticas')}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Críticas e Erros</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Acompanhamento e correção de inconsistências geradas nos sistemas SoulMV e SAW.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                {/* Card 2 */}
                <div 
                  onClick={() => setActiveTab('sem_valor')}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Proced. Sem Valor</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Mapeamento de procedimentos sem precificação com alerta automático de SLA de 48 horas.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                {/* Card 3 */}
                <div 
                  onClick={() => setActiveTab('sem_tuss')}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Proced. Sem TUSS</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Depara e vinculação de códigos PROFAT com tabelas XML, códigos TUSS e Anvisa.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                {/* Card 4 */}
                <div 
                  onClick={() => setActiveTab('chamados')}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">Chamados Internos</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Central de chamados das equipes com código único, controle por prioridade e suporte a anexos.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:underline">Acessar Módulo <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

              </div>
            </div>

            {/* Resumo do Funcionamento e Objetivos */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" /> Guia de Utilização e Objetivos do Painel
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Críticas e Erros (SoulMV / SAW)
                  </h4>
                  <p className="text-xs leading-relaxed">
                    <strong>Objetivo:</strong> Evitar glosas e retenção de contas médicas. Ao registrar o código de atendimento, número do chamado e crítica apresentada, garantimos a tratativa ágil com as equipes de TI e auditoria.
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Procedimentos Sem Valor
                  </h4>
                  <p className="text-xs leading-relaxed">
                    <strong>Objetivo:</strong> Assegurar o correto faturamento de procedimentos sem valor cadastrado. O sistema ativa um temporizador automático de SLA (48h) a partir da data de solicitação para evitar atrasos no envio de contas aos convênios.
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. Procedimentos Sem TUSS
                  </h4>
                  <p className="text-xs leading-relaxed">
                    <strong>Objetivo:</strong> Manter a padronização e depara de procedimentos junto ao padrão TISS/TUSS da ANS, correlacionando o código PROFAT com registros da Anvisa e tabelas das operadoras.
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Chamados Internos
                  </h4>
                  <p className="text-xs leading-relaxed">
                    <strong>Objetivo:</strong> Facilitar a comunicação direta dos colaboradores com a liderança do Faturamento, permitindo a abertura de chamados com código gerado na hora, definição de prioridade e anexo de evidências.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário de Feedback / Sugestões (Ouvidoria Interna) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl">
              <div className="flex items-center gap-3 border-b pb-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Canal de Sugestões, Críticas e Elogios</h3>
                  <p className="text-xs text-slate-500">Sua opinião é fundamental para aprimorarmos nossas ferramentas operacionais.</p>
                </div>
              </div>

              {feedbackEnviado && (
                <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold">
                  ✓ Abrindo seu gerenciador de e-mail para envio da mensagem para Flávia Albuquerque!
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Mensagem *</label>
                    <select value={feedback.tipo} onChange={(e) => setFeedback({ ...feedback, tipo: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                      <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                      <option value="Crítica Constructiva">Crítica</option>
                      <option value="Elogio">Elogio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sua Mensagem *</label>
                  <textarea required rows="3" value={feedback.mensagem} onChange={(e) => setFeedback({ ...feedback, mensagem: e.target.value })} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Escreva aqui suas ideias ou comentários para o time de faturamento..."></textarea>
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
          /* ==================== ABAS DE TABELA E FILTROS ==================== */
          <>
            {/* Topo / Header Verde */}
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {activeTab === 'criticas' && 'Gestão de Críticas e Erros (SoulMV / SAW)'}
                  {activeTab === 'sem_valor' && 'Procedimentos Sem Valor (Alerta SLA 48h)'}
                  {activeTab === 'sem_tuss' && 'Procedimentos Sem TUSS'}
                  {activeTab === 'chamados' && 'Central de Chamados e Suporte Interno'}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeTab === 'chamados' ? 'Abertura, controle e acompanhamento de solicitações internas' : 'Acompanhamento e resolução de chamados e pendências'}
                </p>
              </div>

              <button
                onClick={handleOpenNewModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition"
              >
                <PlusCircle className="w-5 h-5" /> {activeTab === 'chamados' ? 'Abrir Novo Chamado' : 'Novo Registro'}
              </button>
            </header>

            {/* Painel de Filtros Avançados */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" /> Filtros de Pesquisa Avançada
                  </span>
                  <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-emerald-700 underline font-medium">
                    Limpar Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  
                  {/* Filtro por Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full border p-2 rounded-lg text-sm bg-white"
                    >
                      <option value="Todos">Todos os Status</option>
                      <option value="Pendente">1. Pendente</option>
                      <option value="Em Andamento">2. Em Andamento</option>
                      <option value="Concluído">3. Concluído</option>
                    </select>
                  </div>

                  {/* Filtro por PROFAT ou Chamado */}
                  {activeTab === 'chamados' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cód. Chamado / Título</label>
                        <input 
                          type="text" 
                          placeholder="Ex: CH-849201" 
                          value={filterChamado} 
                          onChange={(e) => setFilterChamado(e.target.value)} 
                          className="w-full border p-2 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema</label>
                        <select 
                          value={filterSistema} 
                          onChange={(e) => setFilterSistema(e.target.value)} 
                          className="w-full border p-2 rounded-lg text-sm bg-white"
                        >
                          <option value="Todos">Todos os Sistemas</option>
                          <option value="SoulMV">SoulMV</option>
                          <option value="EasyAudit">EasyAudit</option>
                          <option value="SAW">SAW</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Código PROFAT</label>
                      <input 
                        type="text" 
                        placeholder="Pesquisar por PROFAT..." 
                        value={filterProfat} 
                        onChange={(e) => setFilterProfat(e.target.value)} 
                        className="w-full border p-2 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {/* Filtro de Período de Data */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data Inicial</label>
                    <input 
                      type="date" 
                      value={filterDateStart} 
                      onChange={(e) => setFilterDateStart(e.target.value)} 
                      className="w-full border p-2 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data Final</label>
                    <input 
                      type="date" 
                      value={filterDateEnd} 
                      onChange={(e) => setFilterDateEnd(e.target.value)} 
                      className="w-full border p-2 rounded-lg text-sm"
                    />
                  </div>

                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4">Status (Ordem Fixa)</th>
                      {activeTab === 'chamados' ? (
                        <>
                          <th className="p-4">Código / Título</th>
                          <th className="p-4">Solicitante / Setor</th>
                          <th className="p-4">Sistema / Tipo</th>
                          <th className="p-4">Contato (Chat / Ramal)</th>
                          <th className="p-4">Prioridade</th>
                          <th className="p-4 text-center">Anexo</th>
                        </>
                      ) : (
                        <>
                          <th className="p-4">Atendimento</th>
                          {activeTab === 'criticas' && (
                            <>
                              <th className="p-4">Crítica/Erro</th>
                              <th className="p-4">Prioridade</th>
                              <th className="p-4">Sistema</th>
                              <th className="p-4">Empresa / Convênio</th>
                              <th className="p-4">Nº Chamado</th>
                            </>
                          )}
                          {activeTab === 'sem_valor' && (
                            <>
                              <th className="p-4">Profat / Descrição</th>
                              <th className="p-4">Tabela</th>
                              <th className="p-4">Alerta SLA (48h)</th>
                              <th className="p-4">Empresa / Convênio</th>
                              <th className="p-4">Dt da Conta</th>
                            </>
                          )}
                          {activeTab === 'sem_tuss' && (
                            <>
                              <th className="p-4">Profat / Descrição</th>
                              <th className="p-4">TUSS / Tabela XML</th>
                              <th className="p-4">Anvisa</th>
                              <th className="p-4">Empresa / Convênio</th>
                            </>
                          )}
                          <th className="p-4">Usuário</th>
                        </>
                      )}
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedItems.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-8 text-center text-slate-400">Nenhum registro encontrado com os filtros selecionados.</td>
                      </tr>
                    ) : (
                      filteredAndSortedItems.map((item) => {
                        const sla = activeTab === 'sem_valor' ? getSLAStatus(item.dtSolicitacao) : null;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-4">
                              <select
                                value={item.status || 'Pendente'}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm outline-none cursor-pointer ${
                                  item.status === 'Concluído' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                  item.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="Pendente">🟡 Pendente</option>
                                <option value="Em Andamento">🔵 Em Andamento</option>
                                <option value="Concluído">🟢 Concluído</option>
                              </select>
                            </td>

                            {activeTab === 'chamados' ? (
                              <>
                                <td className="p-4">
                                  <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-max mb-1 border border-emerald-200">
                                    {item.codChamado}
                                  </div>
                                  <div className="font-semibold text-slate-800 text-sm">{item.tituloChamado}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-slate-800">{item.nomeUsuario}</div>
                                  <div className="text-xs text-slate-500">{item.setor}</div>
                                </td>
                                <td className="p-4">
                                  <span className="font-medium text-slate-700">{item.sistema}</span>
                                  <span className="text-xs text-slate-500 block">({item.tipoChamado})</span>
                                </td>
                                <td className="p-4 text-xs text-slate-600">
                                  <div>Chat: {item.chat || '-'}</div>
                                  <div>Ramal: {item.ramal || '-'}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 text-xs rounded font-bold ${
                                    item.prioridade === 'Alta' ? 'bg-red-100 text-red-700' :
                                    item.prioridade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {item.prioridade || 'Normal'}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {item.anexoUrl ? (
                                    <a 
                                      href={item.anexoUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium"
                                      title={item.anexoNome}
                                    >
                                      <Paperclip className="w-3.5 h-3.5" /> Ver Anexo
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                                  {item.codAtendimento || '-'}
                                </td>

                                {activeTab === 'criticas' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800">{item.criticaErro}</td>
                                    <td className="p-4">
                                      <span className={`px-2 py-1 text-xs rounded font-bold ${
                                        item.prioridade === 'Alta' ? 'bg-red-100 text-red-700' :
                                        item.prioridade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {item.prioridade || 'Normal'}
                                      </span>
                                    </td>
                                    <td className="p-4">{item.sistema}</td>
                                    <td className="p-4">{item.empresa} / {item.convenio}</td>
                                    <td className="p-4 font-mono text-xs">{item.numChamado || '-'}</td>
                                  </>
                                )}

                                {activeTab === 'sem_valor' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800">{item.profat} - {item.descricao}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700">{item.tabela || '-'}</td>
                                    <td className="p-4">
                                      {sla && (
                                        <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${sla.color}`}>
                                          {sla.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4">{item.empresa} / {item.convenio}</td>
                                    <td className="p-4">{item.dtConta}</td>
                                  </>
                                )}

                                {activeTab === 'sem_tuss' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800">{item.profat} - {item.descricao}</td>
                                    <td className="p-4">{item.tuss || 'Sem TUSS'} ({item.tabelaXml || '-'})</td>
                                    <td className="p-4">{item.anvisa || '-'}</td>
                                    <td className="p-4">{item.empresa} / {item.convenio}</td>
                                  </>
                                )}

                                <td className="p-4 text-xs text-slate-500">{item.usuario || 'Sistema'}</td>
                              </>
                            )}

                            <td className="p-4 flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleOpenEditModal(item)}
                                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition"
                                title="Editar dados"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button 
                                onClick={() => alert(`Detalhes / Descrição:\n\n${item.descritivoChamado || item.observacao || 'Sem observações adicionais.'}`)}
                                className="text-xs text-emerald-700 hover:underline px-1 py-1 font-medium"
                              >
                                Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal de Formulário de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingId ? 'Editar Registro' : 'Novo Registro'} - {activeTab === 'chamados' ? 'Chamado Interno' : activeTab}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Formulário de Chamados Internos */}
              {activeTab === 'chamados' && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Código do Chamado Gerado</span>
                      <h4 className="text-2xl font-mono font-extrabold text-emerald-950">{formData.codChamado}</h4>
                    </div>
                    <span className="text-xs text-emerald-800 bg-emerald-200 px-3 py-1 rounded-full font-semibold">Geração Automática</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Colaborador *</label>
                      <input required name="nomeUsuario" value={formData.nomeUsuario || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Setor *</label>
                      <input required name="setor" value={formData.setor || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Ex: Faturamento, Recepção, TI" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Chamado *</label>
                    <input required name="tituloChamado" value={formData.tituloChamado || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm font-semibold text-slate-800" placeholder="Resumo do problema ou solicitação" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descritivo do Chamado *</label>
                    <textarea required name="descritivoChamado" value={formData.descritivoChamado || ''} onChange={handleInputChange} rows="4" className="w-full border p-2.5 rounded-lg text-sm" placeholder="Explique detalhadamente o que aconteceu, código de erro ou necessidade..."></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sistema *</label>
                      <select required name="sistema" value={formData.sistema || 'SoulMV'} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                        <option value="SoulMV">SoulMV</option>
                        <option value="EasyAudit">EasyAudit</option>
                        <option value="SAW">SAW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Chamado *</label>
                      <select required name="tipoChamado" value={formData.tipoChamado || 'Falha'} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                        <option value="Falha">Falha</option>
                        <option value="Correção">Correção</option>
                        <option value="Dúvida">Dúvida</option>
                        <option value="Esclarecimento">Esclarecimento</option>
                        <option value="Ajuste">Ajuste</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Chat (Contato) *</label>
                      <input required name="chat" value={formData.chat || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Teams / WhatsApp" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ramal *</label>
                      <input required name="ramal" value={formData.ramal || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: 4022" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade *</label>
                      <select required name="prioridade" value={formData.prioridade || 'Média'} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-dashed border-emerald-300 p-4 rounded-xl bg-emerald-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem (PNG/JPEG) ou Documento (PDF/DOC) (Opcional)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf, .doc, .docx" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer" />
                    {filePreview && (
                      <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {filePreview}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Formulários das Outras Abas */}
              {activeTab !== 'chamados' && (
                <>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cód. Atendimento</label>
                    <input name="codAtendimento" value={formData.codAtendimento || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="Ex: 1234567" />
                  </div>

                  {activeTab === 'criticas' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Crítica / Erro</label>
                          <input required name="criticaErro" value={formData.criticaErro || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</label>
                          <select name="prioridade" value={formData.prioridade || 'Baixa'} onChange={handleInputChange} className="w-full border p-2 rounded text-sm">
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema</label>
                          <select name="sistema" value={formData.sistema || 'SoulMV'} onChange={handleInputChange} className="w-full border p-2 rounded text-sm">
                            <option value="SoulMV">SoulMV</option>
                            <option value="SAW">SAW</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                          <input name="empresa" value={formData.empresa || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                          <input name="convenio" value={formData.convenio || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Remessa/Conta</label>
                          <input name="remessa" value={formData.remessa || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº do Chamado</label>
                          <input name="numChamado" value={formData.numChamado || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'sem_valor' && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Profat</label>
                          <input required name="profat" value={formData.profat || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Procedimento</label>
                          <input required name="descricao" value={formData.descricao || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Tabela</label>
                          <input name="tabela" value={formData.tabela || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="Ex: CBHPM / Própria" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Data da Solicitação (Para Alerta SLA 48h)</label>
                          <input type="datetime-local" required name="dtSolicitacao" value={formData.dtSolicitacao || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Dt da Conta</label>
                          <input type="date" name="dtConta" value={formData.dtConta || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                          <input name="empresa" value={formData.empresa || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                          <input name="convenio" value={formData.convenio || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'sem_tuss' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Profat</label>
                          <input required name="profat" value={formData.profat || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Procedimento</label>
                          <input required name="descricao" value={formData.descricao || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Tabela XML</label>
                          <input name="tabelaXml" value={formData.tabelaXml || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">TUSS</label>
                          <input name="tuss" value={formData.tuss || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Anvisa</label>
                          <input name="anvisa" value={formData.anvisa || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                          <input name="empresa" value={formData.empresa || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                          <input name="convenio" value={formData.convenio || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário Responsável</label>
                    <input required name="usuario" value={formData.usuario || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="Seu nome" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Observações / Conclusão</label>
                    <textarea name="observacao" value={formData.observacao || ''} onChange={handleInputChange} rows="3" className="w-full border p-2 rounded text-sm"></textarea>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold">
                  {editingId ? 'Salvar Alterações' : 'Enviar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
