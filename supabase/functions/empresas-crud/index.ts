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

      const cnpj = url.searchParams.get("cnpj");
      if (cnpj) {
        try {
          // Standard ReceitaWS lookup
          console.log(`Buscando CNPJ no ReceitaWS: ${cnpj}`);
          const resp = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
          const data = await resp.json();
          
          console.log("Resposta ReceitaWS:", JSON.stringify(data));

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("Erro na consulta CNPJ:", e.message);
          return new Response(JSON.stringify({ error: e.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
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
      
      // Safety check: ensure the record has an id_entidade if the RPC might fail without it
      const { data: currentEmp } = await supabase
        .from("empresa")
        .select("id_entidade")
        .eq("id_empresa", body.id_empresa)
        .single();
        
      if (currentEmp && !currentEmp.id_entidade) {
        // Repair mode: create an entity if missing (common in some seed data)
        const { data: newEnt, error: entErr } = await supabase
          .from("entidade")
          .insert({})
          .select("id_entidade")
          .single();
        
        if (!entErr && newEnt) {
          await supabase
            .from("empresa")
            .update({ id_entidade: newEnt.id_entidade })
            .eq("id_empresa", body.id_empresa);
        }
      }

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
      const id = body.id_empresa;
      console.log(`[DELETE] Alvo: ${id}`);

      try {
        // 1. Get info before deleting
        const { data: emp } = await supabase
          .from("empresa")
          .select("id_entidade, id_matriz, is_matriz")
          .eq("id_empresa", id)
          .single();
        
        const entidadeId = emp?.id_entidade;

        // 2. Clear relations
        console.log(`[DELETE] Limpando relações secundárias para ${id}...`);
        await Promise.all([
          supabase.from("contato_empresa").delete().eq("id_empresa", id),
          supabase.from("empresa_parceria").delete().eq("id_empresa", id),
          supabase.from("empresa_formacao").delete().eq("id_empresa", id),
          supabase.from("aluno").update({ id_empresa: null }).eq("id_empresa", id),
          supabase.from("colaborador").update({ id_empresa: null }).eq("id_empresa", id),
          supabase.from("empresa").update({ id_matriz: null }).eq("id_matriz", id),
        ]);

        // 3. Try RPC
        const { error: rpcErr } = await supabase.rpc("excluir_empresa", { p_id_empresa: id });
        
        // 4. Force Delete if RPC didn't finish it
        if (rpcErr) {
          console.warn(`[DELETE] RPC falhou (${rpcErr.message}), tentando delete direto.`);
          await supabase.from("empresa").delete().eq("id_empresa", id);
        }

        // 5. Cleanup Entidade (Orphans)
        if (entidadeId) {
          console.log(`[DELETE] Limpando entidade ${entidadeId}...`);
          try {
            await supabase.from("entidade_endereco").delete().eq("id_entidade", entidadeId);
            await supabase.from("entidade").delete().eq("id_entidade", entidadeId);
          } catch (e) {
            console.warn("[DELETE] Erro ao limpar entidade/endereco:", e.message);
          }
        }

        console.log(`[DELETE] Sucesso total para ${id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (err: any) {
        console.error(`[DELETE] Falha crítica:`, err);
        return new Response(JSON.stringify({ error: err.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Método não encontrado" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

