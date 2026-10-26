
/* =========================================================
   GERENCIADOR DE VIAGENS PEDAGÓGICAS
   Arquivo: index.js

   Responsabilidades:
   - Exibir o painel geral de viagens.
   - Filtrar e pesquisar viagens.
   - Cadastrar novas viagens.
   - Consultar detalhes e histórico dos participantes.
   - Exibir o controle operacional da viagem selecionada.
   ========================================================= */


/* =========================================================
   1. ELEMENTOS DA PÁGINA
   ========================================================= */

const seletorViagem = document.getElementById("seletorViagem");
const novaViagemForm = document.getElementById("novaViagemForm");
const btnNovaViagem = document.getElementById("btnNovaViagem");
const btnExcluirViagem = document.getElementById("btnExcluirViagem");

const painelNovaViagem = document.getElementById("painelNovaViagem");
const painelOperacional = document.getElementById("painelOperacional");

const listaParticipantesNovaViagem =
    document.getElementById("listaParticipantesNovaViagem");

const btnSelecionarTodos =
    document.getElementById("selecionarTodosAlunos");

const btnCancelarNovaViagem =
    document.getElementById("btnCancelarNovaViagem");

const buscaInicio = document.getElementById("buscaInicio");
const listaInicio = document.getElementById("listaInicio");

const buscaViagens = document.getElementById("buscaViagens");
const filtroSituacao = document.getElementById("filtroSituacao");

const listaProximas = document.getElementById("listaProximas");
const listaEmAndamento = document.getElementById("listaEmAndamento");
const listaRealizadas = document.getElementById("listaRealizadas");

const modalDetalhes = document.getElementById("modalDetalhesViagem");
const btnFecharDetalhes = document.getElementById("btnFecharDetalhes");

let controleOperacionalAberto = false;


/* =========================================================
   2. FUNÇÕES AUXILIARES
   ========================================================= */

// Evita que textos cadastrados pelo usuário sejam interpretados
// como HTML ao serem exibidos na página.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}


// Normaliza textos para buscas sem diferenciar maiúsculas,
// minúsculas ou acentos.
function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


// Obtém a situação da viagem.
//
// Por enquanto, viagens antigas que ainda não possuem o campo
// "situacao" são classificadas pela data apenas para exibição.
// A situação persistente será implementada no viagens.js.
function obterSituacaoExibicao(viagem) {
    if (viagem.situacao === "realizada") {
        return "realizada";
    }

    if (
        viagem.situacao === "em-andamento" ||
        viagem.situacao === "andamento"
    ) {
        return "andamento";
    }

    if (viagem.situacao === "proxima") {
        return "proxima";
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (viagem.data) {
        const dataViagem = new Date(`${viagem.data}T00:00:00`);

        if (!Number.isNaN(dataViagem.getTime()) && dataViagem < hoje) {
            return "andamento";
        }
    }

    return "proxima";
}


function nomeSituacao(situacao) {
    const nomes = {
        proxima: "Próxima",
        andamento: "Em andamento",
        realizada: "Realizada"
    };

    return nomes[situacao] || "Não definida";
}


function obterInformacaoData(viagem) {
    const data = formatarDataViagem(viagem.data);
    const local = viagem.local
        ? escaparHTML(viagem.local)
        : "Destino não informado";

    return `${escaparHTML(data)} • ${local}`;
}


function obterQuantidadeParticipantes(viagem) {
    return Array.isArray(viagem.participantes)
        ? viagem.participantes.length
        : 0;
}


/* =========================================================
   3. FORMULÁRIO DE NOVA VIAGEM
   ========================================================= */

function preencherParticipantesNovaViagem() {
    if (!listaParticipantesNovaViagem) return;

    if (!Array.isArray(alunos) || alunos.length === 0) {
        listaParticipantesNovaViagem.innerHTML =
            '<p class="sem-resultados">Nenhum aluno cadastrado.</p>';
        return;
    }

    listaParticipantesNovaViagem.innerHTML = alunos.map(aluno => `
        <label class="participante-item">
            <input
                type="checkbox"
                name="participantesNovaViagem"
                value="${escaparHTML(aluno.matricula)}"
                checked
            >

            <span>
                <strong>${escaparHTML(aluno.nome)}</strong>
                <small>
                    ${escaparHTML(aluno.turma)}
                    • ${escaparHTML(aluno.matricula)}
                </small>
            </span>
        </label>
    `).join("");

    atualizarTextoSelecionarTodos();
}


function atualizarTextoSelecionarTodos() {
    const caixas = [
        ...document.querySelectorAll(
            'input[name="participantesNovaViagem"]'
        )
    ];

    if (!btnSelecionarTodos) return;

    const todosMarcados =
        caixas.length > 0 && caixas.every(caixa => caixa.checked);

    btnSelecionarTodos.textContent = todosMarcados
        ? "Desmarcar todos"
        : "Selecionar todos";
}


function abrirFormularioNovaViagem() {
    painelNovaViagem.classList.add("aberto");

    preencherParticipantesNovaViagem();

    painelNovaViagem.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("novaViagemNome").focus();
}


function fecharFormularioNovaViagem() {
    painelNovaViagem.classList.remove("aberto");
}



async function cadastrarNovaViagem(evento) {
    evento.preventDefault();

    const nome = document
        .getElementById("novaViagemNome")
        .value.trim();

    const data = document
        .getElementById("novaViagemData")
        .value;

    const local = document
        .getElementById("novaViagemLocal")
        .value.trim();

    const descricao = document
        .getElementById("novaViagemDescricao")
        .value.trim();

    const matriculas = [
        ...document.querySelectorAll(
            'input[name="participantesNovaViagem"]:checked'
        )
    ].map(caixa => caixa.value);

    if (!nome) {
        alert("Informe o nome da viagem.");
        return;
    }

    if (!data) {
        alert("Informe a data da viagem.");
        return;
    }

    if (!local) {
        alert("Informe o destino da viagem.");
        return;
    }

    if (matriculas.length === 0) {
        alert("Selecione pelo menos um aluno para a viagem.");
        return;
    }

    const botaoEnviar = novaViagemForm.querySelector(
        'button[type="submit"]'
    );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    try {
        const resposta = await fetch("/api/viagens", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                data,
                local,
                descricao,
                matriculas
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível cadastrar a viagem."
            );
        }

        alert(
            `A viagem "${nome}" foi cadastrada no banco com sucesso!`
        );

        novaViagemForm.reset();
        fecharFormularioNovaViagem();

        // Atualização temporária: as funções atuais ainda leem o localStorage.
        // A integração completa da listagem será feita no próximo passo.
        atualizarPainelGeral();
        atualizarSeletorViagens();
        atualizarControleOperacional();

    } catch (erro) {
        console.error("Erro ao cadastrar viagem:", erro);

        alert(
            "Não foi possível cadastrar a viagem.\n\n" + erro.message
        );
    } finally {
        if (botaoEnviar) {
            botaoEnviar.disabled = false;
        }
    }
}



/* =========================================================
   4. CARTÕES DAS VIAGENS
   ========================================================= */

function criarCartaoViagem(viagem) {
    const situacao = obterSituacaoExibicao(viagem);

    const nome = escaparHTML(viagem.nome);
    const descricao = escaparHTML(
        viagem.descricao || "Sem descrição cadastrada."
    );

    const quantidade = obterQuantidadeParticipantes(viagem);

    let botoes = "";

    if (situacao === "proxima") {
        botoes = `
            <button
                type="button"
                class="btn-cartao btn-abrir-controle"
                data-acao="abrir-controle"
                data-id="${escaparHTML(viagem.id)}"
            >
                Abrir controle
            </button>

            <button
                type="button"
                class="btn-cartao btn-iniciar-viagem"
                data-acao="iniciar-viagem"
                data-id="${escaparHTML(viagem.id)}"
            >
                Iniciar viagem
            </button>
        `;
    } else if (situacao === "andamento") {
        botoes = `
            <button
                type="button"
                class="btn-cartao btn-abrir-controle"
                data-acao="abrir-controle"
                data-id="${escaparHTML(viagem.id)}"
            >
                Continuar controle
            </button>

            <button
                type="button"
                class="btn-cartao btn-finalizar-viagem"
                data-acao="finalizar-viagem"
                data-id="${escaparHTML(viagem.id)}"
            >
                Finalizar viagem
            </button>
        `;
    } else {
        botoes = `
            <button
                type="button"
                class="btn-cartao btn-detalhes-viagem"
                data-acao="detalhes"
                data-id="${escaparHTML(viagem.id)}"
            >
                Consultar detalhes
            </button>
        `;
    }

    return `
        <article class="cartao-viagem">

            <div class="cartao-viagem-topo">
                <span class="situacao-viagem situacao-${situacao}">
                    ${nomeSituacao(situacao)}
                </span>

                <span class="quantidade-participantes">
                    👥 ${quantidade} aluno(s)
                </span>
            </div>

            <h3>${nome}</h3>

            <p class="cartao-data">
                🗓️ ${obterInformacaoData(viagem)}
            </p>

            <p class="cartao-descricao">
                ${descricao}
            </p>

            <div class="cartao-acoes">
                ${botoes}
            </div>

        </article>
    `;
}


/* =========================================================
   5. PAINEL GERAL E FILTROS
   ========================================================= */

function atualizarPainelGeral() {
    const viagens = carregarViagens();

    const busca = normalizarTexto(buscaViagens?.value || "");
    const filtro = filtroSituacao?.value || "todas";

    const grupos = {
        proxima: [],
        andamento: [],
        realizada: []
    };

    viagens.forEach(viagem => {
        const situacao = obterSituacaoExibicao(viagem);

        const textoBusca = normalizarTexto([
            viagem.nome,
            viagem.local,
            viagem.descricao
        ].join(" "));

        const correspondeBusca = textoBusca.includes(busca);
        const correspondeFiltro =
            filtro === "todas" || filtro === situacao;

        if (correspondeBusca && correspondeFiltro) {
            grupos[situacao].push(viagem);
        }
    });

    // Ordena próximas viagens pela data mais próxima.
    grupos.proxima.sort((a, b) => {
        return (a.data || "9999-12-31")
            .localeCompare(b.data || "9999-12-31");
    });

    // Ordena viagens em andamento pela data mais recente.
    grupos.andamento.sort((a, b) => {
        return (b.data || "").localeCompare(a.data || "");
    });

    // Ordena o histórico pelas datas mais recentes.
    grupos.realizada.sort((a, b) => {
        return (b.data || "").localeCompare(a.data || "");
    });

    document.getElementById("resumoProximas").textContent =
        viagens.filter(v => obterSituacaoExibicao(v) === "proxima").length;

    document.getElementById("resumoAndamento").textContent =
        viagens.filter(v => obterSituacaoExibicao(v) === "andamento").length;

    document.getElementById("resumoRealizadas").textContent =
        viagens.filter(v => obterSituacaoExibicao(v) === "realizada").length;

    document.getElementById("resumoTotalViagens").textContent =
        viagens.length;

    renderizarGrupoViagens(
        listaProximas,
        grupos.proxima,
        "Nenhuma próxima viagem encontrada."
    );

    renderizarGrupoViagens(
        listaEmAndamento,
        grupos.andamento,
        "Nenhuma viagem em andamento encontrada."
    );

    renderizarGrupoViagens(
        listaRealizadas,
        grupos.realizada,
        "Nenhuma viagem realizada encontrada."
    );
}


function renderizarGrupoViagens(elemento, viagens, mensagemVazia) {
    if (!elemento) return;

    if (viagens.length === 0) {
        elemento.innerHTML = `
            <p class="sem-resultados">
                ${escaparHTML(mensagemVazia)}
            </p>
        `;
        return;
    }

    elemento.innerHTML = viagens
        .map(criarCartaoViagem)
        .join("");
}


/* =========================================================
   6. SELETOR DA VIAGEM NO CONTROLE OPERACIONAL
   ========================================================= */

function atualizarSeletorViagens() {
    const viagens = carregarViagens();
    const ativa = obterViagemAtiva();

    seletorViagem.innerHTML = viagens.map(viagem => `
        <option
            value="${escaparHTML(viagem.id)}"
            ${viagem.id === ativa.id ? "selected" : ""}
        >
            ${escaparHTML(viagem.nome)}
        </option>
    `).join("");

    document.getElementById("nomeViagemAtiva").textContent =
        ativa.nome;

    document.getElementById("infoViagemAtiva").textContent =
        `${formatarDataViagem(ativa.data)}${
            ativa.local ? " • " + ativa.local : ""
        }`;
}


/* =========================================================
   7. CONTROLE OPERACIONAL DOS ALUNOS
   ========================================================= */

function atualizarControleOperacional() {
    const viagem = obterViagemAtiva();

    if (!viagem) return;

    const resumo = obterResumoViagem(viagem);

    document.getElementById("totalAlunos").textContent =
        resumo.total;

    document.getElementById("totalEmbarcados").textContent =
        resumo.embarcados;

    document.getElementById("totalPendentes").textContent =
        resumo.pendentes;

    document.getElementById("totalDesembarcados").textContent =
        resumo.desembarcados;

    const busca = normalizarTexto(buscaInicio.value);

    const participantes = obterAlunosNaViagem(viagem).filter(aluno => {
        const nome = normalizarTexto(aluno.nome);
        const matricula = String(aluno.matricula);

        return nome.includes(busca) || matricula.includes(busca);
    });

    if (participantes.length === 0) {
        listaInicio.innerHTML = `
            <p class="sem-resultados">
                Nenhum aluno encontrado nesta viagem.
            </p>
        `;
        return;
    }

    listaInicio.innerHTML = participantes.map(aluno => {
        const iniciais = escaparHTML(
            aluno.nome
                .split(/\s+/)
                .filter(Boolean)
                .map(parte => parte[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
        );

        const status = escaparHTML(aluno.status || "Pendente");

        const classe = normalizarTexto(status)
            .replace(/\s+/g, "-");

        return `
            <div class="aluno">

                <div class="aluno-info">
                    <div class="avatar">${iniciais}</div>

                    <div>
                        <div class="nome">
                            ${escaparHTML(aluno.nome)}
                        </div>

                        <div class="turma">
                            ${escaparHTML(aluno.turma)}
                            • Matrícula: ${escaparHTML(aluno.matricula)}
                        </div>
                    </div>
                </div>

                <span class="status status-${classe}">
                    ${status === "Embarcado" ? "✓ " : ""}${status}
                </span>

            </div>
        `;
    }).join("");
}


function abrirControleOperacional(id) {
    const viagem = carregarViagens().find(item => item.id === id);

    if (!viagem) {
        alert("Não foi possível localizar essa viagem.");
        return;
    }

    selecionarViagem(id);

    controleOperacionalAberto = true;

    painelOperacional.classList.add("aberto");

    atualizarSeletorViagens();
    atualizarControleOperacional();

    painelOperacional.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   8. DETALHES E HISTÓRICO DA VIAGEM
   ========================================================= */

function formatarDataHora(registro) {
    if (registro.dataHora) {
        const data = new Date(registro.dataHora);

        if (!Number.isNaN(data.getTime())) {
            return data.toLocaleString("pt-BR");
        }
    }

    return registro.horario || "Horário não registrado";
}


function abrirDetalhesViagem(id) {
    const viagem = carregarViagens().find(item => item.id === id);

    if (!viagem) {
        alert("Não foi possível localizar essa viagem.");
        return;
    }

    document.getElementById("detalhesNomeViagem").textContent =
        viagem.nome;

    const participantes = obterAlunosNaViagem(viagem);

    const participantesHTML = participantes.length
        ? participantes.map(aluno => {
            const historico = Array.isArray(aluno.historico)
                ? aluno.historico
                : [];

            const registrosHTML = historico.length
                ? `
                    <ul class="historico-participante">
                        ${historico.map(registro => `
                            <li>
                                <strong>
                                    ${escaparHTML(registro.tipo || "Registro")}
                                </strong>
                                <span>
                                    ${escaparHTML(formatarDataHora(registro))}
                                </span>
                            </li>
                        `).join("")}
                    </ul>
                `
                : "<p>Sem registros de movimentação.</p>";

            return `
                <article class="detalhe-participante">
                    <div class="detalhe-participante-cabecalho">
                        <div>
                            <strong>${escaparHTML(aluno.nome)}</strong>
                            <small>
                                ${escaparHTML(aluno.turma)}
                                • ${escaparHTML(aluno.matricula)}
                            </small>
                        </div>

                        <span class="status">
                            ${escaparHTML(aluno.status || "Pendente")}
                        </span>
                    </div>

                    ${registrosHTML}
                </article>
            `;
        }).join("")
        : "<p>Nenhum participante registrado nesta viagem.</p>";

    document.getElementById("conteudoDetalhesViagem").innerHTML = `
        <div class="detalhes-resumo">
            <p><strong>Data:</strong> ${escaparHTML(formatarDataViagem(viagem.data))}</p>
            <p><strong>Destino:</strong> ${escaparHTML(viagem.local || "Não informado")}</p>
            <p><strong>Descrição:</strong> ${escaparHTML(viagem.descricao || "Não informada")}</p>
            <p><strong>Situação:</strong> ${escaparHTML(nomeSituacao(obterSituacaoExibicao(viagem)))}</p>
            <p><strong>Participantes:</strong> ${participantes.length}</p>
        </div>

        <h3>Participantes e registros</h3>

        <div class="lista-detalhes-participantes">
            ${participantesHTML}
        </div>
    `;

    if (typeof modalDetalhes.showModal === "function") {
        modalDetalhes.showModal();
    } else {
        modalDetalhes.setAttribute("open", "");
    }
}


/* =========================================================
   9. AÇÕES DOS CARTÕES
   ========================================================= */

function tratarAcaoCartao(evento) {
    const botao = evento.target.closest("button[data-acao]");

    if (!botao) return;

    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    if (acao === "abrir-controle") {
        abrirControleOperacional(id);
        return;
    }

    if (acao === "detalhes") {
        abrirDetalhesViagem(id);
        return;
    }

    if (acao === "iniciar-viagem") {
        // Será conectado à função iniciarViagem() no viagens.js.
        if (typeof iniciarViagem !== "function") {
            alert("A função de iniciar viagem será habilitada na próxima etapa.");
            return;
        }

        iniciarViagem(id);
        atualizarPainelGeral();
        abrirControleOperacional(id);
        return;
    }

    if (acao === "finalizar-viagem") {
        // Será conectado à função finalizarViagem() no viagens.js.
        if (typeof finalizarViagem !== "function") {
            alert("A função de finalizar viagem será habilitada na próxima etapa.");
            return;
        }

        const viagem = carregarViagens().find(item => item.id === id);

        if (!viagem) return;

        const confirmar = confirm(
            `Deseja finalizar a viagem "${viagem.nome}"?\n\n` +
            "Os registros de participantes serão preservados no histórico."
        );

        if (!confirmar) return;

        finalizarViagem(id);

        controleOperacionalAberto = false;
        painelOperacional.classList.remove("aberto");

        atualizarPainelGeral();
        atualizarSeletorViagens();
        atualizarControleOperacional();
    }
}


/* =========================================================
   10. EXCLUSÃO DE VIAGEM
   ========================================================= */

function excluirViagemAtiva() {
    const viagem = obterViagemAtiva();

    if (!viagem) return;

    const confirmar = confirm(
        `Excluir a viagem "${viagem.nome}"?\n\n` +
        "Os registros dessa viagem também serão removidos. " +
        "Esta ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
        excluirViagem(viagem.id);

        atualizarPainelGeral();
        atualizarSeletorViagens();
        atualizarControleOperacional();

        alert("Viagem excluída com sucesso.");
    } catch (erro) {
        alert(erro.message);
    }
}


/* =========================================================
   11. EVENTOS DA INTERFACE
   ========================================================= */

btnNovaViagem.addEventListener("click", () => {
    window.location.href = "nova-viagem.html";
});

btnCancelarNovaViagem.addEventListener(
    "click",
    fecharFormularioNovaViagem
);

novaViagemForm.addEventListener("submit", cadastrarNovaViagem);

btnSelecionarTodos.addEventListener("click", () => {
    const caixas = [
        ...document.querySelectorAll(
            'input[name="participantesNovaViagem"]'
        )
    ];

    const todosMarcados =
        caixas.length > 0 && caixas.every(caixa => caixa.checked);

    caixas.forEach(caixa => {
        caixa.checked = !todosMarcados;
    });

    atualizarTextoSelecionarTodos();
});

listaParticipantesNovaViagem.addEventListener("change", evento => {
    if (evento.target.matches(
        'input[name="participantesNovaViagem"]'
    )) {
        atualizarTextoSelecionarTodos();
    }
});

buscaViagens.addEventListener("input", atualizarPainelGeral);
filtroSituacao.addEventListener("change", atualizarPainelGeral);

buscaInicio.addEventListener("input", atualizarControleOperacional);

seletorViagem.addEventListener("change", () => {
    selecionarViagem(seletorViagem.value);
    atualizarSeletorViagens();
    atualizarControleOperacional();
});

btnExcluirViagem.addEventListener("click", excluirViagemAtiva);

listaProximas.addEventListener("click", tratarAcaoCartao);
listaEmAndamento.addEventListener("click", tratarAcaoCartao);
listaRealizadas.addEventListener("click", tratarAcaoCartao);

btnFecharDetalhes.addEventListener("click", () => {
    modalDetalhes.close();
});

// Fecha os detalhes ao clicar fora do conteúdo.
modalDetalhes.addEventListener("click", evento => {
    if (evento.target === modalDetalhes) {
        modalDetalhes.close();
    }
});

// Atualiza a interface se outra função alterar a viagem ativa.
window.addEventListener("viagemAlterada", () => {
    atualizarPainelGeral();
    atualizarSeletorViagens();
    atualizarControleOperacional();
});

window.addEventListener("registroViagem", () => {
    atualizarPainelGeral();
    atualizarControleOperacional();
});


/* =========================================================
   12. INICIALIZAÇÃO
   ========================================================= */

function inicializarPainel() {
    atualizarPainelGeral();
    atualizarSeletorViagens();
    atualizarControleOperacional();

    // A tela inicial abre no painel geral.
    painelOperacional.classList.remove("aberto");
    painelNovaViagem.classList.remove("aberto");
}

inicializarPainel();