'use strict';
const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Admin System',
        email: 'admin@mail.com',
        password: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Staff User',
        email: 'staff@mail.com',
        password: hashPassword('staff123'),
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: ['admin@mail.com', 'staff@mail.com']
    }, {});
  }
};
