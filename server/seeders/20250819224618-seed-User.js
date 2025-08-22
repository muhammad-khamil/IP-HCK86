'use strict';

const { hashPassword } = require('../helpers/bcrypt');


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Users", [
      {
        name: "admin",
        email: "admin@gmail.com",
        password: hashPassword("12345"),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "kemil",
        email: "kemil@gmail.com",
        password: hashPassword("12345"),
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {
      truncate: true,
      restartIdentity: true,
      cascade: true
    })
  }
};
