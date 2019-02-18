import { Meteor } from "meteor/meteor"
import { Template } from "meteor/templating"

import "./routes";
import "../both/collections";

import "./main.html"

import "./login/login"


Template.layout.events({
  "click .btn-logout"() {
    Meteor.logout();
  }
});

Meteor.startup(() => {
  moment.locale("de");
});