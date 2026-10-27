import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { 
  AlertTriangle, CheckCircle, Clock, FileText, PlusCircle, 
  Search, ShieldAlert, FileCode, ChevronRight, X, AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('criticas');
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Formulário Estado Inicial
  const [formData, setFormData] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, activeTab), {
        ...formData,
        status: formData.status || 'Pendente',
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({});
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" /> Faturamento
            </h1>
            <p className="text-xs text-slate-400 mt-1">Painel Operacional e Controle</p>
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
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Grupo de Trabalho Faturamento
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header topo */}
        <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'criticas' && 'Gestão de Críticas e Erros (SoulMV / SAW)'}
              {activeTab === 'sem_valor' && 'Procedimentos Sem Valor (Alerta SLA 48h)'}
              {activeTab === 'sem_tuss' && 'Procedimentos Sem TUSS'}
            </h2>
            <p className="text-sm text-slate-500">Acompanhamento e resolução de chamados e pendências</p>
          </div>

          <button
            onClick={() => { setFormData({}); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition"
          >
            <PlusCircle className="w-5 h-5" /> Novo Registro
          </button>
        </header>

        {/* Filtros e Tabela */}
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
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
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
                            <td className="p-4">{item.tuss || 'Sem TUSS'} ({item.tabelaXml})</td>
                            <td className="p-4">{item.anvisa || '-'}</td>
                            <td className="p-4">{item.empresa} / {item.convenio}</td>
                          </>
                        )}

                        <td className="p-4 text-xs text-slate-500">{item.usuario || 'Sistema'}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => alert(`Observações: ${item.observacao || 'Nenhuma observação informada.'}`)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver Obs
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
              <h3 className="font-bold text-lg">Novo Registro - {activeTab}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {activeTab === 'criticas' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Crítica / Erro</label>
                      <input required name="criticaErro" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</label>
                      <select name="prioridade" onChange={handleInputChange} className="w-full border p-2 rounded text-sm">
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema</label>
                      <select name="sistema" onChange={handleInputChange} className="w-full border p-2 rounded text-sm">
                        <option value="SoulMV">SoulMV</option>
                        <option value="SAW">SAW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                      <input name="empresa" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                      <input name="convenio" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Remessa/Atendimento/Conta</label>
                      <input name="remessa" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nº do Chamado</label>
                      <input name="numChamado" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sem_valor' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Profat</label>
                      <input required name="profat" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Procedimento</label>
                      <input required name="descricao" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Data da Solicitação (Para Alerta SLA 48h)</label>
                      <input type="datetime-local" required name="dtSolicitacao" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dt da Conta</label>
                      <input type="date" name="dtConta" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                      <input name="empresa" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                      <input name="convenio" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sem_tuss' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Profat</label>
                      <input required name="profat" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Procedimento</label>
                      <input required name="descricao" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tabela XML</label>
                      <input name="tabelaXml" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">TUSS</label>
                      <input name="tuss" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Anvisa</label>
                      <input name="anvisa" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                      <input name="empresa" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Convênio</label>
                      <input name="convenio" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário Responsável</label>
                <input required name="usuario" onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="Seu nome" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observações / Conclusão</label>
                <textarea name="observacao" onChange={handleInputChange} rows="3" className="w-full border p-2 rounded text-sm"></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
