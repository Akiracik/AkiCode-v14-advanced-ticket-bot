const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Ticket panelini kurar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Ticket Oluştur')
            .setDescription('Ticket oluşturmak için aşağıdaki menüden bir kategori seçin.')
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_menu')
                    .setPlaceholder('Bir kategori seçin')
                    .addOptions([
                        {
                            label: 'Satış',
                            description: 'Satış ile ilgili sorularınız için',
                            value: 'sales',
                        },
                        {
                            label: 'Destek',
                            description: 'Teknik destek için',
                            value: 'support',
                        },
                        {
                            label: 'Diğer',
                            description: 'Diğer konular için',
                            value: 'other',
                        },
                    ]),
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Ticket paneli başarıyla kuruldu!', ephemeral: true });
    },
};