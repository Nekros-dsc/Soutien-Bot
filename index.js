const { Client, resolveColor } = require("discord.js"),
    { readFileSync, writeFileSync } = require("fs"),
    database = JSON.parse(readFileSync("./data.db")),
    { token, prefix, owners } = require("./config"),
    client = new Client({
        intents: 3276799
    });

client.login(token);
client.on("ready", () => {
    console.log(`Bot soutien connecté en tant que ${client.user.tag}!\nPowered by Nova World!`);
});


client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === "setup") {
        if (!owners.includes(message.author.id)) return message.channel.send(`Zut! Il semblerait que vous ne soyez pas un propriétaire du bot!`);
        let guildData = database[message.guild.id] || {};
        let buttons = {
            type: 1,
            components: [
                {
                    type: 2,
                    emoji: { name: "💬" },
                    style: 2,
                    custom_id: "message"
                },
                {
                    type: 2,
                    emoji: { name: "🎭" },
                    style: 2,
                    custom_id: "role"
                }
            ]
        }
        const msg = await message.channel.send({ embeds: [embed()], components: [buttons] });
        const collector = msg.createMessageComponentCollector({ time: 60000, filter: (i) => i.user.id === message.author.id });
        collector.on("end", () => msg.edit({ components: [] }));
        collector.on("collect", async (interaction) => {
            if (interaction.customId === "message") {
                await interaction.reply({ content: "Quel est le message de soutien ?\nExemple: `/novaworld`", fetchReply: true })
                const filter = (m) => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ time: 60000, filter });
                collector.on("collect", async (m) => {
                    guildData.message = m.content;
                    database[message.guild.id] = guildData;
                    writeFileSync("./data.db", JSON.stringify(database));
                    collector.stop();
                    msg.edit({ embeds: [embed()], components: [buttons] });
                    interaction.deleteReply();
                    m.delete();
                });
            }
            if (interaction.customId === "role") {
                await interaction.reply({ content: "Quel est le rôle soutien ?", fetchReply: true })
                const filter = (m) => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector({ time: 60000, filter });
                collector.on("collect", async (m) => {
                    const role = m.mentions.roles.first() || message.guild.roles.cache.get(m.content) || message.guild.roles.cache.find(r => r.name.toLowerCase().includes(m.content.toLowerCase()));
                    if (!role) return error(m, "Rôle introuvable", interaction)
                    guildData.role = role.id
                    database[message.guild.id] = guildData;
                    writeFileSync("./data.db", JSON.stringify(database));
                    msg.edit({ embeds: [embed()], components: [buttons] });
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
        function embed() {
            return {
                title: "Soutien",
                fields: [
                    {
                        name: "Message",
                        value: guildData.message || "Aucun message défini"
                    },
                    {
                        name: "Rôle",
                        value: `${guildData.role ? `<@&${guildData.role}>` : "Aucun rôle défini"}`
                    }
                ],
                color: resolveColor("Purple"),
                footer: { text: "Powered by Nova World! - discord.gg/novaworld" }
            }
        }
    }
})