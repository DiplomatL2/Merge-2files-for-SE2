function parseLocKeys(text) {
  // каждый «запись» выглядит как: Key Value, или Key , Value
  // сначала разобьём по запятым, потом берём первый токен как ключ
  const keys = new Set();
  text.split(",").forEach(chunk => {
    const trimmed = chunk.trim();
    if (!trimmed) return;
    // ключ до первого пробела
    const key = trimmed.split(/\s+/)[0];
    if (key) keys.add(key);
  });
  return keys;
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

document.getElementById("compareBtn").addEventListener("click", async () => {
  const fileEn = document.getElementById("fileEn").files[0];
  const fileRu = document.getElementById("fileRu").files[0];

  if (!fileEn || !fileRu) {
    alert("Выбери оба файла");
    return;
  }

  const [textEn, textRu] = await Promise.all([
    readFileAsText(fileEn),
    readFileAsText(fileRu),
  ]);

  const keysEn = parseLocKeys(textEn);
  const keysRu = parseLocKeys(textRu);

  const missingInRu = [];
  const extraInRu = [];

  for (const k of keysEn) {
    if (!keysRu.has(k)) missingInRu.push(k);
  }
  for (const k of keysRu) {
    if (!keysEn.has(k)) extraInRu.push(k);
  }

  document.getElementById("missingRu").textContent =
    "Нет в переводе:\n" + missingInRu.sort().join("\n");

  document.getElementById("extraRu").textContent =
    "Лишние в переводе:\n" + extraInRu.sort().join("\n");
});