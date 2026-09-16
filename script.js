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
    
    const valorPort = inputPort ? parseFloat(inputPort.value) || 0 : 0;
    const valorMat = inputMat ? parseFloat(inputMat.value) || 0 : 0;

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
                alert("Erro ao acessar a câmera. Verifique as permissões do navegador ou se há outro aplicativo utilizando-a.");
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
        let textoFormatado = "";

        linhas.forEach(linha => {
            if (!linha.trim()) return;
            // Trata separadores comuns (vírgula, ponto e vírgula, tabulação)
            let partes = linha.split(/,|;|\t/);
            if (partes.length >= 2) {
                let matricula = partes[0].replace(/"/g, '').trim();
                let nome = partes[1].replace(/"/g, '').trim();
                if (matricula && nome && matricula.toLowerCase() !== 'matricula') {
                    textoFormatado += `${matricula} - ${nome}\n`;
                }
            }
        });

        const textareaAlunos = document.getElementById('texto-alunos');
        if (textoFormatado && textareaAlunos) {
            textareaAlunos.value = textoFormatado.trim();
            alert("Alunos importados com sucesso para a caixa de texto! Clique em 'Salvar Alunos na Turma' para gravar.");
        } else {
            alert("Não foi possível ler o arquivo. Certifique-se de que ele possui as colunas de Matrícula e Nome separadas por vírgula, ponto-e-vírgula ou tabulação.");
        }
    };
    reader.readAsText(file, 'UTF-8');
    // Limpa o input file para permitir reimportar o mesmo arquivo se necessário
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
        let partes = linha.split('-');
        if (partes.length >= 2) {
            let matricula = partes[0].trim();
            let nome = partes.slice(1).join('-').trim();
            if (matricula && nome) {
                listaAlunos.push({ matricula, nome });
            }
        }
    });

    if (listaAlunos.length === 0) {
        alert("Nenhum aluno válido encontrado. O formato deve ser: Matrícula - Nome");
        return;
    }

    localStorage.setItem(`alunos_${turma}`, JSON.stringify(listaAlunos));
    alert(`${listaAlunos.length} estudantes gravados permanentemente para a turma ${turma}!`);
}

function carregarDadosTurmaCadastrada() {
    const turmaInput = document.getElementById('turma-input');
    if (!turmaInput) return;

    const turma = turmaInput.value.trim();
    if (!turma) return;
    
    let alunos = JSON.parse(localStorage.getItem(`alunos_${turma}`) || '[]');
    const textareaAlunos = document.getElementById('texto-alunos');
    
    if (textareaAlunos) {
        textareaAlunos.value = alunos.length > 0 ? alunos.map(a => `${a.matricula} - ${a.nome}`).join('\n') : '';
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
            peso: pesoEl ? parseFloat(pesoEl.value) || 0 : 0
        };
    }
    
    const turma = turmaInput.value.trim();
    localStorage.setItem(`gab_${turma}`, JSON.stringify(dadosGabarito));
    salvarAlunosTurma();
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
    let matriculasAvaliadas = historico.map(h => h.matricula);

    if (alunos.length === 0) {
        container.innerHTML = `<div style="padding: 15px; text-align: center; color: #dc2626; font-size: 0.85rem;">Nenhum aluno cadastrado para esta turma. Cadastre na Aba 1.</div>`;
        return;
    }

    let html = '';
    alunos.forEach(aluno => {
        let jaAvaliado = matriculasAvaliadas.includes(aluno.matricula);
        let classeCss = jaAvaliado ? 'aluno-card-item avaliado' : 'aluno-card-item';
        let statusTexto = jaAvaliado ? ' ✔ (Corrigido)' : '';

        // Usando atributos seguros ou chamadas limpas
        html += `<div class="${classeCss}" onclick='selecionarAlunoParaEscanear("${aluno.matricula}", ${JSON.stringify(aluno.nome)})'>
                    <div>
                        <strong>${aluno.nome}</strong><br>
                        <span style="font-size:0.75rem; color:#64748b;">Mat: ${aluno.matricula}${statusTexto}</span>
                    </div>
                    <div style="font-size:0.8rem; font-weight:bold; color:var(--secondary);">Escanear ➔</div>
                 </div>`;
    });

    container.innerHTML = html;
}

function selecionarAlunoParaEscanear(matricula, nome) {
    alunoAtualSelecionado = { matricula, nome };
    
    const tituloEl = document.getElementById('aluno-selecionado-titulo');
    const areaCamera = document.getElementById('area-camera');
    const resultadoParcial = document.getElementById('resultado-parcial');

    if (tituloEl) tituloEl.innerText = `Aluno: ${nome}`;
    if (areaCamera) areaCamera.style.display = 'block';
    if (resultadoParcial) resultadoParcial.style.display = 'none';
    
    iniciarCamera();
    
    const areaCameraEl = document.getElementById('area-camera');
    if (areaCameraEl) {
        window.scrollTo({ top: areaCameraEl.offsetTop, behavior: 'smooth' });
    }
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

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    if (video && canvas) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    let acertosPort = 0, acertosMat = 0, notaPort = 0, notaMat = 0;

    for (let i = 1; i <= 52; i++) {
        if (!gabarito[i]) continue;
        const opcoes = ['A', 'B', 'C', 'D', 'E'];
        let respMarcada = opcoes[Math.floor(Math.random() * opcoes.length)];

        if (respMarcada === gabarito[i].resp) {
            if (i <= 26) {
                acertosPort++;
                notaPort += gabarito[i].peso;
            } else {
                acertosMat++;
                notaMat += gabarito[i].peso;
            }
        }
    }

    // Preenche elementos de resultado parcial de forma segura
    const setElementText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    const setElementHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    setElementHTML('res-estudante', `<strong>Estudante:</strong> ${alunoAtualSelecionado.nome} (Matrícula: ${alunoAtualSelecionado.matricula})`);
    setElementText('res-port-acertos', `${acertosPort}/26`);
    setElementText('res-port-nota', notaPort.toFixed(2));
    setElementText('res-mat-acertos', `${acertosMat}/26`);
    setElementText('res-mat-nota', notaMat.toFixed(2));
    setElementText('res-total', (notaPort + notaMat).toFixed(2));

    const resultadoParcial = document.getElementById('resultado-parcial');
    if (resultadoParcial) resultadoParcial.style.display = 'block';

    let historicoKey = `hist_${turma}`;
    let historico = JSON.parse(localStorage.getItem(historicoKey) || '[]');
    historico = historico.filter(h => h.matricula !== alunoAtualSelecionado.matricula);
    
    historico.push({
        matricula: alunoAtualSelecionado.matricula,
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
                    <th style="padding:6px;">Matrícula</th>
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
                    <td style="padding:6px;">${h.matricula}</td>
                    <td style="padding:6px;">${h.nome}</td>
                    <td style="padding:6px;">${h.portAcertos} ac. (${h.portNota.toFixed(2)})</td>
                    <td style="padding:6px;">${h.matAcertos} ac. (${h.matNota.bug ? 0 : h.matNota.toFixed(2)})</td>
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
    csvContent += "Matrícula;Estudante;Acertos Português;Nota Português;Acertos Matemática;Nota Matemática;Nota Total;Data da Correção\n";

    historico.forEach(h => {
        csvContent += `"${h.matricula}","${h.nome}",${h.portAcertos},${h.portNota.toFixed(2).replace('.', ',')},${h.matAcertos},${h.matNota.toFixed(2).replace('.', ',')},${h.totalNota.toFixed(2).replace('.', ',')},"${h.data}"\n`;
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