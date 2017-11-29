let app = getApp()
let Member = require('../../service/member.js')
let coupon = require('../../service/coupon.js')
let util = require('../../utils/util.js')
let message = require('../../service/message.js')
let config = require('../../utils/config.js')
Page({
  data: {
    memberInfo: {}
  },
  onLoad: function (options) {

  },
  getInfoWhenLogin() {

    let that = this;
    wx.getUserInfo({
      success: function (res) {
        that.setData({
          userInfo: res.userInfo
        })
      },
      fail: function (err) {
        if (err.errMsg.indexOf('auth') > -1) {
          wx.showModal({
            title: '提示',
            content: '未授予用户信息权限，部分功能会受到限制，是否前往设置',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      }
    })


    new Member(data => {
      this.setData({
        memberInfo: data.data
      })
    }).view({
          appid:config.APPID
      })

    that.setData({
      userInfo: app.globalData.userInfo
    })

    //收藏商品数量
    new Member(data=> {
        this.setData({
          favoriteProductCout:data.data.length
        })
    }).productList({
      tenantId: app.globalData.tenantId
    });

    //优惠券数量
    new coupon(data => {
      this.setData({
        couponLength: data.data.length
      })
    }).list({
      tenantId: app.globalData.tenantId
    })

    //会员卡数量
    new coupon(data=>{
      this.setData({
        cardLength: data.data.cards.length
      })
    }).cardlist({
      tenantId: app.globalData.tenantId
    })

    //未读消息数量
    new message(data => {
      var count = parseInt(data.data.account) + parseInt(data.data.message) + parseInt(data.data.order);
      this.setData({
        count: count
      })
    }).count()
  },
  onShow: function () {
    var that = this;
    if (app.globalData.LOGIN_STATUS) {
      this.getInfoWhenLogin()
    } else {
      app.loginOkCallback = res => {
        this.getInfoWhenLogin()
      }
    }
  },
  //我的钱包
  purse: function () {
    util.navigateTo({
      url: 'purse/purse',
    })
  },
  //进收藏页面
  goFavorite: function () {
    util.navigateTo({
      url: 'favorite/favorite',
    })
  },
  //进入券包
  goCoupon: function () {
    util.navigateTo({
      url: '/pages/member/coupon/list',
    })
  },
  //进入微信会员卡
  goMemberCard: function () {
    if (!wx.canIUse('web-view')){
      util.errShow("微信版本不支持")
      return
    }
    util.navigateTo({
      url: '/pages/card/card',
    })
  },
  //进消息页面
  goMessage: function () {
    util.navigateTo({
      url: '../message/index',
    })
  },
  //我的订单
  toOrder: function (e) {
    var id = e.currentTarget.dataset.current
    util.navigateTo({
      url: 'order/order?id=' + id,
    })
  },
  //收货地址
  chooseAddress: function () {
    try {
      wx.chooseAddress({
        success: function (res) {








        },
        fail: function (err) {

          if (err.errMsg.indexOf('auth') > -1) {
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

  //修改密码
  password: function () {
    if (this.data.memberInfo.bindMobile !== 'binded') {
      util.errShow('您还未绑定手机', 1000, function () {
        util.navigateTo({
          url: '/pages/member/bind/bind',
        })
      })
      return;
    }
    util.navigateTo({
      url: '/pages/include/captcha/captcha?type=password&title=修改支付密码',
    })
  },

  //绑定手机
  bindPhone: function () {
    if (this.data.memberInfo.bindMobile !== 'binded') {
      util.navigateTo({
        url: 'bind/bind',
      })
    } else {

      util.errShow('您已绑定', 1500);
    }

  },

  //联系我们
  callUs: function () {
    wx.makePhoneCall({
      phoneNumber: '0551-67698098',
      success(res) {

      },
      fail(err) {
        if (err.errMsg.indexOf('cancel') === -1) {
          util.errShow('0551-67698098', 5000)
        }

      }
    })
  }
})