import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { method } = req;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const view = url.searchParams.get("view");
    const id_treinamento = url.searchParams.get("id_treinamento");

    if (method === "GET") {
      // --- VIEW: LISTA DE TREINAMENTOS (Para o seletor na página de alunos) ---
      if (view === "treinamentos") {
        const { data, error } = await supabase
          .from("treinamento")
          .select("id_treinamento, nome, status, nota_minima_modulo, nota_minima_curso, presenca_minima_porcentagem")
          .order("nome", { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // --- VIEW: VISUALIZAÇÃO COMPLETA (Matriz de Acompanhamento) ---
      if (view === "completa" && id_treinamento) {
        // 1. Fetch training modules
        const { data: trainingModules, error: tmErr } = await supabase
          .from("treinamento_modulo")
          .select("id_modulo, ordem")
          .eq("id_treinamento", id_treinamento)
          .order("ordem", { ascending: true });
        if (tmErr) throw tmErr;
        
        const modIds = (trainingModules || []).map(tm => tm.id_modulo);
        let formattedMods = [];

        if (modIds.length > 0) {
          const { data: mods, error: mErr } = await supabase
            .from("modulo")
            .select("*")
            .in("id_modulo", modIds);
          if (mErr) throw mErr;

          const { data: allAulas, error: aErr } = await supabase
            .from("modulo_aula")
            .select("*")
            .eq("id_treinamento", id_treinamento);
          if (aErr) throw aErr;

          formattedMods = (trainingModules || []).map(tm => {
            const detail = mods?.find(m => m.id_modulo === tm.id_modulo) || { nome: "Módulo não encontrado" };
            const aulas = (allAulas || []).filter(a => a.id_modulo === tm.id_modulo).sort((a,b) => (a.ordem||0)-(b.ordem||0));
            return { ...detail, ...tm, aulas };
          });
        }

        // 2. Fetch Enrollments & Students
        const { data: enrollments, error: eErr } = await supabase
          .from("aluno_treinamento_progresso")
          .select("id_aluno")
          .eq("id_treinamento", id_treinamento);
        if (eErr) throw eErr;

        const studentIds = (enrollments || []).map(e => e.id_aluno);
        let studentsWithData = [];

        if (studentIds.length > 0) {
          const { data: students, error: sErr } = await supabase
            .from("aluno")
            .select(`
            *,
            empresa(id_empresa, nome),
            entidade(
              id_entidade,
              contato(
                id_contato,
                contato_email(email),
                contato_telefone(numero)
              )
            )
          `)
            .in("id_aluno", studentIds);
          if (sErr) throw sErr;

          // Fetch Presence and Grades
          let presence = [];
          try {
            const { data } = await supabase
              .from("aluno_aula_presenca")
              .select("*")
              .eq("id_treinamento", id_treinamento);
            presence = data || [];
          } catch (e) { console.error("Erro busca presenca:", e); }

          let grades = [];
          try {
            const { data } = await supabase
              .from("aluno_modulo_presenca")
              .select("*")
              .eq("id_treinamento", id_treinamento);
            grades = data || [];
          } catch (e) { console.error("Erro busca notas:", e); }

          studentsWithData = (students || []).map(s => {
            const sPresence = presence.filter(p => p.id_aluno === s.id_aluno);
            const sGrades = grades.filter(g => g.id_aluno === s.id_aluno);
            
            // Extrair email e telefone das tabelas de contato relacionadas
            const emailObj = s.entidade?.contato?.[0]?.contato_email?.[0];
            const phoneObj = s.entidade?.contato?.[0]?.contato_telefone?.[0];

            return {
              ...s,
              empresa: s.empresa?.nome || s.empresa_nome || "Sem Empresa",
              email: emailObj?.email || null,
              telefone: phoneObj?.numero || s.telefone || null,
              presencas: sPresence,
              notas: sGrades
            };
          });
        }

        return new Response(JSON.stringify({
          modulos: formattedMods,
          alunos: studentsWithData
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // --- DEFAULT: LISTA DE ALUNOS GERAL ---
      let query = supabase
        .from("aluno")
        .select(`
          *,
          empresa(id_empresa, nome),
          entidade(
            id_entidade,
            tipo,
            contato(
              id_contato,
              contato_email(id_email, email, tipo),
              contato_telefone(id_telefone, numero, tipo)
            )
          )
        `);
      
      if (id) {
        query = query.eq("id_aluno", id).single();
      } else if (id_treinamento && id_treinamento !== "none") {
        // Obter os IDs dos alunos matriculados no treinamento
        const { data: enrollments, error: enrolErr } = await supabase
          .from("aluno_treinamento_progresso")
          .select("id_aluno")
          .eq("id_treinamento", id_treinamento);
        
        if (enrolErr) throw enrolErr;
        
        const studentIds = enrollments.map(e => e.id_aluno);
        if (studentIds.length === 0) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        query = query.in("id_aluno", studentIds).order("nome", { ascending: true });
      } else {
        query = query.order("nome", { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PATCH") {
      const { registros } = await req.json();
      if (!Array.isArray(registros)) throw new Error("Registros deve ser um array");

      for (const reg of registros) {
        // Se id_aula estiver presente, é registro de frequencia/aula
        if (reg.id_aula) {
          const { error } = await supabase
            .from("aluno_aula_presenca")
            .upsert({
              id_aluno: reg.id_aluno,
              id_treinamento: reg.id_treinamento,
              id_modulo: reg.id_modulo,
              id_aula: reg.id_aula,
              presenca: reg.presenca,
              pontualidade: reg.pontualidade,
              camera_aberta: reg.camera_aberta,
              participacao: reg.participacao,
              justificativa_falta: reg.justificativa_falta
            }, { onConflict: "id_aluno,id_treinamento,id_modulo,id_aula" });
          if (error) console.error("Erro upsert aula:", error);
        } else {
          // Caso contrário, é nota do módulo
          const { error } = await supabase
            .from("aluno_modulo_presenca")
            .upsert({
              id_aluno: reg.id_aluno,
              id_treinamento: reg.id_treinamento,
              id_modulo: reg.id_modulo,
              nota: reg.nota
            }, { onConflict: "id_aluno,id_treinamento,id_modulo" });
          if (error) console.error("Erro upsert modulo:", error);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      const { nome, cpf, data_nascimento, id_empresa, cargo, email, telefone } = await req.json();

      const { data: entData, error: entErr } = await supabase
        .from("entidade")
        .insert({ tipo: "aluno" })
        .select()
        .single();
      if (entErr) throw entErr;

      const id_entidade = entData.id_entidade;

      const { data: aluData, error: aluErr } = await supabase
        .from("aluno")
        .insert({
          id_entidade,
          nome,
          cpf,
          data_nascimento,
          id_empresa,
          cargo
        })
        .select()
        .single();
      if (aluErr) throw aluErr;

      const { data: conData, error: conErr } = await supabase
        .from("contato")
        .insert({ id_entidade })
        .select()
        .single();
      if (conErr) throw conErr;

      const id_contato = conData.id_contato;

      if (email) {
        await supabase.from("contato_email").insert({ id_contato, email, tipo: "pessoal" });
      }
      if (telefone) {
        await supabase.from("contato_telefone").insert({ id_contato, numero: telefone, tipo: "celular" });
      }

      return new Response(JSON.stringify(aluData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    if (method === "PUT") {
      if (!id) throw new Error("ID obrigatório");
      const { nome, cpf, data_nascimento, id_empresa, cargo, email, telefone } = await req.json();

      const { data: aluData, error: aluErr } = await supabase
        .from("aluno")
        .update({ nome, cpf, data_nascimento, id_empresa, cargo })
        .eq("id_aluno", id)
        .select()
        .single();
      if (aluErr) throw aluErr;

      const id_entidade = aluData.id_entidade;
      const { data: conData } = await supabase.from("contato").select("id_contato").eq("id_entidade", id_entidade).single();
      
      let id_contato = conData?.id_contato;
      if (!id_contato) {
        const { data: newCon } = await supabase.from("contato").insert({ id_entidade }).select().single();
        id_contato = newCon.id_contato;
      }

      if (email) {
        await supabase.from("contato_email").delete().eq("id_contato", id_contato);
        await supabase.from("contato_email").insert({ id_contato, email, tipo: "pessoal" });
      }
      if (telefone) {
        await supabase.from("contato_telefone").delete().eq("id_contato", id_contato);
        await supabase.from("contato_telefone").insert({ id_contato, numero: telefone, tipo: "celular" });
      }

      return new Response(JSON.stringify(aluData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      if (!id) throw new Error("ID obrigatório");
      const { data: alu } = await supabase.from("aluno").select("id_entidade").eq("id_aluno", id).single();
      if (alu) {
        const { id_entidade } = alu;
        const { data: contacts } = await supabase.from("contato").select("id_contato").eq("id_entidade", id_entidade);
        if (contacts) {
          for (const c of contacts) {
            await supabase.from("contato_email").delete().eq("id_contato", c.id_contato);
            await supabase.from("contato_telefone").delete().eq("id_contato", c.id_contato);
          }
        }
        await supabase.from("contato").delete().eq("id_entidade", id_entidade);
        await supabase.from("aluno").delete().eq("id_aluno", id);
        await supabase.from("entidade").delete().eq("id_entidade", id_entidade);
      }
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});