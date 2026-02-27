const { Client, GatewayIntentBits, AuditLogEvent } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LOG_CHANNEL_ID = "1476645987387965457";
const invites = new Map();

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);

  for (const guild of client.guilds.cache.values()) {
    const guildInvites = await guild.invites.fetch();
    invites.set(guild.id, guildInvites);
  }
});

client.on("inviteCreate", async invite => {
  const guildInvites = await invite.guild.invites.fetch();
  invites.set(invite.guild.id, guildInvites);
});

client.on("inviteDelete", async invite => {
  const guildInvites = await invite.guild.invites.fetch();
  invites.set(invite.guild.id, guildInvites);
});

client.on("guildMemberAdd", async member => {
  const guild = member.guild;
  const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!logChannel) return;

  const newInvites = await guild.invites.fetch();
  const oldInvites = invites.get(guild.id);

  invites.set(guild.id, newInvites);

  let usedInvite = null;

  if (oldInvites) {
    usedInvite = newInvites.find(inv => {
      const old = oldInvites.get(inv.code);
      return old && inv.uses > old.uses;
    });
  }

  // Eğer normal invite bulunamazsa vanity kontrol
  if (!usedInvite && guild.vanityURLCode) {
    try {
      const vanityData = await guild.fetchVanityData();
      logChannel.send(
        `🎉 ${member.user.tag} katıldı!\n🔗 Vanity URL kullanıldı.\n📊 Toplam kullanım: ${vanityData.uses}`
      );
      return;
    } catch {}
  }

  if (!usedInvite) {
    logChannel.send(`🎉 ${member.user.tag} katıldı!\n❓ Davet eden bulunamadı.`);
    return;
  }

  logChannel.send(
    `🎉 ${member.user.tag} katıldı!\n👤 Davet eden: ${usedInvite.inviter.tag}\n📊 Davet kullanım: ${usedInvite.uses}`
  );
});

client.login(process.env.TOKEN);
