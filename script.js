let alunoAtualSelecionado = null;

function criarCamposGabarito() {
    const gridPort = document.getElementById('grid-port');
    const gridMat = document.getElementById('grid-mat');

    for (let i = 1; i <= 26; i++) {
        gridPort.innerHTML += `
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
        gridMat.innerHTML += `
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
}
criarCamposGabarito();

function aplicarValorLote() {
    const valorPort = parseFloat(document.getElementById('lote-port').value) || 0;
    const valorMat = parseFloat(document.getElementById('lote-mat').value) || 0;

    for (let i = 1; i <= 26; i++) {
        document.getElementById(`peso_${i}`).value = valorPort;
    }
    for (let i = 27; i <= 52; i++) {
        document.getElementById(`peso_${i}`).value = valorMat;
    }
    alert("Valores aplicados com sucesso!");
}

function switchTab(index) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === index));
    document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === index));
    if (index === 1) atualizarSelectTurmasEscanear();
    if (index === 2) atualizarSelectTurmasRelatorio();
}

let videoStream = null;
function iniciarCamera() {
    const video = document.getElementById('video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                videoStream = stream;
                video.srcObject = stream;
            })
            .catch(err => alert("Erro ao acessar a câmera. Verifique as permissões do navegador."));
    }
}

function fecharCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('area-camera').style.display = 'none';
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
            let partes = linha.split(/,|;|\t/);
            if (partes.length >= 2) {
                let matricula = partes[0].replace(/"/g, '').trim();
                let nome = partes[1].replace(/"/g, '').trim();
                if (matricula && nome && matricula.toLowerCase() !== 'matricula') {
                    textoFormatado += `${matricula} - ${nome}\n`;
                }
            }
        });

        if (textoFormatado) {
            document.getElementById('texto-alunos').value = textoFormatado.trim();
            alert("Alunos importados com sucesso para a caixa de texto! Clique em 'Salvar Alunos na Turma' para gravar.");
        } else {
            alert("Não foi possível ler o arquivo. Certifique-se de que ele possui as colunas de Matrícula e Nome.");
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function salvarAlunosTurma() {
    const turma = document.getElementById('turma-input').value.trim();
    if (!turma) {
        alert("Preencha o nome da turma primeiro.");
        return;
    }
    const texto = document.getElementById('texto-alunos').value.trim();
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
            listaAlunos.push({ matricula, nome });
        }
    });

    localStorage.setItem(`alunos_${turma}`, JSON.stringify(listaAlunos));
    alert(`${listaAlunos.length} estudantes gravados permanentemente para a turma ${turma}!`);
}

function carregarDadosTurmaCadastrada() {
    const turma = document.getElementById('turma-input').value.trim();
    if (!turma) return;
    
    let alunos = JSON.parse(localStorage.getItem(`alunos_${turma}`) || '[]');
    if (alunos.length > 0) {
        document.getElementById('texto-alunos').value = alunos.map(a => `${a.matricula} - ${a.nome}`).join('\n');
    } else {
        document.getElementById('texto-alunos').value = '';
    }

    let gabaritoStr = localStorage.getItem(`gab_${turma}`);
    if (gabaritoStr) {
        let gabarito = JSON.parse(gabaritoStr);
        for (let i = 1; i <= 52; i++) {
            if (gabarito[i]) {
                document.getElementById(`gab_${i}`).value = gabarito[i].resp;
                document.getElementById(`peso_${i}`).value = gabarito[i].peso;
            }
        }
    }
}

function salvarGabaritoETudo() {
    const turma = document.getElementById('turma-input').value.trim();
    if (!turma) {
        alert("Por favor, preencha o nome da turma.");
        return;
    }
    let dadosGabarito = {};
    for (let i = 1; i <= 52; i++) {
        dadosGabarito[i] = {
            resp: document.getElementById(`gab_${i}`).value,
            peso: parseFloat(document.getElementById(`peso_${i}`).value) || 0
        };
    }
    localStorage.setItem(`gab_${turma}`, JSON.stringify(dadosGabarito));
    salvarAlunosTurma();
}

function atualizarSelectTurmasEscanear() {
    const select = document.getElementById('select-turma-escanear');
    select.innerHTML = '<option value="">Selecione a turma...</option>';
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('gab_')) {
            let turma = key.replace('gab_', '');
            select.innerHTML += `<option value="${turma}">${turma}</option>`;
        }
    }
}

function atualizarSelectTurmasRelatorio() {
    const select = document.getElementById('select-turma-rel');
    select.innerHTML = '<option value="">Selecione...</option>';
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('gab_')) {
            let turma = key.replace('gab_', '');
            select.innerHTML += `<option value="${turma}">${turma}</option>`;
        }
    }
}

function carregarListaAlunosEscanear() {
    const turma = document.getElementById('select-turma-escanear').value;
    const container = document.getElementById('lista-alunos-escolha');
    fecharCamera();
    document.getElementById('resultado-parcial').style.display = 'none';

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

        html += `<div class="${classeCss}" onclick='selecionarAlunoParaEscanear("${aluno.matricula}", "${aluno.nome}")'>
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
    document.getElementById('aluno-selecionado-titulo').innerText = `Aluno: ${nome}`;
    document.getElementById('area-camera').style.display = 'block';
    document.getElementById('resultado-parcial').style.display = 'none';
    iniciarCamera();
    window.scrollTo({ top: document.getElementById('area-camera').offsetTop, behavior: 'smooth' });
}

function capturarEProcessarPorAluno() {
    if (!alunoAtualSelecionado) return;
    const turma = document.getElementById('select-turma-escanear').value;
    
    let gabaritoStr = localStorage.getItem(`gab_${turma}`);
    if (!gabaritoStr) {
        alert("Gabarito não encontrado!");
        return;
    }
    let gabarito = JSON.parse(gabaritoStr);

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let acertosPort = 0, acertosMat = 0, notaPort = 0, notaMat = 0;

    for (let i = 1; i <= 52; i++) {
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

    document.getElementById('res-estudante').innerHTML = `<strong>Estudante:</strong> ${alunoAtualSelecionado.nome} (Matrícula: ${alunoAtualSelecionado.matricula})`;
    document.getElementById('res-port-acertos').innerText = `${acertosPort}/26`;
    document.getElementById('res-port-nota').innerText = notaPort.toFixed(2);
    document.getElementById('res-mat-acertos').innerText = `${acertosMat}/26`;
    document.getElementById('res-mat-nota').innerText = notaMat.toFixed(2);
    document.getElementById('res-total').innerText = (notaPort + notaMat).toFixed(2);
    document.getElementById('resultado-parcial').style.display = 'block';

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
    const turma = document.getElementById('select-turma-rel').value;
    const container = document.getElementById('relatorio-conteudo');
    const btnExcel = document.getElementById('btn-exportar');

    if (!turma) {
        container.innerHTML = '<p>Selecione uma turma.</p>';
        btnExcel.style.display = 'none';
        return;
    }

    let historico = JSON.parse(localStorage.getItem(`hist_${turma}`) || '[]');
    if (historico.length === 0) {
        container.innerHTML = `<p>Nenhum estudante corrigido para a turma ${turma} ainda.</p>`;
        btnExcel.style.display = 'none';
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
                    <td style="padding:6px;">${h.matAcertos} ac. (${h.matNota.toFixed(2)})</td>
                    <td style="padding:6px;"><strong>${h.totalNota.toFixed(2)}</strong></td>
                 </tr>`;
    });

    html += `</table>`;
    html += `<p style="margin-top:15px;"><strong>Média da Turma - Português:</strong> ${(somaNotaPort/historico.length).toFixed(2)}</p>`;
    html += `<p><strong>Média da Turma - Matemática:</strong> ${(somaNotaMat/historico.length).toFixed(2)}</p>`;
    
    container.innerHTML = html;
    btnExcel.style.display = 'block';
}

function exportarExcel() {
    const turma = document.getElementById('select-turma-rel').value;
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