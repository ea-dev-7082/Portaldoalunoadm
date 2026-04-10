import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { ThemeProvider } from "next-themes";

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

function TestePublicoContent() {
  const { id_teste } = useParams<{ id_teste: string }>();

  // State
  const [teste, setTeste] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // CPF / Aluno
  const [cpf, setCpf] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [alunoValidado, setAlunoValidado] = useState<any>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Respostas
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  // Envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Fetch teste on mount
  useEffect(() => {
    if (!id_teste) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`?id_teste=${id_teste}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar teste");
        setTeste(data);
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id_teste]);

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
        body: JSON.stringify({ cpf: cpfLimpo, id_teste }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpfError(data.error || "CPF não encontrado.");
        setAlunoValidado(null);
      } else {
        setAlunoValidado(data.aluno);
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

  const perguntas = teste?.perguntas || [];
  const todasRespondidas = perguntas.length > 0 && perguntas.every((p: any) => respostas[p.id_pergunta]);
  const podeEnviar = alunoValidado && todasRespondidas;

  const handleEnviar = async () => {
    if (!podeEnviar) return;
    setIsSubmitting(true);
    try {
      const respostasArray = Object.entries(respostas).map(([id_pergunta, id_alternativa_selecionada]) => ({
        id_pergunta,
        id_alternativa_selecionada,
      }));

      const res = await apiFetch(`?action=enviar`, {
        method: "POST",
        body: JSON.stringify({
          id_teste,
          id_aluno: alunoValidado.id_aluno,
          respostas: respostasArray,
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Computed values
  const nomeModulo = teste?.modulo
    ? `Módulo ${toRoman(teste.modulo.ordem || 1)}${teste.modulo.nome ? ` — ${teste.modulo.nome}` : ""}`
    : "";
  const nomeTreinamento = teste?.modulo?.treinamento?.nome || "";

  // ─── LOADING ──────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 animate-pulse">Carregando teste...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ──────────────────────────────
  if (loadError || !teste) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 dark:from-slate-950 dark:to-red-950">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Teste não encontrado</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{loadError || "O link pode estar incorreto ou o teste foi removido."}</p>
        </div>
      </div>
    );
  }

  // ─── INATIVO ──────────────────────────────
  if (teste.ativo === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-950 dark:to-amber-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Teste Indisponível</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
            {teste.motivo_inatividade || "Este teste foi desativado e não está aceitando respostas no momento."}
          </p>
          <p className="text-xs text-slate-400">Entre em contato com o administrador do treinamento.</p>
        </div>
      </div>
    );
  }

  // ─── NÃO ABERTO AINDA ──────────────────────────────
  if (teste.nao_aberto) {
    const dataAbertura = teste.data_abertura ? new Date(teste.data_abertura) : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Teste Ainda Não Disponível</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Este teste será liberado em breve.
          </p>
          {dataAbertura && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Abertura prevista</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {dataAbertura.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' às '}
                {dataAbertura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTADO OVERLAY ──────────────────────────────
  if (resultado) {
    const percentual = resultado.percentual || 0;
    const isAprovado = percentual >= 70;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border relative overflow-hidden">
          {/* Background decoration */}
          <div className={`absolute inset-0 opacity-5 ${isAprovado ? "bg-emerald-500" : "bg-amber-500"}`} />

          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isAprovado
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          }`}>
            {isAprovado ? (
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
            {isAprovado ? "Parabéns!" : "Teste Concluído"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {alunoValidado?.nome}, aqui está o seu resultado:
          </p>

          {/* Note circle */}
          <div className={`w-32 h-32 mx-auto rounded-full border-4 flex flex-col items-center justify-center mb-6 ${
            isAprovado ? "border-emerald-400 text-emerald-600" : "border-amber-400 text-amber-600"
          }`}>
            <span className="text-3xl font-bold">{resultado.nota_obtida}</span>
            <span className="text-xs opacity-70">de {resultado.nota_maxima}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aproveitamento</p>
              <p className={`text-lg font-bold ${isAprovado ? "text-emerald-600" : "text-amber-600"}`}>
                {percentual}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tentativa</p>
              <p className="text-lg font-bold text-violet-600">{resultado.tentativas}ª</p>
            </div>
          </div>

          <button
            onClick={handleNovaTentativa}
            className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-lg shadow-violet-500/20"
          >
            Fazer Nova Tentativa
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM ──────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                {teste.titulo || "Teste de Conhecimento"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {nomeTreinamento} {nomeModulo && `• ${nomeModulo}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ──── SEÇÃO CPF ──── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Identificação do Aluno
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Digite seu CPF para confirmar sua matrícula neste treinamento.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(formatCPF(e.target.value));
                setCpfError(null);
                if (alunoValidado) { setAlunoValidado(null); }
              }}
              disabled={!!alunoValidado}
              maxLength={14}
              className={`flex-1 h-12 px-4 rounded-xl border-2 text-sm font-mono tracking-wider transition-all outline-none
                ${cpfError
                  ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 focus:border-red-400"
                  : alunoValidado
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-violet-400"
                }
                text-slate-800 dark:text-white
                disabled:opacity-60 disabled:cursor-not-allowed`}
            />
            {!alunoValidado ? (
              <button
                onClick={handleValidarCPF}
                disabled={isValidating || cpf.replace(/\D/g, "").length < 11}
                className="h-12 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold text-sm transition-colors shrink-0 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : "Validar"}
              </button>
            ) : (
              <button
                onClick={() => { setAlunoValidado(null); setCpf(""); setRespostas({}); }}
                className="h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 text-sm transition-colors shrink-0"
              >
                Alterar
              </button>
            )}
          </div>

          {/* Error */}
          {cpfError && (
            <div className="mt-3 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {cpfError}
            </div>
          )}

          {/* Aluno validated card */}
          {alunoValidado && (
            <div className="mt-3 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {alunoValidado.nome?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{alunoValidado.nome}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {alunoValidado.cargo || ""}{alunoValidado.cargo && alunoValidado.empresa ? " • " : ""}{alunoValidado.empresa || ""}
                </p>
              </div>
              <svg className="w-6 h-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          )}
        </section>

        {/* ──── SEÇÃO PERGUNTAS ──── */}
        {perguntas.map((pergunta: any, pIdx: number) => (
          <section
            key={pergunta.id_pergunta}
            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 transition-all ${
              !alunoValidado ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-bold shrink-0">
                {pIdx + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">
                  {pergunta.enunciado}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Valor: {pergunta.valor_nota} ponto(s)
                </p>
              </div>
            </div>

            <div className="space-y-2 ml-11">
              {(pergunta.alternativas || []).map((alt: any, aIdx: number) => {
                const isSelected = respostas[pergunta.id_pergunta] === alt.id_alternativa;
                return (
                  <button
                    key={alt.id_alternativa}
                    type="button"
                    onClick={() => handleSelectAlternativa(pergunta.id_pergunta, alt.id_alternativa)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all
                      ${isSelected
                        ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-600 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "border-violet-500 bg-violet-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`flex-1 ${isSelected ? "text-violet-700 dark:text-violet-300 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                      <span className="font-bold mr-1.5 text-slate-400">{String.fromCharCode(65 + aIdx)})</span>
                      {alt.texto}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* ──── BARRA DE ENVIO ──── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 sticky bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {!alunoValidado ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">⚠ Valide seu CPF para continuar</span>
              ) : !todasRespondidas ? (
                <span>
                  {Object.keys(respostas).length} de {perguntas.length} pergunta(s) respondida(s)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Todas respondidas!</span>
              )}
            </div>
            <button
              onClick={handleEnviar}
              disabled={!podeEnviar || isSubmitting}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-600 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : "Enviar Teste"}
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  );
}

export function TestePublico() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TestePublicoContent />
    </ThemeProvider>
  );
}
