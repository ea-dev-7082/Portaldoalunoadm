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

    if (method === "GET") {
      const isMatriz = url.searchParams.get("matriz") === "true";
      const getColaboradores = url.searchParams.get("colaboradores") === "true";

      if (getColaboradores) {
        const { data, error } = await supabase.from("colaborador").select("id_colaborador, nome, cpf, cargo");
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabase.from("empresa").select(`
        id_empresa, 
        nome, 
        cnpj,
        is_matriz,
        id_matriz,
        id_entidade,
        entidade:id_entidade (
          entidade_endereco (
            endereco (
              id_endereco, cep, logradouro, numero, complemento, bairro, cidade, estado
            )
          )
        )
      `);
      
      if (isMatriz) {
          query = query.eq("is_matriz", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      const flattened = (data || []).map((emp: any) => {
          const addrInfo = emp.entidade?.entidade_endereco?.[0]?.endereco;
          return {
              ...emp,
              endereco: addrInfo || null
          };
      });

      return new Response(JSON.stringify(flattened), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.rpc("criar_nova_empresa", {
          p_nome: body.nome,
          p_cnpj: body.cnpj,
          p_is_matriz: body.is_matriz ?? false,
          p_id_matriz: body.id_matriz || null,
          p_cep: body.cep,
          p_logradouro: body.logradouro,
          p_numero: body.numero,
          p_complemento: body.complemento,
          p_bairro: body.bairro,
          p_cidade: body.cidade,
          p_estado: body.estado,
          p_dono_id: body.dono_id || null,
          p_dono_nome: body.dono_nome || null,
          p_dono_cpf: body.dono_cpf || null,
          p_dono_cargo: body.dono_cargo || null
      });

      if (error) throw error;
      return new Response(JSON.stringify({ id_empresa: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    if (method === "PUT") {
      const body = await req.json();
      const { data, error } = await supabase.rpc("atualizar_empresa", {
          p_id_empresa: body.id_empresa,
          p_nome: body.nome,
          p_cnpj: body.cnpj,
          p_is_matriz: body.is_matriz ?? false,
          p_id_matriz: body.id_matriz || null,
          p_cep: body.cep,
          p_logradouro: body.logradouro,
          p_numero: body.numero,
          p_complemento: body.complemento,
          p_bairro: body.bairro,
          p_cidade: body.cidade,
          p_estado: body.estado
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      const body = await req.json();
      const { error } = await supabase.rpc("excluir_empresa", {
          p_id_empresa: body.id_empresa
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Método não encontrado" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

