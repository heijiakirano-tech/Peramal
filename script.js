// ==========================
// VARIABEL GLOBAL
// ==========================
let tapInterval;
let tapCount = 0;
const TOTAL_TAPS = 50; 
let currentSlide = 0; // Mengontrol posisi slide (0, 1, 2)

// Daftar database kartu
const DB_MAP = [
    'major_arcana.json', 
    'suit_of_pentacels.json', 
    'suit_of_wands.json', 
    'suit_of_swords.json', 
    'suit_of_cups.json'
];

// ==========================
// KONTROL LAYAR
// ==========================
function openInput() {
    document.getElementById("opening").style.display = "none";
    document.getElementById("inputScreen").style.display = "flex";
}

function startLoading() {
    // Simpan data input user
    window.userData = {
        name: document.getElementById("userName").value,
        day: document.getElementById("day").value,
        month: document.getElementById("month").value,
        year: document.getElementById("year").value,
        dayOfWeek: document.getElementById("daySelect").value
    };

    document.getElementById("inputScreen").style.display = "none";
    document.getElementById("loadingScreen").style.display = "flex";
    startTapAnimation();
}

// ==========================
// ANIMASI TAP KARTU
// ==========================
function startTapAnimation() {
    const cards = document.querySelectorAll('.card');
    let currentIndex = 0;

    tapInterval = setInterval(() => {
        cards.forEach(card => card.classList.remove('active'));
        cards[currentIndex].classList.add('active');
        currentIndex = (currentIndex + 1) % cards.length;
        tapCount++;

        if (tapCount >= TOTAL_TAPS) {
            clearInterval(tapInterval);
            setTimeout(showResult, 500);
        }
    }, 300);
}

// ===============================
// PROSES DATA (GACHA)
// ===============================
async function showResult() {
    const { name, month, dayOfWeek } = window.userData;

    try {
        // Ambil data kombinasi
        const alphaCombos = await fetch('alphabet_combination.json').then(res => res.json());
        const dayCombos = await fetch('day_combination.json').then(res => res.json());
        const zodiacCombos = await fetch('zodiac_combination.json').then(res => res.json());

        const alphaKey = getAlphabetGroup(name, alphaCombos);
        const monthKey = month.toString().padStart(2, '0');

        // Gacha 3 ID Kartu unik
        const id1 = gacha(dayCombos[dayOfWeek]);
        const id2 = gacha(zodiacCombos[monthKey]);
        const id3 = gacha(alphaCombos[alphaKey]);

        // Ambil detail kartu dari database utama
        const finalCards = await fetchCardData([id1, id2, id3]);
        renderFinalUI(finalCards);
    } catch (error) {
        console.error("Kesalahan membaca takdir:", error);
        alert("Terjadi kesalahan mistis. Pastikan semua file JSON sudah tersedia.");
    }
}

// ===============================
// RENDER UI & TEMPLATE SLIDE
// ===============================
function renderFinalUI(cards) {
    document.getElementById("loadingScreen").style.display = "none";
    const resultScreen = document.getElementById("resultScreen");
    resultScreen.style.display = "flex"; 

    const track = document.getElementById("slidesTrack");
    let html = "";

    // Mencetak 3 slide menggunakan template default yang sama
    cards.forEach((card) => {
        html += `
        <div class="card-result-item">
            <div class="card-img-wrapper">
                <img class="card-img-result" src="${card.image}" alt="${card.title}">
            </div>
            <div class="card-text-content">
                <div class="card-name-large">${card.title}</div>
                <hr class="white-line">
                <div class="card-middle-section">
                    <div class="card-title">${card.role}</div>
                </div>
                <div class="card-bottom-section">
                    <p class="prophecy-text"><strong>Ramalan:</strong> ${card.prophecy}</p>
                    <p class="warning-text"><strong>Peringatan:</strong> ${card.warning}</p>
                </div>
            </div>
        </div>`;
    });

    track.innerHTML = html;
    currentSlide = 0; // Reset ke slide pertama
    updateSlide();
}

// ===============================
// LOGIKA BERGESER (CAROUSEL)
// ===============================
function updateSlide() {
    const track = document.getElementById("slidesTrack");
    // Menggeser papan panjang berdasarkan index slide (0%, -33.33%, -66.66%)
    const offset = currentSlide * (100 / 3); 
    track.style.transform = `translateX(-${offset}%)`;
}

function nextSlide() {
    if (currentSlide < 2) { 
        currentSlide++; 
        updateSlide(); 
    } else {
        currentSlide = 0; // Kembali ke kartu pertama jika sudah di akhir
        updateSlide();
    }
}

function prevSlide() {
    if (currentSlide > 0) { 
        currentSlide--; 
        updateSlide(); 
    } else {
        currentSlide = 2; // Ke kartu terakhir jika di awal
        updateSlide();
    }
}

// ===============================
// FUNGSI PENDUKUNG (UTILITY)
// ===============================
function getAlphabetGroup(name, combos) {
    if (!name) return "ABD";
    const firstLetter = name.charAt(0).toUpperCase();
    return Object.keys(combos).find(key => key.includes(firstLetter)) || "ABD";
}

function gacha(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchCardData(ids) {
    let allCards = [];
    for (const file of DB_MAP) {
        try {
            const data = await fetch(file).then(res => res.json());
            allCards = allCards.concat(data);
        } catch (e) {
            console.warn("File tidak ditemukan: " + file);
        }
    }
    // Mengambil data lengkap kartu yang ID-nya cocok dengan hasil gacha
    return allCards.filter(card => ids.includes(card.id)).slice(0, 3);
}