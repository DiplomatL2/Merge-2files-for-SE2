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

      if (!map.has(key)) {
        map.set(key, lineNumber);
      }
    }
  });

  return map;
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
  const filesEnList = Array.from(document.getElementById("filesEn").files);
  const filesRuList = Array.from(document.getElementById("filesRu").files);

  if (!filesEnList.length || !filesRuList.length) {
    alert("Выбери файлы обеих папок");
    return;
  }

  // индекс по имени файла
  const enByName = new Map();
  const ruByName = new Map();

  filesEnList.forEach(f => enByName.set(f.name, f));
  filesRuList.forEach(f => ruByName.set(f.name, f));

  const allNames = new Set([
    ...Array.from(enByName.keys()),
    ...Array.from(ruByName.keys()),
  ]);

  let output = "";

  for (const name of Array.from(allNames).sort()) {
    const enFile = enByName.get(name);
    const ruFile = ruByName.get(name);

    if (enFile && !ruFile) {
      output += `\n=== ${name} ===\nНет файла перевода (есть только EN)\n`;
      continue;
    }

    if (!enFile && ruFile) {
      output += `\n=== ${name} ===\nЛишний файл перевода (нет исходника EN)\n`;
      continue;
    }

    // пара есть в обеих папках -> сравниваем ключи
    const [textEn, textRu] = await Promise.all([
      readFileAsText(enFile),
      readFileAsText(ruFile),
    ]);

    const keysEnWithLines = parseLocKeysWithLines(textEn);
    const keysRu = new Set(parseLocKeysWithLines(textRu).keys());

    const missingInRu = [];
    const extraInRu = [];

    for (const [key, line] of keysEnWithLines.entries()) {
      if (!keysRu.has(key)) {
        missingInRu.push(`${key} (строка ${line})`);
      }
    }

    for (const key of keysRu) {
      if (!keysEnWithLines.has(key)) {
        extraInRu.push(key);
      }
    }

    output += `\n=== ${name} ===\n`;

    if (missingInRu.length) {
      output += "Нет в переводе (есть в EN, нет в RU):\n" +
        missingInRu.sort().join("\n") + "\n";
    } else {
      output += "Нет в переводе: нет\n";
    }

    if (extraInRu.length) {
      output += "Лишние в переводе (есть в RU, нет в EN):\n" +
        extraInRu.sort().join("\n") + "\n";
    } else {
      output += "Лишние в переводе: нет\n";
    }
  }

  document.getElementById("result").textContent = output.trim();
});