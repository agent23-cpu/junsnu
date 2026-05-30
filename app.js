// --- 상태 관리 ---
let timerSeconds = 0;
let timerInterval = null;
let isTimerRunning = false;

let students = [];
let pickedStudents = [];

// 오디오 컨텍스트 (알람 소리용)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4
    
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// --- DOM 요소 ---
// 타이머
const timerDisplay = document.getElementById('timer-display');
const btnStartTimer = document.getElementById('start-timer');
const btnPauseTimer = document.getElementById('pause-timer');
const btnResetTimer = document.getElementById('reset-timer');
const timeBtns = document.querySelectorAll('.time-btn');

// 추첨기
const pickerDisplay = document.getElementById('picker-display');
const btnStartPicker = document.getElementById('start-picker');
const chkExclude = document.getElementById('exclude-picked');

// 명단
const textInput = document.getElementById('student-input');
const pickedList = document.getElementById('picked-list');
const btnResetList = document.getElementById('reset-list');
const totalCount = document.getElementById('total-count');
const remainingCount = document.getElementById('remaining-count');

// --- 초기화 ---
function init() {
    // 로컬 스토리지 데이터 불러오기
    const savedInput = localStorage.getItem('yaksa_input');
    if (savedInput) textInput.value = savedInput;
    
    const savedPicked = localStorage.getItem('yaksa_picked');
    if (savedPicked) pickedStudents = JSON.parse(savedPicked);
    
    updateList();
    updateTimerDisplay();
}

// --- 타이머 기능 ---
function updateTimerDisplay() {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
    
    if (timerSeconds === 0 && isTimerRunning) {
        timerDisplay.classList.add('danger');
    } else {
        timerDisplay.classList.remove('danger');
    }
}

timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timerSeconds += parseInt(btn.dataset.time);
        updateTimerDisplay();
    });
});

btnStartTimer.addEventListener('click', () => {
    if (timerSeconds > 0 && !isTimerRunning) {
        // 오디오 컨텍스트 정책 해제
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        isTimerRunning = true;
        timerDisplay.classList.remove('danger');
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                timerDisplay.classList.add('danger');
                playBeep(); // 종료 알람
            }
        }, 1000);
    }
});

btnPauseTimer.addEventListener('click', () => {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerDisplay.classList.remove('danger');
});

btnResetTimer.addEventListener('click', () => {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimerDisplay();
});

// --- 명단 및 추첨 기능 ---
textInput.addEventListener('input', () => {
    localStorage.setItem('yaksa_input', textInput.value);
    updateList();
});

function updateList() {
    // 쉼표로 분리하고 공백 제거
    const rawList = textInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    // 중복 제거 및 배열 저장
    students = [...new Set(rawList)];
    
    // UI 업데이트
    totalCount.textContent = students.length;
    
    // 남은 인원 계산 (제외 옵션 반영)
    let available = students;
    if (chkExclude.checked) {
        available = students.filter(s => !pickedStudents.includes(s));
    }
    remainingCount.textContent = available.length;
    
    // 버튼 상태
    btnStartPicker.disabled = available.length === 0;
    if (available.length === 0 && students.length > 0) {
        pickerDisplay.innerHTML = `<span class="placeholder">모두 뽑혔습니다</span>`;
    }
    
    renderPickedList();
}

function renderPickedList() {
    pickedList.innerHTML = '';
    pickedStudents.forEach((student, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${student}</span> <span class="picked-number">${index + 1}번째</span>`;
        pickedList.appendChild(li);
    });
    
    // 로컬 스토리지 저장
    localStorage.setItem('yaksa_picked', JSON.stringify(pickedStudents));
}

chkExclude.addEventListener('change', updateList);

btnResetList.addEventListener('click', () => {
    if (confirm('당첨자 목록을 초기화하시겠습니까?')) {
        pickedStudents = [];
        localStorage.removeItem('yaksa_picked');
        pickerDisplay.innerHTML = `<span class="placeholder">추첨을 시작해주세요</span>`;
        pickerDisplay.className = 'picker-display';
        updateList();
    }
});

btnStartPicker.addEventListener('click', () => {
    let available = students;
    if (chkExclude.checked) {
        available = students.filter(s => !pickedStudents.includes(s));
    }
    
    if (available.length === 0) return;
    
    btnStartPicker.disabled = true;
    pickerDisplay.className = 'picker-display rolling';
    
    // 오디오 해제
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // 두구두구 애니메이션 (2초간 0.1초마다)
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomTemp = available[Math.floor(Math.random() * available.length)];
        pickerDisplay.textContent = randomTemp;
        rollCount++;
        
        if (rollCount >= 20) {
            clearInterval(rollInterval);
            
            // 실제 당첨자 선정
            const winner = available[Math.floor(Math.random() * available.length)];
            pickerDisplay.textContent = winner;
            pickerDisplay.className = 'picker-display winner';
            
            // 당첨자 목록 추가
            pickedStudents.push(winner);
            updateList();
            
            // 버튼 활성화
            setTimeout(() => {
                btnStartPicker.disabled = available.length === 0;
            }, 500);
        }
    }, 100);
});

// 시작
init();
