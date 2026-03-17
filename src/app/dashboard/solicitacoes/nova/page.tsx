'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

interface Material {
  id: number;
  nome: string;
  descricao?: string;
  emoji?: string;
}

interface UserProfile {
  nome: string;
  endereco: string | null;
}

type ModoEndereco = 'perfil' | 'novo';

export default function CriarSolicitacaoPage() {
  const [formData, setFormData] = useState({
    titulo: '',
    tipoMaterial: '',
    quantidade: '',
    descricao: ''
  });

  const [imagens, setImagens] = useState<string[]>([]);
  
  const [enderecoNovo, setEnderecoNovo] = useState({
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  });

  const [modoEndereco, setModoEndereco] = useState<ModoEndereco>('perfil');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [step, setStep] = useState(1);
  const [loadingMateriais, setLoadingMateriais] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Carregar materiais e perfil
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const resMateriais = await fetch('/api/materiais');
        const dataMateriais = await resMateriais.json();
        const comEmoji = dataMateriais.map((m: Material) => ({
          ...m,
          emoji: {
            'Borracha / Pneus': '🛞',
            'Eletrônicos (e-lixo)': '📱',
            'Madeira': '🌳',
            'Metal / Alumínio': '🔩',
            'Orgânico': '🌱',
            'Papel / Papelão': '📄',
            'Plástico': '♻️',
            'Têxtil': '👕',
            'Vidro': '🍾',
            'Óleo de Cozinha': '🧴'
          }[m.nome] || '📦'
        }));
        setMateriais(comEmoji);

        const resPerfil = await fetch('/api/users/me');
        const dataPerfil = await resPerfil.json();
        setPerfil(dataPerfil);

        if (!dataPerfil.endereco) {
          setModoEndereco('novo');
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar dados');
      } finally {
        setLoadingMateriais(false);
      }
    };
    carregarDados();
  }, []);

  // Monta endereço novo
  const montarEnderecoNovo = () => {
    const { rua, numero, complemento, bairro, cidade, uf } = enderecoNovo;
    return [
      rua && numero ? `${rua}, ${numero}` : rua,
      complemento,
      bairro,
      cidade && uf ? `${cidade} - ${uf}` : cidade || uf,
    ].filter(Boolean).join(', ');
  };

  // Retorna endereço final
  const getEnderecoFinal = () => {
    if (modoEndereco === 'perfil') return perfil?.endereco ?? '';
    return montarEnderecoNovo();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInputEnderecoNovo = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'uf') {
      finalValue = value.toUpperCase().slice(0, 2);
    }

    setEnderecoNovo({ ...enderecoNovo, [name]: finalValue });
  };

  // ✨ Handler para upload de imagem (Cloudinary)
  const handleImageUpload = (result: any) => {
    if (result.event === 'success') {
      const imageUrl = result.info.secure_url;
      setImagens([...imagens, imageUrl]);
      console.log('Imagem uploaded com sucesso:', imageUrl);
    }
  };

  // Remover imagem
  const removerImagem = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  const getMaterialEmoji = () => {
    const material = materiais.find(m => m.id === parseInt(formData.tipoMaterial));
    return material?.emoji || '📦';
  };

  const getMaterialNome = () => {
    const material = materiais.find(m => m.id === parseInt(formData.tipoMaterial));
    return material?.nome || '';
  };

  const validarStep = (stepNum: number) => {
    setErro('');

    if (stepNum === 1) {
      if (!formData.titulo.trim()) {
        setErro('Título é obrigatório');
        return false;
      }
      if (formData.titulo.length < 3) {
        setErro('Título deve ter no mínimo 3 caracteres');
        return false;
      }
      if (!formData.tipoMaterial) {
        setErro('Tipo de material é obrigatório');
        return false;
      }
    }

    if (stepNum === 2) {
      if (!formData.quantidade) {
        setErro('Quantidade é obrigatória');
        return false;
      }
      if (!formData.descricao.trim()) {
        setErro('Descrição é obrigatória');
        return false;
      }
      if (formData.descricao.length < 10) {
        setErro('Descrição deve ter no mínimo 10 caracteres');
        return false;
      }
    }

    if (stepNum === 3) {
      const enderecoFinal = getEnderecoFinal();
      if (!enderecoFinal.trim()) {
        setErro('Informe um endereço para a coleta');
        return false;
      }
      if (enderecoFinal.trim().length < 5) {
        setErro('O endereço é muito curto. Preencha os dados completos');
        return false;
      }
    }

    return true;
  };

  const handleProxima = () => {
    if (validarStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleVoltar = () => {
    setStep(step - 1);
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarStep(3)) return;

    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const enderecoFinal = getEnderecoFinal();

      const payload = {
        titulo: formData.titulo,
        materialId: parseInt(formData.tipoMaterial),
        quantidade: formData.quantidade,
        descricao: formData.descricao,
        endereco: enderecoFinal,
        imagens: imagens
      };

      console.log('Payload enviado:', payload);

      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSucesso('✓ Solicitação criada com sucesso!');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        let mensagemErro = 'Erro ao criar solicitação';

        if (data.resumo && typeof data.resumo === 'string') {
          mensagemErro = data.resumo;
        } else if (typeof data.error === 'string') {
          mensagemErro = data.error;
        }

        setErro(mensagemErro);
      }
    } catch (err) {
      console.error('Erro ao processar solicitação:', err);
      setErro('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Informações', 'Detalhes', 'Endereço'];
  const stepIcons = ['📝', '📦', '📍'];
  const enderecoNovoPreviw = montarEnderecoNovo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition transform hover:scale-105"
            >
              <span className="text-xl">←</span> Voltar ao Dashboard
            </Link>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-3">
              ♻️ Nova Solicitação
            </h1>
            <p className="text-gray-600 text-lg">Descreva o que precisa ser coletado e conecte com empresas de reciclagem</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between gap-4 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1">
                  <div className={`flex items-center justify-center w-full h-2 rounded-full mb-2 overflow-hidden ${
                    s <= step
                      ? 'bg-gradient-to-r from-green-600 to-blue-600'
                      : 'bg-gray-200'
                  }`} />
                  <div className="flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      s <= step
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg scale-110'
                        : s < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {s < step ? '✓' : stepIcons[s - 1]}
                    </div>
                  </div>
                  <p className={`text-center text-sm font-semibold mt-2 ${
                    s <= step ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {stepTitles[s - 1]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {erro && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <p className="text-red-700 font-semibold flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span>{typeof erro === 'string' ? erro : 'Erro ao processar solicitação'}</span>
              </p>
            </div>
          )}

          {/* Success Message */}
          {sucesso && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-pulse">
              <p className="text-green-700 font-semibold flex items-center gap-2">
                <span className="text-2xl">🎉</span> {sucesso}
              </p>
            </div>
          )}

          {/* Main Card */}
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            
            {/* STEP 1: INFORMAÇÕES */}
            {step === 1 && (
              <div className="p-8 md:p-12 animate-fadeIn">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                    <span className="text-4xl">📝</span> Informações
                  </h2>
                  <p className="text-gray-600">Comece descrevendo sua necessidade de forma clara</p>
                </div>

                <form className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleInputChange}
                        placeholder="Ex: Coleta de Plástico do Condomínio"
                        className="w-full px-4 py-4 text-lg bg-gradient-to-br from-slate-50 to-green-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:shadow-lg focus:from-green-50 transition-all duration-300"
                        maxLength={100}
                      />
                      <span className="absolute right-4 top-4 text-sm text-gray-400">
                        {formData.titulo.length}/100
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Seja conciso e descritivo</p>
                  </div>

                  {/* Tipo de Material */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Tipo de Material <span className="text-red-500">*</span>
                    </label>
                    {loadingMateriais ? (
                      <div className="flex items-center justify-center py-4">
                        <p className="text-gray-600">Carregando materiais...</p>
                      </div>
                    ) : (
                      <select
                        name="tipoMaterial"
                        value={formData.tipoMaterial}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 text-lg bg-gradient-to-br from-slate-50 to-green-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:shadow-lg transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="">Selecionar...</option>
                        {materiais.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.emoji || '📦'} {material.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Dica */}
                  <div className="bg-gradient-to-r from-green-50 to-cyan-50 border-l-4 border-green-500 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>💡 Dica:</strong> Escolha o tipo de material com precisão para melhor matching com empresas de reciclagem.
                    </p>
                  </div>
                </form>

                {/* Botões */}
                <div className="mt-10 flex justify-end gap-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-semibold"
                  >
                    Cancelar
                  </Link>
                  <button
                    onClick={handleProxima}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition font-semibold flex items-center gap-2"
                  >
                    Próximo <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DETALHES */}
            {step === 2 && (
              <div className="p-8 md:p-12 animate-fadeIn">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                    <span className="text-4xl">📦</span> Detalhes da Solicitação
                  </h2>
                  <p className="text-gray-600">Complete as informações sobre quantidade, descrição e imagens</p>
                </div>

                <form className="space-y-6">
                  {/* Quantidade */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="quantidade"
                      value={formData.quantidade}
                      onChange={handleInputChange}
                      placeholder="Ex: 50.5 kg, 10 sacos, etc"
                      className="w-full px-4 py-4 text-lg bg-gradient-to-br from-slate-50 to-green-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:shadow-lg focus:from-green-50 transition-all duration-300"
                    />
                    <p className="mt-2 text-sm text-gray-500">Descreva a quantidade (kg, sacos, etc)</p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Descrição <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      placeholder="Descreva em detalhes: Quanto tem? Onde está? Qual é a urgência? Há restrições de acesso?"
                      rows={6}
                      className="w-full px-4 py-4 text-base bg-gradient-to-br from-slate-50 to-green-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:shadow-lg focus:from-green-50 transition-all duration-300 resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-gray-500">Mínimo 10 caracteres</p>
                      <span className="text-sm text-gray-400">{formData.descricao.length}/500</span>
                    </div>
                  </div>

                  {/* Upload de Imagens com Cloudinary */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Fotos do Material <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>

                    {/* Widget Cloudinary */}
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={handleImageUpload}
                      onEvent={(event) => {
                        if (event === 'queues-start') setUploadingImage(true);
                        if (event === 'queues-end') setUploadingImage(false);
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          disabled={uploadingImage}
                          className="w-full px-4 py-4 border-2 border-dashed border-green-600 rounded-xl hover:bg-green-50 transition text-green-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage ? '📤 Uploadando...' : '📸 Adicionar Fotos'}
                        </button>
                      )}
                    </CldUploadWidget>

                    <p className="mt-2 text-sm text-gray-500">
                      Clique para selecionar fotos do seu computador
                    </p>

                    {/* Preview das imagens */}
                    {imagens.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          {imagens.length} foto(s) adicionada(s)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagens.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removerImagem(idx)}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dica */}
                  <div className="bg-gradient-to-r from-green-50 to-cyan-50 border-l-4 border-green-500 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>💡 Dica:</strong> Fotos nítidas aumentam as chances de sua solicitação ser aceita pelas empresas de reciclagem.
                    </p>
                  </div>
                </form>

                {/* Botões */}
                <div className="mt-10 flex justify-between gap-4">
                  <button
                    onClick={handleVoltar}
                    className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-semibold"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handleProxima}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition font-semibold flex items-center gap-2"
                  >
                    Próximo <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ENDEREÇO */}
            {step === 3 && (
              <div className="p-8 md:p-12 animate-fadeIn">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                    <span className="text-4xl">📍</span> Endereço de Coleta
                  </h2>
                  <p className="text-gray-600">Confirme ou adicione o endereço para coleta do material</p>
                </div>

                {/* Seletor de modo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Opção: usar endereço do perfil */}
                  <button
                    type="button"
                    onClick={() => setModoEndereco('perfil')}
                    disabled={!perfil?.endereco}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      modoEndereco === 'perfil'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    } ${perfil?.endereco ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        modoEndereco === 'perfil'
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300'
                      }`}>
                        {modoEndereco === 'perfil' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          modoEndereco === 'perfil' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          Usar do Perfil
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {perfil?.endereco || 'Sem endereço cadastrado'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Opção: informar novo endereço */}
                  <button
                    type="button"
                    onClick={() => setModoEndereco('novo')}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      modoEndereco === 'novo'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        modoEndereco === 'novo'
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300'
                      }`}>
                        {modoEndereco === 'novo' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          modoEndereco === 'novo' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          Informar Outro
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Preencher um endereço diferente
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Formulário de endereço novo */}
                {modoEndereco === 'novo' && (
                  <form className="space-y-4 mb-8 p-6 bg-gradient-to-br from-slate-50 to-green-50 rounded-xl border border-gray-200">
                    {/* Rua + Número */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          Rua / Avenida
                        </label>
                        <input
                          type="text"
                          name="rua"
                          value={enderecoNovo.rua}
                          onChange={handleInputEnderecoNovo}
                          placeholder="Ex: Rua das Flores"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          Número
                        </label>
                        <input
                          type="text"
                          name="numero"
                          value={enderecoNovo.numero}
                          onChange={handleInputEnderecoNovo}
                          placeholder="123"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Complemento */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Complemento <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        name="complemento"
                        value={enderecoNovo.complemento}
                        onChange={handleInputEnderecoNovo}
                        placeholder="Apto 42, Bloco B..."
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Bairro
                      </label>
                      <input
                        type="text"
                        name="bairro"
                        value={enderecoNovo.bairro}
                        onChange={handleInputEnderecoNovo}
                        placeholder="Ex: Centro"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all"
                      />
                    </div>

                    {/* Cidade + UF */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          Cidade
                        </label>
                        <input
                          type="text"
                          name="cidade"
                          value={enderecoNovo.cidade}
                          onChange={handleInputEnderecoNovo}
                          placeholder="Ex: São Paulo"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          UF
                        </label>
                        <input
                          type="text"
                          name="uf"
                          value={enderecoNovo.uf}
                          onChange={handleInputEnderecoNovo}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {enderecoNovoPreviw && (
                      <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-lg">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                          📍 Prévia do Endereço
                        </p>
                        <p className="text-green-700 font-semibold">
                          {enderecoNovoPreviw}
                        </p>
                      </div>
                    )}
                  </form>
                )}

                {/* Endereço do perfil selecionado */}
                {modoEndereco === 'perfil' && perfil?.endereco && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-cyan-50 border-l-4 border-green-600 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 flex-shrink-0 mt-1">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-700 mb-1">Endereço Selecionado</p>
                        <p className="text-green-600">
                          {perfil.endereco}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview da solicitação */}
                <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-xl border-2 border-green-200 p-6 mb-8">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4">✓ Resumo da Solicitação</p>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Título:</span>
                      <p className="font-semibold text-gray-800">{formData.titulo}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Material:</span>
                      <p className="font-semibold text-gray-800">{getMaterialEmoji()} {getMaterialNome()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Quantidade:</span>
                      <p className="font-semibold text-gray-800">{formData.quantidade}</p>
                    </div>
                    {imagens.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Imagens:</span>
                        <p className="font-semibold text-gray-800">📸 {imagens.length} foto(s)</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600">Endereço:</span>
                      <p className="font-semibold text-gray-800">{getEnderecoFinal()}</p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-8">
                  <p className="text-sm text-blue-800">
                    <strong>✨ Verificou tudo?</strong> Sua solicitação será enviada para empresas de reciclagem que poderão coletar o material.
                  </p>
                </div>

                {/* Botões */}
                <div className="flex justify-between gap-4">
                  <button
                    onClick={handleVoltar}
                    className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-semibold"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⚙️</span> Criando...
                      </>
                    ) : (
                      <>🚀 Criar Solicitação</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}