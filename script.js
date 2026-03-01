const terminal = document.querySelector(".terminal");
const commandInput = document.getElementById("command-input");
const commandTyped = document.getElementById("command-typed");
const commandGhost = document.querySelector(".command-ghost");
const hint = document.getElementById("command-hint");
const log = document.getElementById("log");
const progressValue = document.getElementById("progress-value");
const progressFill = document.getElementById("progress-fill");
const progressFooter = document.getElementById("progress-footer");
const progress = document.getElementById("progress");
const profile = document.querySelector(".profile");
const toast = document.getElementById("toast");
const terminalHeader = document.querySelector(".terminal__header");
const openTerminalBtn = document.getElementById("open-terminal-btn");

const steps = [
  { text: "Scanning project tree...", type: "muted", icon: ">" },
  { text: "Resolving packages...", type: "muted", icon: ">" },
  { text: "Bundling assets...", type: "muted", icon: ">" },
  { text: "Generating chunks...", type: "muted", icon: ">" },
  { text: "Caching build data...", type: "muted", icon: ">" },
  { text: "Optimizing output...", type: "muted", icon: ">" },
  { text: "Build finished", type: "success", icon: "✓" },
  { text: "Warming up server...", type: "accent", icon: "→" },
  { text: "Server ready", type: "accent", icon: "→" },
];

const targetPercent = 89;
const totalSteps = steps.length;
let hasStarted = false;
let previousValue = "";
let toastTimer = null;
let shellMode = false;
let buildFinished = false;

function addLogLine({ text, type, icon }) {
  const line = document.createElement("div");
  line.className = "log__line";

  if (type === "accent") {
    line.classList.add("log__line--accent");
  }
  if (type === "success") {
    line.classList.add("log__line--success");
  }

  const iconSpan = document.createElement("span");
  iconSpan.className = "log__icon";
  iconSpan.textContent = icon;

  const textSpan = document.createElement("span");
  textSpan.textContent = text;

  line.append(iconSpan, textSpan);
  log.append(line);

  requestAnimationFrame(() => {
    line.classList.add("is-visible");
  });
}

function updateProgress(stepIndex) {
  const fraction = (stepIndex + 1) / totalSteps;
  const percent = Math.round(fraction * targetPercent);
  progressValue.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
  progressFooter.textContent = `Processing ${stepIndex + 1}/${totalSteps}...`;
}

function runSteps() {
  progress.classList.add("is-visible");
  steps.forEach((step, index) => {
    setTimeout(() => {
      addLogLine(step);
      updateProgress(index);
      if (index === totalSteps - 1) {
        setTimeout(() => {
          buildFinished = true;
          terminal.classList.add("terminal--done");
          profile.classList.remove("profile--hidden");
        }, 600);
      }
    }, 600 * (index + 1));
  });
}

const shellCommands = {
  "--help": {
    description: "Показать все команды",
    run: () => {
      const entries = Object.entries(shellCommands).map(
        ([name, config]) => `${name} - ${config.description}`
      );
      return ["Доступные команды:", ...entries];
    },
  },
  whoami: {
    description: "Информация о разработчике",
    run: () => ["kanekiq - Full-stack developer", "Game systems, UI and backend integration"],
  },
  stack: {
    description: "Текущий технический стек",
    run: () => ["TypeScript, Node.js, React, PostgreSQL, Redis, Lua, Python, C#, C++, PHP"],
  },
  contacts: {
    description: "Контакты для связи",
    run: () => ["Telegram: ghouldul", "Discord: gh0ldul777"],
  },
  projects: {
    description: "Статистика по проектам",
    run: () => ["10+ completed projects", "2 years production experience", "24/7 support"],
  },
  status: {
    description: "Текущий статус",
    run: () => ["Status: Online", "Open for new projects"],
  },
  date: {
    description: "Текущая дата и время",
    run: () => [new Date().toLocaleString("ru-RU")],
  },
  clear: {
    description: "Очистить терминал",
    run: () => {
      log.textContent = "";
      return [];
    },
  },
  close: {
    description: "Скрыть терминал",
    run: () => {
      shellMode = false;
      terminal.classList.add("terminal--done");
      return ["Terminal closed"];
    },
  },
};

function runShellCommand(inputCommand) {
  const command = inputCommand.trim();
  if (!command) {
    return;
  }

  addLogLine({ text: command, type: "accent", icon: "~" });
  const handler = shellCommands[command];
  if (!handler) {
    addLogLine({ text: `Command not found: ${command}`, type: "muted", icon: "!" });
    addLogLine({ text: "Введите --help для списка команд", type: "muted", icon: ">" });
    return;
  }

  const outputLines = handler.run();
  outputLines.forEach((line) => addLogLine({ text: line, type: "muted", icon: ">" }));
}

function openTerminalShell() {
  if (!buildFinished) {
    return;
  }
  shellMode = true;
  terminal.classList.remove("terminal--done");
  progress.classList.remove("is-visible");
  commandGhost.textContent = "--help";
  hint.textContent = "Введите --help и нажмите Enter.";
  commandInput.removeAttribute("disabled");
  commandInput.value = "";
  previousValue = "";
  renderTyped("");
  log.textContent = "";
  commandInput.focus();
  const x = Number(terminal.dataset.x || 0);
  const y = Number(terminal.dataset.y || 0);
  terminal.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  addLogLine({ text: "kanekiq shell initialized", type: "success", icon: "✓" });
  addLogLine({ text: "Введите --help для просмотра команд", type: "muted", icon: ">" });
}

function startSequence() {
  if (hasStarted) {
    return;
  }
  const value = commandInput.value.trim();
  if (!value) {
    commandInput.focus();
    return;
  }
  hasStarted = true;
  commandInput.setAttribute("disabled", "true");
  commandInput.blur();
  hint.textContent = "";
  setTimeout(runSteps, 400);
}

function renderTyped(value) {
  const isAppend = value.startsWith(previousValue);
  const appendFrom = previousValue.length;
  commandTyped.textContent = "";

  if (shellMode) {
    commandGhost.textContent = value.length ? "" : "--help";
  } else {
    commandGhost.textContent = "npm run build";
  }

  for (let i = 0; i < value.length; i += 1) {
    const span = document.createElement("span");
    span.className = "typed-char";
    span.textContent = value[i];

    if (isAppend && i >= appendFrom) {
      span.classList.add("is-new");
    }

    commandTyped.append(span);
  }

  if (isAppend && value.length > appendFrom) {
    requestAnimationFrame(() => {
      const newChars = commandTyped.querySelectorAll(".typed-char.is-new");
      newChars.forEach((char) => char.classList.add("is-visible"));
    });
  }

  previousValue = value;
}

commandInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (shellMode) {
      runShellCommand(commandInput.value);
      commandInput.value = "";
      previousValue = "";
      renderTyped("");
      return;
    }
    startSequence();
  }
});

commandInput.addEventListener("input", (event) => {
  renderTyped(event.target.value);
});

window.addEventListener("load", () => {
  requestAnimationFrame(() => {
    terminal.classList.remove("terminal--hidden");
    commandInput.focus();
    terminal.dataset.x = "0";
    terminal.dataset.y = "0";
    terminal.style.transform = "translate(-50%, -50%) translate(0px, 0px)";
  });
});

async function copyToClipboard(value) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const success = document.execCommand("copy");
  textarea.remove();
  return success;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-copy]");
  if (!target) {
    return;
  }

  const value = target.getAttribute("data-copy");
  if (!value) {
    return;
  }

  const ok = await copyToClipboard(value);
  showToast(ok ? `Скопировано: ${value}` : "Не удалось скопировать");
});

if (openTerminalBtn) {
  openTerminalBtn.addEventListener("click", () => {
    openTerminalShell();
  });
}

if (terminal && terminalHeader) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;

  const onPointerMove = (event) => {
    if (!isDragging) {
      return;
    }
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const nextX = startOffsetX + deltaX;
    const nextY = startOffsetY + deltaY;
    terminal.dataset.x = `${nextX}`;
    terminal.dataset.y = `${nextY}`;
    terminal.style.transform = `translate(-50%, -50%) translate(${nextX}px, ${nextY}px)`;
  };

  const endDrag = () => {
    if (!isDragging) {
      return;
    }
    isDragging = false;
    terminal.classList.remove("is-dragging");
    document.removeEventListener("mousemove", onPointerMove);
    document.removeEventListener("mouseup", endDrag);
  };

  terminalHeader.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    isDragging = true;
    terminal.classList.add("is-dragging");
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = Number(terminal.dataset.x || 0);
    startOffsetY = Number(terminal.dataset.y || 0);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", endDrag);
  });
}
