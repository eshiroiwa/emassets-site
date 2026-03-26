const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = await readBody(req);
  const {
    nome = "",
    email = "",
    telefone = "",
    objetivo = "",
    mensagem = "",
    website = ""
  } = body;

  // Honeypot
  if (website) {
    return res.redirect(303, "/?enviado=true#contato");
  }

  if (!nome || !email || !telefone || !objetivo) {
    return res.redirect(303, "/?enviado=erro#contato");
  }

  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = Number(process.env.SMTP_PORT || 0);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const toEmail = process.env.CONTACT_TO || "";

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !toEmail) {
    return res.redirect(303, "/?enviado=erro#contato");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: `"E&M ASSETS - Site" <${smtpUser}>`,
      to: toEmail,
      replyTo: email,
      subject: "Novo lead - Site E&M ASSETS",
      html: `
        <h2>Novo lead pelo site da E&amp;M ASSETS</h2>
        <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(telefone)}</p>
        <p><strong>Objetivo:</strong> ${escapeHtml(objetivo)}</p>
        <p><strong>Mensagem:</strong><br>${escapeHtml(mensagem || "").replace(/\n/g, "<br>")}</p>
      `
    });

    return res.redirect(303, "/?enviado=true#contato");
  } catch (error) {
    return res.redirect(303, "/?enviado=erro#contato");
  }
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
  }

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  if (!raw) return {};

  const contentType = String(req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  return {};
}
