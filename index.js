const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`البوت شغال باسم ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content === 'هلا') {
        message.reply('هلا والله 👋');
    }
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const express = require("express");
const fs = require("fs");

// =========================
// الإعدادات
// =========================

const TOKEN = "توكن_البوت_هنا";
const CLIENT_ID = "CLIENT_ID";
const CLIENT_SECRET = "CLIENT_SECRET";
const REDIRECT_URI = "https://YOUR-DOMAIN.com/callback";
const SELLER_ROLE_ID = "ROLE_ID";

// =========================
// حفظ الأعضاء
// =========================

const DB_FILE = "./members.json";

let members = {};

if (fs.existsSync(DB_FILE)) {
  try {
    members = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    members = {};
  }
}

function saveMembers() {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(members, null, 2)
  );
}

// =========================
// البوت
// =========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// أمر متجر
// =========================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "متجر") {

    const embed = new EmbedBuilder()
      .setTitle("🛒 متجر الأعضاء")
      .setDescription(
        "اضغط على الزر بالأسفل للاشتراك في القيف أواي.\n\n" +
        "بعد موافقتك عبر Discord سيتم تسجيلك كـ **عضو مبيع**."
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_shop")
        .setLabel("🎁 اشتراك")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // بيع SERVER_ID العدد
  // =========================

  if (message.content.startsWith("بيع ")) {

    if (!message.member.roles.cache.has(SELLER_ROLE_ID)) {
      return message.reply("❌ ما عندكش صلاحية استخدام أمر البيع.");
    }

    const args = message.content.trim().split(/\s+/);

    const serverId = args[1];
    const amount = Number(args[2]);

    if (!serverId || !amount || amount <= 0) {
      return message.reply(
        "❌ الاستخدام:\n`بيع SERVER_ID العدد`"
      );
    }

    const available = Object.values(members)
      .filter(member => member.accessToken);

    if (available.length < amount) {
      return message.reply(
        `❌ المتوفر حالياً: ${available.length} عضو.\nالمطلوب: ${amount}`
      );
    }

    await message.reply(
      `🟢 بدأت عملية بيع **${amount}** عضو للسيرفر:\n\`${serverId}\``
    );

    let success = 0;
    let failed = 0;

    for (const member of available.slice(0, amount)) {

      try {

        const response = await fetch(
          `https://discord.com/api/v10/guilds/${serverId}/members/${member.id}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bot ${TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              access_token: member.accessToken
            })
          }
        );

        if (
          response.status === 201 ||
          response.status === 204
        ) {
          success++;
        } else {
          failed++;
        }

      } catch (error) {
        console.error(error);
        failed++;
      }
    }

    await message.channel.send(
      `📦 **نتيجة البيع**\n\n` +
      `✅ تم إدخال: **${success}**\n` +
      `❌ فشل: **${failed}**`
    );
  }
});

// =========================
// زر الاشتراك
// =========================

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  if (interaction.customId !== "join_shop") return;

  const userId = interaction.user.id;

  if (members[userId]) {
    return interaction.reply({
      content: "✅ أنت مسجل بالفعل كعضو مبيع.",
      ephemeral: true
    });
  }

  const oauthURL =
    "https://discord.com/oauth2/authorize" +
    `?client_id=${CLIENT_ID}` +
    "&response_type=code" +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    "&scope=identify%20guilds.join";

  await interaction.reply({
    content:
      "🎁 **اشتراك القيف أواي**\n\n" +
      "اضغط الرابط التالي ووافق عبر Discord:\n\n" +
      oauthURL,
    ephemeral: true
  });
});

// =========================
// OAuth2
// =========================

const app = express();

app.get("/callback", async (req, res) => {

  const code = req.query.code;

  if (!code) {
    return res.send("❌ لم يتم العثور على كود التفويض.");
  }

  try {

    const params = new URLSearchParams();

    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);

    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: params
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.log(tokenData);
      return res.send("❌ فشل التفويض.");
    }

    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`
        }
      }
    );

    const user = await userResponse.json();

    members[user.id] = {
      id: user.id,
      username: user.username,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      joinedAt: Date.now()
    };

    saveMembers();

    res.send(`
      <html>
        <body style="font-family:Arial;text-align:center;padding:50px">
          <h1>✅ تم الاشتراك</h1>
          <p>تم تسجيلك كعضو مبيع بنجاح.</p>
          <p>يمكنك إغلاق الصفحة.</p>
        </body>
      </html>
    `);

  } catch (error) {

    console.error(error);

    res.send("❌ حدث خطأ أثناء التسجيل.");
  }
});

// =========================
// تشغيل الموقع
// =========================

app.listen(3000, () => {
  console.log("🌐 OAuth Server يعمل على Port 3000");
});

// =========================
// تشغيل البوت
// =========================

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

});

client.login(process.env.TOKEN);
