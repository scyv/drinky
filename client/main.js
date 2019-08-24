import { Meteor } from "meteor/meteor"
import { Template } from "meteor/templating"

import "./routes";
import "../both/collections";

import "./main.html"

import "./login/login"

var chartHandle;
ChartData = new Mongo.Collection("chartData");


Template.layout.events({
    "click .btn-logout"() {
        Meteor.logout();
    }
});

Template.chart.onRendered(() => {
    Tracker.autorun(() => {
        chartHandle = Meteor.subscribe("chartData");
    });

    const dataSet = ChartData.find({}, {sort: {_id: 1}}).fetch();
    const dataSets = {};

    const colors = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
    ];

    dataSet.forEach(entry => {
        const ownerCountMap = _.countBy(entry.owners);
        Object.keys(ownerCountMap).forEach((key, idx) => {
            const count = ownerCountMap[key];
            const ownerId = key;
            if (!dataSets[ownerId]) {
                dataSets[ownerId] = {
                    label: Meteor.users.findOne(ownerId).profile.name,
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: colors[idx]
                };
            }
            dataSets[ownerId].data[entry._id - 1] += count;
        });
    });

    var ctx = Template.instance().find("canvas").getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: moment.weekdays(),
            datasets: Object.keys(dataSets).map(key => {
                return dataSets[key];
            })
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    stacked: true
                }],
                xAxes: [{
                    stacked: true

                }]
            }
        }
    });

});

Meteor.startup(() => {
    moment.locale("de");
});