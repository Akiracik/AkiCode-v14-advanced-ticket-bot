const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicket, closeTicket, addUser, removeUser, createTranscript } = require('../utils/ticketUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket işlemleri')
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Mevcut ticket\'ı kapat'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ticket\'a kullanıcı ekle')
                .addUserOption(option => option.setName('user').setDescription('Eklenecek kullanıcı').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Ticket\'tan kullanıcı çıkar')
                .addUserOption(option => option.setName('user').setDescription('Çıkarılacak kullanıcı').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('Ticket mesajlarını kaydet')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await createTicket(interaction);
                break;
            case 'close':
                await closeTicket(interaction);
                break;
            case 'add':
                await addUser(interaction);
                break;
            case 'remove':
                await removeUser(interaction);
                break;
            case 'transcript':
                await createTranscript(interaction);
                break;
        }
    },
};