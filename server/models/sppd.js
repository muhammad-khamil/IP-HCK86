'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SPPD extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SPPD.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  SPPD.init({
    daerah_tujuan: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Daerah tujuan is required'
        },
        notEmpty: {
          msg: 'Daerah tujuan is required'
        }
      }
    },
    maksud_perjalanan: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Maksud perjalanan is required'
        },
        notEmpty: {
          msg: 'Maksud perjalanan is required'
        }
      }
    },
    instansi_dituju: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Instansi dituju is required'
        },
        notEmpty: {
          msg: 'Instansi dituju is required'
        }
      }
    },
    tanggalBerangkat: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Tanggal berangkat is required'
        },
        isDate: {
          msg: 'Tanggal berangkat must be a valid date'
        }
      }
    },
    tanggalPulang: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Tanggal pulang is required'
        },
        isDate: {
          msg: 'Tanggal pulang must be a valid date'
        }
      }
    },
    jenisTransportasi: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Jenis transportasi is required'
        },
        notEmpty: {
          msg: 'Jenis transportasi is required'
        }
      }
    },
    hargaTiket: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Harga tiket is required'
        },
        isInt: {
          msg: 'Harga tiket must be an integer'
        }
      }
    },
    imgTiket: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Image tiket is required'
        },
        notEmpty: {
          msg: 'Image tiket is required'
        }
      }
    },
    namaHotel: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Nama hotel is required'
        },
        notEmpty: {
          msg: 'Nama hotel is required'
        }
      }
    },
    hargaHotel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Harga hotel is required'
        },
        isInt: {
          msg: 'Harga hotel must be an integer'
        }
      }
    },
    imgBill: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Image bill is required'
        },
        notEmpty: {
          msg: 'Image bill is required'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SPPD',
  });
  return SPPD;
};