
"use strict";

// ======================================================
// CADASTRO DE NOVA VIAGEM
// Depende de dados.js e viagens.js
// ======================================================

const formularioNovaViagem = document.getElementById("formNovaViagem");
const campoNomeViagem = document.getElementById("nomeViagem");
const campoDataViagem = document.getElementById("dataViagem");
const campoLocalViagem = document.getElementById("localViagem");
const campoDescricaoViagem = document.getElementById("descricaoViagem");

const campoBuscaAluno = document.getElementById("buscaAluno");
const campoFiltroTurma = document.getElementById("filtroTurma");
const listaAlunosCadastro = document.getElementById("listaAlunosCadastro");
const resumoSelecao = document.getElementById("resumoSelecao");
const mensagemErroCadastro = document.getElementById("mensagemErroCadastro");

const btnSelecionarVisiveis = document.getElementById("btnSelecionarVisiveis");
const btnLimparSelecao = document.getElementById("btnLimparSelecao");
const btnSalvarViagem = document.getElementById("btnSalvarViagem");

// Lista de alunos que participarão da viagem.
// O Set evita que uma matrícula seja selecionada duas vezes.
const matriculasSelecionadas = new Set();

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function escaparHTMLCadastro(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function normalizarTextoCadastro(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Obtém a matrícula considerando alguns nomes de propriedade comuns.
function obterMatriculaCadastro(aluno) {
    const valor =
        aluno.matricula ??
        aluno.matrícula ??
        aluno.rm ??
        aluno.codigoMatricula ??
        aluno.codigo_matricula;

    return valor == null ? "" : String(valor).trim();
}

function obterNomeCadastro(aluno) {
    return String(
        aluno.nome ??
        aluno.nomeCompleto ??
        aluno.nome_completo ??
        aluno.name ??
        ""
    ).trim();
}

function obterTurmaCadastro(aluno) {
    return String(
        aluno.turma ??
        aluno.classe ??
        aluno.nomeTurma ??
        aluno.nome_turma ??
        "Turma não informada"
    ).trim();
}

function obterAlunosCadastrados() {
    // O arquivo dados.js precisa disponibilizar a variável global "alunos".
    if (typeof alunos === "undefined" || !Array.isArray(alunos)) {
        return [];
    }

    // Ignora registros sem matrícula ou sem nome.
    return alunos.filter(aluno =>
        obterMatriculaCadastro(aluno) !== "" &&
        obterNomeCadastro(aluno) !== ""
    );
}

// ======================================================
// MENSAGENS
// ======================================================

function mostrarErroCadastro(mensagem) {
    mensagemErroCadastro.textContent = mensagem;
    mensagemErroCadastro.className = "mensagem-erro";
    mensagemErroCadastro.hidden = false;

    mensagemErroCadastro.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function limparErroCadastro() {
    mensagemErroCadastro.textContent = "";
    mensagemErroCadastro.hidden = true;
}

// ======================================================
// FILTRO DE TURMAS
// ======================================================

function carregarFiltroTurmas() {
    const alunosCadastrados = obterAlunosCadastrados();

    const turmas = [...new Set(
        alunosCadastrados.map(obterTurmaCadastro)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    campoFiltroTurma.innerHTML =
        '<option value="">Todas as turmas</option>';

    turmas.forEach(turma => {
        const opcao = document.createElement("option");

        opcao.value = turma;
        opcao.textContent = turma;

        campoFiltroTurma.appendChild(opcao);
    });
}

// ======================================================
// FILTRAGEM DOS ALUNOS
// ======================================================

function obterAlunosVisiveis() {
    const busca = normalizarTextoCadastro(campoBuscaAluno.value);
    const turmaSelecionada = campoFiltroTurma.value;

    return obterAlunosCadastrados()
        .filter(aluno => {
            const nome = normalizarTextoCadastro(
                obterNomeCadastro(aluno)
            );

            const matricula = normalizarTextoCadastro(
                obterMatriculaCadastro(aluno)
            );

            const turma = obterTurmaCadastro(aluno);

            const correspondeBusca =
                !busca ||
                nome.includes(busca) ||
                matricula.includes(busca);

            const correspondeTurma =
                !turmaSelecionada ||
                turma === turmaSelecionada;

            return correspondeBusca && correspondeTurma;
        })
        .sort((a, b) => {
            const turmaA = obterTurmaCadastro(a);
            const turmaB = obterTurmaCadastro(b);

            const comparacaoTurma = turmaA.localeCompare(
                turmaB,
                "pt-BR"
            );

            if (comparacaoTurma !== 0) {
                return comparacaoTurma;
            }

            return obterNomeCadastro(a).localeCompare(
                obterNomeCadastro(b),
                "pt-BR"
            );
        });
}

// ======================================================
// RENDERIZAÇÃO DA LISTA
// ======================================================

function renderizarAlunosCadastro() {
    const alunosVisiveis = obterAlunosVisiveis();

    if (alunosVisiveis.length === 0) {
        listaAlunosCadastro.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum aluno encontrado com esses filtros.
            </p>
        `;

        atualizarResumoSelecao();
        return;
    }

    let turmaAtual = null;
    let conteudo = "";

    alunosVisiveis.forEach(aluno => {
        const nome = obterNomeCadastro(aluno);
        const matricula = obterMatriculaCadastro(aluno);
        const turma = obterTurmaCadastro(aluno);

        if (turma !== turmaAtual) {
            turmaAtual = turma;

            conteudo += `
                <div class="grupo-turma">
                    ${escaparHTMLCadastro(turma)}
                </div>
            `;
        }

        const selecionado = matriculasSelecionadas.has(matricula);

        conteudo += `
            <label class="aluno-opcao">
                <input
                    type="checkbox"
                    class="checkbox-aluno-viagem"
                    value="${escaparHTMLCadastro(matricula)}"
                    ${selecionado ? "checked" : ""}
                >

                <span class="dados-aluno">
                    <strong>${escaparHTMLCadastro(nome)}</strong>

                    <span class="matricula-aluno">
                        Matrícula: ${escaparHTMLCadastro(matricula)}
                    </span>
                </span>
            </label>
        `;
    });

    listaAlunosCadastro.innerHTML = conteudo;

    listaAlunosCadastro
        .querySelectorAll(".checkbox-aluno-viagem")
        .forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    matriculasSelecionadas.add(checkbox.value);
                } else {
                    matriculasSelecionadas.delete(checkbox.value);
                }

                atualizarResumoSelecao();
                limparErroCadastro();
            });
        });

    atualizarResumoSelecao();
}

// ======================================================
// RESUMO DA SELEÇÃO
// ======================================================

function atualizarResumoSelecao() {
    const quantidade = matriculasSelecionadas.size;

    resumoSelecao.textContent =
        quantidade === 1
            ? "1 aluno selecionado"
            : `${quantidade} alunos selecionados`;
}

// ======================================================
// SELECIONAR E LIMPAR ALUNOS
// ======================================================

// Seleciona somente os alunos que aparecem com os filtros atuais.
btnSelecionarVisiveis.addEventListener("click", () => {
    obterAlunosVisiveis().forEach(aluno => {
        matriculasSelecionadas.add(
            obterMatriculaCadastro(aluno)
        );
    });

    renderizarAlunosCadastro();
    limparErroCadastro();
});

// Limpa a seleção completa, inclusive alunos de outras turmas.
btnLimparSelecao.addEventListener("click", () => {
    matriculasSelecionadas.clear();

    renderizarAlunosCadastro();
    limparErroCadastro();
});

// A busca e o filtro atualizam a lista sem apagar as seleções anteriores.
campoBuscaAluno.addEventListener(
    "input",
    renderizarAlunosCadastro
);

campoFiltroTurma.addEventListener(
    "change",
    renderizarAlunosCadastro
);

// ======================================================
// DATA MÍNIMA
// Permite cadastrar viagens a partir da data de hoje.
// ======================================================

function configurarDataMinima() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    const hoje = `${ano}-${mes}-${dia}`;

    campoDataViagem.min = hoje;
    campoDataViagem.value = hoje;
}

// ======================================================
// SALVAR NOVA VIAGEM
// ======================================================

formularioNovaViagem.addEventListener("submit", evento => {
    evento.preventDefault();
    limparErroCadastro();

    const nome = campoNomeViagem.value.trim();
    const data = campoDataViagem.value;
    const local = campoLocalViagem.value.trim();
    const descricao = campoDescricaoViagem.value.trim();

    if (!nome || !data || !local) {
        mostrarErroCadastro(
            "Preencha o nome, a data e o destino da viagem."
        );
        return;
    }

    if (data < campoDataViagem.min) {
        mostrarErroCadastro(
            "A data da viagem não pode ser anterior a hoje."
        );
        return;
    }

    if (matriculasSelecionadas.size === 0) {
        mostrarErroCadastro(
            "Selecione pelo menos um aluno para a viagem."
        );
        return;
    }

    if (typeof criarViagem !== "function") {
        mostrarErroCadastro(
            "Não foi possível localizar a função de cadastro. Verifique se viagens.js foi carregado corretamente."
        );
        return;
    }

    btnSalvarViagem.disabled = true;
    btnSalvarViagem.textContent = "Salvando...";

    try {
        // Utiliza a função centralizada de viagens.js.
        // A viagem é criada como próxima, sem iniciar os embarques.
        criarViagem({
            nome,
            data,
            local,
            descricao,
            matriculas: [...matriculasSelecionadas]
        });

        // A função criarViagem já salva os dados no localStorage.
        alert("Viagem cadastrada com sucesso!");

        // Volta ao painel principal para visualizar a nova viagem.
        window.location.href = "index.html";
    } catch (erro) {
        console.error("Erro ao cadastrar viagem:", erro);

        mostrarErroCadastro(
            erro.message ||
            "Ocorreu um erro ao salvar a viagem. Confira os dados e tente novamente."
        );

        btnSalvarViagem.disabled = false;
        btnSalvarViagem.textContent = "Salvar viagem";
    }
});

// ======================================================
// INICIALIZAÇÃO DA PÁGINA
// ======================================================


async function inicializarCadastroNovaViagem() {
    configurarDataMinima();

    try {
        const resposta = await fetch("/api/alunos-com-turmas");

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os alunos.");
        }

        const dados = await resposta.json();

        alunos = dados
            .filter(aluno => aluno.ativo)
            .map(aluno => ({
                matricula: aluno.matricula,
                nome: aluno.nome,
                turma: aluno.turma?.nome || "Turma não informada",
                telefone: "",
                responsavel: "",
                telefoneResponsavel: "",
                status: "Pendente",
                ultimoRegistro: null
            }));

        carregarFiltroTurmas();
        renderizarAlunosCadastro();

        if (alunos.length === 0) {
            listaAlunosCadastro.innerHTML = `
                <p class="mensagem-vazia">
                    Nenhum aluno ativo encontrado.
                </p>
            `;
        }
    } catch (erro) {
        console.error("Erro ao carregar alunos:", erro);

        listaAlunosCadastro.innerHTML = `
            <p class="mensagem-vazia">
                Erro ao carregar os alunos. Verifique o servidor.
            </p>
        `;
    }
}

inicializarCadastroNovaViagem();

