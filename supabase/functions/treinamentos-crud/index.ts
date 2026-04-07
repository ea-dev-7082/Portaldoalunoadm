import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    
    // --- VIEW: CONFIG ---
    if (url.searchParams.get("view") === "config") {
      if (method === "GET") {
        const { data, error } = await supabase.from("configuracoes_gerais").select("*").limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        return new Response(JSON.stringify(data || {}), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (method === "PATCH") {
        const payload = await req.json();
        const { data: existing } = await supabase.from("configuracoes_gerais").select("id").limit(1).single();
        let res;
        if (existing) {
          res = await supabase.from("configuracoes_gerais").update(payload).eq("id", existing.id);
        } else {
          res = await supabase.from("configuracoes_gerais").insert(payload);
        }
        if (res.error) throw res.error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Process body only for POST and PUT
    let body = null;
    if (method === "POST" || method === "PUT") {
      body = await req.json();
    }

    // --- GET LIST OR SINGLE ---
    if (method === "GET") {
      if (id) {
        const { data, error } = await supabase
          .from("treinamento")
          .select(`
            *,
            modules:treinamento_modulo (
              ordem,
              modulo:modulo (
                *,
                aulas:modulo_aula (*)
              )
            ),
            companies:empresa_treinamento (
              id_empresa
            ),
            students:aluno_treinamento_progresso (
              id_aluno
            )
          `)
          .eq("id_treinamento", id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const { data, error } = await supabase
          .from("treinamento")
          .select(`
            *,
            modules:treinamento_modulo (
              ordem,
              modulo:modulo (
                id_modulo, 
                nome, 
                descricao,
                aulas:modulo_aula (*)
              )
            ),
            companies:empresa_treinamento (
              id_empresa
            ),
            students:aluno_treinamento_progresso (
              id_aluno
            )
          `)
          .order("data_inicio", { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- CREATE TRAINING ---
    if (method === "POST") {
      const { nome, descricao, slug, categoria, data_inicio, data_fim, status, modules, companies, students } = body;
      
      if (!nome) {
        return new Response(JSON.stringify({ error: "O nome do treinamento é obrigatório." }), {
          status: 400, headers: corsHeaders
        });
      }

      const trainingSlug = slug || nome.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);

      const { data: gConfig } = await supabase.from("configuracoes_gerais").select("*").limit(1).single();

      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .insert({ 
          nome, 
          descricao, 
          slug: trainingSlug,
          categoria: categoria || "Geral", 
          data_inicio: data_inicio || null, 
          data_fim: data_fim || null, 
          status: status || "Agendado",
          carga_horaria: body.carga_horaria || 0,
          nota_minima_modulo: gConfig?.nota_minima_modulo || 7,
          nota_minima_curso: gConfig?.nota_minima_curso || 7,
          presenca_minima_porcentagem: gConfig?.presenca_minima_porcentagem || 75,
          minutos_tolerancia_atraso: gConfig?.minutos_tolerancia_atraso || 15
        })
        .select()
        .single();

      if (trError) throw trError;
      const trainingId = training.id_treinamento;

      // Association with Companies
      if (companies && Array.isArray(companies)) {
        const companyInserts = companies.map(compId => ({ id_treinamento: trainingId, id_empresa: compId }));
        await supabase.from("empresa_treinamento").insert(companyInserts);
      }

      // Association with Students
      if (students && Array.isArray(students)) {
        const studentInserts = students.map(studentId => ({ id_treinamento: trainingId, id_aluno: studentId }));
        await supabase.from("aluno_treinamento_progresso").insert(studentInserts);
      }

      // Modules & Aulas
      if (modules && Array.isArray(modules)) {
        for (const [index, mod] of modules.entries()) {
          const { data: newMod } = await supabase.from("modulo").insert({ nome: mod.nome, descricao: mod.descricao }).select().single();
          if (newMod) {
            await supabase.from("treinamento_modulo").insert({ id_treinamento: trainingId, id_modulo: newMod.id_modulo, ordem: index });

            if (mod.aulas && Array.isArray(mod.aulas) && mod.aulas.length > 0) {
              const aulaInserts = mod.aulas.map((aula: any, ai: number) => ({
                id_modulo: newMod.id_modulo,
                id_treinamento: trainingId,
                ordem: ai + 1,
                data_aula: aula.data_aula || null,
                hora_inicio: aula.hora_inicio || null,
                hora_fim: aula.hora_fim || null,
                duracao_minutos: aula.duracao_minutos || 0
              }));
              await supabase.from("modulo_aula").insert(aulaInserts);
            } else {
              await supabase.from("modulo_aula").insert({
                id_modulo: newMod.id_modulo,
                id_treinamento: trainingId,
                ordem: 1,
                data_aula: mod.data_aula || null,
                hora_inicio: mod.hora_inicio || null,
                hora_fim: mod.hora_fim || null,
                duracao_minutos: mod.duracao_minutos || 0
              });
            }
          }
        }
      }

      return new Response(JSON.stringify(training), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 });
    }

    // --- UPDATE TRAINING ---
    if (method === "PUT") {
      if (!id) throw new Error("ID required");
      const { nome, descricao, slug, categoria, data_inicio, data_fim, status, modules, companies, students } = body;

      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .update({ nome, descricao, slug, categoria, data_inicio, data_fim, status, carga_horaria: body.carga_horaria || 0 })
        .eq("id_treinamento", id).select().single();

      if (trError) throw trError;

      // Sync Companies
      await supabase.from("empresa_treinamento").delete().eq("id_treinamento", id);
      if (companies && Array.isArray(companies)) {
        const companyInserts = companies.map(compId => ({ id_treinamento: id, id_empresa: compId }));
        await supabase.from("empresa_treinamento").insert(companyInserts);
      }

      // Sync Students (Relationship table according to schema is aluno_treinamento_progresso)
      await supabase.from("aluno_treinamento_progresso").delete().eq("id_treinamento", id);
      if (students && Array.isArray(students)) {
        const studentInserts = students.map(studentId => ({ id_treinamento: id, id_aluno: studentId }));
        await supabase.from("aluno_treinamento_progresso").insert(studentInserts);
      }

      // Sync Modules & Aulas
      // Note: We delete relationships but NOT the module records themselves for now to avoid breaking shared modules
      await supabase.from("treinamento_modulo").delete().eq("id_treinamento", id);
      await supabase.from("modulo_aula").delete().eq("id_treinamento", id);

      if (modules && Array.isArray(modules)) {
        for (const [index, mod] of modules.entries()) {
          let modId = mod.id_modulo;
          if (!modId) {
            const { data: nMod } = await supabase.from("modulo").insert({ nome: mod.nome, descricao: mod.descricao }).select().single();
            modId = nMod?.id_modulo;
          } else {
            await supabase.from("modulo").update({ nome: mod.nome, descricao: mod.descricao }).eq("id_modulo", modId);
          }
          
          if (modId) {
            await supabase.from("treinamento_modulo").insert({ id_treinamento: id, id_modulo: modId, ordem: index });
            
            if (mod.aulas && Array.isArray(mod.aulas) && mod.aulas.length > 0) {
              const aulaInserts = mod.aulas.map((aula: any, ai: number) => ({
                id_modulo: modId,
                id_treinamento: id,
                ordem: ai + 1,
                data_aula: aula.data_aula || null,
                hora_inicio: aula.hora_inicio || null,
                hora_fim: aula.hora_fim || null,
                duracao_minutos: aula.duracao_minutos || 0
              }));
              await supabase.from("modulo_aula").insert(aulaInserts);
            } else {
              await supabase.from("modulo_aula").insert({
                id_modulo: modId,
                id_treinamento: id,
                ordem: 1,
                data_aula: mod.data_aula || null,
                hora_inicio: mod.hora_inicio || null,
                hora_fim: mod.hora_fim || null,
                duracao_minutos: mod.duracao_minutos || 0
              });
            }
          }
        }
      }

      return new Response(JSON.stringify(training), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- DELETE TRAINING ---
    if (method === "DELETE") {
      if (!id) throw new Error("ID required");
      await supabase.from("empresa_treinamento").delete().eq("id_treinamento", id);
      await supabase.from("treinamento_modulo").delete().eq("id_treinamento", id);
      const { error } = await supabase.from("treinamento").delete().eq("id_treinamento", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
