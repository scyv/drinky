import { Meteor } from "meteor/meteor"

Router.configure({
    layoutTemplate: "layout"
});

Router.route("/", function () {
    if (Meteor.userId()) {
        this.render("userid");
    } else {
        this.render("login");
    }
}, {name: "lists"});

Router.route("/login", function () {
    this.render("login");
}, {name: "login"});
