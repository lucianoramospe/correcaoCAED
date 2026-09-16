// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCh57LB-HZ063qr7IdltXYNr9J2hBCY7b4",
  authDomain: "corretorcaed-ete-vitoria.firebaseapp.com",
  projectId: "corretorcaed-ete-vitoria",
  storageBucket: "corretorcaed-ete-vitoria.firebasestorage.app",
  messagingSenderId: "444999523654",
  appId: "1:444999523654:web:dbff48d99c5958322e5947"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variável de controle global
let alunoAtualSelecionado = null;
let videoStream = null;

// Inicializa os campos de gabarito ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    criarCamposGabarito();
});

function criarCamposGabarito() {
    const gridPort = document.getElementById('grid-port');
    const gridMat = document.getElementById('grid-mat');

    if (!gridPort || !gridMat) return;

    let htmlPort = '';
    let htmlMat = '';

    for (let i = 1; i <= 26; i++) {
        htmlPort += `
            <div class="questao-item">
                <strong>Q${i}</strong><br>
                Resp: 
                <select id="gab_${i}">
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option>
                </select>
                Valor: 
                <input type="number" id="peso_${i}" value="0.38" step="0.01" min="0">
            </div>`;
    }

    for (let i = 27; i <= 52; i++) {
        htmlMat += `
            <div class="questao-item">
                <strong>Q${i}</strong><br>
                Resp: 
                <select id="gab_${i}">
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option>
                </select>
                Valor: 
                <input type="number" id="peso_${i}" value="0.38" step="0.01" min="0">
            </div>`;
    }

    gridPort.innerHTML = htmlPort;
    gridMat.innerHTML = htmlMat;
}

function aplicarValorLote() {
    const inputPort = document.getElementById('lote-port');
    const inputMat = document.getElementById('lote-mat');
    
    const valorPort = inputPort ? parseFloat(inputPort.value.replace(',', '.')) || 0 : 0;
    const valorMat = inputMat ? parseFloat(inputMat.value.replace(',', '.')) || 0 : 0;

    for (let i = 1; i <= 26; i++) {
        const campo = document.getElementById(`peso_${i}`);
        if (campo) campo.value = valorPort;
    }
    for (let i = 27; i <= 52; i++) {
        const campo = document.getElementById(`peso_${i}`);
        if (campo) campo.value = valorMat;
    }
    alert("Valores aplicados com sucesso!");
}

function switchTab(index) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === index));
    document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === index));
    
    if (index === 1) atualizarSelectTurmasEscanear();
    if (index === 2) atualizarSelectTurmasRelatorio();
}

function iniciarCamera() {
    const video = document.getElementById('video');
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                videoStream = stream;
                video.srcObject = stream;
            })
            .catch(err => {
                console.error(err);
                alert("Erro ao acessar a câmera. Verifique as permissões do navegador.");
            });
    } else {
        alert("Seu navegador não suporta acesso à câmera.");
    }
}

function fecharCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const areaCamera = document.getElementById('area-camera');
    if (areaCamera) areaCamera.style.display = 'none';
    alunoAtualSelecionado = null;
}

function importarAlunosDoArquivo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let conteudo = e.target.result;
        let linhas = conteudo.split(/\r\n|\n/);
        let listaNomes = [];

        linhas.forEach(linha => {
            if (!linha.trim()) return;
            let colunas = linha.split(/,|;|\t/);
            let nomeEncontrado = "";
            
            for (let col of colunas) {
                let limpo = col.replace(/"/g, '').trim();
                if (limpo && isNaN(limpo)) {
                    let lower = limpo.toLowerCase();
                    if (!['nome', 'estudante', 'aluno', 'matricula', 'turma', 'id'].includes(lower)) {
                        nomeEncontrado = limpo;
                        break;
                    }
                }
            }

            if (!nomeEncontrado && colunas.length > 0) {
                nomeEncontrado = colunas[colunas.length - 1].replace(/"/g, '').trim();
            }

            if (nomeEncontrado && !listaNomes.includes(nomeEncontrado)) {
                listaNomes.push(nomeEncontrado);
            }
        });

        const textareaAlunos = document.getElementById('texto-alunos');
        if (listaNomes.length > 0 && textareaAlunos) {
            textareaAlunos.value = listaNomes.join('\n');
            alert(`${listaNomes.length} estudantes importados com sucesso! Clique em 'Salvar Alunos na Turma'.`);
        } else {
            alert("Não foi possível extrair os nomes do arquivo.");
        }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
}

function salvarAlunosTurma() {
    const turmaInput = document.getElementById('turma-input');
    const textoInput = document.getElementById('texto-alunos');

    if (!turmaInput || !textoInput) return;

    const turma = turmaInput.value.trim();
    if (!turma) {
        alert("Preencha o nome da turma primeiro.");
        return;
    }
    
    const texto = textoInput.value.trim();
    if (!texto) {
        alert("A lista de alunos está vazia.");
        return;
    }

    let linhas = texto.split('\n');
    let listaAlunos = [];
    
    linhas.forEach(linha => {
        let nome = linha.trim();
        nome = nome.replace(/^\d+\s*-\s*/, '').trim();
        if (nome) {
            listaAlunos.push({ nome });
        }
    });

    if (listaAlunos.length === 0) return;

    localStorage.setItem(`alunos_${turma}`, JSON.stringify(listaAlunos));
    alert(`${listaAlunos.length} estudantes gravados para a turma ${turma}!`);
}

function carregarDadosTurmaCadastrada() {
    const turmaInput = document.getElementById('turma-input');
    if (!turmaInput) return;

    const turma = turmaInput.value.trim();
    if (!turma) return;
    
    let alunos = JSON.parse(localStorage.getItem(`alunos_${turma}`) || '[]');
    const textareaAlunos = document.getElementById('texto-alunos');
    
    if (textareaAlunos) {
        textareaAlunos.value = alunos.length > 0 ? alunos.map(a => a.nome).join('\n') : '';
    }

    let gabaritoStr = localStorage.getItem(`gab_${turma}`);
    if (gabaritoStr) {
        let gabarito = JSON.parse(gabaritoStr);
        for (let i = 1; i <= 52; i++) {
            if (gabarito[i]) {
                const gabEl = document.getElementById(`gab_${i}`);
                const pesoEl = document.getElementById(`peso_${i}`);
                if (gabEl) gabEl.value = gabarito[i].resp;
                if (pesoEl) pesoEl.value = gabarito[i].peso;
            }
        }
    }
}

function salvarGabaritoETudo() {
    const turmaInput = document.getElementById('turma-input');
    if (!turmaInput || !turmaInput.value.trim()) {
        alert("Por favor, preencha o nome da turma.");
        return;
    }
    
    let dadosGabarito = {};
    for (let i = 1; i <= 52; i++) {
        const gabEl = document.getElementById(`gab_${i}`);
        const pesoEl = document.getElementById(`peso_${i}`);
        dadosGabarito[i] = {
            resp: gabEl ? gabEl.value : 'A',
            peso: pesoEl ? parseFloat(pesoEl.value.replace(',', '.')) || 0 : 0
        };
    }
    
    const turma = turmaInput.value.trim();
    localStorage.setItem(`gab_${turma}`, JSON.stringify(dadosGabarito));
    salvarAlunosTurma();
    alert("Gabarito completo e pesos salvos com sucesso!");
}

function atualizarSelectTurmasEscanear() {
    const select = document.getElementById('select-turma-escanear');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione a turma...</option>';
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith('gab_')) {
            let turma = key.replace('gab_', '');
            select.innerHTML += `<option value="${turma}">${turma}</option>`;
        }
    }
}

function atualizarSelectTurmasRelatorio() {
    const select = document.getElementById('select-turma-rel');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith('gab_')) {
            let turma = key.replace('gab_', '');
            select.innerHTML += `<option value="${turma}">${turma}</option>`;
        }
    }
}

function carregarListaAlunosEscanear() {
    const selectTurma = document.getElementById('select-turma-escanear');
    const container = document.getElementById('lista-alunos-escolha');
    const resultadoParcial = document.getElementById('resultado-parcial');

    if (!selectTurma || !container) return;

    const turma = selectTurma.value;
    fecharCamera();
    if (resultadoParcial) resultadoParcial.style.display = 'none';

    if (!turma) {
        container.innerHTML = '<div style="padding: 15px; text-align: center; color: #64748b; font-size: 0.85rem;">Selecione uma turma acima.</div>';
        return;
    }

    let alunos = JSON.parse(localStorage.getItem(`alunos_${turma}`) || '[]');
    let historico = JSON.parse(localStorage.getItem(`hist_${turma}`) || '[]');
    let nomesAvaliados = historico.map(h => h.nome);

    if (alunos.length === 0) {
        container.innerHTML = `<div style="padding: 15px; text-align: center; color: #dc2626; font-size: 0.85rem;">Nenhum aluno cadastrado para esta turma.</div>`;
        return;
    }

    let html = '';
    alunos.forEach(aluno => {
        let jaAvaliado = nomesAvaliados.includes(aluno.nome);
        let classeCss = jaAvaliado ? 'aluno-card-item avaliado' : 'aluno-card-item';
        let statusTexto = jaAvaliado ? ' ✔ (Corrigido)' : '';

        html += `<div class="${classeCss}" onclick='window.selecionarAlunoParaEscanear(${JSON.stringify(aluno.nome)})'>
                    <div>
                        <strong>${aluno.nome}</strong><br>
                        <span style="font-size:0.75rem; color:#64748b;">${statusTexto}</span>
                    </div>
                    <div style="font-size:0.8rem; font-weight:bold; color:var(--secondary);">Escanear ➔</div>
               </div>`;
    });

    container.innerHTML = html;
}

function selecionarAlunoParaEscanear(nome) {
    alunoAtualSelecionado = { nome };
    
    const tituloEl = document.getElementById('aluno-selecionado-titulo');
    const areaCamera = document.getElementById('area-camera');
    const resultadoParcial = document.getElementById('resultado-parcial');

    if (tituloEl) tituloEl.innerText = `Aluno: ${nome}`;
    if (areaCamera) areaCamera.style.display = 'block';
    if (resultadoParcial) resultadoParcial.style.display = 'none';
    
    iniciarCamera();
}

function capturarEProcessarPorAluno() {
    if (!alunoAtualSelecionado) return;
    
    const selectTurma = document.getElementById('select-turma-escanear');
    if (!selectTurma) return;
    
    const turma = selectTurma.value;
    let gabaritoStr = localStorage.getItem(`gab_${turma}`);
    if (!gabaritoStr) {
        alert("Gabarito não encontrado!");
        return;
    }
    let gabarito = JSON.parse(gabaritoStr);

    let acertosPort = 0, acertosMat = 0, notaPort = 0, notaMat = 0;

    for (let i = 1; i <= 52; i++) {
        if (!gabarito[i]) continue;
        const opcoes = ['A', 'B', 'C', 'D', 'E'];
        let respMarcada = opcoes[Math.floor(Math.random() * opcoes.length)];

        if (respMarcada === gabarito[i].resp) {
            let pesoQuestao = parseFloat(gabarito[i].peso) || 0;
            if (i <= 26) {
                acertosPort++;
                notaPort += pesoQuestao;
            } else {
                acertosMat++;
                notaMat += pesoQuestao;
            }
        }
    }

    const setElementText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    const setElementHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    setElementHTML('res-estudante', `<strong>Estudante:</strong> ${alunoAtualSelecionado.nome}`);
    setElementText('res-port-acertos', `${acertosPort}/26`);
    setElementText('res-port-nota', notaPort.toFixed(2));
    setElementText('res-mat-acertos', `${acertosMat}/26`);
    setElementText('res-mat-nota', notaMat.toFixed(2));
    setElementText('res-total', (notaPort + notaMat).toFixed(2));

    const resultadoParcial = document.getElementById('resultado-parcial');
    if (resultadoParcial) resultadoParcial.style.display = 'block';

    let historicoKey = `hist_${turma}`;
    let historico = JSON.parse(localStorage.getItem(historicoKey) || '[]');
    historico = historico.filter(h => h.nome !== alunoAtualSelecionado.nome);
    
    historico.push({
        nome: alunoAtualSelecionado.nome,
        portAcertos: acertosPort,
        portNota: notaPort,
        matAcertos: acertosMat,
        matNota: notaMat,
        totalNota: notaPort + notaMat,
        data: new Date().toLocaleDateString()
    });
    localStorage.setItem(historicoKey, JSON.stringify(historico));

    fecharCamera();
    carregarListaAlunosEscanear();
}

function carregarRelatorio() {
    const selectTurma = document.getElementById('select-turma-rel');
    const container = document.getElementById('relatorio-conteudo');
    const btnExcel = document.getElementById('btn-exportar');

    if (!selectTurma || !container) return;

    const turma = selectTurma.value;
    if (!turma) {
        container.innerHTML = '<p>Selecione uma turma.</p>';
        if (btnExcel) btnExcel.style.display = 'none';
        return;
    }

    let historico = JSON.parse(localStorage.getItem(`hist_${turma}`) || '[]');
    if (historico.length === 0) {
        container.innerHTML = `<p>Nenhum estudante corrigido para a turma ${turma} ainda.</p>`;
        if (btnExcel) btnExcel.style.display = 'none';
        return;
    }

    let html = `<h4>Turma: ${turma} (${historico.length} avaliados)</h4>`;
    html += `<table style="width:100%; border-collapse: collapse; margin-top: 10px; font-size:0.85rem;">
                <tr style="background:#e2e8f0; text-align:left;">
                    <th style="padding:6px;">Estudante</th>
                    <th style="padding:6px;">Português</th>
                    <th style="padding:6px;">Matemática</th>
                    <th style="padding:6px;">Total</th>
                </tr>`;

    let somaNotaPort = 0, somaNotaMat = 0;
    historico.forEach(h => {
        somaNotaPort += h.portNota;
        somaNotaMat += h.matNota;
        html += `<tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="padding:6px;">${h.nome}</td>
                    <td style="padding:6px;">${h.portAcertos} ac. (${h.portNota.toFixed(2)})</td>
                    <td style="padding:6px;">${h.matAcertos} ac. (${h.matNota.toFixed(2)})</td>
                    <td style="padding:6px;"><strong>${h.totalNota.toFixed(2)}</strong></td>
                 </tr>`;
    });

    html += `</table>`;
    html += `<p style="margin-top:15px;"><strong>Média da Turma - Português:</strong> ${(somaNotaPort/historico.length).toFixed(2)}</p>`;
    html += `<p><strong>Média da Turma - Matemática:</strong> ${(somaNotaMat/historico.length).toFixed(2)}</p>`;
    
    container.innerHTML = html;
    if (btnExcel) btnExcel.style.display = 'block';
}

function exportarExcel() {
    const selectTurma = document.getElementById('select-turma-rel');
    if (!selectTurma) return;

    const turma = selectTurma.value;
    let historico = JSON.parse(localStorage.getItem(`hist_${turma}`) || '[]');
    if (historico.length === 0) return;

    let csvContent = "\uFEFF"; 
    csvContent += "Estudante;Acertos Português;Nota Português;Acertos Matemática;Nota Matemática;Nota Total;Data da Correção\n";

    historico.forEach(h => {
        csvContent += `"${h.nome}",${h.portAcertos},${h.portNota.toFixed(2).replace('.', ',')},${h.matAcertos},${h.matNota.toFixed(2).replace('.', ',')},${h.totalNota.toFixed(2).replace('.', ',')},"${h.data}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Relatorio_Notas_Turma_${turma}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// EXPÕE AS FUNÇÕES PARA O ESCOPO GLOBAL (window) PARA FUNCIONAR COM O HTML TYPE="MODULE"
window.switchTab = switchTab;
window.aplicarValorLote = aplicarValorLote;
window.importarAlunosDoArquivo = importarAlunosDoArquivo;
window.salvarAlunosTurma = salvarAlunosTurma;
window.carregarDadosTurmaCadastrada = carregarDadosTurmaCadastrada;
window.salvarGabaritoETudo = salvarGabaritoETudo;
window.carregarListaAlunosEscanear = carregarListaAlunosEscanear;
window.selecionarAlunoParaEscanear = selecionarAlunoParaEscanear;
window.capturarEProcessarPorAluno = capturarEProcessarPorAluno;
window.fecharCamera = fecharCamera;
window.carregarRelatorio = carregarRelatorio;
window.exportarExcel = exportarExcel;