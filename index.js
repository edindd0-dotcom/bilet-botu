const { Client, GatewayIntentBits } = require("discord.js");

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

const inviteCache = new Map();
const inviteCount = new Map();

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif!`);

  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, invites);
  }
});

client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;

  const newInvites = await guild.invites.fetch();
  const oldInvites = inviteCache.get(guild.id);

  inviteCache.set(guild.id, newInvites);

  if (!oldInvites) return;

  const usedInvite = newInvites.find(inv => {
    const old = oldInvites.get(inv.code);
    return old && inv.uses > old.uses;
  });

  if (!usedInvite) return;

  const inviter = usedInvite.inviter;
  if (!inviter) return;

  const current = inviteCount.get(inviter.id) || 0;
  inviteCount.set(inviter.id, current + 1);

  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  channel.send(
    `🎉 ${member.user.tag} katıldı!\n` +
    `👤 Davet eden: ${inviter.tag}\n` +
    `📊 Toplam daveti: ${inviteCount.get(inviter.id)}`
  );
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!davet") {
    const count = inviteCount.get(message.author.id) || 0;
    message.reply(`📊 Toplam davetin: ${count}`);
  }
});

client.login(process.env.TOKEN);
