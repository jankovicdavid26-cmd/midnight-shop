const clean = (s, n) => String(s || "").replace(/[@`]/g, "").trim().slice(0, n);
const json = (code, obj) => ({ statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { ok: false });

  let d;
  try { d = JSON.parse(event.body); } catch { return json(400, { ok: false }); }

  if (d.website) return json(200, { ok: true, id: "MS-OK" });

  const o = {
    product: clean(d.product, 60),
    plan: clean(d.plan, 60),
    price: clean(d.price, 40),
    discord: clean(d.discord, 40),
    pay: ["PayPal", "Bankovni prenos"].includes(d.pay) ? d.pay : "PayPal",
    note: clean(d.note, 300) || "-",
  };
  if (!o.product || !o.plan || !o.discord) return json(400, { ok: false });

  const id = "MS-" + Date.now().toString(36).toUpperCase();
  const body = {
    content: "@here Nova narudžbina!",
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      title: `Nova narudžbina ${id}`,
      color: 0x2f6bff,
      fields: [
        { name: "Proizvod", value: o.product, inline: true },
        { name: "Paket", value: o.plan, inline: true },
        { name: "Cena", value: o.price, inline: true },
        { name: "Discord kupca", value: o.discord, inline: true },
        { name: "Plaćanje", value: o.pay, inline: true },
        { name: "Napomena", value: o.note },
      ],
      footer: { text: "Midnight Shop" },
      timestamp: new Date().toISOString(),
    }],
  };
  if (process.env.USE_FORUM === "1") body.thread_name = `${id} | ${o.product} | ${o.discord}`.slice(0, 100);

  try {
    const r = await fetch(process.env.DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return json(502, { ok: false });
    return json(200, { ok: true, id });
  } catch {
    return json(502, { ok: false });
  }
};
