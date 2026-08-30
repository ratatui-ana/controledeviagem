const parametros = new URLSearchParams(window.location.search);

const matricula = parametros.get("matricula");

const aluno = alunos.find(
    aluno => aluno.matricula === matricula
);

if (!aluno) {
    document.body.innerHTML = `
        <h1>Aluno não encontrado</h1>
        <p>Verifique a matrícula informada.</p>
    `;

} else {

    console.log("Aluno encontrado:", aluno);

}

const parametros = new URLSearchParams(window.location.search);

const matricula = parametros.get("matricula");

const aluno = alunos.find(
    aluno => aluno.matricula === matricula
);

if (!aluno) {

    document.body.innerHTML = `
        <h1>Aluno não encontrado</h1>
        <p>Verifique a matrícula informada.</p>
    `;

} else {

    document.getElementById("nomeAluno").textContent =
        aluno.nome;

    document.getElementById("turmaAluno").textContent =
        aluno.turma;

    document.getElementById("matriculaAluno").textContent =
        aluno.matricula;

    document.getElementById("telefoneAluno").textContent =
        aluno.telefone;

    document.getElementById("responsavelAluno").textContent =
        aluno.responsavel;

    document.getElementById("telefoneResponsavel").textContent =
        aluno.telefoneResponsavel;

    document.getElementById("statusAluno").textContent =
        aluno.status;

    document.getElementById("ultimoRegistro").textContent =
        aluno.ultimoRegistro || "Nenhum registro";
}