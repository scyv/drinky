import { Meteor } from 'meteor/meteor'
import { Drinks } from "../both/collections"
import { TelegramBot, Chats } from "./telegram-bot"

export const Configuration = new Mongo.Collection("configuration");

Meteor.startup(() => {
    const tgBot = new TelegramBot();

    tgBot.init();

    Meteor.setInterval(() => {
        const now = moment().toDate();
        if (now > moment().startOf("day").add(8, "hour").toDate()
            && now < moment().startOf("day").add(20, "hour").toDate()) {
            Chats.find().forEach((chat) => {
                if (chat.reminderSent) {
                    return;
                }
                const lastDrink = Drinks.findOne({user: chat.user}, {sort: {time: -1}, limit: 1});
                if (lastDrink && moment(lastDrink.time).add(2, "hour").toDate() < new Date()) {
                    tgBot.sendToChat(chat.chatId, "Du solltest mal was trinken!");
                    Chats.update(chat._id, {$set: {reminderSent: true}});
                }
            });
        }
    }, 600000);
});