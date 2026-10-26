const listaAlunos = document.querySelector(".lista-alunos");
const modal = document.getElementById("modalAluno");
const fecharModal = document.getElementById("fecharModal");

let alunoSelecionado = null;

function listaAtual() {
    return obterAlunosNaViagem();
}

function mostrarAlunos(lista) {
    listaAlunos.innerHTML = `<h2>Lista de alunos</h2>`;

    lista.forEach(aluno => {
        const iniciais = aluno.nome.split(" ")
            .map(nome => nome[0]).slice(0, 2).join("").toUpperCase();

        const statusClasse = aluno.status.toLowerCase().replace("í", "i");
        const card = document.createElement("div");
        card.className = "aluno";

        card.innerHTML = `
            <div class="aluno-info">
                <div class="avatar">${iniciais}</div>
                <div>
                    <div class="nome">${aluno.nome}</div>
                    <div class="turma">
                        ${aluno.turma} • Matrícula: ${aluno.matricula}
                    </div>
                </div>
            </div>

            <div>
                <span class="status ${statusClasse}">
                    ${aluno.status === "Embarcado" ? "✓ " : ""}${aluno.status}
                </span>
                <br><br>
                <button class="btn-detalhes" data-matricula="${aluno.matricula}">
                    Ver detalhes →
                </button>
            </div>
        `;

        listaAlunos.appendChild(card);
    });

    document.querySelectorAll(".btn-detalhes").forEach(botao => {
        botao.addEventListener("click", () => abrirModal(botao.dataset.matricula));
    });
}

function abrirModal(matricula) {
    alunoSelecionado = obterAlunoNaViagem(matricula);

    if (!alunoSelecionado) {
        console.error("Aluno não encontrado:", matricula);
        return;
    }

    const iniciais = alunoSelecionado.nome.split(" ")
        .map(nome => nome[0]).slice(0, 2).join("").toUpperCase();

    document.getElementById("modalAvatar").textContent = iniciais;
    document.getElementById("modalNome").textContent = alunoSelecionado.nome;
    document.getElementById("modalTurma").textContent = alunoSelecionado.turma;
    document.getElementById("modalMatricula").textContent = alunoSelecionado.matricula;
    document.getElementById("modalTelefone").textContent = alunoSelecionado.telefone;
    document.getElementById("modalResponsavel").textContent = alunoSelecionado.responsavel;
    document.getElementById("modalTelefoneResponsavel").textContent = alunoSelecionado.telefoneResponsavel;
    document.getElementById("modalStatus").textContent = alunoSelecionado.status;

    modal.classList.add("aberto");
}

function fecharModalAluno() {
    modal.classList.remove("aberto");
    alunoSelecionado = null;
}

fecharModal.addEventListener("click", fecharModalAluno);

modal.addEventListener("click", evento => {
    if (evento.target === modal) fecharModalAluno();
});

document.getElementById("btnEmbarcar").addEventListener("click", () => {
    if (alunoSelecionado) registrarEvento("Embarcado");
});

document.getElementById("btnDesembarcar").addEventListener("click", () => {
    if (alunoSelecionado) registrarEvento("Desembarcado");
});

document.getElementById("btnReembarcar").addEventListener("click", () => {
    if (alunoSelecionado) registrarEvento("Embarcado");
});

function registrarEvento(status) {
    if (!alunoSelecionado) return;

    registrarEventoNaViagem(alunoSelecionado.matricula, status);

    alunoSelecionado = obterAlunoNaViagem(alunoSelecionado.matricula);
    document.getElementById("modalStatus").textContent = status;

    aplicarFiltros();
}

const buscaAluno = document.getElementById("buscaAluno");
const filtroStatus = document.getElementById("filtroStatus");

function aplicarFiltros() {
    const texto = buscaAluno.value.toLowerCase().trim();
    const statusSelecionado = filtroStatus.value;

    const filtrados = listaAtual().filter(aluno => {
        const nomeCorresponde = aluno.nome.toLowerCase().includes(texto);
        const matriculaCorresponde = String(aluno.matricula).includes(texto);
        const statusCorresponde =
            !statusSelecionado ||
            aluno.status.toLowerCase() === statusSelecionado.toLowerCase();

        return (nomeCorresponde || matriculaCorresponde) && statusCorresponde;
    });

    mostrarAlunos(filtrados);
    atualizarResumo();
}

buscaAluno.addEventListener("input", aplicarFiltros);
filtroStatus.addEventListener("change", aplicarFiltros);

function atualizarResumo() {
    const resumo = obterResumoViagem();

    document.getElementById("totalAlunos").textContent = resumo.total;
    document.getElementById("totalEmbarcados").textContent = resumo.embarcados;
    document.getElementById("totalPendentes").textContent = resumo.pendentes;

    const titulo = document.querySelector("header p");
    if (titulo) {
        const viagem = obterViagemAtiva();
        titulo.textContent = `${viagem.nome} • ${formatarDataViagem(viagem.data)}`;
    }
}

window.addEventListener("viagemAlterada", () => {
    buscaAluno.value = "";
    filtroStatus.value = "";
    atualizarResumo();
    mostrarAlunos(listaAtual());
});

window.addEventListener("registroViagem", () => {
    atualizarResumo();
    aplicarFiltros();
});

atualizarResumo();
mostrarAlunos(listaAtual());
