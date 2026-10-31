<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAOe9aMUozLEUnj-I8fdg9pgTuG9iM2gNM",
    authDomain: "voting-app-c0e4f.firebaseapp.com",
    projectId: "voting-app-c0e4f",
    storageBucket: "voting-app-c0e4f.firebasestorage.app",
    messagingSenderId: "1063274263693",
    appId: "1:1063274263693:web:6e4f9813380fd652615ec4",
    measurementId: "G-P1XDHVGR5S"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut, signInAnonymously }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs,
         query, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appDiv = document.getElementById("app");
const statusDiv = document.getElementById("status-user");

function tampilkanPesan(target, teks, tipe = "error") {
  target.innerHTML = `<div class="pesan ${tipe}">${teks}</div>`;
}

const params = new URLSearchParams(location.search);
const voteId = params.get("vote");

onAuthStateChanged(auth, (user) => {
  if (voteId) {
    if (!user) {
      signInAnonymously(auth).catch(err => {
        appDiv.innerHTML = `<div class="pesan error">Gagal memuat: ${err.message}</div>`;
      });
      return;
    }
    renderHalamanVoting(voteId, user);
  } else {
    if (!user || user.isAnonymous) {
      renderLogin();
    } else {
      renderDashboard(user);
    }
  }
  statusDiv.textContent = user && !user.isAnonymous ? user.email : "";
});

function renderLogin() {
  appDiv.innerHTML = `
    <div class="kartu">
      <h2>Login Pembuat Voting</h2>
      <div id="pesan-login"></div>
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="password" placeholder="Password (min 6 karakter)" />
      <button id="btn-login">Login</button>
      <button id="btn-daftar" class="secondary">Daftar Baru</button>
    </div>
  `;
  const pesan = document.getElementById("pesan-login");
  document.getElementById("btn-login").onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth,
        document.getElementById("email").value.trim(),
        document.getElementById("password").value);
    } catch (e) { tampilkanPesan(pesan, e.message); }
  };
  document.getElementById("btn-daftar").onclick = async () => {
    try {
      await createUserWithEmailAndPassword(auth,
        document.getElementById("email").value.trim(),
        document.getElementById("password").value);
    } catch (e) { tampilkanPesan(pesan, e.message); }
  };
}

async function renderDashboard(user) {
  appDiv.innerHTML = `
    <div class="kartu">
      <h2>Buat Voting Baru</h2>
      <div id="pesan-buat"></div>
      <input type="text" id="judul-voting" placeholder="Judul voting (misal: Ketua Kelas)" />
      <input type="text" id="kandidat-input" placeholder="Nama kandidat, pisahkan dengan koma" />
      <button id="btn-buat">Buat Voting</button>
      <button id="btn-logout" class="danger">Logout</button>
    </div>
    <div id="daftar-voting"></div>
  `;
  document.getElementById("btn-logout").onclick = () => signOut(auth);

  const pesanBuat = document.getElementById("pesan-buat");
  document.getElementById("btn-buat").onclick = async () => {
    const judul = document.getElementById("judul-voting").value.trim();
    const kandidatRaw = document.getElementById("kandidat-input").value.trim();
    if (!judul || !kandidatRaw)
      return tampilkanPesan(pesanBuat, "Judul dan kandidat wajib diisi.");
    const kandidat = kandidatRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (kandidat.length < 2)
      return tampilkanPesan(pesanBuat, "Minimal 2 kandidat.");
    try {
      await addDoc(collection(db, "votings"), {
        judul, kandidat, ownerId: user.uid, createdAt: serverTimestamp()
      });
      tampilkanPesan(pesanBuat, "Voting berhasil dibuat.", "sukses");
      muatDaftarVoting(user);
    } catch (e) { tampilkanPesan(pesanBuat, e.message); }
  };

  muatDaftarVoting(user);
}

async function muatDaftarVoting(user) {
  const wadah = document.getElementById("daftar-voting");
  if (!wadah) return;
  const q = query(collection(db, "votings"), where("ownerId", "==", user.uid));
  const snap = await getDocs(q);
  if (snap.empty) {
    wadah.innerHTML = `<div class="kartu"><p>Belum ada voting.</p></div>`;
    return;
  }
  let html = "";
  snap.forEach(d => {
    const data = d.data();
    const link = `${location.origin}${location.pathname}?vote=${d.id}`;
    html += `
      <div class="kartu">
        <h3>${data.judul}</h3>
        <p>Kandidat: ${data.kandidat.join(", ")}</p>
        <p>Bagikan link ini:</p>
        <div class="link-box">${link}</div>
        <button class="secondary btn-hasil" data-id="${d.id}">Lihat Hasil</button>
      </div>
    `;
  });
  wadah.innerHTML = html;
  wadah.querySelectorAll(".btn-hasil").forEach(btn => {
    btn.onclick = () => lihatHasil(btn.dataset.id, user);
  });
}

async function lihatHasil(votingId, user) {
  const wadah = document.getElementById("daftar-voting");
  wadah.innerHTML = `<div class="kartu"><p>Memuat hasil...</p></div>`;
  try {
    const vSnap = await getDoc(doc(db, "votings", votingId));
    if (!vSnap.exists()) throw new Error("Voting tidak ditemukan.");
    const voting = vSnap.data();

    const q = query(collection(db, "votes"),
      where("votingId", "==", votingId),
      where("ownerId", "==", user.uid));
    const snap = await getDocs(q);

    const hitung = {};
    voting.kandidat.forEach(k => hitung[k] = 0);
    snap.forEach(d => {
      const k = d.data().kandidat;
      if (hitung[k] !== undefined) hitung[k]++;
    });
    const total = Object.values(hitung).reduce((a, b) => a + b, 0);

    let html = `<div class="kartu"><h2>Hasil: ${voting.judul}</h2>
                <p>Total suara: ${total}</p>`;
    voting.kandidat.forEach(k => {
      const jumlah = hitung[k];
      const persen = total === 0 ? 0 : Math.round((jumlah / total) * 100);
      html += `
        <div class="baris-hasil">
          <span style="width:80px;flex-shrink:0;">${k}</span>
          <div class="bar-luar"><div class="bar-dalam" style="width:${persen}%"></div></div>
          <span class="persen">${persen}% (${jumlah})</span>
        </div>`;
    });
    html += `<button class="secondary" onclick="location.reload()">Kembali</button></div>`;
    wadah.innerHTML = html;
  } catch (e) {
    wadah.innerHTML = `<div class="kartu"><div class="pesan error">${e.message}</div></div>`;
  }
}

async function renderHalamanVoting(votingId, user) {
  appDiv.innerHTML = `<div class="kartu"><p>Memuat voting...</p></div>`;
  try {
    const vSnap = await getDoc(doc(db, "votings", votingId));
    if (!vSnap.exists()) {
      appDiv.innerHTML = `<div class="kartu"><div class="pesan error">Voting tidak ditemukan.</div></div>`;
      return;
    }
    const voting = vSnap.data();

    const kunciLokal = `sudah_vote_${votingId}`;
    if (localStorage.getItem(kunciLokal)) {
      appDiv.innerHTML = `<div class="kartu"><div class="pesan sukses">Kamu sudah memilih.</div></div>`;
      return;
    }

    let html = `<div class="kartu"><h2>${voting.judul}</h2><p>Pilih satu kandidat:</p>`;
    voting.kandidat.forEach(nama => {
      html += `<button class="tombol-kandidat" data-nama="${nama}">${nama}</button>`;
    });
    html += `</div>`;
    appDiv.innerHTML = html;

    appDiv.querySelectorAll(".tombol-kandidat").forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          await addDoc(collection(db, "votes"), {
            votingId,
            ownerId: voting.ownerId,
            kandidat: btn.dataset.nama,
            voterId: user.uid,
            createdAt: serverTimestamp()
          });
          localStorage.setItem(kunciLokal, "1");
          appDiv.innerHTML = `<div class="kartu"><div class="pesan sukses">Terima kasih! Suaramu tercatat.</div></div>`;
        } catch (e) {
          btn.disabled = false;
          appDiv.innerHTML += `<div class="pesan error">Gagal: ${e.message}</div>`;
        }
      };
    });
  } catch (e) {
    appDiv.innerHTML = `<div class="kartu"><div class="pesan error">${e.message}</div></div>`;
  }
        }
