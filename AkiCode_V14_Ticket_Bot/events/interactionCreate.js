const { 
    createTicket, 
    closeTicket, 
    confirmCloseTicket, 
    reopenTicket, 
    deleteTicket, 
    createTranscript 
} = require('../utils/ticketUtils');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_menu') {
                const category = interaction.values[0];
                await createTicket(interaction, category);
            }
        } else if (interaction.isButton()) {
            switch (interaction.customId) {
                case 'closeTicket':
                    await closeTicket(interaction);
                    break;
                case 'confirmClose':
                    await confirmCloseTicket(interaction);
                    break;
                case 'cancelClose':
                    await interaction.update({ content: 'Ticket kapatma işlemi iptal edildi.', embeds: [], components: [] });
                    break;
                case 'reopenTicket':
                    await reopenTicket(interaction);
                    break;
                case 'deleteTicket':
                    await deleteTicket(interaction);
                    break;
                case 'createTranscript':
                    await createTranscript(interaction);
                    break;
            }
        }
    },
};