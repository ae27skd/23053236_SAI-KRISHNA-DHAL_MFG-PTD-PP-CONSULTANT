const state = {
  currentStep: 1,
  documents: {},
  counters: {
    PR:  Math.floor(10000000  + Math.random() * 89999999),
    RFQ: Math.floor(6000000000 + Math.random() * 99999999),
    PO:  Math.floor(4500000000 + Math.random() * 99999999),
    GR:  Math.floor(5000000000 + Math.random() * 99999999),
    IV:  Math.floor(5100000000 + Math.random() * 99999999),
    PAY: 'PAY-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*999)).padStart(3,'0'),
  }
};

const stepMeta = [
  null,
  { label: 'Purchase Requisition', badge: 'PR',  color: '#185FA5', tables: 'EBAN',             acc: 'No FI posting' },
  { label: 'RFQ / Quotation',      badge: 'RFQ', color: '#5B21B6', tables: 'EKKO, EKPO (AN)',  acc: 'None' },
  { label: 'Purchase Order',       badge: 'PO',  color: '#854F0B', tables: 'EKKO, EKPO',        acc: 'Commitment created' },
  { label: 'Goods Receipt',        badge: 'GR',  color: '#0F6E56', tables: 'MKPF, MSEG, MARD', acc: 'Dr Stock / Cr GR/IR' },
  { label: 'Invoice Verification', badge: 'IV',  color: '#993C1D', tables: 'BKPF, BSEG, BSIK', acc: 'Dr GR/IR / Cr Vendor' },
  { label: 'Vendor Payment',       badge: 'PAY', color: '#3B6D11', tables: 'BKPF, BSEG, BSAK', acc: 'Dr Vendor / Cr Bank' },
];

const tcodes = ['', 'ME51N', 'ME41/ME47/ME49', 'ME21N', 'MIGO (101)', 'MIRO', 'F110'];

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  setTimeout(() => { t.className = 'toast hidden'; }, 2800);
}

function validate(step) {
  const checks = {
    1: [['pr-material','Material description'], ['pr-qty','Quantity'], ['pr-dept','Department']],
    2: [['rfq-v1','Vendor 1 name'], ['rfq-p1','Vendor 1 price'], ['rfq-v2','Vendor 2 name'], ['rfq-p2','Vendor 2 price']],
    3: [['po-vendor','Vendor name'], ['po-price','Unit price']],
    4: [['gr-qty','GR quantity'], ['gr-sloc','Storage location']],
    5: [['iv-qty','Invoice quantity'], ['iv-inv','Invoice number'], ['iv-amount','Invoice amount']],
    6: [['pay-bank','Bank account'], ['pay-runid','Payment run ID']],
  };
  for (const [id, label] of (checks[step] || [])) {
    if (!getVal(id)) {
      showToast(label + ' is required', 'error');
      document.getElementById(id) && document.getElementById(id).focus();
      return false;
    }
  }
  if (step === 5) {
    const grQty = parseInt(state.documents.GR && state.documents.GR.qty || 0);
    const ivQty = parseInt(getVal('iv-qty'));
    if (ivQty > grQty) {
      showToast('Invoice qty exceeds GR qty — 3-way match failed!', 'error');
      return false;
    }
  }
  return true;
}

function compareRFQ() {
  const vendors = [
    { name: getVal('rfq-v1') || 'Vendor 1', price: parseFloat(getVal('rfq-p1')) || 0 },
    { name: getVal('rfq-v2') || 'Vendor 2', price: parseFloat(getVal('rfq-p2')) || 0 },
    { name: getVal('rfq-v3') || 'Vendor 3', price: parseFloat(getVal('rfq-p3')) || 0 },
  ].filter(function(v) { return v.price > 0; });

  const minPrice = Math.min.apply(null, vendors.map(function(v) { return v.price; }));
  const winner   = vendors.find(function(v) { return v.price === minPrice; });

  const cmp = document.getElementById('rfq-compare');
  cmp.innerHTML = '<table class="rfq-table"><thead><tr><th>Vendor</th><th>Quoted Price (per unit)</th><th>Status</th></tr></thead><tbody>' +
    vendors.map(function(v) {
      return '<tr class="' + (v.price === minPrice ? 'winner' : '') + '"><td>' + v.name + '</td><td>Rs.' + v.price.toLocaleString('en-IN') + '</td><td>' + (v.price === minPrice ? 'Selected (Lowest)' : '-') + '</td></tr>';
    }).join('') + '</tbody></table>';
  cmp.classList.add('visible');

  if (winner) {
    document.getElementById('rfq-selected').value = winner.name + ' @ Rs.' + winner.price + '/unit';
    var poVendor = document.getElementById('po-vendor');
    var poPrice  = document.getElementById('po-price');
    if (poVendor) poVendor.value = winner.name;
    if (poPrice)  poPrice.value  = winner.price;
    showToast('ME49: ' + winner.name + ' selected at Rs.' + winner.price + '/unit', 'success');
  }
}

function submitStep(step) {
  if (!validate(step)) return;

  if (step === 1) {
    state.documents.PR = {
      num: 'PR-' + state.counters.PR,
      material: getVal('pr-material'),
      qty: getVal('pr-qty'),
      uom: getVal('pr-uom'),
      dept: getVal('pr-dept'),
      plant: getVal('pr-plant'),
    };
    showToast('PR ' + state.documents.PR.num + ' created successfully', 'success');

  } else if (step === 2) {
    if (!getVal('rfq-selected')) compareRFQ();
    state.documents.RFQ = {
      num: state.counters.RFQ.toString(),
      selected: getVal('rfq-selected'),
    };
    showToast('RFQ ' + state.documents.RFQ.num + ' complete — vendor selected, PO pre-filled', 'success');

  } else if (step === 3) {
    var qty   = parseInt(state.documents.PR && state.documents.PR.qty || 0);
    var price = parseFloat(getVal('po-price'));
    state.documents.PO = {
      num:    state.counters.PO.toString(),
      vendor: getVal('po-vendor'),
      qty:    qty,
      price:  price,
      total:  qty * price,
      terms:  getVal('po-terms'),
    };
    showToast('PO ' + state.documents.PO.num + ' created — Rs.' + state.documents.PO.total.toLocaleString('en-IN'), 'success');

  } else if (step === 4) {
    state.documents.GR = {
      num:  state.counters.GR.toString(),
      qty:  parseInt(getVal('gr-qty')),
      sloc: getVal('gr-sloc'),
      dn:   getVal('gr-dn'),
    };
    updateMatchPanel();
    showToast('GR ' + state.documents.GR.num + ' posted — stock updated', 'success');

  } else if (step === 5) {
    state.documents.IV = {
      num:    state.counters.IV.toString(),
      invNo:  getVal('iv-inv'),
      qty:    parseInt(getVal('iv-qty')),
      amount: parseFloat(getVal('iv-amount')),
    };
    showToast('Invoice ' + state.documents.IV.invNo + ' posted — vendor open item created', 'success');

  } else if (step === 6) {
    state.documents.PAY = {
      num:    state.counters.PAY,
      method: getVal('pay-method'),
      bank:   getVal('pay-bank'),
      amount: state.documents.IV && state.documents.IV.amount || 0,
    };
    showToast('Payment executed — vendor open item cleared!', 'success');
    setTimeout(showSummary, 600);
    return;
  }

  activateStep(step + 1);
}

function goBack(step) {
  activateStep(step - 1);
}

function activateStep(n) {
  state.currentStep = n;
  document.querySelectorAll('.form-card').forEach(function(c) { c.classList.remove('active'); });
  var card = document.getElementById('form-step-' + n);
  if (card) card.classList.add('active');

  document.querySelectorAll('.step').forEach(function(s, i) {
    var sn = i + 1;
    s.classList.remove('active', 'completed');
    if (sn < n)  s.classList.add('completed');
    if (sn === n) s.classList.add('active');
  });

  document.querySelectorAll('.step-connector').forEach(function(c, i) {
    c.classList.toggle('completed', i + 1 < n);
  });

  if (n === 5) updateMatchPanel();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateMatchPanel() {
  var poQty = state.documents.PO && state.documents.PO.qty || '—';
  var grQty = state.documents.GR && state.documents.GR.qty || '—';
  var pqEl  = document.getElementById('match-po-qty');
  var gqEl  = document.getElementById('match-gr-qty');
  if (pqEl) pqEl.textContent = poQty;
  if (gqEl) gqEl.textContent = grQty;
  var ivInput = document.getElementById('iv-qty');
  if (ivInput && state.documents.GR) ivInput.value = state.documents.GR.qty;
}

function showSummary() {
  document.querySelectorAll('.form-card').forEach(function(c) { c.classList.remove('active'); });
  document.querySelectorAll('.step').forEach(function(s) { s.classList.add('completed'); });
  document.querySelectorAll('.step-connector').forEach(function(c) { c.classList.add('completed'); });

  var panel = document.getElementById('summary-panel');
  panel.classList.remove('hidden');

  var docs = [
    { label: 'PR',      num: state.documents.PR  && state.documents.PR.num   || '—' },
    { label: 'RFQ',     num: state.documents.RFQ && state.documents.RFQ.num  || '—' },
    { label: 'PO',      num: state.documents.PO  && state.documents.PO.num   || '—' },
    { label: 'GR',      num: state.documents.GR  && state.documents.GR.num   || '—' },
    { label: 'Invoice', num: state.documents.IV  && state.documents.IV.invNo || '—' },
    { label: 'Payment', num: state.documents.PAY && state.documents.PAY.num  || '—' },
  ];
  document.getElementById('doc-chain').innerHTML = docs.map(function(d, i) {
    return '<div class="doc-chip"><span>' + d.label + '</span><span class="doc-num">' + d.num + '</span></div>' +
      (i < docs.length - 1 ? '<span class="doc-arrow">→</span>' : '');
  }).join('');

  var colors = ['#185FA5','#5B21B6','#854F0B','#0F6E56','#993C1D','#3B6D11'];
  document.getElementById('summary-body').innerHTML = stepMeta.slice(1).map(function(m, i) {
    return '<tr><td><span class="step-badge" style="background:' + colors[i] + '18;color:' + colors[i] + '">' + m.badge + '</span></td>' +
      '<td>' + m.label + '</td>' +
      '<td style="font-family:monospace;font-size:11px">' + tcodes[i+1] + '</td>' +
      '<td style="font-family:monospace;font-size:11px;color:#555">' + m.tables + '</td>' +
      '<td style="font-size:12px;color:#555">' + m.acc + '</td></tr>';
  }).join('');

  panel.scrollIntoView({ behavior: 'smooth' });
}

function restartCycle() {
  state.currentStep = 1;
  state.documents   = {};
  state.counters.PR  = Math.floor(10000000  + Math.random() * 89999999);
  state.counters.RFQ = Math.floor(6000000000 + Math.random() * 99999999);
  state.counters.PO  = Math.floor(4500000000 + Math.random() * 99999999);
  state.counters.GR  = Math.floor(5000000000 + Math.random() * 99999999);
  state.counters.IV  = Math.floor(5100000000 + Math.random() * 99999999);
  state.counters.PAY = 'PAY-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*999)).padStart(3,'0');

  document.getElementById('summary-panel').classList.add('hidden');
  var cmp = document.getElementById('rfq-compare');
  if (cmp) { cmp.classList.remove('visible'); cmp.innerHTML = ''; }
  var sel = document.getElementById('rfq-selected');
  if (sel) sel.value = '';
  activateStep(1);

  var today = new Date().toISOString().split('T')[0];
  ['pr-date','rfq-validity','iv-date','pay-date'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = today;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var today = new Date().toISOString().split('T')[0];
  ['pr-date','rfq-validity','iv-date','pay-date'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = today;
  });
});
