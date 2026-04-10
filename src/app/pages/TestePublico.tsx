import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { ThemeProvider, useTheme } from "next-themes";
import { AlertCircle, Clock, CheckCircle2, Search, ArrowRight, Lock, Calendar } from "lucide-react";

const SUPABASE_URL = "https://wytbbtlxrhkvqvlwjivc.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dGJidGx4cmhrdnF2bHdqaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYwMTIsImV4cCI6MjA4ODM5MjAxMn0.7iFjBVva_7nsNlvmfZ_8ddQuTmvCrCx9NTP1sKRzRB0";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/teste-publico${path}`, {
    ...options,
    headers: {
      "apikey": ANON_KEY,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

function getAjustePontuacaoLabel(tentativa: number): { texto: string; cor: string } | null {
  if (tentativa === 2) return { texto: "2ª tentativa: será subtraído 1 ponto da nota integral", cor: "amber" };
  if (tentativa >= 3) return { texto: "3ª tentativa+: serão subtraídos 3 pontos da nota integral", cor: "red" };
  return null;
}

function TestePublicoContent() {
  const { id_teste } = useParams<{ id_teste: string }>();
  const { setTheme } = useTheme();
  const isExtraParam = new URLSearchParams(window.location.search).get("extra") === "true";

  const [teste, setTeste] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cpf, setCpf] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [alunoValidado, setAlunoValidado] = useState<any>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);

  const [tentativasInfo, setTentativasInfo] = useState<any>(null);

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [perguntasShuffled, setPerguntasShuffled] = useState<any[]>([]);

  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const shufflePerguntas = (perguntasRaw: any[]) => {
    if (!perguntasRaw) return [];
    return perguntasRaw.map((p: any) => ({
      ...p,
      alternativas: shuffleArray(p.alternativas || [])
    }));
  };

  useEffect(() => {
    setTheme("light");
    if (!id_teste) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`?id_teste=${id_teste}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar teste");
        setTeste(data);
        
        if (data.perguntas) {
          setPerguntasShuffled(shufflePerguntas(data.perguntas));
        }
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id_teste, setTheme]);

  const handleValidarCPF = async () => {
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length < 11) {
      setCpfError("Digite um CPF válido com 11 dígitos.");
      return;
    }
    setIsValidating(true);
    setCpfError(null);
    try {
      const res = await apiFetch(`?action=validar-cpf`, {
        method: "POST",
        body: JSON.stringify({ cpf: cpfLimpo, id_teste, extra: isExtraParam }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpfError(data.error || "CPF não encontrado.");
        setAlunoValidado(null);
        setTentativasInfo(null);
      } else {
        setAlunoValidado(data.aluno);
        setTentativasInfo(data);
        setCpfError(null);
      }
    } catch {
      setCpfError("Erro de conexão. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectAlternativa = (id_pergunta: string, id_alternativa: string) => {
    setRespostas(prev => ({ ...prev, [id_pergunta]: id_alternativa }));
  };

  const perguntas = perguntasShuffled || [];
  const todasRespondidas = perguntas.length > 0 && perguntas.every((p: any) => respostas[p.id_pergunta]);
  
  const podeEnviar = alunoValidado && todasRespondidas;

  const handleEnviar = async () => {
    if (!podeEnviar) return;
    setIsSubmitting(true);
    try {
      const respostasArray = Object.entries(respostas).map(([id_pergunta, id_alternativa_selecionada]) => ({
        id_pergunta, id_alternativa_selecionada,
      }));
      const res = await apiFetch(`?action=enviar`, {
        method: "POST",
        body: JSON.stringify({
          id_teste, 
          id_aluno: alunoValidado.id_aluno, 
          respostas: respostasArray,
          extra: isExtraParam 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar");
      setResultado(data);
    } catch (err: any) {
      alert(err.message || "Erro ao enviar formulário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNovaTentativa = () => {
    setRespostas({});
    setResultado(null);
    setAlunoValidado(null);
    setTentativasInfo(null);
    if (teste?.perguntas) {
      setPerguntasShuffled(shufflePerguntas(teste.perguntas));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse">Carregando teste...</p>
        </div>
      </div>
    );
  }

  if (loadError || !teste) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Teste não encontrado</h2>
          <p className="text-slate-500 text-sm">{loadError || "O link pode estar incorreto ou o teste foi removido."}</p>
        </div>
      </div>
    );
  }

  const nomeModulo = teste.modulo
    ? `Módulo ${toRoman(teste.modulo.ordem || 1)}${teste.modulo.nome ? ` — ${teste.modulo.nome}` : ""}`
    : "";
  const nomeTreinamento = teste.modulo?.treinamento?.nome || "";

  const isInactive = teste.ativo === false;
  const isExpired = teste.data_fechamento && new Date() > new Date(teste.data_fechamento);
  const isNotOpenYet = teste.nao_aberto;
  const showExpirationLock = (isInactive || isExpired) && !isExtraParam;

  if (showExpirationLock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans antialiased text-slate-900 transition-colors duration-500">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 text-center space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 group-hover:h-2 transition-all duration-300" />
          
          <div className="relative">
            <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-500 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Clock className="w-12 h-12" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Acesso Expirado</h1>
            <p className="text-slate-500 text-base leading-relaxed">
              {isInactive ? (teste.motivo_inatividade || "Este teste foi temporariamente desativado pelo administrador.") : "O prazo limite para a realização desta atividade já se encerrou."}
            </p>
          </div>

          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100 text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Aviso Importante</span>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Caso você possua uma permissão de <strong>Teste Extra</strong> concedida pelo seu instrutor, utilize o link especial que foi enviado diretamente para você. Links convencionais não permitem o acesso após o prazo.
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isExtraParam && isNotOpenYet) {
    const dataAbertura = teste.data_abertura ? new Date(teste.data_abertura) : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans antialiased text-slate-900 transition-colors duration-500">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 text-center space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 group-hover:h-2 transition-all duration-300" />
          
          <div className="relative">
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-blue-500 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Calendar className="w-12 h-12" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Teste em Breve</h1>
            <p className="text-slate-500 text-base leading-relaxed">
              Esta atividade ainda não está disponível para realização.
            </p>
          </div>

          {dataAbertura && (
            <div className="p-6 bg-blue-50/80 rounded-2xl border border-blue-100 text-center space-y-1">
              <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Abertura prevista</p>
              <p className="text-sm font-semibold text-blue-700">
                {dataAbertura.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' às '}
                {dataAbertura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            Verificar novamente
          </button>
        </div>
      </div>
    );
  }

  if (resultado) {
    const isAprovado = resultado.aprovado;
    const percentual = Math.round((resultado.nota_obtida / resultado.nota_maxima) * 100);

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans antialiased text-slate-900">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 text-center space-y-8 relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${
            isAprovado ? "from-emerald-400 via-teal-500 to-emerald-400" : "from-amber-400 via-orange-500 to-amber-400"
          }`} />
          
          <div className="relative">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto transform rotate-3 transition-transform duration-500 hover:rotate-0 ${
              isAprovado ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"
            }`}>
              {isAprovado ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isAprovado ? "Excelente Trabalho!" : "Resultado do Teste"}
            </h1>
            <p className="text-slate-500 text-base leading-relaxed">
              {isAprovado 
                ? "Você atingiu a pontuação necessária para aprovação neste módulo." 
                : "Sua pontuação ficou abaixo do mínimo exigido. Revise o conteúdo e tente novamente."}
            </p>
          </div>

          {resultado.ajuste_pontuacao > 0 && (
            <div className="flex items-start gap-3 bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 text-left text-amber-700 text-[13px] leading-relaxed">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Ajuste de Pontuação: −{resultado.ajuste_pontuacao} ponto(s)</p>
                <p className="opacity-80">
                  Nota integral: {resultado.nota_integral} → Nota final: {resultado.nota_obtida}
                  {resultado.is_teste_extra && " (Teste Extra)"}
                </p>
              </div>
            </div>
          )}

          <div className="relative py-4">
             <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Nota Final</p>
                   <div className={`text-4xl font-black ${isAprovado ? "text-emerald-600" : "text-amber-600"}`}>
                      {resultado.nota_obtida}
                      <span className="text-sm font-medium text-slate-300 ml-1">/{resultado.nota_maxima}</span>
                   </div>
                </div>
                <div className="w-[1px] h-10 bg-slate-100" />
                <div className="text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Aproveitamento</p>
                   <div className={`text-4xl font-black ${isAprovado ? "text-emerald-600" : "text-amber-600"}`}>
                      {percentual}%
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">Tentativa realizada</p>
              <p className="text-lg font-extrabold text-indigo-600">{resultado.tentativas}ª tentativa</p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
          >
            Fazer Nova Tentativa
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const proximaTentativa = tentativasInfo?.proxima_tentativa || 1;
  const ajusteInfo = tentativasInfo ? getAjustePontuacaoLabel(proximaTentativa) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 pb-24">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-100 border border-indigo-200/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 truncate">
                  {teste.titulo || "Teste de Conhecimento"}
                </h1>
                {isExtraParam && (
                  <span className="shrink-0 bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider border border-amber-200">
                    Extra
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                <span className="text-indigo-600 font-bold">{nomeTreinamento}</span>
                {nomeModulo && <><span className="text-slate-300">•</span> {nomeModulo}</>}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* IDENTIFICAÇÃO */}
        <section className="bg-white rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.04)] border border-slate-200/60 p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Search className="w-24 h-24" />
          </div>
          
          <div className="space-y-2 relative">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                 <Lock className="w-4 h-4" />
              </div>
              Identificação do Aluno
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Para acessar as questões, informe seu CPF cadastrado no sistema para validarmos sua matrícula.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCPF(e.target.value));
                  setCpfError(null);
                  if (alunoValidado) { setAlunoValidado(null); setTentativasInfo(null); }
                }}
                disabled={!!alunoValidado}
                maxLength={14}
                className={`w-full h-14 px-5 rounded-2xl border-2 text-base font-bold tracking-widest transition-all outline-none
                  ${cpfError
                    ? "border-red-100 bg-red-50 text-red-600 focus:border-red-300"
                    : alunoValidado
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-slate-50 focus:border-indigo-400 focus:bg-white text-slate-900"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            {!alunoValidado ? (
              <button
                onClick={handleValidarCPF}
                disabled={isValidating || cpf.replace(/\D/g, "").length < 11}
                className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 hover:bg-slate-800"
              >
                {isValidating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Validar CPF"}
              </button>
            ) : (
              <button
                onClick={() => { setAlunoValidado(null); setCpf(""); setRespostas({}); setTentativasInfo(null); }}
                className="h-14 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 font-bold text-sm hover:border-slate-200 hover:text-slate-600 transition-all"
              >
                Alterar
              </button>
            )}
          </div>

          {cpfError && (
            <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50/50 rounded-xl p-4 border border-red-100/50 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="font-medium leading-relaxed">{cpfError}</p>
            </div>
          )}

          {alunoValidado && (
            <div className="flex items-center gap-4 bg-emerald-50/50 rounded-[1.5rem] p-5 border border-emerald-100/50 animate-in fade-in slide-in-from-left-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-100 flex items-center justify-center text-white font-black text-lg">
                {alunoValidado.nome?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 text-base truncate">{alunoValidado.nome}</p>
                <p className="text-[13px] text-slate-500 font-medium truncate opacity-80 uppercase tracking-wide">
                  {alunoValidado.cargo || "Estudante"}{alunoValidado.empresa?.nome ? ` • ${alunoValidado.empresa.nome}` : ""}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          )}

          {alunoValidado && ajusteInfo && (
            <div className={`flex items-start gap-3 text-[13px] rounded-2xl p-4 border ${
              ajusteInfo.cor === "red"
                ? "text-red-700 bg-red-50/30 border-red-100"
                : "text-amber-700 bg-amber-50/30 border-amber-100"
            }`}>
              <Clock className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-black uppercase tracking-wider text-[11px] mb-0.5">{ajusteInfo.texto}</p>
                <p className="font-medium opacity-80">Você está em sua {proximaTentativa}ª tentativa oficial para este teste.</p>
              </div>
            </div>
          )}
        </section>

        {/* QUESTÕES */}
        {alunoValidado && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Questionário</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {perguntas.map((p: any, pIdx: number) => (
              <div 
                key={p.id_pergunta}
                className="bg-white rounded-[2.5rem] p-8 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.02)] border border-slate-200/50 group transition-all hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)]"
              >
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {pIdx + 1}
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-relaxed pt-1.5">
                      {p.enunciado}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {p.alternativas?.map((alt: any) => (
                      <button
                        key={alt.id_alternativa}
                        onClick={() => handleSelectAlternativa(p.id_pergunta, alt.id_alternativa)}
                        className={`flex items-center gap-4 p-5 rounded-2xl text-left transition-all border-2 ${
                          respostas[p.id_pergunta] === alt.id_alternativa
                            ? "bg-indigo-50/30 border-indigo-500 shadow-md shadow-indigo-50"
                            : "bg-slate-50/50 border-transparent hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          respostas[p.id_pergunta] === alt.id_alternativa
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-slate-300"
                        }`}>
                          {respostas[p.id_pergunta] === alt.id_alternativa && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                          )}
                        </div>
                        <span className={`text-base font-bold ${respostas[p.id_pergunta] === alt.id_alternativa ? "text-indigo-900" : "text-slate-600"}`}>
                          {alt.texto}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col items-center gap-6 shadow-2xl shadow-slate-200">
               <div className="text-center space-y-2">
                  <h3 className="text-white text-xl font-black tracking-tight">Pronto para finalizar?</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Certifique-se de que revisou todas as suas respostas. Esta ação não poderá ser desfeita.
                  </p>
               </div>
               
               <button
                  onClick={handleEnviar}
                  disabled={!podeEnviar || isSubmitting}
                  className={`w-full max-w-xs h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                    podeEnviar && !isSubmitting
                      ? "bg-white text-slate-900 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      Enviar Teste Agora
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!todasRespondidas && (
                  <div className="flex items-center gap-2 text-amber-500/80 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Responda todas as questões primeiro
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function TestePublico() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <TestePublicoContent />
    </ThemeProvider>
  );
}
