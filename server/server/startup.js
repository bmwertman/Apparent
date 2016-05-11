import { Meteor } from 'meteor/meteor';
import { Calevents } from '../imports/api/cal_events';

Meteor.startup(() => {
  if (Calevents.find().count() === 0) {
    const calevents = [{
      'name': 'Dubstep-Free Zone',
      'description': 'Fast just got faster with Nexus S.'
    }, {
      'name': 'All dubstep all the time',
      'description': 'Get it on!'
    }, {
      'name': 'Savage lounging',
      'description': 'Leisure suit required. And only fiercest manners.'
    }];

    calevents.forEach((calevent) => {
      Calevents.insert(calevent)
    });
  }
});
