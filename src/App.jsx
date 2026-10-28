import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, Clock, PlusCircle, Search, ShieldAlert, 
  FileCode, ChevronRight, X, Edit3, MessageSquare, Paperclip, 
  FileText, ExternalLink, Image as ImageIcon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('criticas');
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterText, setFilterText] = useState('');

  // Estado do Formulário
  const [formData, setFormData] = useState({});
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
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

  // Processar Upload de Arquivo (PNG, JPEG, PDF, DOC) em Base64
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
    // Gerar Código Interno Único de Chamado (ex: CH-849201)
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
        // Atualizar registro
        const itemRef = doc(db, activeTab, editingId);
        const { id, ...dataToUpdate } = formData;
        await updateDoc(itemRef, dataToUpdate);
      } else {
        // Criar novo registro
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

  // Cálculo de SLA (48 horas)
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
    return { label: 'Dentro do SLA', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  const filteredItems = items.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" /> Faturamento
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Painel Operacional e Chamados Internos</p>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('criticas')}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'criticas' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Críticas e Erros</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('sem_valor')}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'sem_valor' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>Proced. Sem Valor</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('sem_tuss')}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'sem_tuss' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <span>Proced. Sem TUSS</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('chamados')}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'chamados' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>Chamados Internos</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Grupo de Trabalho Faturamento
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topo / Header */}
        <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'criticas' && 'Gestão de Críticas e Erros (SoulMV / SAW)'}
              {activeTab === 'sem_valor' && 'Procedimentos Sem Valor (Alerta SLA 48h)'}
              {activeTab === 'sem_tuss' && 'Procedimentos Sem TUSS'}
              {activeTab === 'chamados' && 'Central de Chamados e Suporte Interno'}
            </h2>
            <p className="text-sm text-slate-500">
              {activeTab === 'chamados' ? 'Abertura, controle e acompanhamento de chamados dos colaboradores' : 'Acompanhamento e resolução de chamados e pendências'}
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition"
          >
            <PlusCircle className="w-5 h-5" /> {activeTab === 'chamados' ? 'Abrir Novo Chamado' : 'Novo Registro'}
          </button>
        </header>

        {/* Corpo com Tabela e Pesquisa */}
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="mb-6 flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-96">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar registros..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-700"
            />
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
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const sla = activeTab === 'sem_valor' ? getSLAStatus(item.dtSolicitacao) : null;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <select
                            value={item.status || 'Pendente'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300 bg-white shadow-sm outline-none cursor-pointer"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                        </td>

                        {activeTab === 'chamados' ? (
                          <>
                            <td className="p-4">
                              <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max mb-1 border border-blue-200">
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
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 p-1.5 rounded border border-blue-200"
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
                            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition"
                            title="Editar dados"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button 
                            onClick={() => alert(`Detalhes / Descrição:\n\n${item.descritivoChamado || item.observacao || 'Sem observações adicionais.'}`)}
                            className="text-xs text-blue-600 hover:underline px-1 py-1"
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
      </main>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingId ? 'Editar Registro' : 'Novo Registro'} - {activeTab === 'chamados' ? 'Chamado Interno' : activeTab}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Formulário de Chamados Internos */}
              {activeTab === 'chamados' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Código do Chamado Gerado</span>
                      <h4 className="text-2xl font-mono font-extrabold text-blue-900">{formData.codChamado}</h4>
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-semibold">Geração Automática</span>
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

                  {/* Upload de Anexo Opcional */}
                  <div className="border border-dashed border-slate-300 p-4 rounded-xl bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Anexar Imagem (PNG/JPEG) ou Documento (PDF/DOC) (Opcional)</label>
                    <input type="file" accept="image/png, image/jpeg, application/pdf, .doc, .docx" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    {filePreview && (
                      <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                  {editingId ? 'Salvar Alterações' : 'Enviar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
