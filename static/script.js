async function handleInquiry() {
    const certInput = document.getElementById('certInput');
    const certCode = certInput.value.trim();
    
    if (certCode.length < 3) {
        alert("لطفاً حداقل ۳ کاراکتر وارد کنید");
        return;
    }

    const loader = document.getElementById('loadingBox');
    loader.style.display = 'flex';

    try {
        const response = await fetch(`/api/check?certification_code=${encodeURIComponent(certCode)}`);
        
        if (!response.ok) {
            // اگر پاسخ از سرور 5xx یا 4xx بود
            throw new Error(`خطا در پاسخگویی سرور: ${response.status}`);
        }

        const data = await response.json();

        if (data.found) {
            showResult(data);
        } else {
            showResult({ found: false, certificationCode: certCode });
        }
    } catch (error) {
        console.error("Error details:", error);
        alert("خطا در برقراری ارتباط با سرور. لطفا مجددا تلاش کنید.");
    } finally {
        loader.style.display = 'none';
    }
}

function showResult(data) {
    document.getElementById('search-view').style.display = 'none';
    document.getElementById('result-view').style.display = 'flex';

    document.getElementById('res-code').innerText = data.certificationCode || "---";
    document.getElementById('res-fa').innerText = data.nameFa || "---";
    document.getElementById('res-en').innerText = data.nameEn || "---";
    document.getElementById('res-course').innerText = data.course || "---";
    document.getElementById('res-date').innerText = data.dateOfIssue || "---";
    document.getElementById('res-exp').innerText = data.expDate || "---";


    const badge = document.getElementById('statusBadge');
    const text = document.getElementById('statusText');
    const icon = document.getElementById('statusIcon');
    
    badge.classList.remove('status-valid', 'status-invalid', 'status-expired');

    if (!data.found) {
        badge.classList.add('status-invalid');
        text.innerText = 'نامعتبر';
        icon.className = 'fa-solid fa-times-circle';
    } else {
        const expDateStr = data.expirationDate;
        const status = checkDateStatus(expDateStr);
        
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
    // اگر تاریخ انقضا وجود ندارد، فرض می کنیم معتبر است (یا وضعیت نامشخص)
    if (!expDateStr) return 'valid'; 

    // تاریخ باید به فرمت YYYY-MM-DD باشد تا Date() به درستی آن را تفسیر کند
    // جایگزینی / با -
    const expDate = new Date(expDateStr.replace(/\//g, '-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // نادیده گرفتن زمان برای مقایسه دقیق روز

    return expDate < today ? 'expired' : 'valid';
}

function goBack() {
    document.getElementById('result-view').style.display = 'none';
    document.getElementById('search-view').style.display = 'flex';
    document.getElementById('certInput').value = '';
}
