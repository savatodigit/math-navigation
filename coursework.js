/*
  Регистрация и получение задания на курсовой проект для ЗФ
*/
const SUPABASE_URL = "https://hwouyzjeoojwpbawszpm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HhFW_s2zFOOpCi3XZbX64w_DzyxEUsu";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("coursework-form");
  const result = document.getElementById("coursework-result");
  if (!form || !result) return;

  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_PUBLISHABLE_KEY,
    "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
  };

  const showResult = (message, isError = false) => {
    result.hidden = false;
    result.classList.toggle("error", isError);
    result.innerHTML = message;
  };

  async function getDownloadLink(student) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/download-coursework`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        surname: student.surname,
        study_group: student.study_group,
        record_book_no: student.record_book_no
      })
    });
    const data = await response.json();
    if (!response.ok || !data.download_url) {
      throw new Error(data.error || "Не удалось подготовить файл задания.");
    }
    return data;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const student = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    button.textContent = "Обработка данных…";
    result.hidden = true;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/register-coursework`, {
        method: "POST",
        headers,
        body: JSON.stringify(student)
      });
      const data = await response.json();

      if (response.ok && data.status === "issued") {
        const file = await getDownloadLink(student);
        showResult(`Регистрация успешно завершена. Вам назначен <strong>вариант №${data.variant_no}</strong>.<br><a href="${file.download_url}" target="_blank" rel="noopener">Скачать задание на курсовой проект (PDF)</a><br><small>Ссылка действительна 5 минут. При необходимости отправьте форму повторно, чтобы получить новую ссылку на тот же вариант.</small>`);
      } else if (response.status === 409 && data.status === "already_registered") {
        const file = await getDownloadLink(student);
        showResult(`По этому номеру зачётной книжки заявка уже зарегистрирована. Ваш вариант: <strong>№${data.variant_no}</strong>.<br><a href="${file.download_url}" target="_blank" rel="noopener">Скачать ранее назначенное задание (PDF)</a><br><small>Новый вариант при повторной регистрации не назначается.</small>`);
      } else {
        throw new Error(data.error || data.message || "Не удалось выполнить регистрацию.");
      }
    } catch (error) {
      showResult(error.message || "Произошла ошибка. Попробуйте ещё раз позже.", true);
    } finally {
      button.disabled = false;
      button.innerHTML = 'Зарегистрироваться и получить задание <span aria-hidden="true">→</span>';
    }
  });
});
