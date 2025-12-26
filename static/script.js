async function handleInquiry() {
    const certInput = document.getElementById('certInput');
    const certCode = certInput.value.trim();
    
    // اعتبارسنجی اولیه مشابه پایتون (حداقل ۳ کاراکتر)
    if (certCode.length < 3) {
        alert("لطفاً حداقل ۳ کاراکتر وارد کنید");
        return;
    }

    const loader = document.getElementById('loadingBox');
    loader.style.display = 'flex'; 

    try {
        const response = await fetch(`/api/check?certification_code=${encodeURIComponent(certCode)}`);
        
        if (!response.ok) {
            throw new Error('خطا در پاسخگویی سرور');
        }

        const data = await response.json();

        if (data.found) {
            showResult(data);
        } else {
            showResult({ found: false, certificationCode: certCode });
        }
    } catch (error) {
        console.error("Error:", error);
        alert("برقراری ارتباط با سرور با خطا مواجه شد.");
    } finally {
        loader.style.display = 'none';
}

function showResult(data) {
    document.getElementById('search-view').style.display = 'none';
    document.getElementById('result-view').style.display = 'flex';

    const badge = document.getElementById('statusBadge');
    const text = document.getElementById('statusText');
    const icon = document.getElementById('statusIcon');
    
    document.getElementById('res-code').innerText = data.certificationCode || "---";
    document.getElementById('res-fa').innerText = data.nameFa || "---";
    document.getElementById('res-en').innerText = data.nameEn || "---";
    document.getElementById('res-course').innerText = data.course || "---";
    document.getElementById('res-date').innerText = data.dateOfIssue || "---";

    badge.classList.remove('status-valid', 'status-invalid', 'status-expired');

    if (!data.found) {
        badge.classList.add('status-invalid');
        text.innerText = 'نامعتبر';
        icon.className = 'fa-solid fa-times-circle';
    } else {
        const status = checkDateStatus(data.expirationDate);
        
        if (status === 'expired') {
            badge.classList.add('status-expired');
            text.innerText = 'منقضی شده';
            icon.className = 'fa-solid fa-clock';
        } else {
            badge.classList.add('status-valid');
            text.innerText = 'معتبر';
            icon.className = 'fa-solid fa-check-circle';
        }
    }
}

function checkDateStatus(expDateStr) {
    if (!expDateStr) return 'unknown';
    
    const expDate = new Date(expDateStr.replace(/\//g, '-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today ? 'expired' : 'valid';
}

function goBack() {
    document.getElementById('result-view').style.display = 'none';
    document.getElementById('search-view').style.display = 'flex';
    document.getElementById('certInput').value = '';
}
