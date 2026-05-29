const crypto = require("crypto");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const token = process.env.NETLIFY_TOKEN;
    const siteId = "ba500d92-5703-4e1a-ae7a-9c946d5ba71"; // ID do seu site

    // PDF enviado pelo Access (base64)
    const pdfBuffer = Buffer.from(event.body, "base64");

    // SHA1 obrigatório para deploys no Netlify
    const sha1 = crypto.createHash("sha1").update(pdfBuffer).digest("hex");

    // 1. Criar deploy
    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: {
            "cardapio.pdf": sha1,
          },
        }),
      }
    );

    const deploy = await deployRes.json();
    const deployId = deploy.id;

    // 2. Enviar o PDF
    await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files/cardapio.pdf`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/pdf",
        },
        body: pdfBuffer,
      }
    );

    // 3. Publicar o deploy
    await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/restore`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: e.toString(),
    };
  }
};
