const CHAVE_HISTORICO = 'focusEnemHistorico';
const CHAVE_META = 'focusEnemMeta';
const DURACAO_PAUSA = 5 * 60;

let tempoRestante = 0;
let timerInterval = null;
let modoAtual = 'foco';
let blocoAtual = null;

const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  $('meta').value = localStorage.getItem(CHAVE_META) || 4;
  atualizarTempoInicial();
  renderizarHistorico();
  atualizarProgresso();
});

$('duracao').addEventListener('input', atualizarTempoInicial);
$('meta').addEventListener('change', () => {
  const meta = Math.max(1, Math.min(30, parseInt($('meta').value) || 1));
  $('meta').value = meta;
  localStorage.setItem(CHAVE_META, meta);
  atualizarProgresso();
});
$('startBtn').addEventListener('click', iniciarTimeBox);
$('stopBtn').addEventListener('click', pararTimeBox);
$('limparBtn').addEventListener('click', limparHistorico);

function formatarTempo(segundos) {
  const min = String(Math.floor(segundos / 60)).padStart(2, '0');
  const seg = String(segundos % 60).padStart(2, '0');
  return `${min}:${seg}`;
}

function atualizarDisplay(segundos) {
  $('timer').textContent = formatarTempo(segundos);
}

function atualizarTempoInicial() {
  if (timerInterval !== null || modoAtual !== 'foco') return;
  const minutos = parseInt($('duracao').value);
  if (!isNaN(minutos) && minutos > 0) atualizarDisplay(minutos * 60);
}

function iniciarTimeBox() {
  if (timerInterval !== null) return;
  const minutos = parseInt($('duracao').value);
  const topico = $('topico').value.trim();
  if (isNaN(minutos) || minutos < 1 || minutos > 60) {
    alert('Informe uma duração entre 1 e 60 minutos.');
    return;
  }
  if (!topico) {
    alert('Informe o tópico que será estudado.');
    $('topico').focus();
    return;
  }

  modoAtual = 'foco';
  blocoAtual = { materia: $('materia').value, topico, minutos };
  iniciarContagem(minutos * 60);
  $('status').textContent = 'Bloco de foco em andamento.';
  atualizarBotoes(true);
}

function iniciarContagem(segundos) {
  tempoRestante = segundos;
  atualizarDisplay(tempoRestante);
  timerInterval = setInterval(() => {
    tempoRestante--;
    atualizarDisplay(tempoRestante);
    if (tempoRestante <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      finalizarFoco();
    }
  }, 1000);
}

function finalizarFoco() {
  registrarBloco(blocoAtual);
  atualizarProgresso();
  modoAtual = 'pausa';
  $('timer').classList.add('pause');
  $('status').textContent = 'Pausa obrigatória de 5 minutos. Relaxe e descanse!';
  $('startBtn').style.display = 'none';
  $('stopBtn').style.display = 'none';
  alert('⏰ Time Box concluída! A pausa obrigatória de 5 minutos começou.');
  iniciarContagem(DURACAO_PAUSA);
}

function finalizarPausa() {
  clearInterval(timerInterval);
  timerInterval = null;
  modoAtual = 'foco';
  $('timer').classList.remove('pause');
  $('status').textContent = 'Pausa concluída. Pronto para o próximo bloco!';
  $('stopBtn').textContent = 'Interromper Bloco';
  atualizarBotoes(false);
  atualizarTempoInicial();
  alert('✅ Pausa concluída! Você pode iniciar um novo bloco.');
}

function pararTimeBox() {
  if (modoAtual === 'pausa') {
    finalizarPausa();
    return;
  }
  clearInterval(timerInterval);
  timerInterval = null;
  modoAtual = 'foco';
  blocoAtual = null;
  $('status').textContent = 'Bloco interrompido.';
  atualizarBotoes(false);
  atualizarTempoInicial();
}

function atualizarBotoes(rodando) {
  $('startBtn').style.display = rodando ? 'none' : 'block';
  $('stopBtn').style.display = rodando ? 'block' : 'none';
  $('duracao').disabled = rodando;
  $('materia').disabled = rodando;
  $('topico').disabled = rodando;
}

function obterHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || []; }
  catch { return []; }
}

function registrarBloco(bloco) {
  const historico = obterHistorico();
  historico.push({ ...bloco, data: new Date().toISOString() });
  localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
  renderizarHistorico();
}

function renderizarHistorico() {
  const lista = $('listaHistorico');
  const historico = obterHistorico().reverse();
  lista.innerHTML = '';
  if (historico.length === 0) {
    lista.innerHTML = '<li class="empty">Nenhum bloco concluído ainda.</li>';
    return;
  }
  historico.forEach((bloco) => {
    const data = new Date(bloco.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const item = document.createElement('li');
    item.textContent = `✅ ${bloco.materia} — ${bloco.topico} (${bloco.minutos} min) · ${data}`;
    lista.appendChild(item);
  });
}

function blocosDeHoje() {
  const hoje = new Date().toLocaleDateString('pt-BR');
  return obterHistorico().filter((bloco) => new Date(bloco.data).toLocaleDateString('pt-BR') === hoje).length;
}

function atualizarProgresso() {
  const meta = Math.max(1, parseInt($('meta').value) || 1);
  const concluidos = blocosDeHoje();
  $('contador').textContent = `${concluidos} / ${meta} blocos`;
  $('progresso').max = meta;
  $('progresso').value = Math.min(concluidos, meta);
}

function limparHistorico() {
  if (!confirm('Deseja apagar todo o histórico salvo neste navegador?')) return;
  localStorage.removeItem(CHAVE_HISTORICO);
  renderizarHistorico();
  atualizarProgresso();
}

