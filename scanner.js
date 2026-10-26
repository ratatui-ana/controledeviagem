const campoAno = document.getElementById("anoMatricula");
const campoUnidade = document.getElementById("unidadeMatricula");
const campoNumero = document.getElementById("numeroMatricula");
const matriculaGerada = document.getElementById("matriculaGerada");
const btnBuscarAluno = document.getElementById("btnBuscarAluno");
const resultadoBusca = document.getElementById("resultadoBusca");

const btnCamera = document.getElementById("btnCamera");
const video = document.getElementById("video");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const statusCamera = document.getElementById("statusCamera");

let alunoSelecionado = null;
let cameraAtiva = false;
let streamAtual = null;
let codigoLido = false;
let leitorQR = null;

// ---------------------------------------------------------
// MATRÍCULA MANUAL
// Padrão: AAAA + 289 + NNNN
// ---------------------------------------------------------
function gerarMatricula() {
    const ano = campoAno.value;
    const unidade = campoUnidade.value;
    const numero = campoNumero.value.replace(/\D/g, "").slice(0, 4);

    campoNumero.value = numero;

    const numeroFormatado = numero.padStart(4, "0");
    const matricula = `${ano}${unidade}${numeroFormatado}`;

    matriculaGerada.textContent = matricula;
    return matricula;
}

campoAno.addEventListener("change", gerarMatricula);
campoNumero.addEventListener("input", gerarMatricula);

campoNumero.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        evento.preventDefault();
        buscarAlunoManual();
    }
});

function buscarAlunoManual() {
    const numero = campoNumero.value.replace(/\D/g, "");

    if (numero.length !== 4) {
        resultadoBusca.innerHTML = `
            <div class="aluno-encontrado erro-busca">
                <h3>Complete a matrícula</h3>
                <p>Informe os 4 últimos dígitos da matrícula.</p>
            </div>
        `;
        campoNumero.focus();
        return;
    }

    const matricula = gerarMatricula();
    processarMatricula(matricula, "manual");
}

btnBuscarAluno.addEventListener("click", buscarAlunoManual);

// ---------------------------------------------------------
// RESULTADO DO ALUNO
// ---------------------------------------------------------
function buscarAlunoPorMatricula(matricula) {
    const codigo = String(matricula).trim();

    return alunos.find((aluno) =>
        String(aluno.matricula).trim() === codigo
    );
}

function processarMatricula(matricula, origem = "qr") {
    const codigo = String(matricula).trim();

    console.log(`Procurando aluno (${origem}):`, codigo);

    const aluno = buscarAlunoPorMatricula(codigo);

    if (!aluno) {
        const alunoBase = alunos.find(item =>
            String(item.matricula).trim() === codigo
        );

        if (alunoBase) {
            mostrarAlunoNaoEncontrado(
                codigo,
                origem,
                `O aluno ${alunoBase.nome} está cadastrado, mas não participa da viagem ativa.`
            );
        } else {
            mostrarAlunoNaoEncontrado(codigo, origem);
        }
        return;
    }

    alunoSelecionado = aluno;
    mostrarAluno(aluno);
}

function mostrarAluno(aluno) {
    resultadoBusca.innerHTML = `
        <div class="aluno-encontrado">
            <h3>${aluno.nome}</h3>
            <p>${aluno.turma}</p>
            <p>Matrícula: ${aluno.matricula}</p>
            <p>Status: <strong>${aluno.status}</strong></p>

            <div class="acoes-registro">
                <button class="btn-registrar-embarque" id="registrarEmbarque">
                    🚌 Embarcar
                </button>

                <button class="btn-registrar-desembarque" id="registrarDesembarque">
                    🚶 Desembarcar
                </button>

                <button class="btn-registrar-reembarque" id="registrarReembarque">
                    🔄 Reembarcar
                </button>
            </div>
        </div>
    `;

    document
        .getElementById("registrarEmbarque")
        .addEventListener("click", () => registrarEvento("Embarcado"));

    document
        .getElementById("registrarDesembarque")
        .addEventListener("click", () => registrarEvento("Desembarcado"));

    document
        .getElementById("registrarReembarque")
        .addEventListener("click", () => registrarEvento("Embarcado"));
}

function mostrarAlunoNaoEncontrado(matricula, origem = "qr", mensagemExtra = "") {
    resultadoBusca.innerHTML = `
        <div class="aluno-encontrado erro-busca">
            <h3>Aluno não encontrado</h3>
            <p>Matrícula informada: <strong>${matricula}</strong></p>
            <p>${mensagemExtra || "Verifique os dados e tente novamente."}</p>
        </div>
    `;

    alunoSelecionado = null;

    if (origem === "qr") {
        codigoLido = false;
        statusCamera.textContent = "Aguardando novo QR Code...";
    }
}

function registrarEvento(status) {
    if (!alunoSelecionado) return;

    const registro = registrarEventoNaViagem(
        alunoSelecionado.matricula,
        status
    );

    if (!registro) return;

    alunoSelecionado = obterAlunoNaViagem(alunoSelecionado.matricula);
    mostrarAluno(alunoSelecionado);

    console.log(
        "Registro na viagem:",
        obterViagemAtiva().nome,
        alunoSelecionado.nome,
        status,
        registro.ultimoRegistro
    );
}

// ---------------------------------------------------------
// CÂMERA / QR CODE
// ---------------------------------------------------------
btnCamera.addEventListener("click", async () => {
    if (cameraAtiva) {
        fecharCamera();
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusCamera.textContent = "Câmera indisponível neste acesso.";
        alert(
            "A câmera precisa de HTTPS (ou localhost) para funcionar no navegador."
        );
        return;
    }

    try {
        statusCamera.textContent = "Abrindo câmera...";

        streamAtual = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" }
            },
            audio: false
        });

        video.srcObject = streamAtual;
        video.style.display = "block";
        cameraPlaceholder.style.display = "none";
        cameraAtiva = true;
        codigoLido = false;
        btnCamera.innerHTML = "⛔ Fechar câmera";
        statusCamera.textContent = "Aguardando QR Code...";

        console.log("Câmera aberta com sucesso");
        iniciarScanner();
    } catch (erro) {
        console.error("Erro ao abrir câmera:", erro);
        statusCamera.textContent = "Não foi possível acessar a câmera.";

        alert(
            "Erro ao acessar a câmera:\n\n" +
            erro.name +
            "\n\n" +
            erro.message
        );
    }
});

function fecharCamera() {
    codigoLido = false;
    leitorQR = null;

    if (streamAtual) {
        streamAtual.getTracks().forEach((track) => track.stop());
    }

    streamAtual = null;
    video.srcObject = null;
    video.style.display = "none";
    cameraPlaceholder.style.display = "flex";
    statusCamera.textContent = "Câmera aguardando...";
    cameraAtiva = false;
    btnCamera.innerHTML = "📷 Abrir câmera";

    console.log("Câmera fechada");
}

async function iniciarScanner() {
    if (typeof ZXingBrowser === "undefined") {
        statusCamera.textContent = "Leitor de QR Code indisponível.";
        console.error("Biblioteca ZXing não carregada.");
        return;
    }

    console.log("Scanner iniciado. Aguardando QR Code...");

    leitorQR = new ZXingBrowser.BrowserQRCodeReader();

    try {
        leitorQR.decodeFromVideoElement(video, (resultado, erro) => {
            if (!cameraAtiva || codigoLido) return;

            if (resultado) {
                codigoLido = true;

                const matricula = resultado.getText().trim();

                console.log("QR Code lido:", matricula);
                statusCamera.textContent = "QR Code identificado!";

                // Usa exatamente a mesma rotina da busca manual.
                processarMatricula(matricula, "qr");

                // Mantém a câmera aberta para uma próxima leitura.
                setTimeout(() => {
                    if (cameraAtiva) {
                        codigoLido = false;
                        statusCamera.textContent = "Aguardando novo QR Code...";
                    }
                }, 2500);
            }
        });
    } catch (erro) {
        console.error("Erro ao iniciar leitor QR:", erro);
        statusCamera.textContent = "Não foi possível iniciar o leitor.";
    }
}

gerarMatricula();
console.log("BarcodeDetector disponível?", "BarcodeDetector" in window);
