const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nome, email, telefone, objetivo, mensagem, website } = req.body || {};

  // Honeypot
  if (website) {
    return res.redirect(302, "/?enviado=true#contato");
  }

  if (!nome || !email || !telefone || !objetivo) {
    return res.redirect(302, "/?enviado=erro#contato");
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const toEmail = process.env.CONTACT_TO || "contato@emassets.com.br";

  if (!smtpUser || !smtpPass) {
    return res.redirect(302, "/?enviado=erro#contato");
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

    return res.redirect(302, "/?enviado=true#contato");
  } catch (error) {
    return res.redirect(302, "/?enviado=erro#contato");
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
