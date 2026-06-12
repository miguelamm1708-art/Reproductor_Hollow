// ==========================================
// SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================
const audio = document.getElementById('main-audio');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const btnResetFilters = document.getElementById('btn-reset-filters');

const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeTrack = document.getElementById('current-time');
const totalDurationTrack = document.getElementById('total-duration');

const currentCover = document.getElementById('current-cover');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');

const trackElements = document.querySelectorAll('.canciones');
const albumCards = document.querySelectorAll('.albunes');
const searchInput = document.querySelector('.search-input');
const songElements = document.querySelectorAll('.canciones');

// Estados del reproductor
let isPlaying = false;
let isShuffleMode = false;
let isRepeatMode = false;

// ==========================================
// FUNCIONES DE CONTROL DE PISTAS (UX/UI)
// ==========================================

// Detecta si la canción o el contenedor de su álbum están ocultos en pantalla
function getVisibleTracks() {
    return Array.from(trackElements).filter(track => {
        const isTrackHidden = window.getComputedStyle(track).display === 'none';
        const parentContainer = track.closest('div[class*="albun_"]:not(.albunes)');
        const isParentHidden = parentContainer ? window.getComputedStyle(parentContainer).display === 'none' : false;
        
        return !isTrackHidden && !isParentHidden;
    });
}

// Carga los datos de la canción en el reproductor
function loadSong(albumElement) {
    const audioSrc = albumElement.getAttribute('data-audio');
    const title = albumElement.querySelector('h4').innerText;
    const artist = albumElement.querySelector('p').innerText;
    const coverSrc = albumElement.querySelector('.play_music').src;

    audio.src = audioSrc;
    currentTitle.innerText = title;
    currentArtist.innerText = artist;
    currentCover.src = coverSrc;

    playSong();
}

// Cambiar de canción (Siguiente / Anterior / Aleatorio)
function changeTrack(direction, force = false) {
    const visibleTracks = getVisibleTracks();
    if (visibleTracks.length === 0) return; 

    // Botón anterior inteligente: si lleva más de 3 segundos, reinicia la canción actual
    if (direction === -1 && !force && audio.currentTime > 3) {
        audio.currentTime = 0;
        if (!isPlaying) playSong();
        return;
    }

    let currentTrackIndex = visibleTracks.findIndex(track => {
        return track.getAttribute('data-audio') === audio.getAttribute('src');
    });

    // Lógica para Modo Aleatorio (Shuffle)
    if (direction === 1 && isShuffleMode && visibleTracks.length > 1) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * visibleTracks.length);
        } while (randomIndex === currentTrackIndex);
        
        currentTrackIndex = randomIndex;
    } else {
        // Lógica secuencial (Orden normal)
        if (currentTrackIndex === -1) {
            currentTrackIndex = 0;
        } else {
            currentTrackIndex = (currentTrackIndex + direction + visibleTracks.length) % visibleTracks.length;
        }
    }

    loadSong(visibleTracks[currentTrackIndex]);
}

// Alternar entre Reproducción y Pausa
function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    isPlaying = true;
    btnPlay.innerText = 'pause_circle';
    audio.play().catch(error => console.log("Esperando interacción del usuario para reproducir..."));
}

function pauseSong() {
    isPlaying = false;
    btnPlay.innerText = 'play_circle';
    audio.pause();
}

// ==========================================
// FUNCIONES TÉCNICAS (BARRA DE PROGRESO Y VOLUMEN)
// ==========================================
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (!duration) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = progressPercent;

    // Formatear minutos y segundos
    let currentMins = Math.floor(currentTime / 60);
    let currentSecs = Math.floor(currentTime % 60);
    if (currentSecs < 10) currentSecs = `0${currentSecs}`;
    currentTimeTrack.innerText = `${currentMins}:${currentSecs}`;

    let durationMins = Math.floor(duration / 60);
    let durationSecs = Math.floor(duration % 60);
    if (durationSecs < 10) durationSecs = `0${durationSecs}`;
    totalDurationTrack.innerText = `${durationMins}:${durationSecs}`;
}

function setProgress() {
    const width = progressBar.value;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (width / 100) * duration;
    }
}

function changeVolume() {
    audio.volume = volumeBar.value / 100;
}

// ==========================================
// LÓGICA DE FILTRADO Y BÚSQUEDA
// ==========================================
function filterSongs() {
    const filterValue = searchInput.value.toLowerCase();
    songElements.forEach(song => {
        const title = song.querySelector('h4').innerText.toLowerCase();
        const artist = song.querySelector('p').innerText.toLowerCase();

        if (title.includes(filterValue) || artist.includes(filterValue)) {
            song.style.display = 'flex';
        } else {
            song.style.display = 'none';
        }
    });
}

function resetFilters() {
    searchInput.value = '';
    songElements.forEach(song => {
        song.style.display = 'flex';
    });
    const songContainers = document.querySelectorAll('div[class*="albun_"]:not(.albunes)');
    songContainers.forEach(container => {
        container.style.display = ''; 
    });
}

// ==========================================
// EVENT LISTENERS (ASIGNACIÓN DE ACCIONES)
// ==========================================

// Clic directo en las canciones individuales
trackElements.forEach(element => {
    element.addEventListener('click', () => loadSong(element));
});

// Clic en las tarjetas de Álbumes del Carrusel
albumCards.forEach(card => {
    card.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        btnPlay.innerText = 'play_circle';

        const albumClass = Array.from(card.classList).find(cls => cls.startsWith('albun_'));
        if (albumClass) {
            const songContainers = document.querySelectorAll('div[class*="albun_"]:not(.albunes)');
            songContainers.forEach(container => {
                if (container.classList.contains(albumClass)) {
                    container.style.display = '';
                } else {
                    container.style.display = 'none';
                }
            });

            setTimeout(() => {
                const visibleTracks = getVisibleTracks();
                if (visibleTracks.length > 0) {
                    loadSong(visibleTracks[0]);
                } else {
                    currentTitle.innerText = "Selecciona una canción";
                    currentArtist.innerText = "-";
                }
            }, 50);
        }
    });
});

// Controles principales del reproductor
btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', () => changeTrack(-1, false));
btnNext.addEventListener('click', () => changeTrack(1, true));

// Eventos de configuración de Audio
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress); 
progressBar.addEventListener('input', setProgress);
volumeBar.addEventListener('input', changeVolume);
searchInput.addEventListener('input', filterSongs);
btnResetFilters.addEventListener('click', resetFilters);

// Toggles de modos (Shuffle / Repeat)
btnShuffle.addEventListener('click', () => {
    isShuffleMode = !isShuffleMode;
    btnShuffle.classList.toggle('active', isShuffleMode);
});

btnRepeat.addEventListener('click', () => {
    isRepeatMode = !isRepeatMode;
    btnRepeat.classList.toggle('active', isRepeatMode);
});

// Control inteligente al finalizar la canción
audio.addEventListener('ended', () => {
    if (isRepeatMode) {
        audio.currentTime = 0;
        playSong();
    } else {
        changeTrack(1, true);
    }
});