import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { 
  AlertCircle, Clock, CheckCircle, FileText, Plus, X, Menu, 
  LayoutDashboard, Activity, Trash2, Edit, AlertTriangle, FileUp
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'faturamento-dashboard';

// --- Reusable Components ---

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const FormGroup = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

// --- Hooks ---
const useFirestoreData = (user, collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    
    // Strict path rule applied
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
    const q = query(colRef);
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        // Client-side sorting (newest first based on creation if available, or just keeping order)
        setData(items.reverse());
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName]);

  const addItem = async (itemData) => {
    if (!user || !db) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
    await addDoc(colRef, { ...itemData, createdAt: new Date().toISOString() });
  };

  const updateItem = async (id, itemData) => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, id);
    await updateDoc(docRef, itemData);
  };

  const deleteItem = async (id) => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, id);
    await deleteDoc(docRef);
  };

  return { data, loading, addItem, updateItem, deleteItem };
};

// --- Page Components ---

// 1. Gestão de Críticas e Erros
const CriticasView = ({ user }) => {
  const { data, loading, addItem, updateItem, deleteItem } = useFirestoreData(user, 'criticas_erros');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    critica: '', prioridade: 'Baixa', convenio: '', sistema: 'SoulMV', 
    empresa: '', remessa: '', dataErro: '', status: 'Aberto', 
    usuario: '', chamado: '', observacao: ''
  };
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, form);
    } else {
      addItem(form);
    }
    closeModal();
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Críticas e Erros</h2>
          <p className="text-gray-500 text-sm">Controle de erros de sistema (SoulMV/SAW)</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} /> Nova Entrada
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
              <tr>
                <th className="p-4">Prioridade/Status</th>
                <th className="p-4">Sistema/Empresa</th>
                <th className="p-4">Convênio/Remessa</th>
                <th className="p-4">Crítica/Erro</th>
                <th className="p-4">Data/Usuário</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="6" className="p-4 text-center text-gray-400">Carregando...</td></tr> : 
               data.length === 0 ? <tr><td colSpan="6" className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td></tr> :
               data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge color={item.prioridade === 'Crítica' ? 'red' : item.prioridade === 'Alta' ? 'orange' : item.prioridade === 'Média' ? 'yellow' : 'gray'}>
                        {item.prioridade}
                      </Badge>
                      <Badge color={item.status === 'Concluído' ? 'green' : item.status === 'Em Andamento' ? 'blue' : 'gray'}>
                        {item.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{item.sistema}</div>
                    <div className="text-xs text-gray-500">{item.empresa}</div>
                  </td>
                  <td className="p-4">
                    <div>{item.convenio}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">{item.remessa}</div>
                  </td>
                  <td className="p-4">
                    <div className="line-clamp-2 max-w-xs" title={item.critica}>{item.critica}</div>
                    {item.chamado && <div className="text-xs text-indigo-600 mt-1">Chamado: {item.chamado}</div>}
                  </td>
                  <td className="p-4">
                    <div>{item.dataErro}</div>
                    <div className="text-xs text-gray-500">{item.usuario}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Crítica/Erro" : "Nova Crítica/Erro"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Sistema">
              <select required className="w-full border rounded-lg p-2" value={form.sistema} onChange={e => setForm({...form, sistema: e.target.value})}>
                <option value="SoulMV">SoulMV</option>
                <option value="SAW">SAW</option>
                <option value="Outros">Outros</option>
              </select>
            </FormGroup>
            <FormGroup label="Prioridade">
              <select className="w-full border rounded-lg p-2" value={form.prioridade} onChange={e => setForm({...form, prioridade: e.target.value})}>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </FormGroup>
            <FormGroup label="Empresa">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} />
            </FormGroup>
            <FormGroup label="Convênio">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.convenio} onChange={e => setForm({...form, convenio: e.target.value})} />
            </FormGroup>
            <FormGroup label="Remessa/Atend/Conta">
              <input type="text" className="w-full border rounded-lg p-2" value={form.remessa} onChange={e => setForm({...form, remessa: e.target.value})} />
            </FormGroup>
            <FormGroup label="Data do Erro">
              <input type="date" required className="w-full border rounded-lg p-2" value={form.dataErro} onChange={e => setForm({...form, dataErro: e.target.value})} />
            </FormGroup>
            <FormGroup label="Status">
              <select className="w-full border rounded-lg p-2" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Aberto">Aberto</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </FormGroup>
            <FormGroup label="Usuário">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} />
            </FormGroup>
            <FormGroup label="Nº do Chamado">
              <input type="text" className="w-full border rounded-lg p-2" value={form.chamado} onChange={e => setForm({...form, chamado: e.target.value})} />
            </FormGroup>
             <FormGroup label="Print ou Arquivo (Placeholder)">
              <div className="border border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center text-sm text-gray-500 bg-gray-50">
                 <input type="file" className="w-full text-sm" />
              </div>
            </FormGroup>
          </div>
          <FormGroup label="Crítica/Erro">
            <textarea required rows="3" className="w-full border rounded-lg p-2" value={form.critica} onChange={e => setForm({...form, critica: e.target.value})}></textarea>
          </FormGroup>
          <FormGroup label="Observação/Conclusão">
            <textarea rows="2" className="w-full border rounded-lg p-2" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}></textarea>
          </FormGroup>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// 2. Procedimentos Sem Valor
const SemValorView = ({ user }) => {
  const { data, loading, addItem, updateItem, deleteItem } = useFirestoreData(user, 'procedimentos_sem_valor');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    profat: '', descricao: '', tabela: '', empresa: '', convenio: '', 
    atendimento: '', status: 'Pendente', usuario: '', dataSolicitacao: '', observacao: ''
  };
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, form);
    } else {
      addItem(form);
    }
    closeModal();
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  // CRITICAL LOGIC: 48 hours SLA check
  const checkSLA = (dateStr, status) => {
    if (status === 'Concluído' || !dateStr) return { isOverdue: false };
    const requestDate = new Date(dateStr);
    if (isNaN(requestDate.getTime())) return { isOverdue: false };
    
    const now = new Date();
    const diffMs = now - requestDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return {
      isOverdue: diffHours > 48,
      hours: Math.floor(diffHours)
    };
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Procedimentos Sem Valor</h2>
          <p className="text-gray-500 text-sm">SLA de precificação e cadastro: 48 horas</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} /> Nova Entrada
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
              <tr>
                <th className="p-4">Status / SLA</th>
                <th className="p-4">Profat / Descrição</th>
                <th className="p-4">Empresa / Convênio</th>
                <th className="p-4">Solicitação / Tabela</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="5" className="p-4 text-center text-gray-400">Carregando...</td></tr> : 
               data.length === 0 ? <tr><td colSpan="5" className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td></tr> :
               data.map(item => {
                 const sla = checkSLA(item.dataSolicitacao, item.status);
                 const rowClass = sla.isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50/50';
                 
                 return (
                  <tr key={item.id} className={`${rowClass} transition-colors`}>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 items-start">
                        <Badge color={item.status === 'Concluído' ? 'green' : item.status === 'Em Andamento' ? 'blue' : 'gray'}>
                          {item.status}
                        </Badge>
                        {sla.isOverdue && (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded border border-red-200">
                            <AlertTriangle size={12} /> Atrasado ({sla.hours}h)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{item.profat}</div>
                      <div className="text-xs text-gray-500 line-clamp-2" title={item.descricao}>{item.descricao}</div>
                    </td>
                    <td className="p-4">
                      <div>{item.empresa}</div>
                      <div className="text-xs text-gray-500">{item.convenio}</div>
                      <div className="text-xs text-gray-400 mt-1">Atend: {item.atendimento}</div>
                    </td>
                    <td className="p-4">
                      <div>{item.dataSolicitacao ? new Date(item.dataSolicitacao).toLocaleString('pt-BR') : '-'}</div>
                      <div className="text-xs text-gray-500 mt-1">Tab: {item.tabela}</div>
                      <div className="text-xs text-gray-400">Usr: {item.usuario}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Procedimento Sem Valor" : "Novo Procedimento Sem Valor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Profat">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.profat} onChange={e => setForm({...form, profat: e.target.value})} />
            </FormGroup>
            <FormGroup label="Tabela">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.tabela} onChange={e => setForm({...form, tabela: e.target.value})} />
            </FormGroup>
            <FormGroup label="Empresa">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} />
            </FormGroup>
            <FormGroup label="Convênio">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.convenio} onChange={e => setForm({...form, convenio: e.target.value})} />
            </FormGroup>
            <FormGroup label="Atendimento">
              <input type="text" className="w-full border rounded-lg p-2" value={form.atendimento} onChange={e => setForm({...form, atendimento: e.target.value})} />
            </FormGroup>
            <FormGroup label="Data da Solicitação (Início SLA)">
              <input type="datetime-local" required className="w-full border rounded-lg p-2" value={form.dataSolicitacao} onChange={e => setForm({...form, dataSolicitacao: e.target.value})} />
            </FormGroup>
            <FormGroup label="Status">
              <select className="w-full border rounded-lg p-2" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </FormGroup>
            <FormGroup label="Usuário">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} />
            </FormGroup>
             <FormGroup label="IMG Mat/Med (Placeholder)">
              <div className="border border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center text-sm text-gray-500 bg-gray-50">
                 <input type="file" className="w-full text-sm" />
              </div>
            </FormGroup>
          </div>
          <FormGroup label="Descrição do Procedimento">
            <input type="text" required className="w-full border rounded-lg p-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </FormGroup>
          <FormGroup label="Observação">
            <textarea rows="2" className="w-full border rounded-lg p-2" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}></textarea>
          </FormGroup>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// 3. Procedimento sem TUSS
const SemTussView = ({ user }) => {
  const { data, loading, addItem, updateItem, deleteItem } = useFirestoreData(user, 'procedimentos_sem_tuss');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    profat: '', descricao: '', tabela: '', empresa: '', convenio: '', 
    tabelaXml: '', tuss: '', status: 'Pendente', usuario: '', observacao: '', anvisa: ''
  };
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, form);
    } else {
      addItem(form);
    }
    closeModal();
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Procedimento sem TUSS</h2>
          <p className="text-gray-500 text-sm">Controle de códigos e adequações TUSS</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} /> Nova Entrada
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
              <tr>
                <th className="p-4">Status</th>
                <th className="p-4">Profat / Descrição</th>
                <th className="p-4">Convênio / Tabela</th>
                <th className="p-4">XML / TUSS / Anvisa</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="5" className="p-4 text-center text-gray-400">Carregando...</td></tr> : 
               data.length === 0 ? <tr><td colSpan="5" className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td></tr> :
               data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Badge color={item.status === 'Concluído' ? 'green' : 'gray'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{item.profat}</div>
                    <div className="text-xs text-gray-500 line-clamp-2" title={item.descricao}>{item.descricao}</div>
                  </td>
                  <td className="p-4">
                    <div>{item.convenio}</div>
                    <div className="text-xs text-gray-500 mt-1">Tab: {item.tabela}</div>
                    <div className="text-xs text-gray-400">Empresa: {item.empresa}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs">
                      <span className="font-semibold text-gray-700">XML:</span> {item.tabelaXml || '-'}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="font-semibold text-gray-700">TUSS:</span> {item.tuss || '-'}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="font-semibold text-gray-700">ANVISA:</span> {item.anvisa || '-'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Procedimento Sem TUSS" : "Novo Procedimento Sem TUSS"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Profat">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.profat} onChange={e => setForm({...form, profat: e.target.value})} />
            </FormGroup>
            <FormGroup label="Tabela">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.tabela} onChange={e => setForm({...form, tabela: e.target.value})} />
            </FormGroup>
            <FormGroup label="Empresa">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} />
            </FormGroup>
            <FormGroup label="Convênio">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.convenio} onChange={e => setForm({...form, convenio: e.target.value})} />
            </FormGroup>
            <FormGroup label="Tabela XML">
              <input type="text" className="w-full border rounded-lg p-2" value={form.tabelaXml} onChange={e => setForm({...form, tabelaXml: e.target.value})} />
            </FormGroup>
            <FormGroup label="TUSS">
              <input type="text" className="w-full border rounded-lg p-2" value={form.tuss} onChange={e => setForm({...form, tuss: e.target.value})} />
            </FormGroup>
            <FormGroup label="Status">
              <select className="w-full border rounded-lg p-2" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Pendente">Pendente</option>
                <option value="Concluído">Concluído</option>
              </select>
            </FormGroup>
            <FormGroup label="Usuário">
              <input type="text" required className="w-full border rounded-lg p-2" value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} />
            </FormGroup>
            <FormGroup label="Anvisa">
              <input type="text" className="w-full border rounded-lg p-2" value={form.anvisa} onChange={e => setForm({...form, anvisa: e.target.value})} />
            </FormGroup>
            <FormGroup label="IMG Mat/Med (Placeholder)">
              <div className="border border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center text-sm text-gray-500 bg-gray-50">
                 <input type="file" className="w-full text-sm" />
              </div>
            </FormGroup>
          </div>
          <FormGroup label="Descrição do Procedimento">
            <input type="text" required className="w-full border rounded-lg p-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </FormGroup>
          <FormGroup label="Observações">
            <textarea rows="2" className="w-full border rounded-lg p-2" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}></textarea>
          </FormGroup>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


// --- Main Application Layout ---
export default function App() {
  const [activeTab, setActiveTab] = useState('criticas');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setAuthError("Firebase não configurado no ambiente.");
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Erro de autenticação:", err);
        setAuthError("Falha ao conectar ao banco de dados.");
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: 'criticas', label: 'Gestão de Críticas e Erros', icon: AlertCircle },
    { id: 'sem_valor', label: 'Procedimentos Sem Valor', icon: Clock },
    { id: 'sem_tuss', label: 'Procedimento sem TUSS', icon: FileText },
  ];

  if (authError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-red-600 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
          <p className="text-gray-600">{authError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <LayoutDashboard className="text-indigo-400 mr-3" />
          <h1 className="font-bold text-lg tracking-wide">Faturamento</h1>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center text-xs text-slate-500">
             <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
             Conectado (Sync Ativo)
           </div>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40">
        <div className="flex items-center">
          <LayoutDashboard className="text-indigo-400 mr-2" />
          <h1 className="font-bold">Faturamento</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-16 bg-slate-900 text-white flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
             {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-4 py-4 rounded-lg text-left font-medium ${
                    activeTab === item.id ? 'bg-indigo-600' : 'text-slate-300'
                  }`}
                >
                  <Icon size={20} className="mr-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto">
           {!user ? (
             <div className="h-full flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
             </div>
           ) : (
             <>
               {activeTab === 'criticas' && <CriticasView user={user} />}
               {activeTab === 'sem_valor' && <SemValorView user={user} />}
               {activeTab === 'sem_tuss' && <SemTussView user={user} />}
             </>
           )}
        </div>
      </main>
    </div>
  );
}