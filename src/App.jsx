import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, Clock, PlusCircle, ShieldAlert, 
  FileCode, ChevronRight, X, Edit3, Trash2, MessageSquare, Paperclip,
  Home, Send, Filter, ArrowRight,
  Mail, Download, Image as ImageIcon, Bell, BellRing,
  BarChart3, Activity, CheckCircle, Search, History
} from 'lucide-react';

// 40 Chamados NTI higienizados para a carga inicial/biblioteca
const CHAMADOS_NTI_INICIAIS = [
  { codAtendimento: '', numChamado: '47862', criticaErro: 'As contas que foram colocadas em remessa somem da tela, e para encontrar a remessa precisamos procurar através de uma das contas que foram inseridas, para depois selecionar e conseguir entregar a remessa concluindo assim o processo', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '4297364', numChamado: '48162', criticaErro: 'atendimento 4297364 SADT que teve alta no dia 25/11/2025 às 11:17h, porém não consegui colocar na esteira, pois a conta não aparece', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177287', numChamado: '48291', criticaErro: 'Ao puxar as contas sem remessa na esteira unimed Recife apareceu uma conta 177287 que não está em remessa inforando que já foi gerado xml. Conferi no SAW a guia referente ao atendimento e realmente essa conta não foi postada. Por favor verificar porque ela aparece o status marcado com xml gerado', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed Recife', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177213', numChamado: '48316', criticaErro: 'Ocorreu um erro onde 4 contas que já estava em remessa e importada no SAW, a esteira ao puxar as contas pelo filtro sem remessa trouxe na informação e acabou atribuindo as mesmas em outra remessa. Contas: 177213, 177855, 178411, 177208.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48335', criticaErro: 'ao recalcular as contas está dobrando as diárias dentro da conta', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48511', criticaErro: 'Ao puxar as contas por data, percebemos que a esteira está colocando algumas contas fora do período selecionado, o que está ocasionando o não faturamento da conta na data correta, gerando dessa forma atraso no faturamento. Por favor ajustar.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177654', numChamado: '50226', criticaErro: 'Opme não está aparecendo no easyaudit para as auditoras', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Tratativa: problemas operacionais (conta 177654)' },
  { codAtendimento: '179644', numChamado: '50279', criticaErro: 'opme, divergencia na quantidade na fatura, no sistema mv.conta 179644', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '52041', criticaErro: 'Ao selecionar status sincronizar, o filtro não traz todas as contas.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '4371189', numChamado: '52356', criticaErro: 'Atendimento 4371189 conv 40, 30/12/2025 não aparece na esteira de conta, essa conta precisa passar na auditoria de enfermagem.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Convênio 40', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '157472', numChamado: '52457', criticaErro: 'abrir a remessa 157472 conv.12 (deu erro para retirar as contas)', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Convênio 12', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '157989', numChamado: '53538', criticaErro: 'Ao tentar enviar o arquivo 157989, o sistema informa o erro de integridade.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55258', criticaErro: 'Erro ao gerar xml, na aba monitoração de faturamento. Usuário: Dafne.luiza', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'Dafne Luiza', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55482', criticaErro: 'Ao tentar gerar remessa no Easy Audit, está aparecendo um erro, e não aparece a remessa no sistema, só que no Mv a remessa foi gerada.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55723', criticaErro: 'erro no status de sincronização easy', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '62177', criticaErro: 'Divergências de valores no OPME, auditoria de enfermagem altera os materiais e não assume no Mv.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '64133', criticaErro: 'Erro ao gerar o relatório para imprimir a conta e ao fechar a conta.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '66550', criticaErro: 'Erro ao gerar relatório 10470 no unireport.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '70475', criticaErro: 'duplicidade na esteira de conta no Easy Audit.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48050', criticaErro: 'Remessas duplicando no Easy Audit', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177661', numChamado: '48784', criticaErro: 'Conta 177661 não assumiu a auditoria no mv', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '41194', criticaErro: 'Quebra de parciais automático no sistema', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '43789', criticaErro: 'Duplicidade de códigos de serviço no CEMUC', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'CEMUC', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '43054', criticaErro: 'Solicitação de Melhorias e Correções para a Ferramenta Easy Audit', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitações de melhoria' },
  { codAtendimento: '', numChamado: '44031', criticaErro: 'Restrição que impeça a utilização da mesma guia em dois atendimentos ambulatoriais distintos', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitações de melhoria' },
  { codAtendimento: '', numChamado: '44378', criticaErro: 'Importação de Códigos Laboratoriais (Unilab) para Conta Hospitalar', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unilab', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '61632', criticaErro: 'Limitação de cadastro de porte no SOUL MV', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '63948', criticaErro: 'realização de higienização da base de dados no sistema MV Hospitalar no cadastro do beneficiário', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '63958', criticaErro: 'Atualização da tabela CASSI', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'CASSI', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '69617', criticaErro: 'Solicitação de relatório para Jean', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '69690', criticaErro: 'Solicitação de lógica para o relatório 12590', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Esclarecimento da lógica do relatório 12590' },
  { codAtendimento: '', numChamado: '70291', criticaErro: 'Insert tabelas 72 sulamerica', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'SulAmérica', usuario: 'NTI Import', observacao: 'Insert de atualização dos valores da TABELA 72 do sulamerica' },
  { codAtendimento: '', numChamado: '70421', criticaErro: 'Solicitação de ajuste no relatório - 10470', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Relatório 10470 - unireport não esta trazendo alguns atendimentos' },
  { codAtendimento: '', numChamado: '70903', criticaErro: 'Ajuste de todos os setores e origem para todos os usuários do faturamento', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Ajuste de setores/origens para acesso completo a contas' },
  { codAtendimento: '', numChamado: '71048', criticaErro: 'Extração de relatório via banco para identificar inconsistências cadastrais nas tabelas de faturamento (PROFAT sem TUSS)', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Mapeamento de PROFATs sem vinculo TUSS' },
  { codAtendimento: '', numChamado: '71086', criticaErro: 'Extração de dados via banco para mapeamento e parametrização de valores zerados ou ausentes', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Mapeamento de itens PROFAT sem preço/vigência (Link ClickUp)' },
  { codAtendimento: '', numChamado: '71420', criticaErro: 'Dados como prescrição, evolução dos pacientes não aparece no PEP', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Inconsistência de exibição no PEP' },
  { codAtendimento: '', numChamado: '74153', criticaErro: 'Configuração do convênio 50 na empresa 5 mv - saw', sistema: 'SAW', status: 'Em Andamento', empresa: 'Empresa 5', convenio: 'Convênio 50', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '82.992', criticaErro: 'Acréscimo de aba de observação de faturamento no Easy Audit', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitado via ClickUp' },
  { codAtendimento: '', numChamado: '86.861', criticaErro: 'Solicitação de Raspberry / Estação de Trabalho', sistema: 'Hardware', status: 'Aguardando TI', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitado via ClickUp' }
];

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

  // Controle de Histórico Dinâmico (Esconde concluídos/cancelados por padrão)
  const [showHistory, setShowHistory] = useState(false);

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
        let docs = snapshot.docs.map(doc => doc.data());
        
        // Se a coleção de críticas estiver vazia no Firestore, utiliza a base de chamados importados
        if (colName === 'criticas' && docs.length === 0) {
          docs = CHAMADOS_NTI_INICIAIS;
        }

        const total = docs.length;
        const pendente = docs.filter(d => (d.status || 'Pendente') === 'Pendente' || d.status === 'Aberto').length;
        const andamento = docs.filter(d => d.status === 'Em Andamento' || d.status === 'Em andamento').length;
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
      
      // Se for a aba de críticas e ainda não houver dados no Firestore, exibe a base de 40 chamados importados
      if (activeTab === 'criticas' && data.length === 0) {
        const importadosFormatados = CHAMADOS_NTI_INICIAIS.map((c, idx) => ({
          id: `nti-${idx}`,
          ...c,
          createdAt: new Date().toISOString()
        }));
        setItems(importadosFormatados);
      } else {
        setItems(data);
      }
    }, (error) => {
      console.error("Erro ao buscar dados do Firebase:", error);
      if (activeTab === 'criticas') {
        const importadosFormatados = CHAMADOS_NTI_INICIAIS.map((c, idx) => ({
          id: `nti-${idx}`,
          ...c,
          createdAt: new Date().toISOString()
        }));
        setItems(importadosFormatados);
      }
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
    if (activeTab === 'chamados') {
      const novoCodigoChamado = `CH-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormData({ codChamado: novoCodigoChamado, prioridade: 'Média', sistema: 'SoulMV', tipoChamado: 'Falha', status: 'Pendente' });
    } else {
      setFormData({ status: 'Pendente', sistema: 'SoulMV' });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setFilePreview(item.anexoNome || null);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este registro do banco de dados?")) {
      try {
        if (String(id).startsWith('nti-')) {
          setItems(prev => prev.filter(item => item.id !== id));
        } else {
          await deleteDoc(doc(db, activeTab, id));
        }
      } catch (err) {
        console.error("Erro ao apagar:", err);
        alert("Erro ao excluir do banco de dados.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (String(editingId).startsWith('nti-')) {
          setItems(prev => prev.map(item => item.id === editingId ? { ...formData, id: editingId } : item));
        } else {
          const itemRef = doc(db, activeTab, editingId);
          const { id, ...dataToUpdate } = formData;
          await updateDoc(itemRef, dataToUpdate);
        }
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
      if (String(id).startsWith('nti-')) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      } else {
        await updateDoc(doc(db, activeTab, id), { status: newStatus });
      }
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
    'Em andamento': 2,
    'Aguardando TI': 3,
    'Aguardando Retorno': 4,
    'Concluído': 5,
    'Cancelado': 6
  };

  // Filtro Dinâmico com suporte à Biblioteca de Histórico
  const filteredAndSortedItems = items
    .filter((item) => {
      const currentStatus = item.status || 'Pendente';
      const isSearching = filterProfat.trim() !== '' || filterChamado.trim() !== '' || filterDateStart !== '' || filterDateEnd !== '';

      // Oculta Concluídos/Cancelados a menos que o Histórico esteja ativo ou haja uma busca específica
      if (!showHistory && !isSearching && filterStatus === 'Todos') {
        if (currentStatus === 'Concluído' || currentStatus === 'Cancelado') {
          return false;
        }
      }

      if (filterStatus !== 'Todos' && currentStatus !== filterStatus) return false;

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
                             String(item.tituloChamado || '').toLowerCase().includes(filterChamado.toLowerCase());
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
    setShowHistory(false);
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
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Em Andamento</span>
                    <span className="text-3xl font-extrabold text-blue-950">{totalEmAndamentoGeral}</span>
                    <span className="text-xs text-slate-500 block mt-1">Em tratativa técnica</span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Concluídos (Histórico)</span>
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
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Acompanhamento ativo e biblioteca de consulta de chamados NTI.</p>
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
                  {activeTab === 'criticas' && 'Gestão de Críticas e Erros (Chamados NTI)'}
                  {activeTab === 'sem_valor' && 'Procedimentos Sem Valor (Alerta SLA 48h)'}
                  {activeTab === 'sem_tuss' && 'Procedimentos Sem TUSS (Alerta SLA 24h & Mat./Med.)'}
                  {activeTab === 'chamados' && 'Central de Chamados e Suporte Interno'}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeTab === 'criticas' ? 'Acompanhamento dinâmico da operação e biblioteca de busca do NTI' : 
                   activeTab === 'chamados' ? 'Abertura, controle e acompanhamento de solicitações internas' : 
                   'Acompanhamento e resolução de pendências do setor'}
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
              
              {/* Filtros e Alternância para Histórico */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" /> Filtros e Busca Operacional
                  </span>
                  
                  {/* Botão para Ativar/Desativar Biblioteca de Histórico */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      showHistory 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    {showHistory ? 'Exibindo Histórico Completo' : 'Exibir Concluídos / Histórico'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                      <option value="Todos">Todos (Ativos no Dia a Dia)</option>
                      <option value="Pendente">1. Pendente / Aberto</option>
                      <option value="Em Andamento">2. Em Andamento</option>
                      <option value="Aguardando TI">3. Aguardando TI</option>
                      <option value="Aguardando Retorno">4. Aguardando Retorno do Usuário</option>
                      <option value="Concluído">5. Concluído (Histórico)</option>
                      <option value="Cancelado">6. Cancelado (Histórico)</option>
                    </select>
                  </div>

                  {activeTab === 'chamados' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cód. Chamado / Título</label>
                        <input type="text" placeholder="Ex: CH-849201" value={filterChamado} onChange={(e) => setFilterChamado(e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema</label>
                        <select value={filterSistema} onChange={(e) => setFilterSistema(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                          <option value="Todos">Todos os Sistemas</option>
                          <option value="SoulMV">SoulMV</option>
                          <option value="EasyAudit">EasyAudit</option>
                          <option value="SAW">SAW</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar por Atendimento / Nº NTI / Palavra-Chave</label>
                      <div className="relative">
                        <input type="text" placeholder="Digite Nº NTI (ex: 47862) ou palavra..." value={filterProfat} onChange={(e) => setFilterProfat(e.target.value)} className="w-full border p-2 pr-8 rounded-lg text-sm" />
                        <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data Inicial</label>
                    <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data Final</label>
                    <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4">Status</th>
                      {activeTab === 'chamados' ? (
                        <>
                          <th className="p-4">Código / Título</th>
                          <th className="p-4">Solicitante / Setor</th>
                          <th className="p-4">Sistema / Tipo</th>
                          <th className="p-4">Contato</th>
                          <th className="p-4">Prioridade</th>
                          <th className="p-4 text-center">Anexo</th>
                        </>
                      ) : (
                        <>
                          <th className="p-4">Atendimento / Nº NTI</th>
                          {activeTab === 'criticas' && (
                            <>
                              <th className="p-4">Crítica / Erro Apresentado</th>
                              <th className="p-4">Sistema</th>
                              <th className="p-4">Empresa / Convênio</th>
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
                              <th className="p-4">Alerta SLA (24h)</th>
                              <th className="p-4 text-center">Foto Mat./Med.</th>
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
                        <td colSpan="10" className="p-8 text-center text-slate-400">
                          Nenhum registro ativo encontrado. {showHistory ? '' : 'Ative "Exibir Concluídos" para pesquisar no histórico.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedItems.map((item) => {
                        const sla48 = activeTab === 'sem_valor' ? getSLAStatus(item.dtSolicitacao, 48) : null;
                        const sla24 = activeTab === 'sem_tuss' ? getSLAStatus(item.dtSolicitacao, 24) : null;

                        return (
                          <tr key={item.id} className={`hover:bg-slate-50 transition ${item.status === 'Concluído' ? 'bg-slate-50/50' : ''}`}>
                            <td className="p-4">
                              <select
                                value={item.status || 'Pendente'}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm outline-none cursor-pointer ${
                                  item.status === 'Concluído' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                  item.status === 'Em Andamento' || item.status === 'Em andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  item.status === 'Aguardando TI' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  item.status === 'Aguardando Retorno' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  item.status === 'Cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="Pendente">🟡 Pendente / Aberto</option>
                                <option value="Em Andamento">🔵 Em Andamento</option>
                                <option value="Aguardando TI">🟣 Aguardando TI</option>
                                <option value="Aguardando Retorno">🟠 Aguardando Retorno do Usuário</option>
                                <option value="Concluído">🟢 Concluído</option>
                                <option value="Cancelado">⚪ Cancelado</option>
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
                                    <button 
                                      onClick={() => handleOpenAnexo(item)}
                                      className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:bg-emerald-100 bg-emerald-50 p-1.5 rounded border border-emerald-300 font-semibold transition"
                                      title={item.anexoNome}
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> Ver Anexo
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                                  <div>Atend: {item.codAtendimento || '-'}</div>
                                  {item.numChamado && (
                                    <div className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-1 w-max font-bold">
                                      NTI: #{item.numChamado}
                                    </div>
                                  )}
                                </td>

                                {activeTab === 'criticas' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800">{item.criticaErro}</td>
                                    <td className="p-4">{item.sistema || 'SoulMV'}</td>
                                    <td className="p-4">{item.empresa || '-'} / {item.convenio || '-'}</td>
                                  </>
                                )}

                                {activeTab === 'sem_valor' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800">{item.profat} - {item.descricao}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700">{item.tabela || '-'}</td>
                                    <td className="p-4">
                                      {sla48 && (
                                        <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${sla48.color}`}>
                                          {sla48.label}
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
                                    <td className="p-4">
                                      {sla24 && (
                                        <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${sla24.color}`}>
                                          {sla24.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 text-center">
                                      {item.anexoUrl ? (
                                        <button 
                                          onClick={() => handleOpenAnexo(item)}
                                          className="inline-flex items-center gap-1 text-xs text-blue-800 hover:bg-blue-100 bg-blue-50 p-1.5 rounded border border-blue-300 font-semibold transition"
                                          title={item.anexoNome}
                                        >
                                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Ver Foto Mat/Med
                                        </button>
                                      ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                      )}
                                    </td>
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
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                                title="Excluir Registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
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

      {/* Modal para Visualizar Imagem do Anexo */}
      {viewAnexo && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-emerald-950 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" /> Visualizador de Anexo: {viewAnexo.nome}
              </h3>
              <button onClick={() => setViewAnexo(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-100 flex-1">
              <img src={viewAnexo.url} alt="Anexo Anexado" className="max-h-[65vh] object-contain rounded border border-slate-300 shadow-md" />
            </div>

            <div className="p-4 bg-white border-t flex justify-end gap-3">
              <a 
                href={viewAnexo.url} 
                download={viewAnexo.nome || 'anexo_registro'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Baixar Imagem
              </a>
              <button onClick={() => setViewAnexo(null)} className="px-4 py-2 border rounded-lg text-xs text-slate-600 font-semibold">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingId ? 'Editar Registro' : 'Novo Registro'} - {activeTab === 'chamados' ? 'Chamado Interno' : activeTab === 'criticas' ? 'Crítica e Chamado NTI' : 'Pendência'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Form Chamados Internos */}
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
                    <input required name="tituloChamado" value={formData.tituloChamado || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm font-semibold text-slate-800" placeholder="Resumo da solicitação" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descritivo do Chamado *</label>
                    <textarea required name="descritivoChamado" value={formData.descritivoChamado || ''} onChange={handleInputChange} rows="4" className="w-full border p-2.5 rounded-lg text-sm" placeholder="Explique o problema ou solicitação..."></textarea>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem (PNG/JPEG) ou Documento (PDF) (Max 700KB)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer" />
                    {filePreview && (
                      <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {filePreview}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Form Críticas e Erros (Chamados NTI) */}
              {activeTab === 'criticas' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nº do Chamado NTI</label>
                      <input name="numChamado" value={formData.numChamado || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm font-mono font-bold text-blue-900 bg-blue-50 border-blue-200" placeholder="Ex: 47862" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cód. Atendimento Hospitalar</label>
                      <input name="codAtendimento" value={formData.codAtendimento || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: 4297364" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Crítica / Erro Apresentado *</label>
                    <input required name="criticaErro" value={formData.criticaErro || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Descrição do erro ou lote travado" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sistema *</label>
                      <select name="sistema" value={formData.sistema || 'SoulMV'} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                        <option value="SoulMV">SoulMV</option>
                        <option value="Easy Audit">Easy Audit</option>
                        <option value="SAW">SAW</option>
                        <option value="Hardware">Hardware / Estação</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status da NTI *</label>
                      <select name="status" value={formData.status || 'Pendente'} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white font-semibold">
                        <option value="Pendente">🟡 Pendente / Aberto</option>
                        <option value="Em Andamento">🔵 Em Andamento</option>
                        <option value="Aguardando TI">🟣 Aguardando TI</option>
                        <option value="Aguardando Retorno">🟠 Aguardando Retorno do Usuário</option>
                        <option value="Concluído">🟢 Concluído</option>
                        <option value="Cancelado">⚪ Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa</label>
                      <input name="empresa" value={formData.empresa || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: Hospital" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Convênio</label>
                      <input name="convenio" value={formData.convenio || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: Unimed" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário Responsável *</label>
                    <input required name="usuario" value={formData.usuario || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Seu nome" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tratativa NTI / Observações</label>
                    <textarea name="observacao" value={formData.observacao || ''} onChange={handleInputChange} rows="3" className="w-full border p-2.5 rounded-lg text-sm" placeholder="Histórico de tratativas e retornos dados..."></textarea>
                  </div>
                </>
              )}

              {/* Form Proced. Sem Valor */}
              {activeTab === 'sem_valor' && (
                <>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cód. Atendimento</label>
                    <input name="codAtendimento" value={formData.codAtendimento || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="Ex: 1234567" />
                  </div>
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

              {/* Form Proced. Sem TUSS */}
              {activeTab === 'sem_tuss' && (
                <>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cód. Atendimento</label>
                    <input name="codAtendimento" value={formData.codAtendimento || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm bg-white" placeholder="Ex: 1234567" />
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Data da Solicitação (Para Alerta SLA 24h)</label>
                      <input type="datetime-local" required name="dtSolicitacao" value={formData.dtSolicitacao || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tabela XML</label>
                      <input name="tabelaXml" value={formData.tabelaXml || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="border border-dashed border-blue-300 p-4 rounded-xl bg-blue-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem do Mat./Med. (Opcional - Max 700KB)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                    {filePreview && (
                      <p className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {filePreview}
                      </p>
                    )}
                  </div>
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
