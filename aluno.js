const parametros = new URLSearchParams(window.location.search);
const matricula = parametros.get("matricula");
const viagem = obterViagemAtiva();
const aluno = obterAlunoNaViagem(matricula, viagem);

if (!aluno) {
    document.body.innerHTML = `
        <h1>Aluno não encontrado</h1>
        <p>Verifique a matrícula informada.</p>
        <p><a href="alunos.html">Voltar para os alunos</a></p>
    `;
} else {
    document.getElementById("nomeAluno").textContent = aluno.nome;
    document.getElementById("turmaAluno").textContent = aluno.turma;
    document.getElementById("matriculaAluno").textContent = aluno.matricula;
    document.getElementById("telefoneAluno").textContent = aluno.telefone;
    document.getElementById("responsavelAluno").textContent = aluno.responsavel;
    document.getElementById("telefoneResponsavel").textContent = aluno.telefoneResponsavel;
    document.getElementById("statusAluno").textContent = aluno.status;
    document.getElementById("ultimoRegistro").textContent = aluno.ultimoRegistro || "Nenhum registro";

    const subtitulo = document.querySelector("header p");
    if (subtitulo) subtitulo.textContent =
        `${viagem.nome} • ${formatarDataViagem(viagem.data)}`;
}
