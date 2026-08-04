import { formatINR } from "@/lib/format";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;
const YELLOW = "#e9d400"; // athletic yellow (email-safe hex approximation of the brand)
const INK = "#161616";

/** Shared, email-client-safe HTML shell with the 5XL brand header/footer. */
function layout(inner: string, preview = ""): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
${preview ? `<span style="display:none;opacity:0;color:transparent">${preview}</span>` : ""}
</head>
<body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4">
        <tr><td style="background:${YELLOW};padding:20px 28px">
          <span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:${INK}">5XL</span>
          <span style="font-size:11px;font-weight:700;letter-spacing:2px;color:${INK};opacity:.7"> NUTRITION</span>
        </td></tr>
        <tr><td style="padding:28px">${inner}</td></tr>
        <tr><td style="padding:20px 28px;background:#fafaf9;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c">
          5XL Nutrition · Fuel beyond limits.<br>
          <a href="${APP_URL}" style="color:#78716c">${APP_URL.replace(/^https?:\/\//, "")}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${YELLOW};color:${INK};font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px">${label}</a>`;
}

export type OrderEmailData = {
  name: string;
  email: string;
  orderNumber: string;
  items: { name: string; qty: number; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

export function orderConfirmationEmail(o: OrderEmailData): { subject: string; html: string } {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f0efed">${i.name} <span style="color:#a8a29e">× ${i.qty}</span></td>
         <td align="right" style="padding:8px 0;border-bottom:1px solid #f0efed;white-space:nowrap">${formatINR(i.lineTotal)}</td></tr>`
    )
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;color:${strong ? INK : "#78716c"};${strong ? "font-weight:700;font-size:16px" : ""}">${label}</td>
     <td align="right" style="padding:4px 0;${strong ? "font-weight:700;font-size:16px" : ""}">${value}</td></tr>`;

  const inner = `
    <h1 style="margin:0 0 6px;font-size:22px">Thanks for your order, ${o.name}! 🎉</h1>
    <p style="margin:0 0 20px;color:#57534e">We've received your payment. Order <strong>${o.orderNumber}</strong> is confirmed and being prepared.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:12px">
      ${line("Subtotal", formatINR(o.subtotal))}
      ${o.discount > 0 ? line("Discount", "−" + formatINR(o.discount)) : ""}
      ${line("Shipping", o.shipping === 0 ? "FREE" : formatINR(o.shipping))}
      ${line("Total", formatINR(o.total), true)}
    </table>
    <div style="margin-top:24px">${button(`${APP_URL}/account/orders/${o.orderNumber}`, "View your order")}</div>`;

  return {
    subject: `Order confirmed — ${o.orderNumber}`,
    html: layout(inner, `Your 5XL order ${o.orderNumber} is confirmed`),
  };
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 6px;font-size:22px">Welcome to the squad, ${name}! 💪</h1>
    <p style="margin:0 0 20px;color:#57534e">Your 5XL account is ready. Lab-tested whey, creatine and mass gainers — authentic supplements delivered fast across India.</p>
    <div>${button(`${APP_URL}/products`, "Start shopping")}</div>`;
  return {
    subject: "Welcome to 5XL Nutrition",
    html: layout(inner, "Your 5XL account is ready"),
  };
}
