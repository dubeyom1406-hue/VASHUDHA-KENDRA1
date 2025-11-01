/* ========================== CONFIG ========================== */
const ownerWhatsAppNumber = "919931426338";
const ownerEmail = "vashudhakendra@gmail.com";
const RAZORPAY_KEY = "rzp_test_YourKeyHere";

/* ========================== DATA ========================== */
const services = [
  { name: "पैन कार्ड", price: 200 },
  { name: "आवासीय प्रमाण पत्र", price: 40 },
  { name: "जाति प्रमाण पत्र", price: 40 },
  { name: "आय प्रमाण पत्र", price: 40 },
  { name: "टिकट", price: 100 },
  { name: "आयुष्मान भारत योजना", price: 100 },
  { name: "दाखिल खारिज", price: 200 },
  { name: "वोटर कार्ड", price: 200 },
  { name: "पासपोर्ट", price: 200 },
  { name: "पंजीकरण", price: 100 }
];

/* ========================== ELEMENTS ========================== */
const serviceList = document.getElementById("serviceList");
const cartItems = document.getElementById("cartItems");
const totalDisplay = document.getElementById("total");
const cartBox = document.getElementById("cartBox");
const bookingModal = document.getElementById("bookingModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const bookingForm = document.getElementById("bookingInfoForm");
const modalMsg = document.getElementById("modalMsg");
const slipArea = document.getElementById("slipArea");
const downloadSlip = document.getElementById("downloadSlip");
const feedbackModal = document.getElementById("feedbackModal");
const messageModal = document.getElementById("messageModal");
const feedbackForm = document.getElementById("feedbackForm");
const messageForm = document.getElementById("messageForm");
const payCashBtn = document.getElementById("payCashBtn");
const payOnlineBtn = document.getElementById("payOnlineBtn");
const paymentActions = document.getElementById("paymentActions");

/* ========================== STATE ========================== */
let total = 0;
let selected = {};
let currentBooking = null;
let paymentMode = null;

/* ========================== TOAST ========================== */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ========================== RENDER ========================== */
function renderServices(filter = '') {
  serviceList.innerHTML = '';
  services
    .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'service';
      div.innerHTML = `
        <div class="meta">
          <div style="font-weight:700">${s.name}</div>
          <div style="color:var(--muted);font-size:13px">₹${s.price}</div>
        </div>
        <div>
          <div class="qty">
            <button onclick="decrease(${i})">−</button>
            <div id="count-${i}" style="min-width:30px;text-align:center">0</div>
            <button onclick="increase(${i})">+</button>
          </div>
          <button onclick="removeAll(${i})" style="margin-left:8px;background:transparent;color:#ff9b9b;border:1px solid rgba(255,0,0,0.06);font-size:12px;">Remove</button>
        </div>`;
      serviceList.appendChild(div);
    });
}
function increase(i) { selected[services[i].name] = (selected[services[i].name] || 0) + 1; updateCount(i); renderCart(); }
function decrease(i) { if (selected[services[i].name] > 0) selected[services[i].name]--; updateCount(i); renderCart(); }
function removeAll(i) { selected[services[i].name] = 0; updateCount(i); renderCart(); }
function updateCount(i) { document.getElementById(`count-${i}`).textContent = selected[services[i].name] || 0; }

function renderCart() {
  cartItems.innerHTML = '';
  total = 0;
  Object.entries(selected).forEach(([name, qty]) => {
    if (qty > 0) {
      const service = services.find(s => s.name === name);
      const li = document.createElement('li');
      li.innerHTML = `${name} — ${qty} × ₹${service.price} = ₹${qty * service.price}`;
      cartItems.appendChild(li);
      total += qty * service.price;
    }
  });
  totalDisplay.textContent = total;
  cartBox.style.display = total > 0 ? 'block' : 'none';
}

/* ========================== MENU & SEARCH ========================== */
document.getElementById('searchInput').addEventListener('input', e => renderServices(e.target.value.trim()));
function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}
document.addEventListener('click', e => {
  const menu = document.getElementById('menu');
  if (!e.target.closest('.hamburger') && !e.target.closest('#menu') && window.innerWidth <= 820) {
    menu.style.display = 'none';
  }
});

/* ========================== BOOKING MODAL ========================== */
document.getElementById('openBooking').addEventListener('click', () => {
  const items = Object.entries(selected).filter(([k,v]) => v > 0);
  if (!items.length) return showToast("कम से कम एक सेवा चुनें।", "error");
  bookingModal.style.display = 'flex';
});
document.getElementById('closeBookingModal').addEventListener('click', () => bookingModal.style.display = 'none');
bookingModal.addEventListener('click', e => { if (e.target === bookingModal) bookingModal.style.display = 'none'; });

bookingForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('bookingName').value.trim();
  const phone = document.getElementById('bookingPhone').value.trim();
  if (!name || !phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
    return showToast("सही नाम और 10 अंक का मोबाइल डालें।", "error");
  }

  const simpleMsg = `नया बुकिंग:\nनाम: ${name}\nमोबाइल: ${phone}\nसमय: ${new Date().toLocaleString()}`;
  window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(simpleMsg)}`, '_blank');

  currentBooking = {
    name, phone,
    items: Object.entries(selected).filter(([k,v])=>v>0).map(([n,c])=>({name:n,qty:c,price:services.find(x=>x.name===n).price})),
    total
  };
  paymentMode = null;

  bookingModal.style.display = 'none';
  modalBackdrop.style.display = 'flex';
  modalMsg.innerHTML = `<p style="text-align:center;">पेमेंट कैसे करेंगे?</p>`;
  slipArea.style.display = 'none';
});

/* ========================== PAYMENT ========================== */
document.getElementById('payCashBtn').addEventListener('click', () => {
  paymentMode = 'Cash';
  payOnlineBtn.style.display = 'none';

  let msg = `पेमेंट: Cash\nनाम: ${currentBooking.name}\nमोबाइल: ${currentBooking.phone}\nकुल: ₹${currentBooking.total}\n`;
  currentBooking.items.forEach(i => { msg += `${i.name} × ${i.qty} = ₹${i.qty * i.price}\n`; });
  msg += `समय: ${new Date().toLocaleString()}`;
  window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(msg)}`, '_blank');

  generateSlip();
  slipArea.style.display = 'block';
  modalMsg.innerHTML = `<p style="color:#66fcf1;">Cash पेमेंट कन्फर्म!</p>`;
});

document.getElementById('payOnlineBtn').addEventListener('click', () => {
  paymentMode = 'Online';
  payCashBtn.style.display = 'none';

  const options = {
    key: RAZORPAY_KEY,
    amount: currentBooking.total * 100,
    currency: "INR",
    name: "Vashudha Kendra",
    description: "Service Payment",
    handler: function (response) {
      let msg = `पेमेंट सफल (Online)\nTxn ID: ${response.razorpay_payment_id}\nनाम: ${currentBooking.name}\nमोबाइल: ${currentBooking.phone}\nकुल: ₹${currentBooking.total}\n`;
      currentBooking.items.forEach(i => { msg += `${i.name} × ${i.qty} = ₹${i.qty * i.price}\n`; });
      msg += `समय: ${new Date().toLocaleString()}`;
      window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(msg)}`, '_blank');

      generateSlip(response.razorpay_payment_id);
      slipArea.style.display = 'block';
      modalMsg.innerHTML = `<p style="color:#66fcf1;">पेमेंट सफल!</p>`;
    },
    prefill: { name: currentBooking.name, contact: currentBooking.phone },
    theme: { color: "#06b6d4" },
    modal: { ondismiss: () => {
      showToast("पेमेंट रद्द।", "error");
      payCashBtn.style.display = 'inline-block';
    }}
  };
  const rzp = new Razorpay(options);
  rzp.open();
});

function generateSlip(txn = '') {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18); doc.text('VASHUDHA KENDRA', 105, y, { align: 'center' }); y += 10;
  doc.setFontSize(14); doc.text('Payment Receipt', 105, y, { align: 'center' }); y += 10;
  doc.line(40, y, 170, y); y += 15;
  doc.setFontSize(12);
  doc.text(`Name: ${currentBooking.name}`, 20, y); y += 10;
  doc.text(`Mobile: ${currentBooking.phone}`, 20, y); y += 10;
  doc.text(`Payment Mode: ${paymentMode}`, 20, y); y += 10;
  if (txn) doc.text(`Transaction ID: ${txn}`, 20, y); y += 10;
  doc.text(`Date: ${new Date().toLocaleString()}`, 20, y); y += 15;
  doc.text('Services:', 20, y); y += 10;
  currentBooking.items.forEach(i => { doc.text(`• ${i.name} × ${i.qty} = ₹${i.qty * i.price}`, 30, y); y += 8; });
  y += 5; doc.setFontSize(14); doc.text(`Total: ₹${currentBooking.total}`, 20, y);
  downloadSlip.onclick = () => doc.save(`receipt_${Date.now()}.pdf`);
}

/* ========================== FEEDBACK & MESSAGE ========================== */
function sendToOwner(type, data) {
  const subject = type === 'feedback' ? 'नया फीडबैक' : 'नया संदेश';
  const body = `${type === 'feedback' ? 'Feedback' : 'Message'}:\nनाम: ${data.name}\nमोबाइल: ${data.phone}\nसंदेश: ${data.message}\nसमय: ${new Date().toLocaleString()}`;
  const mailto = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
  const waMsg = `${type === 'feedback' ? 'Feedback' : 'Message'}:\n${data.name}\n${data.phone}\n${data.message}`;
  window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(waMsg)}`, '_blank');
}

/* Feedback Modal */
document.getElementById('sendFeedbackBtn').addEventListener('click', () => {
  feedbackModal.style.display = 'flex';
});
document.getElementById('closeFeedbackModal').addEventListener('click', () => feedbackModal.style.display = 'none');
feedbackModal.addEventListener('click', e => { if (e.target === feedbackModal) feedbackModal.style.display = 'none'; });
feedbackForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('fbName').value.trim();
  const phone = document.getElementById('fbPhone').value.trim();
  const message = document.getElementById('fbMessage').value.trim();
  if (!name || !phone || phone.length !== 10 || !message) return showToast("सभी फील्ड भरें।", "error");
  sendToOwner('feedback', { name, phone, message });
  feedbackModal.style.display = 'none';
  showToast("फीडबैक भेजा गया!", "success");
});

/* Message Modal */
document.getElementById('sendMessageBtn').addEventListener('click', () => {
  messageModal.style.display = 'flex';
});
document.getElementById('closeMessageModal').addEventListener('click', () => messageModal.style.display = 'none');
messageModal.addEventListener('click', e => { if (e.target === messageModal) messageModal.style.display = 'none'; });
messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('msgName').value.trim();
  const phone = document.getElementById('msgPhone').value.trim();
  const message = document.getElementById('msgText').value.trim();
  if (!name || !phone || phone.length !== 10 || !message) return showToast("सभी फील्ड भरें।", "error");
  sendToOwner('message', { name, phone, message });
  messageModal.style.display = 'none';
  showToast("संदेश भेजा गया!", "success");
});

/* ========================== IMAGE COMPRESSOR – USER SETS KB ========================== */
function compressImage() {
  const resultDiv = document.getElementById('compResult');
  resultDiv.innerHTML = `
    <p style="margin:10px 0; color:#94a3b8; text-align:center;">कितने KB में चाहिए?</p>
    <div id="compControls">
      <label>1 KB</label>
      <input type="range" id="compSlider" min="1" max="500" value="100" step="1">
      <label>500 KB</label>
      <div id="compValue">100 KB</div>
    </div>
    <button class="pay" onclick="startCompression()" style="margin-top:12px; width:100%; padding:12px; font-size:16px;">Compress Now</button>
    <div id="compPreview" style="margin-top:15px; text-align:center;"></div>
  `;

  const slider = document.getElementById('compSlider');
  const valueDisplay = document.getElementById('compValue');
  slider.addEventListener('input', () => {
    valueDisplay.textContent = `${slider.value} KB`;
  });
}

window.startCompression = function() {
  const fileInput = document.getElementById('compInput');
  const slider = document.getElementById('compSlider');
  const preview = document.getElementById('compPreview');
  const file = fileInput.files[0];
  const targetKB = parseInt(slider.value);

  if (!file) return showToast("इमेज चुनें।", "error");

  preview.innerHTML = '<p style="color:#66fcf1;">कंप्रेस हो रहा है...</p>';

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let quality = 0.92;
      let dataUrl;
      let attempts = 0;

      const compressStep = () => {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);

        if (sizeKB <= targetKB || quality <= 0.05 || attempts > 30) {
          if (sizeKB > targetKB * 1.1) {
            preview.innerHTML = `<p style="color:#ff6b6b;">${targetKB} KB से कम नहीं हो पाया। (Best: ${sizeKB} KB)</p>`;
          } else {
            preview.innerHTML = `
              <img src="${dataUrl}" class="preview">
              <p style="color:#66fcf1; margin:8px 0;">साइज़: ${sizeKB} KB</p>
              <a href="${dataUrl}" download="compressed.jpg" class="btn">Download</a>
            `;
            showToast(`कंप्रेस्ड! ${sizeKB} KB`, "success");
          }
          return;
        }

        quality -= 0.05;
        attempts++;
        requestAnimationFrame(compressStep);
      };

      compressStep();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

/* ========================== TOOLS ========================== */
document.querySelectorAll('#menu a').forEach(a => {
  a.addEventListener('click', () => {
    showTool(a.dataset.tool);
    if (window.innerWidth <= 820) toggleMenu();
  });
});

function showTool(tool) {
  const toolArea = document.getElementById("toolArea");
  const toolContent = document.getElementById("toolContent");
  toolArea.style.display = 'block';
  toolContent.innerHTML = '';
  const card = document.createElement('div'); card.className = 'card';

  if (tool === "photo2pdf") card.innerHTML = `<h3>Photo to PDF</h3><input type="file" id="photoInput" multiple accept="image/*"><button class="btn" onclick="convertToPDF()">Convert</button><div id="pdfResult"></div>`;
  else if (tool === "pdfmerger") card.innerHTML = `<h3>PDF Merger</h3><input type="file" id="mergeInput" multiple accept="application/pdf"><button class="btn" onclick="mergePDFs()">Merge</button><div id="mergeResult"></div>`;
  else if (tool === "bgremove") {
    card.innerHTML = `
      <h3>AI Background Remover</h3>
      <p style="margin:10px 0; color:#94a3b8;">सबसे तेज़ और सटीक बैकग्राउंड हटाने के लिए:</p>
      <button class="pay" onclick="window.open('https://www.remove.bg/upload', '_blank')" style="width:100%; padding:12px; font-size:16px;">
        Open remove.bg (Free & Fast)
      </button>
      <p style="margin-top:10px; font-size:13px; color:#66fcf1;">Upload करो → 5 सेकंड में PNG डाउनलोड!</p>
    `;
  }
  else if (tool === "compressor") {
    card.innerHTML = `
      <h3>Image Compressor</h3>
      <input type="file" id="compInput" accept="image/*">
      <div id="compResult"></div>
    `;
    setTimeout(compressImage, 100);
  }
  else if (tool === "jpgtopng") card.innerHTML = `<h3>JPG to PNG</h3><input type="file" id="convInput" accept="image/jpeg"><button class="btn" onclick="jpgToPng()">Convert</button><div id="convResult"></div>`;

  toolContent.appendChild(card);
}

/* Close Payment Modal */
document.getElementById('closeModal').addEventListener('click', () => {
  modalBackdrop.style.display = 'none';
  payCashBtn.style.display = 'inline-block';
  payOnlineBtn.style.display = 'inline-block';
  selected = {}; renderCart();
});
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) {
    modalBackdrop.style.display = 'none';
    payCashBtn.style.display = 'inline-block';
    payOnlineBtn.style.display = 'inline-block';
    selected = {}; renderCart();
  }
});

/* Clear Cart */
document.getElementById('clearCart').addEventListener('click', () => { selected = {}; renderCart(); });

/* INIT */
renderServices();
document.getElementById('year').textContent = new Date().getFullYear();