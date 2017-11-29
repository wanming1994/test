let app = getApp();
let actionsheet = require("../../template/actionsheet/payactionsheet.js");
let util = require('../../utils/util.js');
let receiver = require('../../service/receiver.js');
let order = require('../../service/order.js');
let tenant = require('../../service/tenant.js');
Page(Object.assign({}, actionsheet, {
  data: {

  },
  onLoad: function (options) {
    // this.ActionsheetShow(Object.assign({}, res.data, {
    //   closeJump: '/pages/home/index',
    //   successJump: '/pages/pay/success'
    // }))
    this.setData({
      __actionsheet: Object.assign({}, this.data.__actionsheet, { show: true })
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  }
}))