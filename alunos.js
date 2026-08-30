const listaAlunos = document.querySelector(".lista-alunos");

const modal = document.getElementById("modalAluno");
const fecharModal = document.getElementById("fecharModal");

let alunoSelecionado = null;


// ===============================
// MOSTRAR ALUNOS
// ===============================

function mostrarAlunos(lista) {

    listaAlunos.innerHTML = `
        <h2>Lista de alunos</h2>
    `;

    lista.forEach(aluno => {

        const iniciais = aluno.nome
            .split(" ")
            .map(nome => nome[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        const statusClasse = aluno.status
            .toLowerCase()
            .replace("í", "i");

        const card = document.createElement("div");

        card.className = "aluno";

        card.innerHTML = `

            <div class="aluno-info">

                <div class="avatar">
                    ${iniciais}
                </div>

                <div>

                    <div class="nome">
                        ${aluno.nome}
                    </div>

                    <div class="turma">
                        ${aluno.turma}
                        • Matrícula: ${aluno.matricula}
                    </div>

                </div>

            </div>

            <div>

                <span class="status ${statusClasse}">
                    ${aluno.status}
                </span>

                <br><br>

                <button
                    class="btn-detalhes"
                    data-matricula="${aluno.matricula}"
                >
                    Ver detalhes →
                </button>

            </div>

        `;

        listaAlunos.appendChild(card);
    });


    // Botões de detalhes

    document
        .querySelectorAll(".btn-detalhes")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                abrirModal(
                    botao.dataset.matricula
                );

            });

        });
}


// ===============================
// ABRIR MODAL
// ===============================

function abrirModal(matricula) {

    alunoSelecionado = alunos.find(
        aluno => aluno.matricula === matricula
    );

    if (!alunoSelecionado) {
        console.error("Aluno não encontrado:", matricula);
        return;
    }


    const iniciais = alunoSelecionado.nome
        .split(" ")
        .map(nome => nome[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();


    document.getElementById("modalAvatar").textContent =
        iniciais;

    document.getElementById("modalNome").textContent =
        alunoSelecionado.nome;

    document.getElementById("modalTurma").textContent =
        alunoSelecionado.turma;

    document.getElementById("modalMatricula").textContent =
        alunoSelecionado.matricula;

    document.getElementById("modalTelefone").textContent =
        alunoSelecionado.telefone;

    document.getElementById("modalResponsavel").textContent =
        alunoSelecionado.responsavel;

    document.getElementById("modalTelefoneResponsavel").textContent =
        alunoSelecionado.telefoneResponsavel;

    document.getElementById("modalStatus").textContent =
        alunoSelecionado.status;


    modal.classList.add("aberto");
}


// ===============================
// FECHAR MODAL
// ===============================

function fecharModalAluno() {

    modal.classList.remove("aberto");

    alunoSelecionado = null;
}


fecharModal.addEventListener(
    "click",
    fecharModalAluno
);


modal.addEventListener(
    "click",
    evento => {

        if (evento.target === modal) {
            fecharModalAluno();
        }

    }
);


// ===============================
// REGISTRO DE EMBARQUE
// ===============================

document
    .getElementById("btnEmbarcar")
    .addEventListener("click", () => {

        if (!alunoSelecionado) return;

        registrarEvento("Embarcado");

    });


// ===============================
// REGISTRO DE DESEMBARQUE
// ===============================

document
    .getElementById("btnDesembarcar")
    .addEventListener("click", () => {

        if (!alunoSelecionado) return;

        registrarEvento("Desembarcado");

    });


// ===============================
// REGISTRO DE REEMBARQUE
// ===============================

document
    .getElementById("btnReembarcar")
    .addEventListener("click", () => {

        if (!alunoSelecionado) return;

        registrarEvento("Embarcado");

    });


// ===============================
// REGISTRAR EVENTO
// ===============================

function registrarEvento(status) {

    const agora = new Date();

    const horario = agora.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );


    alunoSelecionado.status = status;

    alunoSelecionado.ultimoRegistro = horario;

    atualizarResumo();


    // Atualiza o modal

    document.getElementById("modalStatus")
        .textContent = status;


    // Atualiza a lista atrás do modal

    mostrarAlunos(alunos);

}


// ===============================
// INICIAR
// ===============================

// mostrarAlunos(alunos);
// ===============================
// BUSCA E FILTROS
// ===============================

const buscaAluno = document.getElementById("buscaAluno");
const filtroStatus = document.getElementById("filtroStatus");

function aplicarFiltros() {

    const texto = buscaAluno.value
        .toLowerCase()
        .trim();

    const statusSelecionado = filtroStatus.value;

    const alunosFiltrados = alunos.filter(aluno => {

        const nomeCorresponde =
            aluno.nome
                .toLowerCase()
                .includes(texto);

        const matriculaCorresponde =
            aluno.matricula
                .toString()
                .includes(texto);

        const statusCorresponde =
            statusSelecionado === "" ||
            aluno.status.toLowerCase() ===
            statusSelecionado.toLowerCase();

        return (
            (nomeCorresponde || matriculaCorresponde) &&
            statusCorresponde
        );

    });

    mostrarAlunos(alunosFiltrados);
}


// BUSCA
buscaAluno.addEventListener(
    "input",
    aplicarFiltros
);


// SELECT DE STATUS
filtroStatus.addEventListener(
    "change",
    aplicarFiltros
);

function atualizarResumo() {

    const total = alunos.length;

    const embarcados = alunos.filter(aluno =>
        aluno.status === "Embarcado"
    ).length;

    const pendentes = alunos.filter(aluno =>
        aluno.status === "Pendente"
    ).length;


    document.getElementById("totalAlunos").textContent =
        total;

    document.getElementById("totalEmbarcados").textContent =
        embarcados;

    document.getElementById("totalPendentes").textContent =
        pendentes;

}


// ===============================
// INICIAR PÁGINA
// ===============================
atualizarResumo();
mostrarAlunos(alunos);