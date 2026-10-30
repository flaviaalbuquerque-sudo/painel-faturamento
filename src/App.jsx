import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, Clock, PlusCircle, ShieldAlert, 
  FileCode, ChevronRight, X, Edit3, Trash2, MessageSquare, Paperclip,
  Home, Send, Filter, ArrowRight,
  Mail, Download, Image as ImageIcon, Bell, BellRing,
  BarChart3, Activity, CheckCircle, CheckSquare, Search, History,
  ArrowUpDown, ArrowUp, ArrowDown, FileText, MessageCircle
} from 'lucide-react';

// URL do Webhook do Google Chat (Cole aqui a URL gerada no Espaço do Google Chat)
const GOOGLE_CHAT_WEBHOOK_URL = ""; 

// 40 Chamados NTI higienizados para a carga inicial/biblioteca
const CHAMADOS_NTI_INICIAIS = [
  { codAtendimento: '', numChamado: '47862', data_abertura: '2025-11-25', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'As contas que foram colocadas em remessa somem da tela, e para encontrar a remessa precisamos procurar através de uma das contas que foram inseridas, para depois selecionar e conseguir entregar a remessa concluindo assim o processo', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '4297364', numChamado: '48162', data_abertura: '2025-11-27', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'atendimento 4297364 SADT que teve alta no dia 25/11/2025 às 11:17h, porém não consegui colocar na esteira, pois a conta não aparece', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177287', numChamado: '48291', data_abertura: '2025-11-28', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ao puxar as contas sem remessa na esteira unimed Recife apareceu uma conta 177287 que não está em remessa inforando que já foi gerado xml. Conferi no SAW a guia referente ao atendimento e realmente essa conta não foi postada. Por favor verificar porque ela aparece o status marcado com xml gerado', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed Recife', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177213', numChamado: '48316', data_abertura: '2025-11-28', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ocorreu um erro onde 4 contas que já estava em remessa e importada no SAW, a esteira ao puxar as contas pelo filtro sem remessa trouxe na informação e acabou atribuindo as mesmas em outra remessa. Contas: 177213, 177855, 178411, 177208.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unimed', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48335', data_abertura: '2025-11-28', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'ao recalcular as contas está dobrando as diárias dentro da conta', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48511', data_abertura: '2025-12-01', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ao puxar as contas por data, percebemos que a esteira está colocando algumas contas fora do período selecionado, o que está ocasionando o não faturamento da conta na data correta, gerando dessa forma atraso no faturamento. Por favor ajustar.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177654', numChamado: '50226', data_abertura: '2025-12-10', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Opme não está aparecendo no easyaudit para as auditoras', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Tratativa: problemas operacionais (conta 177654)' },
  { codAtendimento: '179644', numChamado: '50279', data_abertura: '2025-12-10', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'opme, divergencia na quantidade na fatura, no sistema mv.conta 179644', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '52041', data_abertura: '2025-12-31', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ao selecionar status sincronizar, o filtro não traz todas as contas.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '4371189', numChamado: '52356', data_abertura: '2026-01-05', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Atendimento 4371189 conv 40, 30/12/2025 não aparece na esteira de conta, essa conta precisa passar na auditoria de enfermagem.', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Convênio 40', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '157472', numChamado: '52457', data_abertura: '2026-01-05', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'abrir a remessa 157472 conv.12 (deu erro para retirar as contas)', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Convênio 12', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '157989', numChamado: '53538', data_abertura: '2026-01-12', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ao tentar enviar o arquivo 157989, o sistema informa o erro de integridade.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55258', data_abertura: '2026-01-26', nomeSolicitante: 'Dafne Luiza', emailSolicitante: 'dafne.luiza@hospitalunimedcaruaru.com.br', criticaErro: 'Erro ao gerar xml, na aba monitoração de faturamento. Usuário: Dafne.luiza', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'Dafne Luiza', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55482', data_abertura: '2026-01-28', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ao tentar gerar remessa no Easy Audit, está aparecendo um erro, e não aparece a remessa no sistema, só que no Mv a remessa foi gerada.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '55723', data_abertura: '2026-01-30', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'erro no status de sincronização easy', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '62177', data_abertura: '2026-03-16', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Divergências de valores no OPME, auditoria de enfermagem altera os materiais e não assume no Mv.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '64133', data_abertura: '2026-04-01', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Erro ao gerar o relatório para imprimir a conta e ao fechar a conta.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '66550', data_abertura: '2026-04-15', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Erro ao gerar relatório 10470 no unireport.', sistema: 'SoulMV', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '70475', data_abertura: '2026-05-15', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'duplicidade na esteira de conta no Easy Audit.', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '48050', data_abertura: '2025-11-20', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Remessas duplicando no Easy Audit', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '177661', numChamado: '48784', data_abertura: '2025-12-02', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Conta 177661 não assumiu a auditoria no mv', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha OPERACIONAL' },
  { codAtendimento: '', numChamado: '41194', data_abertura: '2025-10-03', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Quebra de parciais automático no sistema', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '43789', data_abertura: '2025-10-21', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Duplicidade de códigos de serviço no CEMUC', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'CEMUC', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '43054', data_abertura: '2025-10-21', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Solicitação de Melhorias e Correções para a Ferramenta Easy Audit', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitações de melhoria' },
  { codAtendimento: '', numChamado: '44031', data_abertura: '2025-10-23', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Restrição que impeça a utilização da mesma guia em dois atendimentos ambulatoriais distintos', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitações de melhoria' },
  { codAtendimento: '', numChamado: '44378', data_abertura: '2025-10-28', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Importação de Códigos Laboratoriais (Unilab) para Conta Hospitalar', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Unilab', usuario: 'NTI Import', observacao: 'Configurações do sistema' },
  { codAtendimento: '', numChamado: '61632', data_abertura: '2026-03-01', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Limitação de cadastro de porte no SOUL MV', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '63948', data_abertura: '2026-03-30', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'realização de higienização da base de dados no sistema MV Hospitalar no cadastro do beneficiário', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '63958', data_abertura: '2026-03-30', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Atualização da tabela CASSI', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'CASSI', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '69617', data_abertura: '2026-05-08', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Solicitação de relatório para Jean', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '69690', data_abertura: '2026-05-08', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Solicitação de lógica para o relatório 12590', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Esclarecimento da lógica do relatório 12590' },
  { codAtendimento: '', numChamado: '70291', data_abertura: '2026-05-13', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Insert tabelas 72 sulamerica', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'SulAmérica', usuario: 'NTI Import', observacao: 'Insert de atualização dos valores da TABELA 72 do sulamerica' },
  { codAtendimento: '', numChamado: '70421', data_abertura: '2026-05-14', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Solicitação de ajuste no relatório - 10470', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Relatório 10470 - unireport não esta trazendo alguns atendimentos' },
  { codAtendimento: '', numChamado: '70903', data_abertura: '2026-05-20', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Ajuste de todos os setores e origem para todos os usuários do faturamento', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Ajuste de setores/origens para acesso completo a contas' },
  { codAtendimento: '', numChamado: '71048', data_abertura: '2026-05-21', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Extração de relatório via banco para identificar inconsistências cadastrais nas tabelas de faturamento (PROFAT sem TUSS)', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Mapeamento de PROFATs sem vinculo TUSS' },
  { codAtendimento: '', numChamado: '71086', data_abertura: '2026-05-21', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Extração de dados via banco para mapeamento e parametrização de valores zerados ou ausentes', sistema: 'Easy Audit', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Mapeamento de itens PROFAT sem preço/vigência' },
  { codAtendimento: '', numChamado: '71420', data_abertura: '2026-05-25', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Dados como prescrição, evolução dos pacientes não aparece no PEP', sistema: 'SoulMV', status: 'Em Andamento', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Inconsistência de exibição no PEP' },
  { codAtendimento: '', numChamado: '74153', data_abertura: '2026-06-15', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Configuração do convênio 50 na empresa 5 mv - saw', sistema: 'SAW', status: 'Em Andamento', empresa: 'Empresa 5', convenio: 'Convênio 50', usuario: 'NTI Import', observacao: 'Origem: Planilha GESTÃO' },
  { codAtendimento: '', numChamado: '82.992', data_abertura: '2026-07-01', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Acréscimo de aba de observação de faturamento no Easy Audit', sistema: 'Easy Audit', status: 'Pendente', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitado via ClickUp' },
  { codAtendimento: '', numChamado: '86.861', data_abertura: '2026-07-10', nomeSolicitante: 'Faturamento', emailSolicitante: 'faturamento@hospitalunimedcaruaru.com.br', criticaErro: 'Solicitação de Raspberry / Estação de Trabalho', sistema: 'Hardware', status: 'Aguardando TI', empresa: 'Hospital', convenio: 'Geral', usuario: 'NTI Import', observacao: 'Solicitado via ClickUp' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal de Conclusão / Parecer Técnico
  const [isConclusionModalOpen, setIsConclusionModalOpen] = useState(false);
  const [conclusionItem, setConclusionItem] = useState(null);
  const [conclusionForm, setConclusionForm] = useState({ 
    consideracoes: '', 
    anexoUrl: '', 
    anexoNome: '', 
    anexoTipo: '', 
    nomeSolicitante: '',
    emailSolicitante: '' 
  });
  const [conclusionFilePreview, setConclusionFilePreview] = useState(null);

  // Modal para Visualizar Considerações/Parecer Salvo
  const [viewParecerModal, setViewParecerModal] = useState(null);

  // Modal para Visualizar Anexo
  const [viewAnexo, setViewAnexo] = useState(null);

  // Sistema de Notificação
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const previousTotalRef = useRef({});

  // Controle de Histórico Dinâmico (Esconde concluídos/cancelados por padrão)
  const [showHistory, setShowHistory] = useState(false);

  // Paginação e Ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'data_abertura', direction: 'desc' });

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

  // Reseta a página para 1 ao mudar de aba ou alterar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, filterProfat, filterSistema, filterChamado, filterDateStart, filterDateEnd, showHistory]);

  // Listener para o Dashboard Global e Notificações em Tempo Real
  useEffect(() => {
    const collections = ['criticas', 'sem_valor', 'sem_tuss', 'chamados'];
    const unsubscribes = collections.map(colName => {
      const q = query(collection(db, colName));
      return onSnapshot(q, (snapshot) => {
        let docs = snapshot.docs.map(doc => doc.data());
        
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
      
      if (activeTab === 'criticas' && data.length === 0) {
        const importadosFormatados = CHAMADOS_NTI_INICIAIS.map((c, idx) => ({
          id: `nti-${idx}`,
          ...c,
          createdAt: c.data_abertura ? `${c.data_abertura}T00:00:00.000Z` : new Date().toISOString()
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
          createdAt: c.data_abertura ? `${c.data_abertura}T00:00:00.000Z` : new Date().toISOString()
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

  // Upload no Formulário Principal (Max 1MB)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("O arquivo é muito grande! O limite de tamanho permitido é de 1 MB.");
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

  // Upload na Janela de Conclusão (Max 1MB)
  const handleConclusionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("O arquivo do parecer é muito grande! Por favor, selecione um arquivo de até 1 MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConclusionForm(prev => ({
          ...prev,
          anexoUrl: reader.result,
          anexoNome: file.name,
          anexoTipo: file.type
        }));
        setConclusionFilePreview(file.name);
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
    const dataHojeIso = new Date().toISOString().substring(0, 10);
    if (activeTab === 'chamados') {
      const novoCodigoChamado = `CH-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormData({ codChamado: novoCodigoChamado, prioridade: 'Média', sistema: 'SoulMV', tipoChamado: 'Falha', status: 'Pendente', data_abertura: dataHojeIso, nomeSolicitante: '', emailSolicitante: '' });
    } else {
      setFormData({ status: 'Pendente', sistema: 'SoulMV', data_abertura: dataHojeIso, nomeSolicitante: '', emailSolicitante: '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setFilePreview(item.anexoNome || null);
    setIsModalOpen(true);
  };

  // Abertura do Modal Dedicado "Concluir Demanda"
  const handleOpenConclusionModal = (item) => {
    setConclusionItem(item);
    setConclusionForm({
      consideracoes: item.consideracoesConclusao || '',
      anexoUrl: item.anexoConclusaoUrl || '',
      anexoNome: item.anexoConclusaoNome || '',
      anexoTipo: item.anexoConclusaoTipo || '',
      nomeSolicitante: item.nomeSolicitante || item.nomeUsuario || item.usuario || '',
      emailSolicitante: item.emailSolicitante || ''
    });
    setConclusionFilePreview(item.anexoConclusaoNome || null);
    setIsConclusionModalOpen(true);
  };

  // Disparo de E-mail via GMAIL WEB DIRETO
  const triggerGmailWeb = (email, nome, consideracoesTexto, itemRef) => {
    if (!email) {
      alert("Por favor, preencha o e-mail do solicitante.");
      return;
    }
    const refCod = itemRef?.numChamado ? `NTI #${itemRef.numChamado}` : (itemRef?.codChamado || itemRef?.codAtendimento || 'Demandas');
    const emailSubject = `[Painel Faturamento] Solicitação Concluída (${refCod})`;
    const emailBody = `Olá ${nome || 'Solicitante'},\n\nSua solicitação foi atendida com sucesso. Favor acessar o painel para confirmar a demanda concluída.\n\nConsiderações do Faturamento:\n${consideracoesTexto || 'Demanda analisada e finalizada pelo setor.'}`;

    // Link direto para a janela de composição do Gmail Web
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank');
  };

  // Disparo para o Google Chat via Webhook
  const sendGoogleChatNotification = async (itemRef, consideracoesTexto, nomeOverride, emailOverride) => {
    if (!GOOGLE_CHAT_WEBHOOK_URL) {
      alert("URL do Webhook do Google Chat não configurada no sistema. Para habilitar, insira a URL do seu espaço na linha 19 do arquivo.");
      return;
    }

    const refCod = itemRef?.numChamado ? `NTI #${itemRef.numChamado}` : (itemRef?.codChamado || itemRef?.codAtendimento || 'Demanda');
    const nomeFinal = nomeOverride || itemRef?.nomeSolicitante || itemRef?.nomeUsuario || itemRef?.usuario || 'Não informado';
    const emailFinal = emailOverride || itemRef?.emailSolicitante || '';

    const messageText = `🟢 *Sua solicitação foi atendida com sucesso!*\n\n` +
      `*Demanda:* ${refCod}\n` +
      `*Solicitante:* ${nomeFinal}${emailFinal ? ` (${emailFinal})` : ''}\n` +
      `*Parecer Técnico:* ${consideracoesTexto || 'Concluído pelo setor de Faturamento.'}\n\n` +
      `_Favor acessar o painel para confirmar a demanda concluída._`;

    try {
      await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText })
      });
      alert("✓ Notificação enviada com sucesso para o Google Chat!");
    } catch (err) {
      console.error("Erro ao enviar para o Google Chat:", err);
      alert("Não foi possível enviar a notificação para o Google Chat.");
    }
  };

  // Submissão da Conclusão da Demanda
  const handleSaveConclusion = async (e) => {
    e.preventDefault();
    if (!conclusionItem) return;

    const dataConclusao = new Date().toISOString();
    const updateData = {
      status: 'Concluído',
      consideracoesConclusao: conclusionForm.consideracoes,
      anexoConclusaoUrl: conclusionForm.anexoUrl,
      anexoConclusaoNome: conclusionForm.anexoNome,
      anexoConclusaoTipo: conclusionForm.anexoTipo,
      nomeSolicitante: conclusionForm.nomeSolicitante,
      emailSolicitante: conclusionForm.emailSolicitante,
      dataConclusao: dataConclusao
    };

    try {
      if (String(conclusionItem.id).startsWith('nti-')) {
        setItems(prev => prev.map(i => i.id === conclusionItem.id ? { ...i, ...updateData } : i));
      } else {
        await updateDoc(doc(db, activeTab, conclusionItem.id), updateData);
      }

      setIsConclusionModalOpen(false);

      // Oferece envio no Gmail Web
      if (conclusionForm.emailSolicitante) {
        if (window.confirm("Demanda concluída! Deseja abrir a janela de e-mail no Gmail agora para notificar o solicitante?")) {
          triggerGmailWeb(conclusionForm.emailSolicitante, conclusionForm.nomeSolicitante, conclusionForm.consideracoes, conclusionItem);
        }
      }
    } catch (err) {
      console.error("Erro ao concluir demanda:", err);
      alert("Erro ao salvar a conclusão no banco de dados.");
    }
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
      const dataCriacao = formData.data_abertura ? `${formData.data_abertura}T00:00:00.000Z` : new Date().toISOString();
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
          data_abertura: formData.data_abertura || new Date().toISOString().substring(0, 10),
          createdAt: dataCriacao
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
      const targetItem = items.find(i => i.id === id);
      if (newStatus === 'Concluído') {
        handleOpenConclusionModal(targetItem);
        return;
      }

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
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=flavia.albuquerque@hospitalunimedcaruaru.com.br&su=${encodeURIComponent(`[Painel Faturamento] ${feedback.tipo} de ${feedback.nome}`)}&body=${encodeURIComponent(`Nome: ${feedback.nome}\nE-mail: ${feedback.email}\nTipo: ${feedback.tipo}\n\nMensagem:\n${feedback.mensagem}`)}`;
    window.open(gmailUrl, '_blank');
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

  // Formatação de data visual BR (DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.substring(0, 10).split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Lógica de Alternância de Ordenação por Coluna
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Componente de Cabeçalho com Indicador de Ordenação
  const SortableHeader = ({ label, sortKey, className = "" }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <th 
        onClick={() => handleSort(sortKey)} 
        className={`p-4 cursor-pointer hover:bg-slate-100 transition select-none whitespace-nowrap ${className}`}
        title={`Clique para ordenar por ${label}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700 font-bold" />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
          )}
        </div>
      </th>
    );
  };

  // 1. Filtragem Inicial dos Registros
  const filteredItems = items.filter((item) => {
    const currentStatus = item.status || 'Pendente';
    const isSearching = filterProfat.trim() !== '' || filterChamado.trim() !== '' || filterDateStart !== '' || filterDateEnd !== '';

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

    const itemDate = (item.data_abertura || item.createdAt || '').substring(0, 10);
    if (filterDateStart && itemDate < filterDateStart) return false;
    if (filterDateEnd && itemDate > filterDateEnd) return false;

    return true;
  });

  // 2. Ordenação Dinâmica por Coluna
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'data_abertura') {
      aVal = a.data_abertura || a.createdAt || '';
      bVal = b.data_abertura || b.createdAt || '';
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // 3. Paginação (Limites de 10 por página)
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setFilterStatus('Todos');
    setFilterProfat('');
    setFilterSistema('Todos');
    setFilterChamado('');
    setFilterDateStart('');
    setFilterDateEnd('');
    setShowHistory(false);
    setSortConfig({ key: 'data_abertura', direction: 'desc' });
  };

  const totalPendenciasGeral = dashStats.criticas.pendente + dashStats.sem_valor.pendente + dashStats.sem_tuss.pendente + dashStats.chamados.pendente;
  const totalEmAndamentoGeral = dashStats.criticas.andamento + dashStats.sem_valor.andamento + dashStats.sem_tuss.andamento + dashStats.chamados.andamento;
  const totalConcluidosGeral = dashStats.criticas.concluido + dashStats.sem_valor.concluido + dashStats.sem_tuss.concluido + dashStats.chamados.concluido;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-emerald-950 text-white flex flex-col justify-between shadow-xl flex-shrink-0">
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
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        
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
                  ✓ Abrindo janela de e-mail no Gmail para Flávia Albuquerque!
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
                    <Send className="w-4 h-4" /> Enviar no Gmail
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* TABELAS E FILTROS */
          <>
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm flex-shrink-0">
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
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition flex-shrink-0"
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

              {/* Tabela de Dados com Rolagem Horizontal Otimizada */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[1450px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <SortableHeader label="Status" sortKey="status" className="min-w-[180px]" />
                      {activeTab === 'chamados' ? (
                        <>
                          <SortableHeader label="Código / Título" sortKey="tituloChamado" className="min-w-[220px]" />
                          <SortableHeader label="Solicitante / E-mail" sortKey="nomeUsuario" className="min-w-[200px]" />
                          <SortableHeader label="Sistema / Tipo" sortKey="sistema" className="min-w-[140px]" />
                          <th className="p-4 whitespace-nowrap min-w-[140px]">Contato</th>
                          <SortableHeader label="Prioridade" sortKey="prioridade" className="min-w-[120px]" />
                          <SortableHeader label="Data de Abertura" sortKey="data_abertura" className="min-w-[140px]" />
                          <th className="p-4 text-center whitespace-nowrap min-w-[110px]">Anexo</th>
                        </>
                      ) : (
                        <>
                          <SortableHeader label="Atendimento / Nº NTI" sortKey="numChamado" className="min-w-[140px]" />
                          {activeTab === 'criticas' && (
                            <>
                              <SortableHeader label="Crítica / Erro Apresentado" sortKey="criticaErro" className="min-w-[280px]" />
                              <SortableHeader label="Data de Abertura" sortKey="data_abertura" className="min-w-[130px]" />
                              <SortableHeader label="Sistema" sortKey="sistema" className="min-w-[120px]" />
                              <SortableHeader label="Empresa / Convênio" sortKey="empresa" className="min-w-[150px]" />
                            </>
                          )}
                          {activeTab === 'sem_valor' && (
                            <>
                              <SortableHeader label="Profat / Descrição" sortKey="descricao" className="min-w-[280px]" />
                              <SortableHeader label="Tabela" sortKey="tabela" className="min-w-[100px]" />
                              <SortableHeader label="Data de Abertura" sortKey="data_abertura" className="min-w-[130px]" />
                              <th className="p-4 whitespace-nowrap min-w-[150px]">Alerta SLA (48h)</th>
                              <SortableHeader label="Empresa / Convênio" sortKey="empresa" className="min-w-[150px]" />
                              <th className="p-4 whitespace-nowrap min-w-[120px]">Dt da Conta</th>
                            </>
                          )}
                          {activeTab === 'sem_tuss' && (
                            <>
                              <SortableHeader label="Profat / Descrição" sortKey="descricao" className="min-w-[280px]" />
                              <SortableHeader label="TUSS / Tabela XML" sortKey="tuss" className="min-w-[160px]" />
                              <SortableHeader label="Data de Abertura" sortKey="data_abertura" className="min-w-[130px]" />
                              <th className="p-4 whitespace-nowrap min-w-[150px]">Alerta SLA (24h)</th>
                              <th className="p-4 text-center whitespace-nowrap min-w-[130px]">Foto Mat./Med.</th>
                              <SortableHeader label="Empresa / Convênio" sortKey="empresa" className="min-w-[150px]" />
                            </>
                          )}
                          <SortableHeader label="Usuário" sortKey="usuario" className="min-w-[120px]" />
                        </>
                      )}
                      <th className="p-4 text-center whitespace-nowrap min-w-[240px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-8 text-center text-slate-400">
                          Nenhum registro ativo encontrado. {showHistory ? '' : 'Ative "Exibir Concluídos" para pesquisar no histórico.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => {
                        const sla48 = activeTab === 'sem_valor' ? getSLAStatus(item.dtSolicitacao, 48) : null;
                        const sla24 = activeTab === 'sem_tuss' ? getSLAStatus(item.dtSolicitacao, 24) : null;
                        const dataExibicao = item.data_abertura || item.dtSolicitacao || item.createdAt;

                        return (
                          <tr key={item.id} className={`hover:bg-slate-50 transition ${item.status === 'Concluído' ? 'bg-slate-50/50' : ''}`}>
                            <td className="p-4 whitespace-nowrap">
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
                                  <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-max mb-1 border border-emerald-200 whitespace-nowrap">
                                    {item.codChamado}
                                  </div>
                                  <div className="font-semibold text-slate-800 text-sm">{item.tituloChamado}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-slate-800">{item.nomeSolicitante || item.nomeUsuario}</div>
                                  <div className="text-xs text-slate-500">{item.emailSolicitante || item.setor}</div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className="font-medium text-slate-700">{item.sistema}</span>
                                  <span className="text-xs text-slate-500 block">({item.tipoChamado})</span>
                                </td>
                                <td className="p-4 text-xs text-slate-600 whitespace-nowrap">
                                  <div>Chat: {item.chat || '-'}</div>
                                  <div>Ramal: {item.ramal || '-'}</div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded font-bold ${
                                    item.prioridade === 'Alta' ? 'bg-red-100 text-red-700' :
                                    item.prioridade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {item.prioridade || 'Normal'}
                                  </span>
                                </td>
                                <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                  {formatDate(dataExibicao)}
                                </td>
                                <td className="p-4 text-center whitespace-nowrap">
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
                                <td className="p-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                                  <div>Atend: {item.codAtendimento || '-'}</div>
                                  {item.numChamado && (
                                    <div className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-1 w-max font-bold">
                                      NTI: #{item.numChamado}
                                    </div>
                                  )}
                                </td>

                                {activeTab === 'criticas' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800 leading-relaxed">{item.criticaErro}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                      {formatDate(dataExibicao)}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">{item.sistema || 'SoulMV'}</td>
                                    <td className="p-4 whitespace-nowrap">{item.empresa || '-'} / {item.convenio || '-'}</td>
                                  </>
                                )}

                                {activeTab === 'sem_valor' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800 leading-relaxed">{item.profat} - {item.descricao}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">{item.tabela || '-'}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                      {formatDate(dataExibicao)}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                      {sla48 && (
                                        <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border inline-block whitespace-nowrap ${sla48.color}`}>
                                          {sla48.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">{item.empresa} / {item.convenio}</td>
                                    <td className="p-4 whitespace-nowrap">{item.dtConta}</td>
                                  </>
                                )}

                                {activeTab === 'sem_tuss' && (
                                  <>
                                    <td className="p-4 font-medium text-slate-800 leading-relaxed">{item.profat} - {item.descricao}</td>
                                    <td className="p-4 whitespace-nowrap">{item.tuss || 'Sem TUSS'} ({item.tabelaXml || '-'})</td>
                                    <td className="p-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                      {formatDate(dataExibicao)}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                      {sla24 && (
                                        <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border inline-block whitespace-nowrap ${sla24.color}`}>
                                          {sla24.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 text-center whitespace-nowrap">
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
                                    <td className="p-4 whitespace-nowrap">{item.empresa} / {item.convenio}</td>
                                  </>
                                )}

                                <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{item.usuario || 'Sistema'}</td>
                              </>
                            )}

                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                
                                {/* Botão Dedicado "Concluir Demanda" */}
                                {item.status !== 'Concluído' ? (
                                  <button
                                    onClick={() => handleOpenConclusionModal(item)}
                                    className="flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1.5 rounded transition shadow-sm border border-emerald-300"
                                    title="Concluir Demanda e Inserir Parecer"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> Concluir Demanda
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setViewParecerModal(item)}
                                    className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition shadow-sm border border-slate-300"
                                    title="Ver Parecer da Resolução"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-600" /> Ver Parecer
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleOpenEditModal(item)}
                                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded transition shadow-sm border border-amber-200"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded transition shadow-sm border border-red-200"
                                  title="Excluir Registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Barra de Paginação (Limite de 10 linhas) */}
                {sortedItems.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                    <div>
                      Mostrando <span className="font-bold text-slate-800">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, sortedItems.length)}</span> de <span className="font-bold text-slate-800">{sortedItems.length}</span> registros
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold transition shadow-sm"
                      >
                        Anterior
                      </button>

                      <div className="px-2 font-medium">
                        Página <span className="font-bold text-emerald-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold transition shadow-sm"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* JANELA DE CONCLUSÃO DA DEMANDA / PARECER TÉCNICO */}
      {isConclusionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-emerald-100">
            <div className="px-6 py-4 bg-emerald-950 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" /> Parecer de Conclusão da Demanda
              </h3>
              <button onClick={() => setIsConclusionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConclusion} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900">
                <span className="font-bold block">Registrando solução para:</span>
                <span className="font-mono text-xs">{conclusionItem?.numChamado ? `NTI #${conclusionItem.numChamado}` : (conclusionItem?.codChamado || conclusionItem?.criticaErro || 'Demanda')}</span>
              </div>

              {/* Campos do Solicitante (Nome e E-mail em 2 colunas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Solicitante *</label>
                  <input 
                    type="text" 
                    required 
                    value={conclusionForm.nomeSolicitante} 
                    onChange={(e) => setConclusionForm({ ...conclusionForm, nomeSolicitante: e.target.value })} 
                    className="w-full border p-2.5 rounded-lg text-sm bg-white" 
                    placeholder="Ex: Vanessa Thaís" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Solicitante *</label>
                  <input 
                    type="email" 
                    required 
                    value={conclusionForm.emailSolicitante} 
                    onChange={(e) => setConclusionForm({ ...conclusionForm, emailSolicitante: e.target.value })} 
                    className="w-full border p-2.5 rounded-lg text-sm bg-white" 
                    placeholder="solicitante@hospitalunimedcaruaru.com.br" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Considerações da Resolução / Parecer *</label>
                <textarea 
                  required 
                  rows="4" 
                  value={conclusionForm.consideracoes} 
                  onChange={(e) => setConclusionForm({ ...conclusionForm, consideracoes: e.target.value })} 
                  className="w-full border p-2.5 rounded-lg text-sm" 
                  placeholder="Descreva o que foi corrigido, ajustado ou orientado para a finalização..."
                ></textarea>
              </div>

              <div className="border border-dashed border-slate-300 p-4 rounded-xl bg-slate-50">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Anexo de Comprovação (Imagem, PDF ou Word — Max 1 MB)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  onChange={handleConclusionFileChange} 
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer" 
                />
                {conclusionFilePreview && (
                  <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {conclusionFilePreview}
                  </p>
                )}
              </div>

              {/* Botões de Disparo de Avisos (Gmail Web e Google Chat) */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-2 border">
                <span className="text-xs font-bold text-slate-700 block">Enviar Notificação de Conclusão:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => triggerGmailWeb(conclusionForm.emailSolicitante, conclusionForm.nomeSolicitante, conclusionForm.consideracoes, conclusionItem)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" /> Enviar via Gmail Web
                  </button>

                  <button
                    type="button"
                    onClick={() => sendGoogleChatNotification(conclusionItem, conclusionForm.consideracoes, conclusionForm.nomeSolicitante, conclusionForm.emailSolicitante)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-300" /> Enviar no Google Chat
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsConclusionModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition">
                  Salvar e Concluir Demanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VISUALIZAR PARECER TÉCNICO DE DEMANDA CONCLUÍDA */}
      {viewParecerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Parecer de Conclusão Salvo
              </h3>
              <button onClick={() => setViewParecerModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div><strong>Solicitante:</strong> {viewParecerModal.nomeSolicitante || viewParecerModal.usuario || 'Não informado'}</div>
                <div><strong>E-mail:</strong> {viewParecerModal.emailSolicitante || '-'}</div>
                <div><strong>Data de Conclusão:</strong> {formatDate(viewParecerModal.dataConclusao || viewParecerModal.createdAt)}</div>
              </div>

              <div>
                <span className="font-bold block text-xs text-slate-500 uppercase tracking-wide mb-1">Considerações Registradas:</span>
                <p className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 text-slate-800 text-xs leading-relaxed">
                  {viewParecerModal.consideracoesConclusao || 'Nenhuma consideração registrada.'}
                </p>
              </div>

              {viewParecerModal.anexoConclusaoUrl && (
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{viewParecerModal.anexoConclusaoNome}</span>
                  <button 
                    onClick={() => handleOpenAnexo({ anexoUrl: viewParecerModal.anexoConclusaoUrl, anexoNome: viewParecerModal.anexoConclusaoNome, anexoTipo: viewParecerModal.anexoConclusaoTipo })} 
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Ver / Baixar
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setViewParecerModal(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Solicitante *</label>
                      <input required name="nomeSolicitante" value={formData.nomeSolicitante || formData.nomeUsuario || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Solicitante *</label>
                      <input required type="email" name="emailSolicitante" value={formData.emailSolicitante || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="seu.email@hospitalunimedcaruaru.com.br" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Setor *</label>
                      <input required name="setor" value={formData.setor || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Ex: Faturamento, Recepção, TI" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Abertura *</label>
                      <input type="date" required name="data_abertura" value={formData.data_abertura || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem (PNG/JPEG), PDF ou Word (Max 1 MB)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer" />
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

                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Abertura *</label>
                      <input type="date" required name="data_abertura" value={formData.data_abertura || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Solicitante</label>
                      <input name="nomeSolicitante" value={formData.nomeSolicitante || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Solicitante</label>
                      <input type="email" name="emailSolicitante" value={formData.emailSolicitante || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="solicitante@hospitalunimedcaruaru.com.br" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa</label>
                      <input name="empresa" value={formData.empresa || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: Hospital" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Convênio</label>
                      <input name="convenio" value={formData.convenio || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ex: Unimed" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário Responsável *</label>
                      <input required name="usuario" value={formData.usuario || ''} onChange={handleInputChange} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Seu nome" />
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Solicitante</label>
                      <input name="nomeSolicitante" value={formData.nomeSolicitante || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail do Solicitante</label>
                      <input type="email" name="emailSolicitante" value={formData.emailSolicitante || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="solicitante@hospitalunimedcaruaru.com.br" />
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Solicitante</label>
                      <input name="nomeSolicitante" value={formData.nomeSolicitante || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail do Solicitante</label>
                      <input type="email" name="emailSolicitante" value={formData.emailSolicitante || ''} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="solicitante@hospitalunimedcaruaru.com.br" />
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem do Mat./Med., PDF ou Word (Max 1 MB)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                    {filePreview && (
                      <p className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {filePreview}
                      </p>
                    )}
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
