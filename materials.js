
/*
  СПИСОК УЧЕБНЫХ МАТЕРИАЛОВ
*/

const materials = [
  {
    title: "Методические указания по курсовому проекту",
    category: "Курсовое проектирование",
    description: "Методические материалы · PDF",
    file: "materials/Методические+указания+по+курсовому+проекту+МОС.pdf"
  },
  {
    title: "Методические указания по лабораторным работам",
    category: "Лабораторные работы",
    description: "Лабораторный практикум · PDF",
    file: "materials/Васьков А.С., Мироненко А.А., Математические основы судовождения. Лабораторный практикум.pdf"
  },
  {
    title: "Мореходные таблицы (2000)",
    category: "Дополнительные материалы",
    description: "Справочное пособие · PDF",
    file: "materials/Morehodny'e Tablicy' - 2000.pdf"
  },
  {
    title: "Кожухов — Математические основы судовождения",
    category: "Курсовое проектирование",
    description: "Учебное пособие · PDF",
    file: "materials/Kozhukhov.Matematicheskie.Osnovy.Sudovozhdeniya.pdf"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("materials-list");
  document.getElementById("year").textContent = new Date().getFullYear();

  if (!materials.length) return;

  list.innerHTML = "";

  materials.forEach((item) => {
    const card = document.createElement("article");
    card.className = "material-card";

    const icon = document.createElement("div");
    icon.className = "file-icon";

    const extension = (item.file.split(".").pop() || "FILE").toUpperCase();
    icon.textContent = extension.length > 5 ? "FILE" : extension;

    const info = document.createElement("div");
    info.className = "material-info";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const description = document.createElement("p");
    description.textContent =
      [item.category, item.description].filter(Boolean).join(" · ");

    const link = document.createElement("a");
    link.className = "download-link";
    link.href = item.file;
    link.setAttribute("download", "");
    link.textContent = "Скачать ↓";

    info.append(title, description, link);
    card.append(icon, info);
    list.append(card);
  });
});
