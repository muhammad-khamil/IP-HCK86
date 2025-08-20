'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SPPDs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      daerah_tujuan: {
        type: Sequelize.STRING
      },
      maksud_perjalanan: {
        type: Sequelize.TEXT
      },
      instansi_dituju: {
        type: Sequelize.STRING
      },
      tanggalBerangkat: {
        type: Sequelize.DATE
      },
      tanggalPulang: {
        type: Sequelize.DATE
      },
      jenisTransportasi: {
        type: Sequelize.STRING
      },
      hargaTiket: {
        type: Sequelize.INTEGER
      },
      imgTiket: {
        type: Sequelize.TEXT
      },
      namaHotel: {
        type: Sequelize.STRING
      },
      hargaHotel: {
        type: Sequelize.INTEGER
      },
      imgBill: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SPPDs');
  }
};