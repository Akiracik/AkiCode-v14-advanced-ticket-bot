const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Ticket bot ayarlarını güncelle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('kategori')
                .setDescription('Ticket kategorisini ayarla')
                .setRequired(false))
        .addChannelOption(option => 
            option.setName('logkanal')
                .setDescription('Log kanalını ayarla')
                .setRequired(false))
        .addRoleOption(option => 
            option.setName('yetkilirol')
                .setDescription('Yetkili rolünü ayarla')
                .setRequired(false)),
    async execute(interaction) {
        const kategori = interaction.options.getChannel('kategori');
        const logKanal = interaction.options.getChannel('logkanal');
        const yetkiliRol = interaction.options.getRole('yetkilirol');

        if (!kategori && !logKanal && !yetkiliRol) {
            return interaction.reply({ content: 'En az bir ayarı güncellemelisiniz!', ephemeral: true });
        }

        const configPath = path.join(__dirname, '..', 'config.json');
        let config;
        try {
            config = require(configPath);
        } catch (error) {
            console.error('Config dosyası okunamadı:', error);
            return interaction.reply({ content: 'Ayarlar güncellenirken bir hata oluştu.', ephemeral: true });
        }

        let updatedSettings = [];

        if (kategori) {
            if (kategori.type !== 4) { // 4 is the channel type for categories
                return interaction.reply({ content: 'Kategori için lütfen bir kategori kanalı seçin!', ephemeral: true });
            }
            config.ticketCategory = kategori.id;
            updatedSettings.push('Ticket kategorisi');
        }

        if (logKanal) {
            if (logKanal.type !== 0) { // 0 is the channel type for text channels
                return interaction.reply({ content: 'Log kanalı için lütfen bir metin kanalı seçin!', ephemeral: true });
            }
            config.logChannel = logKanal.id;
            updatedSettings.push('Log kanalı');
        }

        if (yetkiliRol) {
            config.yetkiliRolId = yetkiliRol.id;
            updatedSettings.push('Yetkili rolü');
        }

        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            await interaction.reply({ content: `Aşağıdaki ayarlar başarıyla güncellendi: ${updatedSettings.join(', ')}`, ephemeral: true });
        } catch (error) {
            console.error('Config dosyası yazılırken hata oluştu:', error);
            await interaction.reply({ content: 'Ayarlar güncellenirken bir hata oluştu.', ephemeral: true });
        }
    },
};