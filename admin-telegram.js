(function () {
  const token = window.TDigitalAdminAuth && window.TDigitalAdminAuth.getToken && window.TDigitalAdminAuth.getToken();
  if (!token) return;

  const form = document.getElementById("telegramForm");
  const chatIdInput = document.getElementById("telegramChatId");
  const botTokenInput = document.getElementById("telegramBotToken");
  const statusEl = document.getElementById("telegramStatus");
  const chatIdEnvNote = document.getElementById("chatIdEnvNote");
  const tokenEnvNote = document.getElementById("tokenEnvNote");
  const tokenMasked = document.getElementById("tokenMasked");
  const testBtn = document.getElementById("telegramTestBtn");
  const testStatus = document.getElementById("telegramTestStatus");

  function showStatus(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.style.background = isError ? "#fef2f2" : "#f0fdf4";
    el.style.borderColor = isError ? "#fecaca" : "#bbf7d0";
  }

  function hideStatus(el) {
    if (el) el.hidden = true;
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/telegram", {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus(statusEl, data.error || "Laden fehlgeschlagen.", true);
        return;
      }
      if (!data.chatIdFromEnv) {
        chatIdInput.value = data.chatId || "";
        chatIdInput.disabled = false;
      } else {
        chatIdInput.value = data.chatId || "";
        chatIdInput.disabled = true;
        chatIdEnvNote.style.display = "inline";
      }
      if (!data.botTokenFromEnv) {
        botTokenInput.placeholder = "Neues Token eingeben oder leer lassen";
        botTokenInput.disabled = false;
        tokenEnvNote.style.display = "none";
        if (data.botTokenMasked) {
          tokenMasked.textContent = "Gespeichert: " + data.botTokenMasked;
          tokenMasked.style.display = "inline";
        }
      } else {
        botTokenInput.disabled = true;
        botTokenInput.placeholder = "Aus Umgebung gesetzt";
        tokenEnvNote.style.display = "inline";
        if (data.botTokenMasked) {
          tokenMasked.textContent = "Aus Umgebung: " + data.botTokenMasked;
          tokenMasked.style.display = "inline";
        }
      }
      testBtn.disabled = !data.configured;
    } catch (e) {
      showStatus(statusEl, "Netzwerkfehler.", true);
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideStatus(statusEl);
      const chatId = chatIdInput.value.trim();
      const botToken = botTokenInput.value.trim();
      if (chatIdInput.disabled) {
        showStatus(statusEl, "Chat-ID wird aus der Umgebung gelesen.", false);
        return;
      }
      try {
        const res = await fetch("/api/admin/telegram", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify({ chatId: chatId || null, botToken: botToken || null })
        });
        const data = await res.json();
        if (!res.ok) {
          showStatus(statusEl, data.error || "Speichern fehlgeschlagen.", true);
          return;
        }
        showStatus(statusEl, "Gespeichert.", false);
        if (data.botTokenMasked) {
          tokenMasked.textContent = "Gespeichert: " + data.botTokenMasked;
          tokenMasked.style.display = "inline";
        }
        botTokenInput.value = "";
        testBtn.disabled = !data.configured;
      } catch (e) {
        showStatus(statusEl, "Netzwerkfehler.", true);
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      hideStatus(testStatus);
      testBtn.disabled = true;
      try {
        const res = await fetch("/api/telegram/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "OrzuIT Testnachricht – Integration funktioniert." })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showStatus(testStatus, "Testnachricht gesendet.", false);
        } else {
          showStatus(testStatus, data.error || "Senden fehlgeschlagen.", true);
        }
      } catch (e) {
        showStatus(testStatus, "Netzwerkfehler.", true);
      }
      testBtn.disabled = false;
    });
  }

  loadSettings();
})();
