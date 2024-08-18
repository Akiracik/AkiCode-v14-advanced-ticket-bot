const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const config = require('../config.json');
const db = new QuickDB();

async function sendLog(interaction, embed, attachment = null) {
    const logChannel = interaction.guild.channels.cache.get(config.logChannel);
    if (logChannel) {
        try {
            if (attachment) {
                await logChannel.send({ embeds: [embed], files: [attachment] });
            } else {
                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Log mesajı gönderilirken hata oluştu:', error);
            await interaction.followUp({ content: 'Log mesajı gönderilirken bir hata oluştu.', ephemeral: true }).catch(console.error);
        }
    } else {
        console.error('Log kanalı bulunamadı. Kanal ID:', config.logChannel);
        await interaction.followUp({ content: 'Log kanalı bulunamadı. Lütfen ayarları kontrol edin.', ephemeral: true }).catch(console.error);
    }
}

async function createTicket(interaction, category) {
    const ticketCount = await db.add(`ticketCount_${interaction.guild.id}`, 1);
    const channelName = `${category}-${interaction.user.username}`.toLowerCase();

    const channel = await interaction.guild.channels.create({
        name: channelName,
        type: 0,
        parent: config.ticketCategory,
        topic: `Ticket Owner: ${interaction.user.id}`, // Ticket sahibinin ID'sini topic'e ekliyoruz
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
                id: config.yetkiliRolId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
        ],
    });

    await channel.send(`Yetkili ekimiz sizinle en kısa sürede ilgilenecektir <@&${config.yetkiliRolId}>, ${interaction.user}`);

    const embed = new EmbedBuilder()
        .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Ticket`)
        .setDescription('Lütfen sorununuzu detaylı bir şekilde açıklayın. Yetkili ekibimiz en kısa sürede size yardımcı olacaktır.')
        .setColor('#00ff00')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('closeTicket')
                .setLabel('Ticket\'ı Kapat')
                .setStyle(ButtonStyle.Danger),
        );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket oluşturuldu: ${channel}`, ephemeral: true });

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Yeni Ticket Oluşturuldu')
        .setDescription(`${interaction.user} tarafından yeni bir ticket oluşturuldu.`)
        .addFields(
            { name: 'Ticket Kanalı', value: channel.toString(), inline: true },
            { name: 'Kategori', value: category, inline: true },
            { name: 'Toplam Ticket Sayısı', value: ticketCount.toString(), inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);
}

async function closeTicket(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Ticket\'ı Kapat')
        .setDescription('Bu ticket\'ı kapatmak istediğinizden emin misiniz?')
        .setColor('#ffff00')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirmClose')
                .setLabel('Kapat')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancelClose')
                .setLabel('İptal')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function confirmCloseTicket(interaction) {
    const closedEmbed = new EmbedBuilder()
        .setTitle('Ticket Kapatıldı')
        .setDescription('Bu ticket kapatıldı. Sadece yetkililer bu ticket\'ı görebilir.')
        .setColor('#ff0000')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('reopenTicket')
                .setLabel('Ticket\'ı Yeniden Aç')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('createTranscript')
                .setLabel('Transcript Oluştur')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('deleteTicket')
                .setLabel('Ticket\'ı Sil')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({ embeds: [closedEmbed], components: [row] });
    
    await interaction.channel.permissionOverwrites.set([
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: config.yetkiliRolId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        }
    ]);

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Kapatıldı')
        .setDescription(`${interaction.user} tarafından bir ticket kapatıldı.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.toString(), inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);
}

async function reopenTicket(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const ticketOwnerId = interaction.channel.topic.split(': ')[1];
    const user = await interaction.guild.members.fetch(ticketOwnerId).catch(() => null);

    if (user) {
        await interaction.channel.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true,
        });
    }

    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { 
        ViewChannel: false,
        SendMessages: false 
    });
    
    const embed = new EmbedBuilder()
        .setTitle('Ticket Yeniden Açıldı')
        .setDescription('Bu ticket yeniden açıldı.')
        .setColor('#00ff00')
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
    await interaction.channel.send(`Ticket yeniden açıldı. ${user ? user : 'Orijinal kullanıcı'} tekrar erişim kazandı.`);

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Yeniden Açıldı')
        .setDescription(`${interaction.user} tarafından bir ticket yeniden açıldı.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.toString(), inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);
}

async function deleteTicket(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Ticket Siliniyor')
        .setDescription('Bu ticket 5 saniye içinde silinecek.')
        .setColor('#ff0000')
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Silindi')
        .setDescription(`${interaction.user} tarafından bir ticket silindi.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.name, inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (error) {
            console.error('Kanal silinirken bir hata oluştu:', error);
        }
    }, 5000);
}

async function addUser(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.create(user, {
        ViewChannel: true,
        SendMessages: true,
    });

    await interaction.reply({ content: `${user} ticket'a eklendi.` });

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket\'a Kullanıcı Eklendi')
        .setDescription(`${interaction.user} tarafından bir ticket'a kullanıcı eklendi.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.toString(), inline: true },
            { name: 'Eklenen Kullanıcı', value: user.toString(), inline: true }
        )
        .setColor('#0099ff')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);
}

async function removeUser(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.delete(user);

    await interaction.reply({ content: `${user} ticket'tan çıkarıldı.` });

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket\'tan Kullanıcı Çıkarıldı')
        .setDescription(`${interaction.user} tarafından bir ticket'tan kullanıcı çıkarıldı.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.toString(), inline: true },
            { name: 'Çıkarılan Kullanıcı', value: user.toString(), inline: true }
        )
        .setColor('#ff9900')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed);
}

async function createTranscript(interaction) {
    if (!interaction.channel.topic || !interaction.channel.topic.startsWith('Ticket Owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', ephemeral: true });
    }

    const { createTranscript } = require('discord-html-transcripts');
    const attachment = await createTranscript(interaction.channel, {
        limit: -1,
        fileName: `${interaction.channel.name}.html`,
    });

    await interaction.reply({ content: 'Transcript oluşturuldu.', files: [attachment] });

    // Log mesajı
    const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Transcript\'i Oluşturuldu')
        .setDescription(`${interaction.user} tarafından bir ticket transcript'i oluşturuldu.`)
        .addFields(
            { name: 'Ticket Kanalı', value: interaction.channel.toString(), inline: true }
        )
        .setColor('#00ffff')
        .setTimestamp();
    
    await sendLog(interaction, logEmbed, attachment);
}

module.exports = { 
    createTicket, 
    closeTicket, 
    confirmCloseTicket, 
    reopenTicket, 
    deleteTicket, 
    addUser, 
    removeUser, 
    createTranscript 
};