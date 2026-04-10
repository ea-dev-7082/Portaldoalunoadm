import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseServiceKey) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);


    const { method } = req;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    // --- VIEW: CONFIG removed ---

    // --- VIEW: ATTENDANCE ---
    if (url.searchParams.get("view") === "attendance") {
      const trainingId = url.searchParams.get("trainingId");
      if (method === "GET") {
        if (!trainingId) throw new Error("trainingId required");
        
        // Fetch presence
        const { data: presence, error: pError } = await supabase.from("aluno_frequencia").select("*").eq("id_treinamento", trainingId);
        if (pError) throw pError;
        
        // Fetch grades
        const { data: grades, error: gError } = await supabase.from("aluno_nota_modulo").select("*").eq("id_treinamento", trainingId);
        if (gError) throw gError;
        
        return new Response(JSON.stringify({ presence, grades }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (method === "POST") {
        const { presence, grades } = await req.json();
        
        if (presence && Array.isArray(presence)) {
          const { error: pErr } = await supabase.from("aluno_frequencia").upsert(presence, { onConflict: 'id_aluno,id_aula' });
          if (pErr) throw pErr;
        }
        
        if (grades && Array.isArray(grades)) {
          const { error: gErr } = await supabase.from("aluno_nota_modulo").upsert(grades, { onConflict: 'id_aluno,id_modulo' });
          if (gErr) throw gErr;
        }
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: "Method not allowed for view" }), { status: 405, headers: corsHeaders });
    }

    // --- VIEW: TESTE ---
    if (url.searchParams.get("view") === "teste") {
      const idModulo = url.searchParams.get("id_modulo");
      const idTeste = url.searchParams.get("id_teste");

      if (method === "GET") {
        if (!idModulo && !idTeste) throw new Error("id_modulo or id_teste required");
        
        let query = supabase.from("teste_conhecimento")
          .select(`
            id_teste, id_modulo, titulo, ativo, motivo_inatividade, data_abertura, data_fechamento,
            perguntas:teste_pergunta (
              id_pergunta, enunciado, ordem, valor_nota,
              alternativas:teste_alternativa (id_alternativa, texto, is_correta, ordem)
            )
          `);
        
        if (idModulo) query = query.eq("id_modulo", idModulo);
        if (idTeste) query = query.eq("id_teste", idTeste);

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (method === "POST") {
        const body = await req.json();
        const { id_modulo, titulo, ativo, data_abertura, data_fechamento } = body;
        
        const { data, error } = await supabase.from("teste_conhecimento").upsert({
          id_modulo,
          titulo: titulo || "Teste de Conhecimento",
          ativo: ativo !== undefined ? ativo : true,
          data_abertura: data_abertura || null,
          data_fechamento: data_fechamento || null,
          updated_at: new Date().toISOString()
        }, { onConflict: "id_modulo" }).select().single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (method === "PATCH") {
         const body = await req.json();
         const { id_teste, ativo, motivo_inatividade } = body;
         const { data, error } = await supabase.from("teste_conhecimento")
          .update({ ativo, motivo_inatividade, updated_at: new Date().toISOString() })
          .eq("id_teste", id_teste)
          .select().single();
         if (error) throw error;
         return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- VIEW: PERGUNTA ---
    if (url.searchParams.get("view") === "pergunta") {
      if (method === "POST") {
        const { id_teste, enunciado, ordem, valor_nota, alternativas } = await req.json();
        
        const { data: pergunta, error: pErr } = await supabase.from("teste_pergunta")
          .insert({ id_teste, enunciado, ordem, valor_nota }).select().single();
        if (pErr) throw pErr;

        if (alternativas && Array.isArray(alternativas)) {
          const altInserts = alternativas.map((a: any) => ({
            id_pergunta: pergunta.id_pergunta,
            texto: a.texto,
            is_correta: a.is_correta,
            ordem: a.ordem
          }));
          const { error: aErr } = await supabase.from("teste_alternativa").insert(altInserts);
          if (aErr) throw aErr;
        }

        return new Response(JSON.stringify(pergunta), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (method === "PUT") {
        const { id_pergunta, enunciado, ordem, valor_nota, alternativas } = await req.json();
        
        const { error: pErr } = await supabase.from("teste_pergunta")
          .update({ enunciado, ordem, valor_nota })
          .eq("id_pergunta", id_pergunta);
        if (pErr) throw pErr;

        if (alternativas && Array.isArray(alternativas)) {
          await supabase.from("teste_alternativa").delete().eq("id_pergunta", id_pergunta);
          const altInserts = alternativas.map((a: any) => ({
            id_pergunta,
            texto: a.texto,
            is_correta: a.is_correta,
            ordem: a.ordem
          }));
          await supabase.from("teste_alternativa").insert(altInserts);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (method === "DELETE") {
        const idPergunta = url.searchParams.get("id_pergunta");
        await supabase.from("teste_alternativa").delete().eq("id_pergunta", idPergunta);
        const { error } = await supabase.from("teste_pergunta").delete().eq("id_pergunta", idPergunta);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- VIEW: TESTE-EXTRA ---
    if (url.searchParams.get("view") === "teste-extra") {
      const idTeste = url.searchParams.get("id_teste");
      const idTreinamento = url.searchParams.get("id_treinamento");
      
      if (method === "GET") {
        if (!idTeste || !idTreinamento) throw new Error("id_teste and id_treinamento required");
        
        const { data: students, error: sErr } = await supabase
          .from("aluno_treinamento_progresso")
          .select(`
            id_aluno,
            aluno:aluno (id_aluno, nome, cpf)
          `)
          .eq("id_treinamento", idTreinamento);
        
        if (sErr) throw sErr;

        const { data: permissions, error: pErr } = await supabase
          .from("teste_extra_permissao")
          .select("id_aluno")
          .eq("id_teste", idTeste);
          
        if (pErr) throw pErr;

        const permittedIds = new Set(permissions?.map(p => p.id_aluno) || []);
        
        const result = students
          .filter((s: any) => s.aluno) // Safety check
          .map((s: any) => ({
            id_aluno: s.aluno.id_aluno,
            nome: s.aluno.nome,
            cpf: s.aluno.cpf,
            tem_permissao: permittedIds.has(s.aluno.id_aluno)
          }));

        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (method === "POST") {
        const { id_aluno, conceder } = await req.json();
        if (!idTeste || !id_aluno) throw new Error("id_teste and id_aluno required");

        if (!conceder) {
           const { error } = await supabase.from("teste_extra_permissao").delete().eq("id_teste", idTeste).eq("id_aluno", id_aluno);
           if (error) throw error;
        } else {
           const { error } = await supabase.from("teste_extra_permissao").upsert({ id_teste: idTeste, id_aluno: id_aluno }, { onConflict: "id_teste,id_aluno" });
           if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: "Method not allowed for view" }), { status: 405, headers: corsHeaders });
    }

    // Process body only for POST and PUT
    let body = null;
    if (method === "POST" || method === "PUT") {
      body = await req.json();
    }

    // --- GET LIST OR SINGLE ---
    if (method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('treinamento')
          .select(`
            id_treinamento, nome, slug, categoria, data_inicio, data_fim, status, carga_horaria, nota_minima_modulo, nota_minima_curso, presenca_minima_porcentagem, minutos_tolerancia_atraso,
            modules:modulo (
              *,
              aulas:modulo_aula (*),
              teste:teste_conhecimento (*)
            ),
            companies:empresa_treinamento (
              id_empresa
            ),
            students:aluno_treinamento_progresso (
              *,
              aluno:aluno (
                *,
                empresa:empresa (*)
              )
            )
          `)
          .eq('id_treinamento', id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const { data, error } = await supabase
          .from('treinamento')
          .select(`
            id_treinamento, nome, slug, categoria, data_inicio, data_fim, status, carga_horaria, nota_minima_modulo, nota_minima_curso, presenca_minima_porcentagem, minutos_tolerancia_atraso,
            modules:modulo (
              *,
              aulas:modulo_aula (*),
              teste:teste_conhecimento (*)
            ),
            companies:empresa_treinamento (
              id_empresa
            ),
            students:aluno_treinamento_progresso (
              *,
              aluno:aluno (
                *,
                empresa:empresa (*)
              )
            )
          `)
          .order('data_inicio', { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // --- CREATE TRAINING ---
    if (method === "POST") {
      const { nome, slug, categoria, data_inicio, data_fim, status, modules, companies, students } = body;
      
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

      // Configuration fetching removed - using defaults to stop communication with the table
      const gConfig = {
        nota_minima_modulo: 7,
        nota_minima_curso: 7,
        presenca_minima_porcentagem: 75,
        minutos_tolerancia_atraso: 15
      };

      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .insert({ 
          nome, 
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

      let associationErrors: any[] = [];

      // Association with Companies
      if (companies && Array.isArray(companies) && companies.length > 0) {
        console.log(`Inserting ${companies.length} company associations for training ${trainingId}`);
        const companyInserts = companies.map(compId => ({ id_treinamento: trainingId, id_empresa: compId }));
        const { error: compErr } = await supabase.from("empresa_treinamento").insert(companyInserts);
        if (compErr) {
          console.error("Error inserting company associations:", compErr);
          associationErrors.push({ table: "empresa_treinamento", error: compErr });
        }
      }

      // Association with Students
      if (students && Array.isArray(students)) {
        console.log(`Syncing ${students.length} students for training ${trainingId}`);
        const studentInserts = students
          .filter(sid => sid && typeof sid === 'string' && sid.length > 30) // Sanitize UUIDs
          .map(studentId => ({ id_treinamento: trainingId, id_aluno: studentId }));
        
        if (studentInserts.length > 0) {
          const { error: studErr } = await supabase.from("aluno_treinamento_progresso").insert(studentInserts);
          if (studErr) {
            console.error("Error inserting student associations:", studErr);
            associationErrors.push({ table: "aluno_treinamento_progresso", error: studErr });
          }
        }
      }



      // Modules & Aulas
      if (modules && Array.isArray(modules)) {
        for (const [index, mod] of modules.entries()) {
          const { data: newMod, error: nError } = await supabase.from('modulo').insert({ 
            nome: mod.nome,
            id_treinamento: trainingId,
            ordem: mod.ordem ?? index + 1
          }).select().single();

          if (nError) throw nError;
          if (newMod) {
            if (mod.aulas && Array.isArray(mod.aulas) && mod.aulas.length > 0) {
              const aulaInserts = mod.aulas.map((aula: any, ai: number) => ({
                id_modulo: newMod.id_modulo,
                ordem: ai + 1,
                data_aula: aula.data_aula || null,
                hora_inicio: aula.hora_inicio || null,
                hora_fim: aula.hora_fim || null,
                duracao_minutos: aula.duracao_minutos || 0
              }));
              const { error: aulaErr } = await supabase.from('modulo_aula').insert(aulaInserts);
              if (aulaErr) throw aulaErr;
            } else {
              const { error: aulaErr } = await supabase.from('modulo_aula').insert({
                id_modulo: newMod.id_modulo,
                ordem: 1,
                data_aula: mod.data_aula || null,
                hora_inicio: mod.hora_inicio || null,
                hora_fim: mod.hora_fim || null,
                duracao_minutos: mod.duracao_minutos || 0
              });
              if (aulaErr) throw aulaErr;
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        ...training, 
        associationErrors, 
        receivedData: { students, companies } 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      });
    }

    // --- UPDATE TRAINING ---
    if (method === "PUT") {
      if (!id) throw new Error("ID required");
      const { nome, slug, categoria, data_inicio, data_fim, status, modules, companies, students } = body;

      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .update({ 
          nome, 
          slug, 
          categoria, 
          data_inicio, 
          data_fim, 
          status, 
          carga_horaria: body.carga_horaria || 0,
          presenca_minima_porcentagem: body.presenca_minima_porcentagem,
          minutos_tolerancia_atraso: body.minutos_tolerancia_atraso
        })
        .eq("id_treinamento", id).select().single();

      if (trError) throw trError;

      let associationErrors: any[] = [];
      
      // Sync Companies
      await supabase.from("empresa_treinamento").delete().eq("id_treinamento", id);
      if (companies && Array.isArray(companies) && companies.length > 0) {
        const companyInserts = companies.map(compId => ({ id_treinamento: id, id_empresa: compId }));
        const { error: compErr } = await supabase.from("empresa_treinamento").insert(companyInserts);
        if (compErr) associationErrors.push({ table: "empresa_treinamento", error: compErr });
      }

      // Sync Students (Relationship table according to schema is aluno_treinamento_progresso)
      const { error: delStudErr } = await supabase.from("aluno_treinamento_progresso").delete().eq("id_treinamento", id);
      if (delStudErr) {
        console.error("Error deleting old student associations:", delStudErr);
        associationErrors.push({ table: "aluno_treinamento_progresso_delete", error: delStudErr });
      }
      
      if (students && Array.isArray(students)) {
        console.log(`Syncing ${students.length} students for training ${id}`);
        const studentInserts = students
          .filter(sid => sid && typeof sid === 'string' && sid.length > 30)
          .map(studentId => ({ id_treinamento: id, id_aluno: studentId }));
        
        if (studentInserts.length > 0) {
          const { error: studErr } = await supabase.from("aluno_treinamento_progresso").insert(studentInserts);
          if (studErr) {
            console.error("Error inserting new student associations:", studErr);
            associationErrors.push({ table: "aluno_treinamento_progresso_insert", error: studErr });
          }
        }
      }

      // Sync Modules & Aulas (Non-destructive UPSERT to preserve tests/questions)
      if (modules && Array.isArray(modules)) {
        const incomingModIds = modules.map(m => m.id_modulo).filter(Boolean);
        
        // 1. Delete modules not in the incoming list
        await supabase.from('modulo').delete().eq('id_treinamento', id).not('id_modulo', 'in', `(${incomingModIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);

        for (const [index, mod] of modules.entries()) {
          const modPayload = {
            nome: mod.nome,
            id_treinamento: id,
            ordem: mod.ordem ?? index + 1
          };

          let modId = mod.id_modulo;
          if (modId) {
            await supabase.from('modulo').update(modPayload).eq('id_modulo', modId);
          } else {
            const { data: newMod } = await supabase.from('modulo').insert(modPayload).select().single();
            modId = newMod?.id_modulo;
          }

          if (modId) {
            // Delete and re-insert lessons (cascading is fine here usually)
            await supabase.from('modulo_aula').delete().eq('id_modulo', modId);
            if (mod.aulas && Array.isArray(mod.aulas) && mod.aulas.length > 0) {
              const aulaInserts = mod.aulas.map((aula: any, ai: number) => ({
                id_modulo: modId,
                ordem: ai + 1,
                data_aula: aula.data_aula || null,
                hora_inicio: aula.hora_inicio || null,
                hora_fim: aula.hora_fim || null,
                duracao_minutos: aula.duracao_minutos || 0
              }));
              await supabase.from('modulo_aula').insert(aulaInserts);
            }
          }
        }
      }

      return new Response(JSON.stringify({ ...training, associationErrors }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      });
    }

    // --- DELETE TRAINING ---
    if (method === "DELETE") {
      if (!id) throw new Error("ID required");
      await supabase.from("empresa_treinamento").delete().eq("id_treinamento", id);
      await supabase.from('modulo').delete().eq('id_treinamento', id);
      const { error } = await supabase.from("treinamento").delete().eq("id_treinamento", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
