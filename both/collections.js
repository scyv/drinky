import { Mongo } from 'meteor/mongo';

/**
 * _id: the id
 * time: when was the drink
 * amount: how much drinky?
 * user: the id of the user, who created hte drinky
 */
export const Drinks = new Mongo.Collection("drinks");
