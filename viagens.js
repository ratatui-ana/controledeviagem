
/* =========================================================
   GERENCIADOR DE VIAGENS PEDAGÓGICAS
   Arquivo: viagens.js

   Responsabilidades:
   - Armazenar e recuperar viagens.
   - Manter os participantes de cada viagem.
   - Controlar a situação de cada viagem.
   - Registrar embarques e desembarques.
   - Preservar o histórico dos participantes.
   - Compartilhar a viagem ativa entre as páginas.
   ========================================================= */


/* =========================================================
   1. CONFIGURAÇÕES E CHAVES DE ARMAZENAMENTO
   ========================================================= */

const CHAVE_VIAGENS = "controleViagem_viagens";
const CHAVE_ATIVA = "controleViagem_viagemAtiva";

const SITUACOES_VIAGEM = [
    "proxima",
    "andamento",
    "realizada"
];


/* =========================================================
   2. FUNÇÕES AUXILIARES
   ========================================================= */

function gerarIdViagem() {
    return "viagem_" +
        Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);
}


function escaparHTMLViagens(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}


function obterDataLocalISO() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


// Determina uma situação inicial para viagens antigas que ainda
// não possuem o campo "situacao".
//
// Uma viagem com data passada NÃO é marcada automaticamente
// como realizada. Ela fica em andamento até ser finalizada
// explicitamente pelo usuário.
function inferirSituacaoViagem(viagem) {
    if (SITUACOES_VIAGEM.includes(viagem.situacao)) {
        return viagem.situacao;
    }

    if (viagem.data) {
        const dataViagem = new Date(`${viagem.data}T00:00:00`);
        const hoje = new Date(`${obterDataLocalISO()}T00:00:00`);

        if (
            !Number.isNaN(dataViagem.getTime()) &&
            dataViagem < hoje
        ) {
            return "andamento";
        }
    }

    return "proxima";
}


// Normaliza os dados sem descartar informações já armazenadas.
function normalizarViagem(viagem) {
    const participantes = Array.isArray(viagem.participantes)
        ? viagem.participantes
        : [];

    return {
        ...viagem,

        id: viagem.id || gerarIdViagem(),

        nome: String(viagem.nome || "Viagem sem nome"),
        data: String(viagem.data || ""),
        local: String(viagem.local || ""),
        descricao: String(viagem.descricao || ""),

        criadaEm: viagem.criadaEm || new Date().toISOString(),

        situacao: inferirSituacaoViagem(viagem),

        participantes: participantes.map(participante => ({
            ...participante,

            matricula: String(participante.matricula ?? ""),

            status: participante.status || "Pendente",

            ultimoRegistro: participante.ultimoRegistro || null,

            historico: Array.isArray(participante.historico)
                ? participante.historico
                : []
        }))
    };
}


/* =========================================================
   3. CARREGAMENTO E SALVAMENTO
   ========================================================= */

function carregarViagens() {
    try {
        const armazenamento = localStorage.getItem(CHAVE_VIAGENS);
        const dados = armazenamento ? JSON.parse(armazenamento) : null;

        if (Array.isArray(dados) && dados.length > 0) {
            const viagensNormalizadas = dados.map(normalizarViagem);

            // Salva apenas quando a normalização realmente altera
            // os dados, evitando gravações desnecessárias.
            if (
                JSON.stringify(dados) !==
                JSON.stringify(viagensNormalizadas)
            ) {
                salvarViagens(viagensNormalizadas);
            }

            return viagensNormalizadas;
        }
    } catch (erro) {
        console.error("Erro ao carregar viagens:", erro);
    }

    // Primeira utilização: cria a viagem padrão usando os alunos
    // que já existem no arquivo dados.js.
    const alunosCadastrados = Array.isArray(alunos) ? alunos : [];

    const viagemPadrao = normalizarViagem({
        id: gerarIdViagem(),

        nome: "Visita Técnica – UNICAMP",
        data: "2026-08-13",
        local: "UNICAMP",
        descricao: "Viagem pedagógica",

        criadaEm: new Date().toISOString(),

        situacao: "andamento",

        participantes: alunosCadastrados.map(aluno => ({
            matricula: String(aluno.matricula),

            status: aluno.status || "Pendente",

            ultimoRegistro: aluno.ultimoRegistro || null,

            historico: Array.isArray(aluno.historico)
                ? aluno.historico
                : (
                    aluno.ultimoRegistro
                        ? [{
                            tipo: aluno.status || "Embarcado",
                            horario: aluno.ultimoRegistro
                        }]
                        : []
                )
        }))
    });

    salvarViagens([viagemPadrao]);

    localStorage.setItem(CHAVE_ATIVA, viagemPadrao.id);

    return [viagemPadrao];
}


function salvarViagens(lista) {
    localStorage.setItem(
        CHAVE_VIAGENS,
        JSON.stringify(lista)
    );
}


/* =========================================================
   4. VIAGEM ATIVA E SELEÇÃO
   ========================================================= */

function obterViagemAtiva() {
    const lista = carregarViagens();

    if (lista.length === 0) {
        return null;
    }

    const idAtivo = localStorage.getItem(CHAVE_ATIVA);

    let viagem = lista.find(item => item.id === idAtivo);

    if (!viagem) {
        viagem = lista[0];

        localStorage.setItem(CHAVE_ATIVA, viagem.id);
    }

    return viagem;
}


function selecionarViagem(id) {
    const lista = carregarViagens();

    const viagem = lista.find(item => item.id === id);

    if (!viagem) {
        return null;
    }

    localStorage.setItem(CHAVE_ATIVA, viagem.id);

    window.dispatchEvent(
        new CustomEvent("viagemAlterada", {
            detail: viagem
        })
    );

    return viagem;
}


/* =========================================================
   5. CRIAÇÃO DE VIAGENS
   ========================================================= */

function criarViagem(dados) {
    if (!dados || !String(dados.nome || "").trim()) {
        throw new Error("Informe o nome da viagem.");
    }

    const matriculas = Array.isArray(dados.matriculas)
        ? [...new Set(dados.matriculas.map(String))]
        : [];

    if (matriculas.length === 0) {
        throw new Error(
            "Selecione pelo menos um aluno para a viagem."
        );
    }

    const lista = carregarViagens();

    const viagem = normalizarViagem({
        id: gerarIdViagem(),

        nome: String(dados.nome).trim(),

        data: dados.data || "",

        local: String(dados.local || "").trim(),

        descricao: String(dados.descricao || "").trim(),

        criadaEm: new Date().toISOString(),

        situacao: "proxima",

        participantes: matriculas.map(matricula => ({
            matricula,

            status: "Pendente",

            ultimoRegistro: null,

            historico: []
        }))
    });

    lista.push(viagem);

    salvarViagens(lista);

    selecionarViagem(viagem.id);

    return viagem;
}


/* =========================================================
   6. INICIAR E FINALIZAR VIAGENS
   ========================================================= */

// Iniciar uma viagem muda a situação administrativa da atividade.
// Isso não altera automaticamente o status dos alunos.
function iniciarViagem(id) {
    const lista = carregarViagens();

    const viagem = lista.find(item => item.id === id);

    if (!viagem) {
        throw new Error("Viagem não encontrada.");
    }

    if (viagem.situacao === "realizada") {
        throw new Error(
            "Uma viagem realizada não pode ser iniciada novamente."
        );
    }

    if (viagem.situacao === "andamento") {
        return viagem;
    }

    viagem.situacao = "andamento";

    viagem.iniciadaEm = new Date().toISOString();

    salvarViagens(lista);

    selecionarViagem(viagem.id);

    return viagem;
}


// Finalizar a viagem preserva os participantes e seus históricos.
// Desembarcar um aluno, por si só, não finaliza a viagem.
function finalizarViagem(id) {
    const lista = carregarViagens();

    const viagem = lista.find(item => item.id === id);

    if (!viagem) {
        throw new Error("Viagem não encontrada.");
    }

    if (viagem.situacao === "realizada") {
        return viagem;
    }

    if (viagem.situacao !== "andamento") {
        throw new Error(
            "Inicie a viagem antes de finalizá-la."
        );
    }

    viagem.situacao = "realizada";

    viagem.finalizadaEm = new Date().toISOString();

    salvarViagens(lista);

    selecionarViagem(viagem.id);

    return viagem;
}


/* =========================================================
   7. EXCLUSÃO DE VIAGENS
   ========================================================= */

function excluirViagem(id) {
    const lista = carregarViagens();

    if (lista.length <= 1) {
        throw new Error(
            "É necessário manter pelo menos uma viagem cadastrada."
        );
    }

    const viagem = lista.find(item => item.id === id);

    if (!viagem) {
        throw new Error("Viagem não encontrada.");
    }

    // Protege o histórico de viagens concluídas contra exclusão
    // acidental. O histórico continua disponível para consulta.
    if (viagem.situacao === "realizada") {
        throw new Error(
            "Esta viagem já foi realizada e está protegida no histórico."
        );
    }

    const novaLista = lista.filter(item => item.id !== id);

    salvarViagens(novaLista);

    if (localStorage.getItem(CHAVE_ATIVA) === id) {
        localStorage.setItem(CHAVE_ATIVA, novaLista[0].id);
    }

    const viagemAtiva = obterViagemAtiva();

    window.dispatchEvent(
        new CustomEvent("viagemAlterada", {
            detail: viagemAtiva
        })
    );
}


/* =========================================================
   8. PARTICIPANTES E DADOS DOS ALUNOS
   ========================================================= */

function obterParticipante(
    matricula,
    viagem = obterViagemAtiva()
) {
    if (!viagem) {
        return null;
    }

    const codigo = String(matricula).trim();

    return viagem.participantes.find(
        participante =>
            String(participante.matricula) === codigo
    ) || null;
}


function obterAlunoNaViagem(
    matricula,
    viagem = obterViagemAtiva()
) {
    if (!Array.isArray(alunos)) {
        return null;
    }

    const aluno = alunos.find(
        item => String(item.matricula) === String(matricula)
    );

    if (!aluno) {
        return null;
    }

    const participante = obterParticipante(matricula, viagem);

    if (!participante) {
        return null;
    }

    return {
        ...aluno,

        status: participante.status || "Pendente",

        ultimoRegistro: participante.ultimoRegistro || null,

        historico: Array.isArray(participante.historico)
            ? participante.historico
            : []
    };
}


function obterAlunosNaViagem(
    viagem = obterViagemAtiva()
) {
    if (!viagem) {
        return [];
    }

    return viagem.participantes
        .map(participante =>
            obterAlunoNaViagem(participante.matricula, viagem)
        )
        .filter(Boolean);
}


/* =========================================================
   9. PERSISTÊNCIA DE UMA VIAGEM
   ========================================================= */

function persistirViagem(viagem) {
    const lista = carregarViagens();

    const indice = lista.findIndex(
        item => item.id === viagem.id
    );

    if (indice === -1) {
        throw new Error(
            "Não foi possível salvar: viagem não encontrada."
        );
    }

    lista[indice] = viagem;

    salvarViagens(lista);

    return viagem;
}


/* =========================================================
   10. REGISTROS DE EMBARQUE E DESEMBARQUE
   ========================================================= */

function registrarEventoNaViagem(
    matricula,
    status,
    viagem = obterViagemAtiva()
) {
    if (!viagem) {
        throw new Error("Nenhuma viagem selecionada.");
    }

    if (viagem.situacao === "realizada") {
        throw new Error(
            "Não é possível registrar movimentações em uma viagem finalizada."
        );
    }

    const participante = obterParticipante(matricula, viagem);

    if (!participante) {
        return null;
    }

    const agora = new Date();

    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const dataHora = agora.toISOString();

    participante.status = String(status);

    participante.ultimoRegistro = horario;

    if (!Array.isArray(participante.historico)) {
        participante.historico = [];
    }

    participante.historico.push({
        tipo: String(status),
        horario,
        dataHora
    });

    persistirViagem(viagem);

    window.dispatchEvent(
        new CustomEvent("registroViagem", {
            detail: {
                matricula: String(matricula),
                status: String(status),
                horario,
                dataHora,
                viagem
            }
        })
    );

    return participante;
}


/* =========================================================
   11. RESUMO DOS PARTICIPANTES
   ========================================================= */

function obterResumoViagem(
    viagem = obterViagemAtiva()
) {
    const lista = obterAlunosNaViagem(viagem);

    return {
        total: lista.length,

        embarcados: lista.filter(
            aluno => aluno.status === "Embarcado"
        ).length,

        pendentes: lista.filter(
            aluno => aluno.status === "Pendente"
        ).length,

        desembarcados: lista.filter(
            aluno => aluno.status === "Desembarcado"
        ).length
    };
}


/* =========================================================
   12. FORMATAÇÃO DE DATAS
   ========================================================= */

function formatarDataViagem(data) {
    if (!data) {
        return "Data não informada";
    }

    const partes = String(data).split("-");

    if (partes.length !== 3) {
        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* =========================================================
   13. BARRA DE VIAGEM NAS OUTRAS PÁGINAS
   ========================================================= */

function inicializarBarraViagem() {
    // A página inicial tem seu próprio seletor.
    if (document.querySelector(".gestao-viagem")) {
        return;
    }

    if (document.getElementById("barraViagemGlobal")) {
        return;
    }

    const header = document.querySelector("header");

    if (!header) {
        return;
    }

    const barra = document.createElement("section");

    barra.id = "barraViagemGlobal";
    barra.className = "barra-viagem-global";

    barra.innerHTML = `
        <div>
            <span>VIAGEM ATIVA</span>

            <strong id="nomeViagemGlobal"></strong>

            <small id="infoViagemGlobal"></small>
        </div>

        <label>
            <span class="visualmente-oculto">
                Selecionar viagem
            </span>

            <select
                id="seletorViagemGlobal"
                aria-label="Selecionar viagem"
            ></select>
        </label>
    `;

    header.insertAdjacentElement("afterend", barra);

    document
        .getElementById("seletorViagemGlobal")
        .addEventListener("change", evento => {
            selecionarViagem(evento.target.value);
            atualizarBarraViagemGlobal();
        });

    atualizarBarraViagemGlobal();
}


function atualizarBarraViagemGlobal() {
    const barra = document.getElementById("barraViagemGlobal");

    if (!barra) {
        return;
    }

    const viagem = obterViagemAtiva();

    if (!viagem) {
        return;
    }

    document.getElementById("nomeViagemGlobal").textContent =
        viagem.nome;

    document.getElementById("infoViagemGlobal").textContent =
        `${formatarDataViagem(viagem.data)}${
            viagem.local ? " • " + viagem.local : ""
        }`;

    const seletor = document.getElementById("seletorViagemGlobal");

    seletor.innerHTML = carregarViagens().map(item => `
        <option
            value="${escaparHTMLViagens(item.id)}"
            ${item.id === viagem.id ? "selected" : ""}
        >
            ${escaparHTMLViagens(item.nome)}
        </option>
    `).join("");
}


/* =========================================================
   14. INICIALIZAÇÃO
   ========================================================= */

// Inicializa o armazenamento antes de as páginas consultarem
// a viagem ativa.
carregarViagens();

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarBarraViagem
    );
} else {
    inicializarBarraViagem();
}

window.addEventListener(
    "viagemAlterada",
    atualizarBarraViagemGlobal
);
