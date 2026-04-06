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

    if (method === "GET") {
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
      } else {
        query = query.order("nome", { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      const { nome, cpf, data_nascimento, id_empresa, cargo, email, telefone } = await req.json();

      // 1. Create Entity
      const { data: entData, error: entErr } = await supabase
        .from("entidade")
        .insert({ tipo: "aluno" })
        .select()
        .single();
      if (entErr) throw entErr;

      const id_entidade = entData.id_entidade;

      // 2. Create Student
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

      // 3. Create Contact
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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});