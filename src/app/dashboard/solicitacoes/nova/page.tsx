'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetError,
  type CloudinaryUploadWidgetInfo,
  type CloudinaryUploadWidgetResults,
} from 'next-cloudinary';

const MAX_IMAGES = 5;

interface Material {
  id: number;
  nome: string;
  emoji?: string;
}

interface UserProfile {
  nome: string;
  endereco: string | null;
}

interface UploadMessage {
  type: 'neutral' | 'success' | 'error';
  text: string;
}

type ModoEndereco = 'perfil' | 'novo';

const materialBadge = (nome: string) => {
  const value = nome.toLowerCase();
  if (value.includes('papel')) return 'PA';
  if (value.includes('plast')) return 'PL';
  if (value.includes('metal') || value.includes('alumin')) return 'MT';
  if (value.includes('vidro')) return 'VD';
  if (value.includes('eletr') || value.includes('e-lixo')) return 'EL';
  if (value.includes('organ')) return 'OR';
  if (value.includes('text')) return 'TX';
  if (value.includes('oleo')) return 'OL';
  if (value.includes('madeira')) return 'MD';
  if (value.includes('borracha') || value.includes('pneu')) return 'BR';
  return 'EC';
};

const widgetErrorText = (error: CloudinaryUploadWidgetError) => {
  if (!error) return 'Nao foi possivel enviar as imagens agora.';
  if (typeof error === 'string') return error;
  return error.statusText || error.status || 'Nao foi possivel enviar as imagens agora.';
};

const secureUrlFromResult = (result: CloudinaryUploadWidgetResults) => {
  if (result.event !== 'success' || !result.info || typeof result.info === 'string') return null;
  const info = result.info as CloudinaryUploadWidgetInfo;
  return typeof info.secure_url === 'string' ? info.secure_url : null;
};

export default function CriarSolicitacaoPage() {
  const [formData, setFormData] = useState({ titulo: '', tipoMaterial: '', quantidade: '', descricao: '' });
  const [imagens, setImagens] = useState<string[]>([]);
  const [enderecoNovo, setEnderecoNovo] = useState({
    rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
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
  const [uploadMessage, setUploadMessage] = useState<UploadMessage | null>(null);

  const remainingSlots = MAX_IMAGES - imagens.length;
  const stepTitles = ['Informacoes', 'Detalhes', 'Endereco'];

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resMateriais, resPerfil] = await Promise.all([fetch('/api/materiais'), fetch('/api/users/me')]);
        const dataMateriais = await resMateriais.json();
        const dataPerfil = await resPerfil.json();

        setMateriais(dataMateriais.map((material: Material) => ({ ...material, emoji: materialBadge(material.nome) })));
        setPerfil(dataPerfil);
        if (!dataPerfil.endereco) setModoEndereco('novo');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar dados');
      } finally {
        setLoadingMateriais(false);
      }
    };

    carregarDados();
  }, []);

  const montarEnderecoNovo = () => {
    const { rua, numero, complemento, bairro, cidade, uf } = enderecoNovo;
    return [rua && numero ? `${rua}, ${numero}` : rua, complemento, bairro, cidade && uf ? `${cidade} - ${uf}` : cidade || uf]
      .filter(Boolean)
      .join(', ');
  };

  const getEnderecoFinal = () => (modoEndereco === 'perfil' ? perfil?.endereco ?? '' : montarEnderecoNovo());
  const enderecoNovoPreview = montarEnderecoNovo();

  const getMaterialSelecionado = () => materiais.find((item) => item.id === Number(formData.tipoMaterial));

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleEnderecoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEnderecoNovo((current) => ({ ...current, [name]: name === 'uf' ? value.toUpperCase().slice(0, 2) : value }));
  };

  const handleImageUpload = (result: CloudinaryUploadWidgetResults) => {
    const imageUrl = secureUrlFromResult(result);
    if (!imageUrl) return;

    setImagens((current) => {
      if (current.includes(imageUrl)) {
        setUploadMessage({ type: 'neutral', text: 'Essa imagem ja foi adicionada.' });
        return current;
      }
      if (current.length >= MAX_IMAGES) {
        setUploadMessage({ type: 'error', text: `Voce pode adicionar no maximo ${MAX_IMAGES} imagens.` });
        return current;
      }
      const next = [...current, imageUrl];
      setUploadMessage({ type: 'success', text: `${next.length} de ${MAX_IMAGES} imagem(ns) pronta(s).` });
      return next;
    });
  };

  const removerImagem = (index: number) => {
    setImagens((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setUploadMessage(null);
  };

  const openUploadWidget = (open: () => void) => {
    if (remainingSlots <= 0) {
      setUploadMessage({ type: 'error', text: 'Limite atingido. Remova uma imagem para adicionar outra.' });
      return;
    }
    if (uploadingImage) {
      setUploadMessage({ type: 'neutral', text: 'Aguarde o upload atual terminar.' });
      return;
    }
    setUploadMessage(null);
    open();
  };

  const validarStep = (targetStep: number) => {
    setErro('');

    if (targetStep === 1) {
      if (!formData.titulo.trim()) return setErro('Titulo e obrigatorio'), false;
      if (formData.titulo.trim().length < 3) return setErro('Titulo deve ter no minimo 3 caracteres'), false;
      if (!formData.tipoMaterial) return setErro('Tipo de material e obrigatorio'), false;
    }

    if (targetStep === 2) {
      if (!formData.quantidade.trim()) return setErro('Quantidade e obrigatoria'), false;
      if (!formData.descricao.trim()) return setErro('Descricao e obrigatoria'), false;
      if (formData.descricao.trim().length < 10) return setErro('Descricao deve ter no minimo 10 caracteres'), false;
      if (uploadingImage) return setErro('Aguarde a finalizacao do upload antes de continuar'), false;
      if (imagens.length > MAX_IMAGES) return setErro(`Voce pode adicionar no maximo ${MAX_IMAGES} imagens`), false;
    }

    if (targetStep === 3) {
      const enderecoFinal = getEnderecoFinal().trim();
      if (!enderecoFinal) return setErro('Informe um endereco para a coleta'), false;
      if (enderecoFinal.length < 5) return setErro('O endereco esta muito curto. Preencha os dados completos'), false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!(validarStep(1) && validarStep(2) && validarStep(3))) return;

    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const payload = {
        titulo: formData.titulo.trim(),
        materialId: Number(formData.tipoMaterial),
        quantidade: formData.quantidade.trim(),
        descricao: formData.descricao.trim(),
        endereco: getEnderecoFinal().trim(),
        imagens,
      };

      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSucesso('Solicitacao criada com sucesso.');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1800);
        return;
      }

      if (typeof data?.resumo === 'string' && data.resumo) return setErro(data.resumo);
      if (typeof data?.error === 'string' && data.error) return setErro(data.error);
      setErro('Erro ao criar solicitacao');
    } catch (err) {
      console.error('Erro ao processar solicitacao:', err);
      setErro('Erro ao processar solicitacao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-green-700 transition hover:text-green-800">
              <span>{'<'}</span><span>Voltar ao Dashboard</span>
            </Link>
            <h1 className="mb-3 bg-gradient-to-r from-green-700 via-emerald-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Nova Solicitacao de Coleta
            </h1>
            <p className="mx-auto max-w-2xl text-gray-600">
              Preencha os dados do material e monte uma galeria com ate 5 imagens antes de enviar.
            </p>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((currentStep) => {
              const active = currentStep === step;
              const done = currentStep < step;
              return (
                <div key={currentStep} className={`rounded-2xl border p-5 ${active ? 'border-green-300 bg-white shadow-xl shadow-green-100' : done ? 'border-emerald-200 bg-emerald-50' : 'border-white/70 bg-white/70'}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold ${active ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {done ? 'OK' : `0${currentStep}`}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Etapa {currentStep}</p>
                      <p className="text-base font-semibold text-slate-800">{stepTitles[currentStep - 1]}</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${currentStep <= step ? 'w-full bg-gradient-to-r from-green-500 to-blue-500' : 'w-0'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {erro && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{erro}</div>}
          {sucesso && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">{sucesso}</div>}

          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-2xl shadow-green-100/60 backdrop-blur-xl">
            {step === 1 && (
              <div className="space-y-8 p-8 md:p-12">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-green-600">Base da solicitacao</p>
                  <h2 className="text-3xl font-bold text-slate-900">Informacoes principais</h2>
                  <p className="mt-2 text-slate-600">Use um titulo claro e escolha o material correto.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Titulo *</label>
                    <div className="relative">
                      <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} maxLength={100} placeholder="Ex: Coleta de plastico do condominio" className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-green-50 px-4 py-4 pr-16 text-lg outline-none transition focus:border-green-600 focus:shadow-lg" />
                      <span className="absolute right-4 top-4 text-sm text-slate-400">{formData.titulo.length}/100</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Tipo de material *</label>
                    {loadingMateriais ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">Carregando materiais...</div>
                    ) : (
                      <select name="tipoMaterial" value={formData.tipoMaterial} onChange={handleInputChange} className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-green-50 px-4 py-4 text-lg outline-none transition focus:border-green-600 focus:shadow-lg">
                        <option value="">Selecionar...</option>
                        {materiais.map((material) => <option key={material.id} value={material.id}>[{material.emoji}] {material.nome}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-cyan-50 p-5 text-sm text-green-900">
                    Um material bem classificado ajuda a empresa certa a encontrar sua solicitacao.
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar</Link>
                  <button type="button" onClick={() => validarStep(1) && setStep(2)} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl">Proximo</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 p-8 md:p-12">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-green-600">Detalhes e imagens</p>
                  <h2 className="text-3xl font-bold text-slate-900">Descricao do material</h2>
                  <p className="mt-2 text-slate-600">Adicione detalhes e monte uma galeria moderna com ate 5 imagens.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Quantidade *</label>
                    <input type="text" name="quantidade" value={formData.quantidade} onChange={handleInputChange} placeholder="Ex: 50 kg, 10 sacos, 3 caixas" className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-green-50 px-4 py-4 text-lg outline-none transition focus:border-green-600 focus:shadow-lg" />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Descricao *</label>
                    <textarea name="descricao" value={formData.descricao} onChange={handleInputChange} rows={6} maxLength={500} placeholder="Explique o volume, o estado do material e qualquer observacao importante para a coleta." className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-green-50 px-4 py-4 outline-none transition focus:border-green-600 focus:shadow-lg" />
                    <div className="mt-2 flex justify-between text-sm text-slate-400"><span>Minimo de 10 caracteres</span><span>{formData.descricao.length}/500</span></div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Fotos do material <span className="font-normal text-slate-400">(opcional)</span></label>
                        <p className="text-sm text-slate-600">Selecione varias imagens de uma vez, veja os previews e remova qualquer foto antes de salvar.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{imagens.length}/{MAX_IMAGES} selecionadas</span>
                        <span className="rounded-full bg-white px-3 py-1 shadow-sm">JPG, PNG, WEBP</span>
                      </div>
                    </div>

                    <div className={`mt-5 rounded-[24px] border-2 border-dashed p-5 md:p-6 ${remainingSlots > 0 ? 'border-emerald-300 bg-white/80' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-green-200">IMG</div>
                          <h3 className="text-lg font-semibold text-slate-900">{remainingSlots > 0 ? `Voce ainda pode adicionar ${remainingSlots} imagem(ns)` : 'Limite maximo atingido'}</h3>
                          <p className="mt-1 text-sm text-slate-600">O upload continua usando Cloudinary e cada imagem fica pronta para preview assim que o envio termina.</p>
                        </div>

                        <CldUploadWidget
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                          onSuccess={handleImageUpload}
                          onError={(uploadError) => { setUploadingImage(false); setUploadMessage({ type: 'error', text: widgetErrorText(uploadError) }); }}
                          onQueuesStart={() => { setUploadingImage(true); setUploadMessage({ type: 'neutral', text: 'Enviando imagens para o Cloudinary...' }); }}
                          onQueuesEnd={() => setUploadingImage(false)}
                          onCloseAction={() => setUploadingImage(false)}
                          options={{
                            multiple: remainingSlots > 1,
                            maxFiles: remainingSlots > 0 ? remainingSlots : 1,
                            sources: ['local', 'camera', 'url'],
                            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                            maxFileSize: 8_000_000,
                            showCompletedButton: false,
                            singleUploadAutoClose: false,
                            showUploadMoreButton: true,
                            showPoweredBy: false,
                            theme: 'minimal',
                            styles: {
                              palette: {
                                window: '#FFFFFF',
                                windowBorder: '#D6EAD6',
                                tabIcon: '#1E7A32',
                                menuIcons: '#5A7860',
                                textDark: '#0F1F12',
                                textLight: '#FFFFFF',
                                link: '#1E7A32',
                                action: '#1E7A32',
                                inactiveTabIcon: '#9AB8A0',
                                error: '#B83228',
                                inProgress: '#1D6FA8',
                                complete: '#1E7A32',
                                sourceBg: '#F8FCF8',
                              },
                            },
                          }}
                        >
                          {({ open }: { open: () => void }) => (
                            <button type="button" onClick={() => openUploadWidget(open)} disabled={uploadingImage} className={`inline-flex min-w-[220px] items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold transition ${remainingSlots > 0 ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg shadow-green-200 hover:-translate-y-0.5 hover:shadow-xl' : 'bg-slate-200 text-slate-500'}`}>
                              {uploadingImage ? 'Enviando imagens...' : remainingSlots > 0 ? 'Adicionar imagens' : 'Limite atingido'}
                            </button>
                          )}
                        </CldUploadWidget>
                      </div>

                      {uploadMessage && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${uploadMessage.type === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : uploadMessage.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>{uploadMessage.text}</div>}
                    </div>

                    {imagens.length > 0 && (
                      <div className="mt-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Previews selecionados</p>
                            <p className="text-sm text-slate-500">Revise as imagens e remova as que nao quiser manter.</p>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{imagens.length} imagem(ns)</span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {imagens.map((url, index) => (
                            <div key={`${url}-${index}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                              <div className="relative">
                                <img src={url} alt={`Preview ${index + 1}`} className="h-56 w-full object-cover" />
                                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">{index === 0 ? 'Principal' : `Imagem ${index + 1}`}</div>
                                <button type="button" onClick={() => removerImagem(index)} aria-label={`Remover imagem ${index + 1}`} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 font-bold text-red-600 shadow-md transition hover:scale-105 hover:bg-red-50">X</button>
                              </div>
                              <div className="p-4 text-sm text-slate-600">Imagem pronta para seguir junto com a solicitacao.</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-cyan-50 p-5 text-sm text-green-900">
                    Fotos nitidas e variadas ajudam na aprovacao e deixam a coleta mais clara para a empresa.
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
                  <button type="button" onClick={() => validarStep(2) && setStep(3)} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl">Proximo</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 p-8 md:p-12">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-green-600">Endereco da coleta</p>
                  <h2 className="text-3xl font-bold text-slate-900">Confirme o local</h2>
                  <p className="mt-2 text-slate-600">Escolha entre o endereco do perfil ou informe outro local.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <button type="button" onClick={() => setModoEndereco('perfil')} disabled={!perfil?.endereco} className={`rounded-2xl border-2 p-5 text-left transition ${modoEndereco === 'perfil' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'} ${perfil?.endereco ? '' : 'cursor-not-allowed opacity-50'}`}>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Usar endereco do perfil</p>
                    <p className="mt-3 font-semibold text-slate-800">{perfil?.endereco || 'Nenhum endereco cadastrado'}</p>
                  </button>
                  <button type="button" onClick={() => setModoEndereco('novo')} className={`rounded-2xl border-2 p-5 text-left transition ${modoEndereco === 'novo' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Informar outro endereco</p>
                    <p className="mt-3 font-semibold text-slate-800">Preencher um local diferente para esta coleta</p>
                  </button>
                </div>

                {modoEndereco === 'novo' && (
                  <div className="space-y-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-green-50 p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="md:col-span-3"><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Rua / Avenida</label><input type="text" name="rua" value={enderecoNovo.rua} onChange={handleEnderecoChange} placeholder="Ex: Rua das Flores" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-600" /></div>
                      <div><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Numero</label><input type="text" name="numero" value={enderecoNovo.numero} onChange={handleEnderecoChange} placeholder="123" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-600" /></div>
                    </div>
                    <div><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Complemento <span className="font-normal text-slate-400">(opcional)</span></label><input type="text" name="complemento" value={enderecoNovo.complemento} onChange={handleEnderecoChange} placeholder="Apto, bloco, referencia..." className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-600" /></div>
                    <div><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Bairro</label><input type="text" name="bairro" value={enderecoNovo.bairro} onChange={handleEnderecoChange} placeholder="Ex: Centro" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-600" /></div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="md:col-span-3"><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Cidade</label><input type="text" name="cidade" value={enderecoNovo.cidade} onChange={handleEnderecoChange} placeholder="Ex: Sao Paulo" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-600" /></div>
                      <div><label className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-slate-700">UF</label><input type="text" name="uf" value={enderecoNovo.uf} onChange={handleEnderecoChange} maxLength={2} placeholder="SP" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 uppercase outline-none transition focus:border-green-600" /></div>
                    </div>
                    {enderecoNovoPreview && <div className="rounded-2xl border border-green-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.24em] text-green-600">Previa do endereco</p><p className="mt-2 text-sm font-semibold text-green-800">{enderecoNovoPreview}</p></div>}
                  </div>
                )}

                {modoEndereco === 'perfil' && perfil?.endereco && <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-cyan-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.24em] text-green-600">Endereco selecionado</p><p className="mt-2 text-sm font-semibold text-green-900">{perfil.endereco}</p></div>}

                <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-green-600">Resumo final</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard label="Titulo" value={formData.titulo} />
                    <SummaryCard label="Material" value={getMaterialSelecionado() ? `[${getMaterialSelecionado()?.emoji}] ${getMaterialSelecionado()?.nome}` : ''} />
                    <SummaryCard label="Quantidade" value={formData.quantidade} />
                    <SummaryCard label="Imagens" value={imagens.length > 0 ? `${imagens.length} imagem(ns) pronta(s)` : 'Nenhuma imagem adicionada'} />
                    <SummaryCard label="Endereco" value={getEnderecoFinal()} full />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
                  Revise tudo antes de criar. A solicitacao sera enviada para analise e depois exibida para empresas parceiras.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
                  <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Criando solicitacao...' : 'Criar solicitacao'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/80 p-4 ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-sm text-slate-500">{label}</span>
      <p className="mt-1 font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}
