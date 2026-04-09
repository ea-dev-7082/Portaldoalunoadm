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
        
        return new Response(JSON.stringify({ presence, grades }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
            id_treinamento, nome, slug, categoria, data_inicio, data_fim, status, carga_horaria, nota_minima_modulo, nota_minima_curso, presenca_minima_porcentagem, minutos_tolerancia_atraso,
            modules:treinamento_modulo (
              ordem,
              data_aula,
              hora_inicio,
              hora_fim,
              duracao_minutos,
              modulo:modulo (
                id_modulo, 
                nome,
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
            id_treinamento, nome, slug, categoria, data_inicio, data_fim, status, carga_horaria, nota_minima_modulo, nota_minima_curso, presenca_minima_porcentagem, minutos_tolerancia_atraso,
            modules:treinamento_modulo (
              ordem,
              data_aula,
              hora_inicio,
              hora_fim,
              duracao_minutos,
              modulo:modulo (
                id_modulo, 
                nome, 
                aulas:modulo_aula (*)
              )
            ),
            companies:empresa_treinamento (
              id_empresa
            ),
            students:aluno_treinamento_progresso (
              id_aluno,
              aluno:aluno (
                id_aluno,
                nome,
                cargo,
                empresa:empresa (
                  id_empresa,
                  nome
                )
              )
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
          const { data: newMod, error: nError } = await supabase.from("modulo").insert({ nome: mod.nome }).select().single();
          if (nError) throw nError;
          if (newMod) {
            const { error: tmErr } = await supabase.from("treinamento_modulo").insert({ 
              id_treinamento: trainingId, 
              id_modulo: newMod.id_modulo, 
              ordem: index,
              data_aula: mod.data_aula || null,
              hora_inicio: mod.hora_inicio || null,
              hora_fim: mod.hora_fim || null,
              duracao_minutos: mod.duracao_minutos || null
            });
            if (tmErr) throw tmErr;

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
              const { error: aulaErr } = await supabase.from("modulo_aula").insert(aulaInserts);
              if (aulaErr) throw aulaErr;
            } else {
              const { error: aulaErr } = await supabase.from("modulo_aula").insert({
                id_modulo: newMod.id_modulo,
                id_treinamento: trainingId,
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
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

      // Sync Modules & Aulas
      // Note: We delete relationships but NOT the module records themselves for now to avoid breaking shared modules
      await supabase.from("treinamento_modulo").delete().eq("id_treinamento", id);
      await supabase.from("modulo_aula").delete().eq("id_treinamento", id);

      if (modules && Array.isArray(modules)) {
        for (const [index, mod] of modules.entries()) {
          let modId = mod.id_modulo;
          if (!modId) {
            const { data: nMod, error: nError } = await supabase.from("modulo").insert({ nome: mod.nome }).select().single();
            if (nError) throw nError;
            modId = nMod?.id_modulo;
          } else {
            const { error: updErr } = await supabase.from("modulo").update({ nome: mod.nome }).eq("id_modulo", modId);
            if (updErr) throw updErr;
          }
          
          if (modId) {
            const { error: tmErr } = await supabase.from("treinamento_modulo").insert({ 
              id_treinamento: id, 
              id_modulo: modId, 
              ordem: index,
              data_aula: mod.data_aula || null,
              hora_inicio: mod.hora_inicio || null,
              hora_fim: mod.hora_fim || null,
              duracao_minutos: mod.duracao_minutos || null
            });
            if (tmErr) throw tmErr;
            
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
              const { error: aulaErr } = await supabase.from("modulo_aula").insert(aulaInserts);
              if (aulaErr) throw aulaErr;
            } else {
              const { error: aulaErr } = await supabase.from("modulo_aula").insert({
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

      return new Response(JSON.stringify({ ...training, associationErrors }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      });
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
