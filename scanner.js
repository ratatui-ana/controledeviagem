
const campoMatricula =
    document.getElementById("matriculaBusca");

const btnBuscarAluno =
    document.getElementById("btnBuscarAluno");

const resultadoBusca =
    document.getElementById("resultadoBusca");


let alunoSelecionado = null;


function buscarAluno() {

    const matricula =
        campoMatricula.value.trim();

    if (!matricula) {
        resultadoBusca.innerHTML = `
            <p>Digite uma matrícula.</p>
        `;
        return;
    }


    const alunoEncontrado = alunos.find(
        aluno =>
            aluno.matricula.toString() === matricula
    );


    if (!alunoEncontrado) {

        resultadoBusca.innerHTML = `
            <div class="aluno-encontrado">
                <h3>Aluno não encontrado</h3>
                <p>
                    Verifique a matrícula informada.
                </p>
            </div>
        `;

        alunoSelecionado = null;

        return;
    }


    alunoSelecionado = alunoEncontrado;


    mostrarAluno();
}


function mostrarAluno() {

    const aluno = alunoSelecionado;


    resultadoBusca.innerHTML = `

        <div class="aluno-encontrado">

            <h3>
                ${aluno.nome}
            </h3>

            <p>
                ${aluno.turma}
            </p>

            <p>
                Matrícula: ${aluno.matricula}
            </p>

            <p>
                Status:
                <strong>${aluno.status}</strong>
            </p>


            <div class="acoes-registro">

                <button
                    class="btn-registrar-embarque"
                    id="registrarEmbarque"
                >
                    🚌 Embarcar
                </button>

                <button
                    class="btn-registrar-desembarque"
                    id="registrarDesembarque"
                >
                    🚶 Desembarcar
                </button>

                <button
                    class="btn-registrar-reembarque"
                    id="registrarReembarque"
                >
                    🔄 Reembarcar
                </button>

            </div>

        </div>

    `;


    document
        .getElementById("registrarEmbarque")
        .addEventListener(
            "click",
            () => registrarEvento("Embarcado")
        );


    document
        .getElementById("registrarDesembarque")
        .addEventListener(
            "click",
            () => registrarEvento("Desembarcado")
        );


    document
        .getElementById("registrarReembarque")
        .addEventListener(
            "click",
            () => registrarEvento("Embarcado")
        );
}


function registrarEvento(status) {

    if (!alunoSelecionado) return;


    const horario =
        new Date().toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    alunoSelecionado.status = status;

    alunoSelecionado.ultimoRegistro = horario;


    mostrarAluno();


    console.log(
        "Registro:",
        alunoSelecionado.nome,
        status,
        horario
    );
}


btnBuscarAluno.addEventListener(
    "click",
    buscarAluno
);

const btnCamera = document.getElementById("btnCamera");

const video = document.getElementById("video");

const cameraPlaceholder = document.getElementById("cameraPlaceholder");

const statusCamera = document.getElementById("statusCamera");


let cameraAtiva = false;
let streamAtual = null;


// ABRIR CÂMERA

btnCamera.addEventListener("click", async () => {

    // Se a câmera já estiver aberta, fecha

    if (cameraAtiva) {

        fecharCamera();

        return;

    }


    try {

        statusCamera.textContent = "Abrindo câmera...";


        // Solicita acesso à câmera traseira
if (!navigator.mediaDevices) {

    alert(
        "A câmera precisa de HTTPS para funcionar no celular.\n\n" +
        "O sistema está sendo aberto em uma conexão não segura."
    );

    return;

}
        streamAtual = await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: {

                    ideal: "environment"

                }

            },

            audio: false

        });


        // Envia o vídeo da câmera para o elemento video

        video.srcObject = streamAtual;


        // Mostra o vídeo

        video.style.display = "block";


        // Esconde o placeholder

        cameraPlaceholder.style.display = "none";


        cameraAtiva = true;


        // Atualiza botão

        btnCamera.innerHTML = "⛔ Fechar câmera";


        console.log("Câmera aberta com sucesso");


        iniciarScanner();


    }

    catch (erro) {

        console.error("Erro ao abrir câmera:", erro);


        statusCamera.textContent =
            "Não foi possível acessar a câmera.";

alert(
    "Erro ao acessar a câmera:\n\n" +
    erro.name +
    "\n\n" +
    erro.message
);

    }

});


// FECHAR CÂMERA

function fecharCamera() {
codigoLido = false;

if (leitorQR) {

    leitorQR = null;

}
    if (streamAtual) {

        streamAtual.getTracks().forEach(track => {

            track.stop();

        });

    }


    video.srcObject = null;


    video.style.display = "none";


    cameraPlaceholder.style.display = "flex";


    statusCamera.textContent = "Câmera aguardando...";


    cameraAtiva = false;


    btnCamera.innerHTML = "📷 Abrir câmera";


    console.log("Câmera fechada");
    

}


// FUNÇÃO TEMPORÁRIA DO SCANNER

let codigoLido = false;

let leitorQR = null;

async function iniciarScanner() {

    console.log("Scanner iniciado. Aguardando QR Code...");


    leitorQR = new ZXingBrowser.BrowserQRCodeReader();


    leitorQR.decodeFromVideoElement(

        video,

        (resultado, erro) => {

            if (resultado && !codigoLido) {

                codigoLido = true;


                const matricula = resultado.getText();


                console.log("QR Code lido:", matricula);


                statusCamera.textContent =
                    "QR Code identificado!";


                processarMatricula(matricula);

            }

        }

    );

}

function processarMatricula(matricula) {

    console.log("Procurando aluno:", matricula);


    const aluno = alunos.find(aluno =>

        String(aluno.matricula) === String(matricula)

    );


    if (!aluno) {

        console.log("Aluno não encontrado");


        mostrarAlunoNaoEncontrado(matricula);


        setTimeout(() => {

            codigoLido = false;

            statusCamera.textContent =
                "Aguardando novo QR Code...";

        }, 3000);


        return;

    }


    console.log("Aluno encontrado:", aluno);


    mostrarAluno(aluno);

}
function mostrarAluno(aluno) {

    alert(
        "Aluno encontrado!\n\n" +
        aluno.nome +
        "\nMatrícula: " +
        aluno.matricula
    );

}
function mostrarAlunoNaoEncontrado(matricula) {

    alert(
        "Nenhum aluno encontrado.\n\n" +
        "Código lido: " +
        matricula
    );

}
console.log("BarcodeDetector disponível?", "BarcodeDetector" in window);
