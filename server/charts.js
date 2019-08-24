import { Meteor } from 'meteor/meteor';

Meteor.publish("chartData", function () { //must be "function" as we use "this"
    ReactiveAggregate(this, Drinks, [
        {
            $match: {
                user: this.userId
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
                amount: {$sum: "$amount"},
                count: {$sum: 1}
            }
        }
    ], {
        clientCollection: "chartData"
    });
});