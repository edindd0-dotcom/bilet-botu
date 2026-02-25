const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const YETKILI_ROL_ID = "1475067665881239748";

// Ticket sayacı
let data = { count: 0 };

if (fs.existsSync("./ticket.json")) {
  data = JSON.parse(fs.readFileSync("./ticket.json"));
}

function saveData() {
  fs.writeFileSync("./ticket.json", JSON.stringify(data));
}

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Ticket panel
  if (message.content === "!ticketpanel") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("🎫 Ticket Aç")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      content: "Ticket açmak için butona bas.",
      components: [row]
    });
  }

  // Ticket silme
  if (message.content === "$delete") {
    if (message.channel.name.startsWith("bilet-")) {
      message.channel.send("🗑 Ticket 5 saniye sonra siliniyor...");
      setTimeout(() => {
        message.channel.delete().catch(() => {});
      }, 5000);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "create_ticket") {

    data.count++;
    saveData();

    const channel = await interaction.guild.channels.create({
      name: `bilet-${data.count}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: YETKILI_ROL_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    channel.send(`🎫 ${interaction.user} ticket açtı.\n\nKapatmak için **$delete** yaz.`);

    interaction.reply({
      content: `Ticket oluşturuldu: ${channel}`,
      ephemeral: true
    });
  }
});

client.login(TOKEN);
