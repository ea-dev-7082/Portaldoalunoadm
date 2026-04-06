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
              modulo:modulo (*)
            ),
            companies:empresa_treinamento (
              empresa:id_empresa (*)
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
              modulo:modulo (id_modulo, nome, descricao)
            ),
            companies:empresa_treinamento (
              id_empresa
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
      const { nome, descricao, slug, categoria, data_inicio, data_fim, status, modules, companies } = body;
      
      if (!nome) {
        return new Response(JSON.stringify({ error: "O nome do treinamento é obrigatório." }), {
          status: 400, headers: corsHeaders
        });
      }

      // Generate slug if not provided
      const trainingSlug = slug || nome.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);

      // 1. Insert Training
      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .insert({ 
          nome, 
          descricao, 
          slug: trainingSlug,
          categoria: categoria || "Geral", 
          data_inicio: data_inicio || null, 
          data_fim: data_fim || null, 
          status: status || "Agendado"
        })
        .select()
        .single();

      if (trError) throw trError;

      // Association with Companies
      if (companies && Array.isArray(companies)) {
        const companyInserts = companies.map(compId => ({
          id_treinamento: training.id_treinamento,
          id_empresa: compId
        }));
        await supabase.from("empresa_treinamento").insert(companyInserts);
      }

      // Modules
      if (modules && Array.isArray(modules)) {
        for (const [index, mod] of modules.entries()) {
          const { data: newMod } = await supabase.from("modulo").insert({ 
            nome: mod.nome, 
            descricao: mod.descricao 
          }).select().single();
          
          if (newMod) {
            await supabase.from("treinamento_modulo").insert({
              id_treinamento: training.id_treinamento,
              id_modulo: newMod.id_modulo,
              ordem: mod.ordem ?? index
            });
          }
        }
      }

      return new Response(JSON.stringify(training), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // --- UPDATE TRAINING ---
    if (method === "PUT") {
      if (!id) throw new Error("ID required");
      
      const { nome, descricao, slug, categoria, data_inicio, data_fim, status, modules, companies } = body;

      const { data: training, error: trError } = await supabase
        .from("treinamento")
        .update({ nome, descricao, slug, categoria, data_inicio, data_fim, status })
        .eq("id_treinamento", id)
        .select()
        .single();

      if (trError) throw trError;

      // Sync Companies
      if (companies && Array.isArray(companies)) {
        await supabase.from("empresa_treinamento").delete().eq("id_treinamento", id);
        const companyInserts = companies.map(compId => ({
          id_treinamento: id,
          id_empresa: compId
        }));
        await supabase.from("empresa_treinamento").insert(companyInserts);
      }

      // Sync Modules
      if (modules && Array.isArray(modules)) {
        await supabase.from("treinamento_modulo").delete().eq("id_treinamento", id);
        for (const [index, mod] of modules.entries()) {
          let modId = mod.id_modulo;
          if (!modId) {
            const { data: nMod } = await supabase.from("modulo").insert({ nome: mod.nome, descricao: mod.descricao }).select().single();
            modId = nMod?.id_modulo;
          } else {
             await supabase.from("modulo").update({ nome: mod.nome, descricao: mod.descricao }).eq("id_modulo", modId);
          }
          if (modId) {
            await supabase.from("treinamento_modulo").insert({ id_treinamento: id, id_modulo: modId, ordem: mod.ordem ?? index });
          }
        }
      }

      return new Response(JSON.stringify(training), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
