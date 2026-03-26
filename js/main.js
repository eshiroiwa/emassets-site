const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.18 });

reveals.forEach((el) => io.observe(el));

const heroVideo = document.querySelector(".hero-video");
const parallaxItems = document.querySelectorAll("[data-parallax-speed]");
const scrollFadeSections = document.querySelectorAll("[data-scroll-fade]");

function onScroll() {
  const y = window.scrollY || 0;

  if (heroVideo) {
    heroVideo.style.transform = `translateY(${y * 0.22}px) scale(1.04)`;
  }

  parallaxItems.forEach((item) => {
    const speed = Number(item.dataset.parallaxSpeed || 0.08);
    item.style.transform = `translateY(${y * speed}px)`;
  });

  scrollFadeSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const start = vh * 0.15;
    const end = vh * 0.85;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    section.style.setProperty("--fade-progress", progress.toFixed(3));
    section.style.setProperty("--lift-progress", progress.toFixed(3));
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const tilts = document.querySelectorAll(".tilt");
tilts.forEach((card) => {
  card.addEventListener("mousemove", (ev) => {
    const rect = card.getBoundingClientRect();
    const px = (ev.clientX - rect.left) / rect.width;
    const py = (ev.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 8;
    const rx = (0.5 - py) * 8;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

const params = new URLSearchParams(window.location.search);
const sentStatus = params.get("enviado");
if (sentStatus === "true") {
  const msg = document.createElement("div");
  msg.textContent = "Mensagem enviada com sucesso. Em breve entraremos em contato.";
  msg.style.position = "fixed";
  msg.style.top = "84px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.zIndex = "200";
  msg.style.padding = "10px 14px";
  msg.style.borderRadius = "999px";
  msg.style.background = "rgba(45, 212, 191, 0.2)";
  msg.style.border = "1px solid rgba(45, 212, 191, 0.5)";
  msg.style.color = "#dcfff8";
  msg.style.backdropFilter = "blur(8px)";
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
    params.delete("enviado");
    const url = window.location.pathname + "#contato";
    window.history.replaceState({}, "", url);
  }, 3800);
}

if (sentStatus === "erro") {
  const msg = document.createElement("div");
  msg.textContent = "Nao foi possivel enviar agora. Tente novamente ou chame no WhatsApp.";
  msg.style.position = "fixed";
  msg.style.top = "84px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.zIndex = "200";
  msg.style.padding = "10px 14px";
  msg.style.borderRadius = "999px";
  msg.style.background = "rgba(248, 113, 113, 0.16)";
  msg.style.border = "1px solid rgba(248, 113, 113, 0.55)";
  msg.style.color = "#7f1d1d";
  msg.style.backdropFilter = "blur(8px)";
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
    params.delete("enviado");
    const url = window.location.pathname + "#contato";
    window.history.replaceState({}, "", url);
  }, 4300);
}
