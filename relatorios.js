function atualizarRelatorio() {
    const viagem = obterViagemAtiva();
    const lista = obterAlunosNaViagem(viagem);
    const resumo = obterResumoViagem(viagem);

    const cards = document.querySelectorAll(".card-resumo strong");
    if (cards[0]) cards[0].textContent = resumo.total;
    if (cards[1]) cards[1].textContent = resumo.embarcados;
    if (cards[2]) cards[2].textContent = resumo.pendentes;
    if (cards[3]) cards[3].textContent = resumo.desembarcados;

    const percentual = resumo.total
        ? ((resumo.embarcados / resumo.total) * 100)
        : 0;

    const tituloPercentual = document.querySelector(".titulo-card strong");
    if (tituloPercentual) tituloPercentual.textContent = `${percentual.toFixed(1).replace(".", ",")}%`;

    const progresso = document.querySelector(".progresso");
    if (progresso) progresso.style.width = `${percentual}%`;

    const legenda = document.querySelector(".legenda");
    if (legenda) {
        legenda.textContent =
            `${resumo.embarcados} de ${resumo.total} alunos registrados como embarcados.`;
    }

    const pendentes = document.querySelectorAll(".aluno-pendente");
    const listaPendentes = lista.filter(aluno => aluno.status === "Pendente");

    pendentes.forEach((elemento, indice) => {
        const aluno = listaPendentes[indice];

        if (!aluno) {
            elemento.style.display = "none";
            return;
        }

        elemento.style.display = "flex";

        const avatar = elemento.querySelector(".avatar");
        const nome = elemento.querySelector(".aluno-info strong");
        const turma = elemento.querySelector(".aluno-info span");

        if (avatar) {
            avatar.textContent = aluno.nome.split(" ")
                .map(n => n[0]).slice(0, 2).join("").toUpperCase();
        }

        if (nome) nome.textContent = aluno.nome;
        if (turma) turma.textContent = `${aluno.turma} • ${aluno.matricula}`;
    });

    const badge = document.querySelector(".badge");
    if (badge) badge.textContent = `${resumo.pendentes} pendentes`;

    const headerP = document.querySelector("header p");
    if (headerP) {
        headerP.textContent =
            `${viagem.nome} • ${formatarDataViagem(viagem.data)}`;
    }

    // Registros recentes da viagem ativa.
    const registros = [];
    lista.forEach(aluno => {
        (aluno.historico || []).forEach(registro => {
            registros.push({
                ...registro,
                nome: aluno.nome
            });
        });
    });

    registros.sort((a, b) =>
        String(b.dataHora || "").localeCompare(String(a.dataHora || ""))
    );

    const historico = document.querySelectorAll(".registro");
    historico.forEach((elemento, indice) => {
        const registro = registros[indice];

        if (!registro) {
            elemento.style.display = "none";
            return;
        }

        elemento.style.display = "flex";

        const nome = elemento.querySelector("strong");
        const texto = elemento.querySelector("p");
        const horario = elemento.querySelector(":scope > span");

        if (nome) nome.textContent = registro.nome;
        if (texto) {
            texto.textContent =
                `${registro.tipo} registrado às ${registro.horario}`;
        }
        if (horario) horario.textContent = registro.horario;
    });
}

window.addEventListener("viagemAlterada", atualizarRelatorio);
window.addEventListener("registroViagem", atualizarRelatorio);

atualizarRelatorio();
