const API_URL = "https://your-app.onrender.com/api/check";

function checkCert() {
  const code = document.getElementById("certInput").value.trim();
  const loading = document.getElementById("loading");
  const result = document.getElementById("result");

  if (!code) return;

  result.innerText = "";
  loading.classList.remove("hidden");

  fetch(`${API_URL}?certification_code=${code}`)
    .then(res => res.json())
    .then(data => {
      loading.classList.add("hidden");

      if (!data.found) {
        result.innerText = "❌ گواهینامه‌ای با این شماره یافت نشد";
        return;
      }

      result.innerText =
        `✅ گواهینامه معتبر\n\n` +
        `نام (فارسی): ${data.nameFa}\n` +
        `Name (EN): ${data.nameEn}\n` +
        `دوره: ${data.course}\n` +
        `تاریخ صدور: ${data.dateOfIssue}\n` +
        `تاریخ انقضا: ${data.expirationDate}`;
    })
    .catch(() => {
      loading.classList.add("hidden");
      result.innerText = "⚠️ خطا در ارتباط با سرور";
    });
}

function openSupport() {
  window.open("https://t.me/your_support_id", "_blank");
}
