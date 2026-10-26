
require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber dados em JSON nas requisições.
app.use(express.json());

// Configuração do Supabase usando variáveis de ambiente.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Disponibiliza os arquivos HTML, CSS e JS existentes.
app.use(express.static(__dirname));

// Rota para verificar se o servidor está funcionando.

app.get("/api/status", async (req, res) => {
    const urlSupabase = process.env.SUPABASE_URL || "";

    let projeto = "URL não configurada";

    try {
        projeto = new URL(urlSupabase).hostname;
    } catch {
        // Mantém a mensagem padrão se a URL for inválida.
    }

    const resultado = {
        servidor: "Funcionando",
        supabaseConfigurado: Boolean(supabase),
        projetoSupabase: projeto
    };

    if (supabase) {
        const { error } = await supabase
            .from("viagens")
            .select("id", { count: "exact", head: true });

        resultado.conexaoSupabase = error
            ? "Erro na consulta"
            : "Consulta realizada";
        
        if (error) {
            console.error("Erro ao testar Supabase:", error.message);
            resultado.detalheErro = error.message;
        }
    } else {
        resultado.conexaoSupabase = "Não configurado";
    }

    res.json(resultado);
});


// Rota de teste para consultar as turmas no Supabase.
app.get("/api/turmas", async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            erro: "Supabase ainda não configurado."
        });
    }

    try {
        const { data, error } = await supabase
            .from("turmas")
            .select("*");

        if (error) {
            console.error("Erro do Supabase:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar as turmas."
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Erro inesperado:", error.message);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

app.get("/api/alunos", async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            erro: "Supabase ainda não configurado."
        });
    }

    try {
        const { data, error } = await supabase
            .from("alunos")
            .select("*");

        if (error) {
            console.error("Erro ao consultar alunos:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os alunos."
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Erro inesperado:", error.message);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

app.get("/api/alunos-com-turmas", async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            erro: "Supabase ainda não configurado."
        });
    }

    try {
        const { data, error } = await supabase
            .from("alunos")
            .select(`
                id,
                matricula,
                nome,
                turma_id,
                ativo,
                turma:turmas (
                    nome
                )
            `);

        if (error) {
            console.error("Erro ao consultar alunos e turmas:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os alunos e suas turmas."
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Erro inesperado:", error.message);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

app.get("/api/viagens", async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            erro: "Supabase ainda não configurado."
        });
    }

    try {
        const { data, error } = await supabase
            .from("viagens")
            .select(`
                id,
                nome,
                data_viagem,
                destino,
                descricao,
                situacao,
                criada_em,
                participacoes (
                    id,
                    aluno_id,
                    status,
                    aluno:alunos (
                        id,
                        matricula,
                        nome,
                        turma:turmas (
                            nome
                        )
                    )
                )
            `)
            .order("data_viagem", { ascending: true });

        if (error) {
            console.error("Erro ao consultar viagens:", error);

            return res.status(500).json({
                erro: "Não foi possível consultar as viagens."
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Erro inesperado:", error.message);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

app.post("/api/viagens", async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            erro: "Supabase ainda não configurado."
        });
    }

    const { nome, data, local, descricao, matriculas } = req.body;

    if (
        !nome?.trim() ||
        !data ||
        !local?.trim() ||
        !Array.isArray(matriculas) ||
        matriculas.length === 0
    ) {
        return res.status(400).json({
            erro: "Informe o nome, a data, o destino e pelo menos um participante."
        });
    }

    try {
        const { data: resultado, error } = await supabase.rpc(
            "criar_viagem_com_participantes",
            {
                p_nome: nome.trim(),
                p_data_viagem: data,
                p_destino: local.trim(),
                p_descricao: descricao?.trim() || null,
                p_matriculas: [...new Set(matriculas)]
            }
        );

        if (error) {
            console.error("Erro ao cadastrar viagem:", error);

            return res.status(400).json({
                erro: error.message || "Não foi possível cadastrar a viagem."
            });
        }

        return res.status(201).json({
            mensagem: "Viagem cadastrada com sucesso!",
            viagem: resultado
        });
    } catch (error) {
        console.error("Erro inesperado:", error);

        return res.status(500).json({
            erro: "Erro interno ao cadastrar a viagem."
        });
    }
});

// Inicia o servidor.
app.listen(PORT, () => {
    console.log(`Controle de Viagens disponível em http://localhost:${PORT}`);
});
