const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember]
});

const LOG_CHANNEL_ID = "1476645987387965457";

const invites = new Map();
const userInvites = new Map();

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif!`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const fetchedInvites = await guild.invites.fetch();
      invites.set(guild.id, fetchedInvites);
      console.log(`${guild.name} davetleri yüklendi.`);
    } catch (err) {
      console.log("Invite fetch hatası:", err.message);
    }
  }
});

client.on("inviteCreate", async invite => {
  const guildInvites = await invite.guild.invites.fetch();
  invites.set(invite.guild.id, guildInvites);
});

client.on("guildMemberAdd", async member => {
  console.log("Yeni üye geldi:", member.user.tag);

  const guild = member.guild;

  let newInvites;
  try {
    newInvites = await guild.invites.fetch();
  } catch (err) {
    console.log("Invite fetch hatası:", err.message);
    return;
  }

  const oldInvites = invites.get(guild.id);
  if (!oldInvites) {
    invites.set(guild.id, newInvites);
    return;
  }

  const inviteUsed = newInvites.find(inv => {
    const old = oldInvites.get(inv.code);
    return old && inv.uses > old.uses;
  });

  invites.set(guild.id, newInvites);

  if (!inviteUsed) {
    console.log("Hangi davet kullanıldı bulunamadı.");
    return;
  }

  const inviter = inviteUsed.inviter;
  if (!inviter) return;

  const current = userInvites.get(inviter.id) || 0;
  userInvites.set(inviter.id, current + 1);

  const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

  if (!logChannel) {
    console.log("Log kanalı bulunamadı.");
    return;
  }

  logChannel.send(
    `🎉 **${member.user.tag}** sunucuya katıldı!\n` +
    `👤 Davet eden: **${inviter.tag}**\n` +
    `📊 Toplam daveti: **${userInvites.get(inviter.id)}**`
  );
});

client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content === "!davet") {
    const count = userInvites.get(message.author.id) || 0;
    message.reply(`📊 Toplam davetin: **${count}**`);
  }
});

if (!process.env.TOKEN) {
  console.log("TOKEN bulunamadı!");
  process.exit(1);
}

client.login(process.env.TOKEN);
