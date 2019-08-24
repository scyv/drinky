import {ConfigProps} from "./configProps";
import {Configuration} from "./main";
import {Drinks} from "../both/collections";

const telegramBotApi = "https://api.telegram.org/bot";

const Updates = new Mongo.Collection("tg_updates");
export const Chats = new Mongo.Collection("tg_chats");

const telegramUpdateInterval = 10000;

let token = "";

export class TelegramBot {

    init() {
        Meteor.setInterval(() => {
            const tokenConf = Configuration.findOne({_id: ConfigProps.TELEGRAM_BOT_TOKEN});
            if (tokenConf) {
                token = tokenConf.value;
                const ctx = this;
                HTTP.call("GET", telegramBotApi + token + "/getUpdates", {}, function (err, resp) {
                    if (resp && resp.data.ok && resp.data.result) {
                        resp.data.result.forEach(update => {
                            if (!Updates.findOne({update_id: update.update_id})) {
                                if (update.message) {
                                    const chatId = update.message.chat.id;
                                    const message = update.message.text.toLowerCase();
                                    if (message === "/start") {
                                        ctx.cmdStart(update.update_id, chatId, ctx);
                                    } else if (message.indexOf("/connect") === 0) {
                                        ctx.cmdConnect(message, chatId, ctx);
                                    } else if (message.indexOf("/100ml") === 0) {
                                        ctx.cmdAddDrink(chatId, "100ml", ctx);
                                    } else if (message.indexOf("/200ml") === 0) {
                                        ctx.cmdAddDrink(chatId, "200ml", ctx);
                                    } else if (message.indexOf("/300ml") === 0) {
                                        ctx.cmdAddDrink(chatId, "300ml", ctx);
                                    } else if (message.indexOf("/500ml") === 0) {
                                        ctx.cmdAddDrink(chatId, "500ml", ctx);
                                    } else if (message.match(/^[0-9.]+m?l/)) {
                                        ctx.cmdAddDrink(chatId, message, ctx);
                                    } else if (message.match(/how much/i)) {
                                        ctx.cmdPrintStats(chatId, ctx);
                                    } else if (message.match(/stats/)) {
                                        ctx.cmdPrintStats(chatId, ctx);
                                    } else if (message.match(/pause/)) {
                                        ctx.cmdPauseForToday(chatId, ctx);
                                    }
                                }
                                Updates.insert(update);
                            }
                        });
                    }
                });
            }
        }, telegramUpdateInterval);
    }

    sendToChat(chatId, text) {
        if (token) {
            const data = {
                chat_id: chatId,
                text: text
            };
            HTTP.call("POST", telegramBotApi + token + "/sendMessage", {
                headers: {"Content-Type": "application/json"},
                data: data
            });
        }
    }

    cmdStart(updateId, chatId, ctx) {
        console.log("New Telegram registration detected", updateId);
        ctx.sendToChat(chatId, "Herzlich willkommen beim Drinky Bot! Bitte sag uns noch mit \"/connect <userId>\", wer Du bist.");
    }

    cmdConnect(message, chatId, ctx) {
        const userId = message.substr(9);
        const user = Meteor.users.findOne({_id: userId});
        if (user) {
            Chats.insert({
                chatId: chatId,
                user: userId
            });
            ctx.sendToChat(chatId, "Ok! Wir werden Dich jetzt immer erinnern, wenn es wieder Zeit ist, zu trinken.");
        } else {
            ctx.sendToChat(chatId, "Bitte gib hinter /connect deine UserId an, z.B: /connect abc1234");
        }
    }

    cmdPauseForToday(chatId, ctx) {
        Chats.find({chatId: chatId}).forEach((chat) => {
            const drink = {
                amount: 0,
                time: moment().endOf("day"),
                user: chat.user
            };
            Drinks.insert(drink);
            ctx.sendToChat(chatId, "Ok. Heute werden wir Dich nicht mehr erinnern.");
        });
    }

    cmdAddDrink(chatId, message, ctx) {
        Chats.find({chatId: chatId}).forEach((chat) => {

                const factor = message.endsWith("ml") ? 1.0 : 1000.0;
                const amount = parseFloat(message) * factor;

                const drink = {
                    amount: amount,
                    time: new Date(),
                    user: chat.user
                };

                Drinks.insert(drink);
                Chats.update(chat._id, {$set: {reminderSent: false}});
                const dailySum = ctx.getDailySum();
                const formattedSum = dailySum.toFixed(2);
                if (dailySum > 1.5) {
                    ctx.sendToChat(chatId, "Super! Heute schon " + formattedSum + " l getrunken!");
                } else if (dailySum > 1) {
                    ctx.sendToChat(chatId, "Heute schon " + formattedSum + " l getrunken!");
                } else {
                    ctx.sendToChat(chatId, "Heute bisher " + formattedSum + " l getrunken! Da geht noch mehr!");
                }
            }
        );
    }

    cmdPrintStats(chatId, ctx) {
        ctx.sendToChat(chatId, "Heute schon " + ctx.getDailySum().toFixed(2) + " l getrunken!");
    }

    getDailySum() {
        let sum = 0.0;
        Drinks.find({
            "time": {
                $lte: moment().endOf("day").toDate(),
                $gte: moment().startOf("day").toDate()
            }
        }).forEach((drink) => {
            sum += drink.amount / 1000;
        });
        return sum;
    }

    getDailyAvg() {

    }
}