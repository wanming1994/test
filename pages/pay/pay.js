let app = getApp();
let actionsheet = require("../../template/actionsheet/payactionsheet.js");
let util = require('../../utils/util.js');
let receiver = require('../../service/receiver.js');
let order = require('../../service/order.js');
let tenant = require('../../service/tenant.js');

Page(Object.assign({}, actionsheet, {

  /**
   * 页面的初始数据
   */
  data: {

    index: 0,
    express: false,
    since: true,
    freight: false,
    storeAdress: ['合肥市瑶海区', '合肥市庐阳区'],
    addressId: 0,
    showCouponSelect: false,
    selectCoupon: {
      name: '未使用',
      code: ''
    },
    memo: '',
    codes: [],
    addressIsGet: true,
    getAddressCount: 10,
    isSelfGet: false
  },

  //单选按钮选择配送方式
  radioChange: function (e) {
    var that = this;
    var shippingMethodId = this.data.objectshippingMethods[e.detail.value].id;
    var shippingMethodCode = this.data.objectshippingMethods[e.detail.value].method;
    //如果是到店提货，隐藏运费，显示选择提货地址
    if (shippingMethodCode == 'F2F') {
      this.setData({
        express: true,
        since: false,
        freight: true,
      })

      //获取所有门店列表，默认选择第一个门店
      new tenant(function (data) {

        that.setData({
          deliveryCenterList: data.data,
          deliveryCenterId: data.data[0].id
        })
      }).deliveryCenterList({
        id: app.globalData.tenantId
      })
    } else if (shippingMethodCode == 'TPL') {
      this.setData({
        express: false,
        since: true,
        freight: false,
      })
    } else if (shippingMethodCode == 'PRIVY') {
      this.setData({
        express: true,
        since: true,
        freight: true,
      })
    }
    this.setData({
      index: e.detail.value,
      shippingMethodId: shippingMethodId,
      shippingMethodCode: shippingMethodCode
    })
    //调用价格计算
    this.calcu()
  },


  bindPickerChange: function (e) {

    var that = this;
    var shippingMethodId = this.data.objectshippingMethods[e.detail.value].id;
    var shippingMethodCode = this.data.objectshippingMethods[e.detail.value].method;
    //如果是到店提货，隐藏运费，显示选择提货地址
    if (shippingMethodCode == 'F2F') {
      this.setData({
        express: true,
        since: false,
        freight: true,
      })

      //获取所有门店列表，默认选择第一个门店
      new tenant(function (data) {

        that.setData({
          deliveryCenterList: data.data,
          deliveryCenterId: data.data[0].id
        })
      }).deliveryCenterList({
        id: app.globalData.tenantId
      })
    } else if (shippingMethodCode == 'TPL') {
      this.setData({
        express: false,
        since: true,
        freight: false,
      })
    }
    this.setData({
      index: e.detail.value,
      shippingMethodId: shippingMethodId,
      shippingMethodCode: shippingMethodCode
    })
    //调用价格计算
    this.calcu()
  },




  //选择提货地址
  storeAdressChange: function (e) {
    var deliveryCenterId = this.data.deliveryCenterList[e.detail.value].id;
    this.setData({
      addressId: e.detail.value
    })
  },

  //收货地址
  chooseAddress: function () {
    var that = this;
    try {
      wx.chooseAddress({
        success: function (res) {
          //获取国家地址码
          new receiver(function (data) {

            //保存地址
            new receiver(function (sd) {

              that.getAddress()
            }).save({
              areaId: data.data,
              consignee: res.userName,
              address: res.detailInfo,
              phone: res.telNumber
            })
          }).getAreaId({
            code: res.nationalCode
          })
        },
        fail: function (err) {

          if (err.errMsg.indexOf('auth deny') > -1) {
            wx.showModal({
              title: '提示',
              content: '未授予地址权限，是否前往设置',
              success: function (res) {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
          }
        }
      })
    } catch (e) {
      util.errShow('微信版本过低')
    }
  },


  validatemobile: function (mobile) {

    this.setData({
      phone: mobile.detail.value
    })
    if (mobile.detail.value.length == 0) {
      util.errShow('手机号有误');
    }
    var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (mobile.detail.value.length != 11 || !myreg.test(mobile.detail.value)) {
      util.errShow('手机号有误');
      return false;
    }


    return true;
  },

  //输入提货人姓名
  f2fName: function (e) {
    this.setData({
      f2fName: e.detail.value
    })
  },


  onLoad: function (options) {
    var that = this;
    if (options.payType) {
      this.data.isSelfGet = true
      this.setData({
        isSelfGet: this.data.isSelfGet,
        express: true,
        since: true,
        freight: true
      })
    }
    this.getAddress();
  },

  getAddress(fn) {
    var that = this
    this.data.addressIsGet = false
    new order(function (data) {
      that.data.addressIsGet = true
      //存储默认在线付款的支付方式id
      for (var i = 0; i < data.data.paymentMethods.length; i++) {
        //'online'为在线付款  'offline'为线下付款
        if (data.data.paymentMethods[i].method == 'online') {
          that.setData({
            paymentMethodId: data.data.paymentMethods[i].id
          })
        }
      }
      //存储默认配送方式为同城快递的id
      for (var i = 0; i < data.data.shippingMethods.length; i++) {
        //'TPL'为同城快递  'F2F'到店提货
        if (that.data.isSelfGet && data.data.shippingMethods[i].method == 'PRIVY') {
          that.setData({
            shippingMethodId: data.data.shippingMethods[i].id,
            shippingMethodCode: data.data.shippingMethods[i].method
          })
        } if (data.data.shippingMethods[i].method == 'TPL') {
          that.setData({
            shippingMethodId: data.data.shippingMethods[i].id,
            shippingMethodCode: data.data.shippingMethods[i].method
          })
        }
      }
      that.setData({
        receiver: data.data.receiver,
        objectshippingMethods: data.data.shippingMethods,
        order: data.data.order,
        amount: data.data.order.amount,
        discount: data.data.order.discount,
        receiverId: data.data.receiver ? data.data.receiver.id : '',
        phone: data.data.receiver ? data.data.receiver.phone : '',
        f2fName: data.data.receiver ? data.data.receiver.consignee : ''
      })
      that.calcu()
    }).confirmOrder()
  },

  //计算价格方法
  calcu: function () {
    var that = this;
    new order(function (data) {

      that.setData({
        calcuPrice: data.data.trades,
        amount: data.data.amountPayable,
        discount: data.data.discount
      })
    }).calculate({
      paymentMethodId: that.data.paymentMethodId,
      shippingMethodId: that.data.shippingMethodId,
      codes: that.data.codes
    })
  },
  //显示
  toogleCouponSelect() {
    this.setData({
      showCouponSelect: !this.data.showCouponSelect
    })
  },
  //选择优惠券
  selectCoupon(e) {
    let code = e.currentTarget.dataset.code,
      name = e.currentTarget.dataset.name,
      codes = [];
    codes.push(code);
    this.setData({
      selectCoupon: {
        code: code ? code : '',
        name: name ? name : '未使用'
      },
      showCouponSelect: false,
      codes: codes
    })
    this.calcu()
  },

  //买家留言
  inputMemo: function (e) {
    this.setData({
      memo: e.detail.value
    })
  },

  //确认下单提交
  formSubmit: function (e) {
    var formId = e.detail.formId;
    var that = this;
    //同城快递提交订单
    if (this.data.shippingMethodCode == 'TPL') {
      if (!this.data.addressIsGet && this.data.getAddressCount) {
        setTimeout(() => {

          this.formSubmit(e)
          --this.data.getAddressCount
        }, 200)
        return
      }
      if (!this.data.receiverId) {
        util.errShow('请选择收货地址');
      } else {
        wx.showLoading({
          title: '订单请求中',
          mask: true
        })
        new order(function (data) {
          new order(function (a) {
            new order(function (res) {
              wx.hideLoading()
              that.ActionsheetShow(Object.assign({}, res.data, {
                closeJump: '/pages/member/order/order?id=1',
                successJump: '/pages/pay/success'
              }))
            }).paymentView({
              sn: a.data
            })
          }).payment({ sn: data.data, formId: formId })

        }).create({
          receiverId: that.data.receiverId,
          paymentMethodId: that.data.paymentMethodId,
          shippingMethodId: that.data.shippingMethodId,
          memo: that.data.memo,
          codes: that.data.codes,
          extension: wx.getStorageSync('extension') ? wx.getStorageSync('extension') : ''
        })
      }
    } else if (this.data.shippingMethodCode == 'F2F') {   //到店提货得订单
      var that = this;
      var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
      if (this.data.phone.length != 11 || !myreg.test(this.data.phone)) {
        util.errShow('手机号有误');
        return false;
      } else if (!this.data.f2fName) {
        util.errShow('请输入提货人');
        return false;
      } else {
        wx.showLoading({
          title: '订单请求中',
          mask: true
        })
        new order(function (data) {
          new order(function (a) {
            new order(function (res) {
              wx.hideLoading()
              that.ActionsheetShow(Object.assign({}, res.data, {
                closeJump: '/pages/member/order/order?id=1',
                successJump: '/pages/pay/success'
              }))
            }).paymentView({
              sn: a.data
            })
          }).payment({ sn: data.data, formId: formId })
        }).create({
          paymentMethodId: that.data.paymentMethodId,
          shippingMethodId: that.data.shippingMethodId,
          memo: that.data.memo,
          codes: that.data.codes,
          deliveryCenterId: that.data.deliveryCenterId,
          mobile: that.data.phone,
          extension: wx.getStorageSync('extension') ? wx.getStorageSync('extension') : '',
          name: that.data.f2fName
        })
      }
    } else if (this.data.shippingMethodCode == 'PRIVY') {    //货柜自拿订单提交
      wx.showLoading({
        title: '订单请求中',
        mask: true
      })
      new order(function (data) {
        new order(function (a) {
          new order(function (res) {
            wx.hideLoading()
            that.ActionsheetShow(Object.assign({}, res.data, {
              closeJump: '/pages/member/order/order?id=1',
              successJump: '/pages/pay/success'
            }))
          }).paymentView({
            sn: a.data
          })
        }).payment({ sn: data.data, formId: formId })

      }).create({
        paymentMethodId: that.data.paymentMethodId,
        shippingMethodId: that.data.shippingMethodId,
        memo: that.data.memo,
        codes: that.data.codes,
        extension: wx.getStorageSync('extension') ? wx.getStorageSync('extension') : ''
      })
    }
  }
}))