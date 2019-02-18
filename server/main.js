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
            && now < moment().startOf("day").add(22, "hour").toDate()) {
            Chats.find().forEach((chat) => {
                const lastDrink = Drinks.findOne({user: chat.user}, {sort: {time: -1}, limit: 1});
                if (lastDrink && moment(lastDrink.time).add(2, "hour").toDate() < new Date()) {
                    tgBot.sendToChat(chat.chatId, "Du solltest mal was trinken!");
                }
            });
        }
    }, 600000);
});