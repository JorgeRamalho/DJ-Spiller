(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const boot = [
    initHeader,
    initSpy,
    initProgress,
    initCanvas,
    initMarquee,
    initCounters,
    initTabs,
    initCopy,
    initOneSheet,
    initForm,
    initDock,
    initPhotos,
    initHouses
  ];

  boot.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.error(fn.name, error);
    }
  });

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });

    const toggle = $(".nav-toggle", header);
    const nav = $("#menu-principal");
    const scrim = $(".nav-scrim");
    if (!toggle || !nav) return;

    const mobile = window.matchMedia("(max-width: 47.99rem)");

    const setOpen = (open, { restoreFocus = false } = {}) => {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("nav-open", open);
      if (scrim) scrim.hidden = !open;
      if (!open && restoreFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    scrim?.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false, { restoreFocus: true });
      }
    });

    mobile.addEventListener("change", (event) => {
      if (!event.matches) setOpen(false);
    });
  }

  function initSpy() {
    const links = $$(".nav-list a");
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (!sections.length) return;

    const mark = (id) => {
      links.forEach((link) => {
        const current = link.getAttribute("href") === `#${id}`;
        if (current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) mark(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initProgress() {
    const bar = $(".progress");
    if (!bar) return;
    const paint = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${value})`;
    };
    paint();
    document.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
  }

  function initCanvas() {
    const canvas = $(".wave");
    const hero = $(".hero");
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let inView = false;
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width) * dpr;
      canvas.height = Math.max(1, rect.height) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
      const bars = 48;
      const gap = 5;
      const barWidth = (width - gap * (bars - 1)) / bars;
      for (let index = 0; index < bars; index += 1) {
        const wave = reduce
          ? 0.45
          : (Math.sin(time / 480 + index * 0.38) + Math.sin(time / 210 + index * 0.17)) / 2;
        const amount = wave * 0.5 + 0.5;
        const barHeight = Math.max(6, amount * height * 0.9);
        ctx.fillStyle = index % 8 === 0 ? "#f0c27a" : "rgba(226, 91, 42, 0.8)";
        ctx.fillRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight);
      }
    };

    const loop = (time) => {
      draw(time);
      if (inView && !reduce && !document.hidden) frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (inView && !reduce && !document.hidden) frame = requestAnimationFrame(loop);
      else draw(0);
    };

    resize();
    window.addEventListener("resize", resize);
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      start();
    }).observe(hero);
    document.addEventListener("visibilitychange", start);
    draw(0);
  }

  function initMarquee() {
    const track = $(".marquee-track");
    if (!track || track.dataset.ready === "true") return;
    track.insertAdjacentHTML("beforeend", track.innerHTML);
    track.dataset.ready = "true";
    track.lastElementChild?.setAttribute("aria-hidden", "true");
  }

  function initCounters() {
    const nodes = $$("[data-count]");
    if (!nodes.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = new Intl.NumberFormat("pt-BR");

    const paint = (node, value) => {
      node.textContent = format.format(value);
    };

    if (reduce) {
      nodes.forEach((node) => paint(node, Number(node.dataset.count)));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const target = Number(node.dataset.count);
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min(1, (now - start) / 900);
          paint(node, Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(node);
      });
    }, { threshold: 0.6 });
    nodes.forEach((node) => observer.observe(node));
  }

  function initTabs() {
    const tablist = $(".tabs");
    if (!tablist) return;
    const tabs = $$("[role='tab']", tablist);
    const panels = $$("[role='tabpanel']");

    const select = (tab) => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(item.getAttribute("aria-controls"));
        if (panel) panel.hidden = !active;
      });
    };

    tablist.addEventListener("click", (event) => {
      const tab = event.target.closest("[role='tab']");
      if (tab) select(tab);
    });

    tablist.addEventListener("keydown", (event) => {
      const current = document.activeElement;
      const index = tabs.indexOf(current);
      if (index < 0) return;
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === index) return;
      event.preventDefault();
      tabs[next].focus();
      select(tabs[next]);
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    }
  }

  function initCopy() {
    $$("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const source = document.getElementById(button.dataset.copy);
        if (!source) return;
        const ok = await copyText(source.textContent.trim());
        const status = $("#copy-status");
        if (!status) return;
        status.hidden = false;
        status.dataset.state = ok ? "ok" : "erro";
        status.textContent = ok
          ? "Texto copiado. Pode colar na arte, na bio ou na mensagem."
          : "Não foi possível copiar neste navegador. Selecione o texto manualmente.";
      });
    });
  }

  function initOneSheet() {
    const button = $("#baixar-sheet");
    if (!button) return;
    button.addEventListener("click", () => {
      const blocks = ["bio-curta", "bio-longa", "rider"].map((id) => {
        const node = document.getElementById(id);
        return node ? node.textContent.trim() : "";
      });
      const text = [
        "SPILER — DJ Spiller",
        "Cristian Spieler · Curitiba e região",
        "Instagram: https://www.instagram.com/spiler.music/",
        "Linktree: https://linktr.ee/Cristianspieler",
        "",
        "BIO CURTA",
        blocks[0],
        "",
        "BIO LONGA",
        blocks[1],
        "",
        "ALINHAMENTO DE BOOTH",
        blocks[2],
        "",
        "Números públicos do Instagram em 19 out 2026: 5.827 seguidores e 99 posts."
      ].join("\n");
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "spiler-one-sheet.txt";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function initForm() {
    const form = $("#briefing");
    if (!form) return;
    const status = $("#form-status");
    const message = $("#mensagem");
    const counter = $("#mensagem-contador");
    const need = $("#necessidade");

    const refreshCount = () => {
      if (!message || !counter) return;
      counter.textContent = `${message.value.length} / 800`;
    };
    message?.addEventListener("input", refreshCount);
    refreshCount();

    need?.addEventListener("change", () => {
      if (!message) return;
      if (need.value === "press" && message.value.trim() === "") {
        message.value = "Olá, Spiler. Preciso do press kit para divulgação. A data, a casa e o veículo são: ";
        refreshCount();
      }
    });

    const fields = [
      ["nome", (value) => value.trim().length >= 2, "Diga seu nome."],
      ["casa", (value) => value.trim().length >= 2, "Diga a casa, a produtora ou o veículo."],
      ["cidade", (value) => value.trim().length >= 2, "Diga a cidade do evento."],
      ["data", (value) => value !== "", "Escolha a data."],
      ["formato", (value) => value !== "", "Escolha o formato."],
      ["necessidade", (value) => value !== "", "Diga o que você precisa."],
      ["email", (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Esse e-mail não parece válido."],
      ["mensagem", (value) => value.trim().length >= 20 && value.trim().length <= 800, "Escreva entre 20 e 800 caracteres."]
    ];

    const setError = (id, text) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id}-erro`);
      if (!input || !error) return;
      error.textContent = text;
      input.setAttribute("aria-invalid", text ? "true" : "false");
      if (text) input.setAttribute("aria-describedby", error.id);
      else input.removeAttribute("aria-describedby");
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if ($("#empresa-site")?.value) return;

      let valid = true;
      fields.forEach(([id, check, text]) => {
        const input = document.getElementById(id);
        const messageText = input && check(input.value) ? "" : text;
        if (messageText) valid = false;
        setError(id, messageText);
      });

      if (!valid) {
        status.hidden = false;
        status.dataset.state = "erro";
        status.textContent = "Revise os campos marcados antes de montar o briefing.";
        const firstInvalid = $("[aria-invalid='true']", form);
        firstInvalid?.focus();
        return;
      }

      const data = new FormData(form);
      const when = new Date(`${data.get("data")}T12:00:00`);
      const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(when);
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const past = when < today;
      const briefing = [
        "Briefing SPILER",
        `Nome: ${data.get("nome")}`,
        `Casa / veículo: ${data.get("casa")}`,
        `Cidade: ${data.get("cidade")}`,
        `Data: ${dateLabel}`,
        `Formato: ${data.get("formato")}`,
        `Pedido: ${$("#necessidade option:checked")?.textContent || ""}`,
        data.get("email") ? `E-mail: ${data.get("email")}` : "",
        data.get("fone") ? `Telefone: ${data.get("fone")}` : "",
        "",
        String(data.get("mensagem")).trim(),
        past ? "\nNota: a data escolhida já passou." : ""
      ].filter(Boolean).join("\n");

      const copied = await copyText(briefing);
      status.hidden = false;
      status.dataset.state = "ok";
      status.innerHTML = copied
        ? `Briefing copiado${past ? " (a data já passou)" : ""}. Abra a DM e cole a mensagem. <a href="https://ig.me/m/spiler.music">Falar no Instagram</a>`
        : "O texto está pronto abaixo. Copie e envie na DM do Instagram.";
      const preview = $("#briefing-preview");
      if (preview) {
        preview.hidden = false;
        preview.textContent = briefing;
      }
    });
  }

  function initDock() {
    const dock = $(".dock");
    const contact = $("#contato");
    if (!dock || !contact) return;
    const narrow = window.matchMedia("(max-width: 63.99rem)");
    let contactVisible = false;
    const toggle = () => {
      const show = narrow.matches && !contactVisible && window.scrollY > 480;
      dock.hidden = !show;
      document.body.classList.toggle("has-dock", show);
    };
    new IntersectionObserver(([entry]) => {
      contactVisible = entry.isIntersecting;
      toggle();
    }, { threshold: 0.25 }).observe(contact);
    document.addEventListener("scroll", toggle, { passive: true });
    narrow.addEventListener("change", toggle);
    toggle();
  }

  function initPhotos() {
    const photo = $("#hero-photo");
    const caption = $("#hero-caption");
    const slides = $$(".hero-slides li");
    const dialog = $("#lightbox");
    const lightImg = $("#lightbox-img");
    const lightCaption = $("#lightbox-caption");
    const lightCount = $("#lightbox-count");
    const rail = $("#rail");
    const railPrev = $("#rail-prev");
    const railNext = $("#rail-next");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let heroIndex = 0;
    let heroTimer = 0;
    let lightIndex = 0;

    const shots = () => $$("#rail [data-shot]");

    const showSlide = (index) => {
      const slide = slides[index];
      if (!photo || !slide) return;
      heroIndex = index;
      photo.style.opacity = "0.35";
      window.setTimeout(() => {
        photo.src = slide.dataset.src;
        photo.alt = slide.dataset.alt || "";
        if (caption) caption.textContent = slide.dataset.caption || "";
        photo.style.opacity = "1";
      }, reduce ? 0 : 140);
    };

    if (!reduce && slides.length > 1) {
      heroTimer = window.setInterval(() => {
        showSlide((heroIndex + 1) % slides.length);
      }, 4600);
    }

    const show = (index) => {
      const items = shots();
      if (!dialog || !items.length) return;
      lightIndex = (index + items.length) % items.length;
      const item = items[lightIndex];
      lightImg.src = item.dataset.src;
      lightImg.alt = item.querySelector("img")?.alt || "";
      lightCaption.textContent = item.dataset.caption || "";
      lightCount.textContent = `${lightIndex + 1} / ${items.length}`;
      if (!dialog.open) dialog.showModal();
    };

    const openSrc = (src) => {
      const index = shots().findIndex((item) => item.dataset.src === src);
      show(index < 0 ? 0 : index);
    };

    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open]");
      if (opener) {
        openSrc(opener.dataset.open);
        return;
      }
      const shot = event.target.closest("#rail [data-shot]");
      if (shot) show(shots().indexOf(shot));
    });

    dialog?.addEventListener("click", (event) => {
      const action = event.target.closest("[data-lightbox]")?.dataset.lightbox;
      if (action === "close") dialog.close();
      if (action === "next") show(lightIndex + 1);
      if (action === "prev") show(lightIndex - 1);
      if (event.target === dialog) dialog.close();
    });

    dialog?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(lightIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(lightIndex - 1);
      }
    });

    const railItemLeft = (item) => {
      if (!rail) return 0;
      return item.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    };

    const railIndex = () => {
      const items = shots();
      if (!rail || !items.length) return 0;
      const scroll = rail.scrollLeft;
      let index = 0;
      let nearest = Infinity;
      items.forEach((item, i) => {
        const dist = Math.abs(railItemLeft(item) - scroll);
        if (dist < nearest) {
          nearest = dist;
          index = i;
        }
      });
      return index;
    };

    const updateRailNav = () => {
      if (!rail) return;
      const items = shots();
      const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (railPrev) railPrev.disabled = items.length < 2 || rail.scrollLeft <= 1;
      if (railNext) railNext.disabled = items.length < 2 || rail.scrollLeft >= max - 1;
    };

    const stepRail = (dir) => {
      const items = shots();
      if (!rail || !items.length) return;
      const next = Math.min(items.length - 1, Math.max(0, railIndex() + dir));
      rail.scrollTo({
        left: railItemLeft(items[next]),
        behavior: reduce ? "auto" : "smooth"
      });
    };

    railPrev?.addEventListener("click", () => stepRail(-1));
    railNext?.addEventListener("click", () => stepRail(1));
    rail?.addEventListener("scroll", updateRailNav, { passive: true });
    rail?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepRail(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepRail(-1);
      }
    });
    window.addEventListener("resize", updateRailNav);
    updateRailNav();
  }

  function initHouses() {
    const toggle = $("#houses-more");
    const extras = $$(".house-more");
    if (!toggle || !extras.length) return;

    const setExpanded = (open) => {
      extras.forEach((house) => {
        house.hidden = !open;
      });
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Ver menos" : "Ver mais…";
    };

    setExpanded(false);

    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });
  }
})();
