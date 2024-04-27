const Discord = require('discord.js'),
    { readFileSync, writeFileSync } = require('fs'),
    database = JSON.parse(readFileSync('./data.db')),
    { token, prefix, owners, color } = require('./config.json'),
    client = new Discord.Client({
        intents: 3276799
    });

client.login(token);
client.on('ready', () => {
    console.log(`[!] — Logged in as ${client.user.tag} (${client.user.id})`);
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence.guild || !newPresence.member) return;
    const role = newPresence.member.guild.roles.cache.get(database[newPresence.guild.id]?.role);
    if (newPresence.member.presence.activities.some(activity => activity.type === 4 && activity.state && activity.state.includes(database[newPresence.guild.id]?.message))) {
        if (role && !newPresence.member.roles.cache.has(database[newPresence.guild.id]?.role)) 
            newPresence.member.roles.add(role)
                .then(() => console.log(`The role ${role.name} (${role.id}) has been assigned to ${newPresence.member.user.username}.`))
                .catch(() => false);
    } else {
        if (role && newPresence.member.roles.cache.has(database[newPresence.guild.id]?.role)) {
            newPresence.member.roles.remove(role)
                .then(() => console.log(`The role ${role.name} (${role.id}) has been removed from ${newPresence.member.user.username}.`))
                .catch(() => false);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === 'setup') {
        if (!owners.includes(message.author.id)) {
            const embed = new Discord.EmbedBuilder()
                .setTitle('`❌` ▸ Unauthorized User')
                .setDescription('*You are not authorized to use this command.*')
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(color)
                .setTimestamp();
            return message.reply({ allowedMentions: { repliedUser: false }, embeds: [embed] });
        }

        let guildData = database[message.guild.id] || {};
        let buttons = {
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: { name: '💬' },
                    style: 2,
                    custom_id: 'message'
                },
                {
                    type: 2,
                    emoji: { name: '🎭' },
                    style: 2,
                    custom_id: 'role'
                }
            ]
        }
        const msg = await message.reply({ allowedMentions: { repliedUser: false }, embeds: [embedf()], components: [buttons] });
        const collector = msg.createMessageComponentCollector({ time: 60000, filter: (i) => i.user.id === message.author.id });
        collector.on('end', () => msg.edit({ components: [] }));
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'message') {
                const embed = new Discord.EmbedBuilder()
                .setTitle('`🪄` ▸ Soutien Message')
                .setDescription('*What is the support message ? (example: **/uhq**)*')
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(color)
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: false });
                const filter = (m) => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ time: 60000, filter });
                collector.on('collect', async (m) => {
                    guildData.message = m.content;
                    database[message.guild.id] = guildData;
                    writeFileSync('./data.db', JSON.stringify(database));
                    collector.stop();
                    msg.edit({ embeds: [embedf()], components: [buttons] });
                    interaction.deleteReply();
                    m.delete();
                });
            }
            if (interaction.customId === 'role') {
                const embed = new Discord.EmbedBuilder()
                .setTitle('`🪄` ▸ Soutien Role')
                .setDescription('*What is the role of support ?*')
                .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(color)
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: false });
                const filter = (m) => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ time: 60000, filter });
                collector.on('collect', async (m) => {
                    const role = m.mentions.roles.first() || message.guild.roles.cache.get(m.content) || message.guild.roles.cache.find(r => r.name.toLowerCase().includes(m.content.toLowerCase()));
                    if (!role) return error(m, 'Role not found please provide a valid role', interaction)
                    guildData.role = role.id
                    database[message.guild.id] = guildData;
                    writeFileSync('./data.db', JSON.stringify(database));
                    msg.edit({ embeds: [embedf()], components: [buttons] });
                    collector.stop();
                    interaction.deleteReply();
                    m.delete();
                });
            }
        })
        function error(m, content, int) {
            m.reply({ content }).then((msg) => {
                setTimeout(() => {
                    msg.delete();
                    int.deleteReply();
                }, 2500)
            })
        }
        function embedf() {
            return {
                title: '`🪄` ▸ Soutien Setup',
                fields: [
                    {
                        name: 'Message',
                        value: `\`${guildData.message || '*No messages defined*'}\``
                    },
                    {
                        name: 'Role',
                        value: `${guildData.role ? `<@&${guildData.role}>` : '*No role defined*'}`
                    }
                ],
                footer: {
                    text: '/Uhq',
                    iconURL: 'https://cdn.discordapp.com/attachments/1227729283691188254/1228404957057650748/Uhq.png?ex=662bec44&is=66197744&hm=51f28c33b7291173b04069162357c43548e27671bf4a9a15019c11a4c1018a42&'
                },
                timestamp: new Date(),
                color: Discord.resolveColor(color)
            };
        }
    }
})
