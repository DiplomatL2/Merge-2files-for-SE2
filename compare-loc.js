function parseLocKeys(text) {
  const keys = new Set();

  // 1) сначала режем по запятым — у тебя именно так разделены пары
  const chunks = text.split(",");

  for (let raw of chunks) {
    const s = raw.trim();
    if (!s) continue;

    // 2) игнорируем явный мусор: одиночные слова без двоеточий/пробела-значения
    //   но это лучше сделать позитивно: вытащить только то, что похоже на ключ

    let key = null;

    // вариант А: JSON‑подобный: "Key": "Value"
    // (в русской версии видно: "ItemTransferAmount10": "Move 10" и т.п.)
    const mQuoted = s.match(/^"([^"]+)"\s*:/);
    if (mQuoted) {
      key = mQuoted[1];
    } else {
      // вариант Б: простой: Key Value...
      // (как в английском: ItemTransferAmount10 Move 10)
      const firstSpace = s.indexOf(" ");
      if (firstSpace > 0) {
        key = s.slice(0, firstSpace).trim();
      } else {
        // если пробела нет, но строка без пробела — может быть чистый ключ без значения
        // например: ScenarioDescriptionVallationStationStart:
        const mSimple = s.match(/^([A-Za-z0-9_]+):?$/);
        if (mSimple) key = mSimple[1];
      }
    }

    if (!key) continue;

    // отсеиваем явный шум: короткие слова, слова без заглавных/подчёркиваний
    if (key.length < 3) continue;
    if (!/[A-Z_]/.test(key)) continue;

    keys.add(key);
  }

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
