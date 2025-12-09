function parseLocKeysWithLines(text) {
  const map = new Map(); // key -> lineNumber
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const chunks = line.split(",");

    for (let raw of chunks) {
      const s = raw.trim();
      if (!s) continue;

      let key = null;

      // "Key": "Value"
      const mQuoted = s.match(/^"([^"]+)"\s*:/);
      if (mQuoted) {
        key = mQuoted[1];
      } else {
        // Key Value...
        const firstSpace = s.indexOf(" ");
        if (firstSpace > 0) {
          key = s.slice(0, firstSpace).trim();
        } else {
          continue;
        }
      }

      if (!key) continue;

      if (key.length < 3) continue;
      if (!/^[A-Za-z0-9_]+$/.test(key)) continue;
      if (!/[A-Z_]/.test(key)) continue;

      // записываем только первый раз (первая строка с таким ключом)
      if (!map.has(key)) {
        map.set(key, lineNumber);
      }
    }
  });

  return map;
}

function parseLocKeys(text) {
  // для RU нам номера строк не нужны, достаточно Set
  return new Set(parseLocKeysWithLines(text).keys());
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

  const keysEnWithLines = parseLocKeysWithLines(textEn);
  const keysRu = parseLocKeys(textRu);

  const missingInRu = [];
  const extraInRu = [];

  // есть в EN, нет в RU
  for (const [key, line] of keysEnWithLines.entries()) {
    if (!keysRu.has(key)) {
      missingInRu.push(`${key} (строка ${line})`);
    }
  }

  // есть в RU, нет в EN
  for (const key of keysRu) {
    if (!keysEnWithLines.has(key)) {
      extraInRu.push(key);
    }
  }

  document.getElementById("missingRu").textContent =
    "Нет в переводе (есть в EN, нет в RU):\n" + missingInRu.sort().join("\n");

  document.getElementById("extraRu").textContent =
    "Лишние в переводе (есть в RU, нет в EN):\n" + extraInRu.sort().join("\n");
});
