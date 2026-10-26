let alunos = [];
async function carregarAlunosDoBanco() {
    try {
        const resposta = await fetch("/api/alunos-com-turmas");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os alunos.");
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

        console.log(`${alunos.length} alunos carregados do Supabase.`);

        // Atualiza a lista de participantes se a função já existir.
        if (typeof preencherParticipantesNovaViagem === "function") {
    preencherParticipantesNovaViagem();

    console.log(
        "Lista de participantes atualizada:",
        document.querySelectorAll(
            '#listaParticipantesNovaViagem .participante-item'
        ).length
    );
}
    } catch (erro) {
        console.error("Erro ao carregar alunos:", erro);
        alert("Não foi possível carregar os alunos do banco. Verifique o servidor.");
    }
}

document.addEventListener("DOMContentLoaded", carregarAlunosDoBanco);