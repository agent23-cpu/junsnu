// --- 샘플 데이터 ---
// 나중에 실제 데이터로 쉽게 교체 가능합니다.
const univData = {
    "서울대학교": {
        "의예과": { 2021: 99.5, 2022: 99.3, 2023: 99.7 },
        "컴퓨터공학부": { 2021: 97.2, 2022: 97.5, 2023: 98.0 },
        "경영학과": { 2021: 97.8, 2022: 98.1, 2023: 98.2 },
        "정치외교학부": { 2021: 96.5, 2022: 96.8, 2023: 97.0 }
    },
    "연세대학교": {
        "의예과": { 2021: 99.1, 2022: 99.0, 2023: 99.4 },
        "인공지능학과": { 2021: 95.5, 2022: 96.0, 2023: 96.8 },
        "경제학부": { 2021: 95.8, 2022: 96.2, 2023: 96.1 },
        "언론홍보영상학부": { 2021: 95.0, 2022: 95.2, 2023: 95.5 }
    },
    "고려대학교": {
        "의과대학": { 2021: 98.9, 2022: 98.8, 2023: 99.2 },
        "스마트보안학부": { 2021: 94.8, 2022: 95.5, 2023: 96.0 },
        "경영대학": { 2021: 95.5, 2022: 96.0, 2023: 95.9 },
        "심리학부": { 2021: 94.2, 2022: 94.5, 2023: 94.8 }
    },
    "성균관대학교": {
        "의예과": { 2021: 98.7, 2022: 98.5, 2023: 99.0 },
        "소프트웨어학": { 2021: 93.5, 2022: 94.2, 2023: 94.8 },
        "글로벌경영": { 2021: 94.5, 2022: 95.0, 2023: 95.2 }
    }
};

// --- DOM 요소 ---
const treeContainer = document.getElementById('univ-tree');
const dataDisplay = document.getElementById('data-display');
const userScoreInput = document.getElementById('user-score');
const predictBtn = document.getElementById('predict-btn');
const batteryCells = document.querySelectorAll('.battery-cell');
const predictionText = document.getElementById('prediction-text');

let selectedUniv = null;
let selectedDept = null;
let currentAvgCutoff = null;

// --- 초기화: 트리 메뉴 그리기 ---
function initTree() {
    for (const [univName, depts] of Object.entries(univData)) {
        const li = document.createElement('li');
        li.className = 'univ-node';
        
        const title = document.createElement('div');
        title.className = 'univ-name';
        title.innerHTML = `📁 ${univName}`;
        
        const deptList = document.createElement('ul');
        deptList.className = 'dept-list';
        
        for (const deptName of Object.keys(depts)) {
            const deptItem = document.createElement('li');
            deptItem.className = 'dept-item';
            deptItem.textContent = `📄 ${deptName}`;
            
            deptItem.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 선택 표시 변경
                document.querySelectorAll('.dept-item').forEach(el => el.classList.remove('selected'));
                deptItem.classList.add('selected');
                
                showData(univName, deptName);
            });
            
            deptList.appendChild(deptItem);
        }
        
        title.addEventListener('click', () => {
            deptList.classList.toggle('active');
            title.innerHTML = deptList.classList.contains('active') ? `📂 ${univName}` : `📁 ${univName}`;
        });
        
        li.appendChild(title);
        li.appendChild(deptList);
        treeContainer.appendChild(li);
    }
}

// --- 입결 데이터 보여주기 ---
function showData(univName, deptName) {
    selectedUniv = univName;
    selectedDept = deptName;
    const scores = univData[univName][deptName];
    
    const y2021 = scores[2021];
    const y2022 = scores[2022];
    const y2023 = scores[2023];
    currentAvgCutoff = ((y2021 + y2022 + y2023) / 3).toFixed(1);
    
    dataDisplay.innerHTML = `
        <div class="univ-subtitle">${univName}</div>
        <h3 class="dept-title">${deptName} 입시 결과 (백분위)</h3>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>2021학년도</th>
                    <th>2022학년도</th>
                    <th>2023학년도</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${y2021}</td>
                    <td>${y2022}</td>
                    <td>${y2023}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="avg-score">
            최근 3개년 평균 합격 커트라인: <strong>${currentAvgCutoff}</strong> 점
        </div>
        
        <p style="color: #64748b; text-align: center; margin-top: 20px;">
            👇 아래 탭에서 성적을 입력하고 합격 가능성(칸수)을 확인해보세요!
        </p>
    `;
    
    // 학과가 바뀌면 예측 탭 초기화
    resetBattery();
    userScoreInput.focus();
}

// --- 칸수(합격 예측) 계산 로직 ---
function calculatePrediction() {
    if (!currentAvgCutoff) {
        alert('먼저 위에서 대학교와 학과를 선택해주세요!');
        return;
    }
    
    const myScore = parseFloat(userScoreInput.value);
    if (isNaN(myScore) || myScore < 0 || myScore > 100) {
        alert('정확한 백분위 점수(0~100)를 입력해주세요!');
        return;
    }
    
    // 점수 차이 계산 (내 점수 - 커트라인 평균)
    const diff = myScore - currentAvgCutoff;
    
    // 칸수 판별 알고리즘 (가상)
    let spaces = 1;
    if (diff >= 3) spaces = 8;
    else if (diff >= 2) spaces = 7;
    else if (diff >= 1) spaces = 6;
    else if (diff >= 0) spaces = 5;
    else if (diff >= -1) spaces = 4;
    else if (diff >= -2) spaces = 3;
    else if (diff >= -3) spaces = 2;
    else spaces = 1;
    
    renderBattery(spaces);
}

// --- 배터리(칸수) 렌더링 ---
function renderBattery(spaces) {
    resetBattery();
    
    let colorClass = 'cell-danger';
    let text = '';
    
    if (spaces >= 7) { colorClass = 'cell-excellent'; text = `${spaces}칸! 최초합격이 매우 안정적입니다. 🎉`; }
    else if (spaces >= 5) { colorClass = 'cell-success'; text = `${spaces}칸! 합격 가능성이 높습니다. (적정) 🙂`; }
    else if (spaces >= 3) { colorClass = 'cell-warning'; text = `${spaces}칸! 소신 지원 구간입니다. (추합권) 🤔`; }
    else { colorClass = 'cell-danger'; text = `${spaces}칸! 불합격 위험이 높습니다. (상향) 😭`; }
    
    // 왼쪽부터 spaces 개수만큼 불 켜기
    for (let i = 0; i < spaces; i++) {
        setTimeout(() => {
            batteryCells[i].classList.add(colorClass);
        }, i * 150); // 순차적으로 켜지는 애니메이션
    }
    
    predictionText.textContent = text;
    predictionText.style.color = 'white';
}

function resetBattery() {
    batteryCells.forEach(cell => {
        cell.className = 'battery-cell'; // 초기화
    });
    predictionText.textContent = currentAvgCutoff ? "점수를 입력하고 예측 버튼을 눌러주세요!" : "왼쪽에서 학과를 먼저 선택해주세요.";
    predictionText.style.color = '#cbd5e1';
}

// --- 이벤트 리스너 ---
predictBtn.addEventListener('click', calculatePrediction);

userScoreInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculatePrediction();
});

// 실행
initTree();
