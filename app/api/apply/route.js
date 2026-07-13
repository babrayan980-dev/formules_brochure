import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../../lib/constants";
import { getAdminDb } from "../../../lib/firebase-admin";

const mailTo = process.env.MAIL_TO || "yassineova@gmail.com";
const smtpUser = process.env.SMTP_USER || "babrayan980@gmail.com";

function clean(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTodayDateValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function buildEmailHtml(data) {
  const rows = [
    ["École / établissement", data.school],
    ["Contact", data.contactName],
    ["Email", data.email],
    ["Téléphone", data.phone || "-"],
    ["Formule", data.formule],
    ["Nombre d'enfants", data.childrenCount || "-"],
    ["Date souhaitée", data.requestedDate || "-"],
    ["Ateliers souhaités", data.ateliers.length ? data.ateliers.join(", ") : "-"],
    ["Pause Gourmande", data.pauseGourmande || "Non"],
    ["Message", data.message || "-"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0d5d9;font-weight:700;color:#9f0018;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0d5d9;color:#211b18;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#fff8ed;padding:24px;">
      <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #f0d5d9;">
        <div style="background:#d9041f;color:#ffffff;padding:22px 24px;">
          <h1 style="margin:0;font-size:24px;">Nouvelle demande Bab Rayan</h1>
          <p style="margin:8px 0 0;color:#ffe9e9;">Formulaire de réservation sortie pédagogique</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${tableRows}
        </table>
      </div>
    </div>
  `;
}

function buildConfirmationEmailHtml(data) {
  return `
    <div style="font-family:Arial,sans-serif;background:#fff8ed;padding:24px;">
      <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #f0d5d9;">
        <div style="background:#d9041f;color:#ffffff;padding:22px 24px;">
          <h1 style="margin:0;font-size:24px;">Votre demande a bien été envoyée</h1>
          <p style="margin:8px 0 0;color:#ffe9e9;">Sortie pédagogique Bab Rayan</p>
        </div>
        <div style="padding:24px;color:#211b18;line-height:1.6;">
          <p>Bonjour ${escapeHtml(data.contactName)},</p>
          <p>
            Merci pour votre demande de réservation pour ${escapeHtml(data.school)}.
            L'équipe Bab Rayan l'a bien reçue et vous répondra rapidement pour confirmer les détails.
          </p>
          <p style="margin:18px 0;padding:14px 16px;background:#fff8ed;border-radius:12px;">
            <strong>Formule :</strong> ${escapeHtml(data.formule || "-")}<br />
            <strong>Date souhaitée :</strong> ${escapeHtml(data.requestedDate || "-")}<br />
            <strong>Ateliers :</strong> ${escapeHtml(data.ateliers.length ? data.ateliers.join(", ") : "-")}
          </p>
          <p>À très bientôt,<br />L'équipe Bab Rayan</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Le formulaire est invalide." }, { status: 400 });
  }

  const data = {
    school: clean(body.school),
    contactName: clean(body.contactName),
    email: clean(body.email),
    phone: clean(body.phone),
    formule: clean(body.formule),
    childrenCount: clean(body.childrenCount),
    requestedDate: clean(body.requestedDate),
    pauseGourmande: clean(body.pauseGourmande),
    ateliers: clean(body.ateliers),
    message: clean(body.message),
  };

  if (!data.school || !data.contactName || !data.email) {
    return NextResponse.json(
      { error: "Merci de renseigner l'école, le nom du contact et l'email." },
      { status: 400 },
    );
  }

  if (data.requestedDate && data.requestedDate < getTodayDateValue()) {
    return NextResponse.json(
      { error: "La date souhaitée ne peut pas être antérieure à aujourd'hui." },
      { status: 400 },
    );
  }

  if (!process.env.SMTP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "La configuration email est manquante. Ajoutez SMTP_APP_PASSWORD dans .env.local." },
      { status: 500 },
    );
  }

  let reservationRef;

  try {
    const db = getAdminDb();
    reservationRef = await db.collection(COLLECTIONS.SORTIES_PEDAGOGIQUES).add({
      school: data.school,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      formule: data.formule,
      childrenCount: data.childrenCount ? Number(data.childrenCount) : null,
      requestedDate: data.requestedDate || null,
      pauseGourmande: data.pauseGourmande || "Non",
      ateliers: data.ateliers,
      message: data.message,
      status: "new",
      source: "bab-rayan-formules",
      emailSent: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Save sortie pedagogique error:", error);
    return NextResponse.json(
      { error: "La demande n'a pas pu être enregistrée dans la base de données." },
      { status: 500 },
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Bab Rayan Formulaire" <${smtpUser}>`,
        to: mailTo,
        replyTo: data.email,
        subject: `Demande de réservation - ${data.school}`,
        html: buildEmailHtml(data),
        text: [
          `École : ${data.school}`,
          `Contact : ${data.contactName}`,
          `Email : ${data.email}`,
          `Téléphone : ${data.phone || "-"}`,
          `Formule : ${data.formule}`,
          `Nombre d'enfants : ${data.childrenCount || "-"}`,
          `Date souhaitée : ${data.requestedDate || "-"}`,
          `Ateliers souhaités : ${data.ateliers.length ? data.ateliers.join(", ") : "-"}`,
          `Pause Gourmande : ${data.pauseGourmande || "Non"}`,
          `Message : ${data.message || "-"}`,
        ].join("\n"),
      }),
      transporter.sendMail({
        from: `"Bab Rayan" <${smtpUser}>`,
        to: data.email,
        replyTo: mailTo,
        subject: "Votre demande de réservation Bab Rayan a bien été envoyée",
        html: buildConfirmationEmailHtml(data),
        text: [
          `Bonjour ${data.contactName},`,
          "",
          `Merci pour votre demande de réservation pour ${data.school}.`,
          "L'équipe Bab Rayan l'a bien reçue et vous répondra rapidement pour confirmer les détails.",
          "",
          `Formule : ${data.formule || "-"}`,
          `Date souhaitée : ${data.requestedDate || "-"}`,
          `Ateliers : ${data.ateliers.length ? data.ateliers.join(", ") : "-"}`,
          "",
          "À très bientôt,",
          "L'équipe Bab Rayan",
        ].join("\n"),
      }),
    ]);

    await reservationRef.update({
      emailSent: true,
      confirmationEmailSent: true,
      emailSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: reservationRef.id });
  } catch (error) {
    console.error("Email send failed", error);

    if (reservationRef) {
      await reservationRef.update({
        emailError: error.message || "Email send failed",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(
      { error: "L'email n'a pas pu être envoyé. Vérifiez les identifiants Gmail." },
      { status: 500 },
    );
  }
}
