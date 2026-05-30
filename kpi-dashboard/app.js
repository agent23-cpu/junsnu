// --- 뷰 컨트롤 로직 ---
const views = {
    landing: document.getElementById('landing-page'),
    input: document.getElementById('input-page'),
    dashboard: document.getElementById('dashboard-page')
};

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    window.scrollTo(0, 0);
}

document.getElementById('btn-go-input').addEventListener('click', () => switchView('input'));
document.getElementById('btn-reinput').addEventListener('click', () => switchView('input'));

// --- 업종별 벤치마크 데이터 ---
const industryBenchmarks = {
    shopping: { name: '쇼핑몰', margin: 15, retention: 25, roas: 300 },
    cafe: { name: '카페/베이커리', margin: 20, retention: 40, roas: 150 },
    restaurant: { name: '일반 음식점', margin: 18, retention: 35, roas: 200 },
    saas: { name: 'IT/SaaS', margin: 30, retention: 80, roas: 400 },
    academy: { name: '학원/교육', margin: 25, retention: 70, roas: 250 },
    hospital: { name: '병의원', margin: 22, retention: 60, roas: 300 }
};

// --- 차트 객체 저장용 ---
let charts = {};

// --- 폼 제출 및 계산 로직 ---
document.getElementById('kpi-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 데이터 수집
    const ind = document.getElementById('industry').value;
    const pSales = parseFloat(document.getElementById('prev-sales').value);
    const pCost = parseFloat(document.getElementById('prev-cost').value);
    const pCust = parseFloat(document.getElementById('prev-customers').value);
    
    const cSales = parseFloat(document.getElementById('curr-sales').value);
    const cCost = parseFloat(document.getElementById('curr-cost').value);
    const cCust = parseFloat(document.getElementById('curr-customers').value);
    const cNewCust = parseFloat(document.getElementById('curr-new-customers').value);
    const cAd = parseFloat(document.getElementById('curr-ad-spend').value);
    
    // KPI 계산
    const netProfit = cSales - cCost;
    const netMargin = (netProfit / cSales) * 100;
    const arpu = cSales / cCust;
    
    const returningCust = cCust - cNewCust;
    const retentionRate = (returningCust / cCust) * 100;
    
    const cac = cNewCust > 0 ? (cAd / cNewCust) : 0;
    const roas = cAd > 0 ? (cSales / cAd) * 100 : 0;
    
    const growth = pSales > 0 ? ((cSales - pSales) / pSales) * 100 : 0;

    // 포맷팅 함수
    const fmtPct = (val) => val.toFixed(1) + '%';
    const fmtNum = (val) => Math.round(val).toLocaleString() + '원';

    // 화면 갱신
    document.getElementById('val-margin').textContent = fmtPct(netMargin);
    document.getElementById('val-margin').style.color = netMargin > 0 ? 'var(--success)' : 'var(--danger)';
    
    document.getElementById('val-arpu').textContent = fmtNum(arpu);
    document.getElementById('val-cac').textContent = fmtNum(cac);
    document.getElementById('val-roas').textContent = fmtPct(roas);
    document.getElementById('val-retention').textContent = fmtPct(retentionRate);
    
    document.getElementById('val-growth').textContent = (growth > 0 ? '+' : '') + fmtPct(growth);
    document.getElementById('val-growth').style.color = growth > 0 ? 'var(--success)' : (growth < 0 ? 'var(--danger)' : 'inherit');

    // AI 및 벤치마킹 실행
    runAIAnalysis(ind, netMargin, retentionRate, roas, cac, growth);
    renderCharts(pSales, pCost, cSales, cCost, cNewCust, returningCust);
    
    switchView('dashboard');
});

// --- AI 분석 및 벤치마킹 로직 ---
function runAIAnalysis(ind, margin, retention, roas, cac, growth) {
    const bench = industryBenchmarks[ind];
    document.getElementById('bench-industry').textContent = bench.name;

    // 벤치마킹 뱃지 생성 함수
    const getBadge = (val, target, isHigherBetter = true) => {
        let status;
        if (isHigherBetter) {
            if (val >= target * 1.1) status = { cls: 'badge-good', txt: '우수' };
            else if (val >= target * 0.9) status = { cls: 'badge-avg', txt: '평균' };
            else status = { cls: 'badge-bad', txt: '주의' };
        } else {
            if (val <= target * 0.9) status = { cls: 'badge-good', txt: '우수' };
            else if (val <= target * 1.1) status = { cls: 'badge-avg', txt: '평균' };
            else status = { cls: 'badge-bad', txt: '주의' };
        }
        return `<span class="bench-badge ${status.cls}">${status.txt}</span>`;
    };

    // 벤치마킹 리스트 렌더링
    const benchHTML = `
        <div class="bench-item">
            <span class="bench-label">순이익률 (목표: ${bench.margin}%)</span>
            ${getBadge(margin, bench.margin)}
        </div>
        <div class="bench-item">
            <span class="bench-label">재구매율 (목표: ${bench.retention}%)</span>
            ${getBadge(retention, bench.retention)}
        </div>
        <div class="bench-item">
            <span class="bench-label">ROAS (목표: ${bench.roas}%)</span>
            ${getBadge(roas, bench.roas)}
        </div>
    `;
    document.getElementById('benchmarks').innerHTML = benchHTML;

    // AI 텍스트 생성
    let aiText = `<p>입력하신 데이터를 바탕으로 <span class="ai-highlight">${bench.name} 업종</span> 맞춤형 경영 분석을 완료했습니다.</p>`;

    // 1. 수익성 분석
    if (margin >= bench.margin) {
        aiText += `<p>✅ <strong>수익성:</strong> 업종 평균(${bench.margin}%) 대비 순이익률이 높아 아주 건강한 재무 상태를 유지하고 있습니다. 현재의 비용 통제 시스템을 훌륭하게 유지하세요.</p>`;
    } else {
        aiText += `<p>⚠️ <strong>수익성:</strong> 순이익률이 업종 평균보다 다소 낮습니다. 불필요한 고정 지출이 없는지 점검하거나, 제품/서비스의 단가 인상(객단가 향상 전략)을 깊게 고려해 보아야 합니다.</p>`;
    }

    // 2. 고객 유지 분석
    if (retention >= bench.retention) {
        aiText += `<p>✅ <strong>고객 유지:</strong> 단골 고객 비율(재구매율)이 훌륭합니다! 서비스 만족도가 높다는 강력한 증거입니다. VIP 고객을 위한 특별 혜택을 조금 더 추가해 충성도를 굳히세요.</p>`;
    } else {
        aiText += `<p>⚠️ <strong>고객 유지:</strong> 재구매율(${retention.toFixed(1)}%)이 낮아 항상 신규 고객 유치에만 돈을 쓰며 의존하고 있습니다. 재방문 시 즉시 쓸 수 있는 할인 쿠폰을 주거나 카카오톡 푸시 알림을 활용해 고객 유지(Retention) 마케팅을 당장 시작하세요.</p>`;
    }

    // 3. 광고 효율
    if (roas < bench.roas) {
        aiText += `<p>💡 <strong>광고 개선:</strong> 광고비 대비 매출(ROAS)이 평균보다 떨어집니다. 1명의 새로운 고객을 데려오는 비용(CAC)이 ${Math.round(cac).toLocaleString()}원이나 듭니다. 광고 타겟팅을 훨씬 더 좁게 설정하거나, 효율이 1도 안 나오는 나쁜 광고 채널은 과감히 끄는 것을 강력히 추천합니다.</p>`;
    } else {
        aiText += `<p>💡 <strong>광고 효율:</strong> ROAS가 좋아 전반적인 광고 마케팅 효율이 뛰어납니다! 만약 회사에 여유 자금이 있다면, 성과가 가장 좋은 채널에 광고 예산을 살짝 더 늘려서 매출 성장을 폭발적으로 가속화해 보세요.</p>`;
    }

    document.getElementById('ai-report').innerHTML = aiText;
}

// --- Chart.js 렌더링 ---
function renderCharts(pSales, pCost, cSales, cCost, cNewCust, cRetCust) {
    // 기존 차트가 있으면 지우고 새로 그려야 겹치지 않음
    if (charts.sales) charts.sales.destroy();
    if (charts.cust) charts.cust.destroy();

    const ctxSales = document.getElementById('chart-sales').getContext('2d');
    charts.sales = new Chart(ctxSales, {
        type: 'bar',
        data: {
            labels: ['지난달', '이번 달'],
            datasets: [
                { label: '매출', data: [pSales, cSales], backgroundColor: '#4f46e5', borderRadius: 6 },
                { label: '비용', data: [pCost, cCost], backgroundColor: '#ef4444', borderRadius: 6 }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    const ctxCust = document.getElementById('chart-customers').getContext('2d');
    charts.cust = new Chart(ctxCust, {
        type: 'doughnut',
        data: {
            labels: ['신규 유입 고객', '기존 재구매 고객'],
            datasets: [{ data: [cNewCust, cRetCust], backgroundColor: ['#3b82f6', '#10b981'], borderWidth: 0 }]
        },
        options: { responsive: true, cutout: '70%' }
    });
}
