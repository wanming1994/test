// pages/home/home.js

let swiperAutoHeight = require("../../template/swiper/swiper.js"),
  Product = require("../../service/product.js"),
  Cart = require("../../service/cart.js"),
  Coupon = require("../../service/coupon.js"),
  Tenant = require("../../service/tenant.js"),
  Ad = require("../../service/ad.js"),
  app = getApp(),
  util = require("../../utils/util.js")

Page(Object.assign({}, swiperAutoHeight, {

  /**
   * 页面的初始数据
   */
  data: {
    scrollTo: '',//页面跳转到
    hotsell: [],//热销商品
    newsell: [],//新品
    recommendsell: [],//推荐商品
    sys: app.globalData.sys,
    paging: {
      recommend: {},
      hotsell: {},
      newsell: {}
    },
    homeLoadReady: false,
    storyTitle: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var extension = options.extension;
    if (extension) {
      wx.setStorageSync('extension', extension)
    }
    if (app.globalData.LOGIN_STATUS) {
      this.getData()
    } else {
      app.loginOkCallbackList.push(() => {
        this.getData()
      })
    }
  },
  //跳转详情页
  toDetail(e) {
    let id = e.currentTarget.dataset.id
    util.navigateTo({
      url: './productDetails/productDetails?id=' + id,
    })
  },
  //加入购物车
  addCart(e) {
    let id = e.currentTarget.dataset.id

    new Cart((res) => {

    }).add({
      id: id,
      quantity: 1
    })
  },
  //获取数据
  getData() {
    let that = this, promiseList = []
    //广告位(顶部)
    promiseList.push(new Promise((resolve, reject) => {
      new Ad(res => {
        this.setData({
          topImgs: {
            data: res.data,
            key: 'image'
          }
        })
        resolve()
      }).doT(80, app.globalData.tenantId)
    }))

    //商家数据
    promiseList.push(new Promise((resolve, reject) => {
      new Tenant(res => {
        this.setData({
          tenantData: res.data
        })
        resolve()
      }).view({
        id: app.globalData.tenantId
      })
    }))

    Promise.all(promiseList).then(res => {
      setTimeout(() => {
        this.setData({
          homeLoadReady: true
        })
      }, 500)
    }, err => {
      this.setData({
        homeLoadReady: true
      })
    })

    //加载优惠券
    new Coupon(data => {
      var item = [];
      var couponList = data.data
      this.setData({
        couponList: couponList
      });
    }).listT({ tenantId: app.globalData.tenantId });

    //获取热销商品
    new Product(res => {
      this.data.paging.hotsell = res.pageModel
      this.setData({
        hotsell: res.data,
        paging: this.data.paging
      })
      if (res.pageModel.pageNumber < res.pageModel.totalPages) {
        this.setData({
          hotsellTips: '加载更多'
        })
      } else {
        this.setData({
          hotsellTips: ''
        })
      }
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 10,
      tagIds: 1
    })

    //品牌故事
    new Tenant(data => {
      this.setData({
        storyTitle: data.data.title,
        storyId: app.globalData.tenantId
      })
    }).article({ id: app.globalData.tenantId })
    //获取新品商品

    new Product(res => {
      this.data.paging.newsell = res.pageModel
      this.setData({
        newsell: res.data,
        paging: this.data.paging
      })
      if (res.pageModel.pageNumber < res.pageModel.totalPages) {
        this.setData({
          newsellTips: '加载更多'
        })
      } else {
        this.setData({
          newsellTips: ''
        })
      }
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 10,
      tagIds: 2
    })

    //获取推荐商品
    new Product(res => {
      this.data.paging.recommend = res.pageModel
      this.setData({
        recommendsell: res.data,
        paging: this.data.paging
      })
      if (res.pageModel.pageNumber < res.pageModel.totalPages) {
        this.setData({
          recommendsellTips: '加载更多'
        })
      } else {
        this.setData({
          recommendsellTips: ''
        })
      }
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 10,
      tagIds: 5
    })

    //广告位(故事下)
    new Ad(res => {
      this.setData({
        storyAdImgs: res.data
      })
    }).doT(211, app.globalData.tenantId)

    //广告位(促销)
    new Ad(res => {
      this.setData({
        promotionAdImgs: {
          data: res.data,
          key: 'image'
        }
      })
    }).doT(214, app.globalData.tenantId)

    //广告位(新品)
    new Ad(res => {
      this.setData({
        newproductAdImgs: {
          data: res.data,
          key: 'image'
        }
      })
    }).doT(213, app.globalData.tenantId)

    //广告位(推荐)
    new Ad(res => {
      this.setData({
        recommendAdImgs: {
          data: res.data,
          key: 'image'
        }
      })
    }).doT(215, app.globalData.tenantId)


    //进店成为会员
    new Tenant(res => {

    }).becomeVip({
      id: app.globalData.tenantId,
      extension: wx.getStorageSync('extension')
    })


  },

  //加载更多商品
  loadingMore: function (e) {
    var tagIds = e.currentTarget.dataset.tagids;
    if (tagIds == '1') {
      this.setData({
        hotsellTipsLoad: true
      })
      var pageModel = this.data.paging.hotsell;
      var hotsell = this.data.hotsell;
      new Product((res) => {
        hotsell = hotsell.concat(res.data)
        this.setData({
          hotsell: hotsell,
          hotsellTipsLoad: false
        });
        if (res.pageModel.totalPages < res.pageModel.pageNumber) {
          this.setData({
            hotsellTips: '',
          })
        }
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '2') {
      this.setData({
        newsellTipsLoad: true
      })
      var pageModel = this.data.paging.newsell;
      var newsell = this.data.newsell;
      new Product((res) => {
        newsell = newsell.concat(res.data)
        this.setData({
          newsell: newsell,
          newsellTipsLoad: false
        })
        if (res.pageModel.totalPages < res.pageModel.pageNumber) {
          this.setData({
            newsellTips: '',
          })
        }
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '5') {
      this.setData({
        recommendsellTipsLoad: true
      })
      var pageModel = this.data.paging.recommend;
      var recommendsell = this.data.recommendsell;
      new Product((res) => {
        recommendsell = recommendsell.concat(res.data)
        this.setData({
          recommendsell: recommendsell,
          recommendsellTipsLoad: false
        })
        if (res.pageModel.totalPages < res.pageModel.pageNumber) {
          this.setData({
            recommendsellTips: '没有更多啦~',
          })
        }
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    }

  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  scrollto(e) {
    let to = e.currentTarget.dataset.to
    this.setData({
      scrollTo: to
    })
  },
  /**
  * 品牌故事跳转
  */
  storyView: function (e) {
    var that = this;
    new Tenant(function (data) {
      util.navigateTo({
        url: './article/article?id=' + that.data.storyId
      })
    }).article({ id: app.globalData.tenantId })
  },
  /**
   * 领取优惠券
   */

  receiveCoupon: function (e) {

    let id = e.currentTarget.dataset.id
    var that = this;
    new Coupon(function (data) {
      new Coupon(function (data) {
        var item = [];
        var couponList = data.data
        that.setData({
          couponList: couponList
        });
      }).listT({ tenantId: app.globalData.tenantId });

      wx.showToast({
        title: '领取成功',
        icon: 'success',
        duration: 2000
      })
    }).pickup({ id: id })
  },
  // 搜索商品
  searchProduct: function (e) {
    util.navigateTo({
      url: './productList/productList?keyWord=' + e.detail.value + '&page=index'
    })
  },
  toList() {
    util.navigateTo({
      url: './productList/productList?keyWord=&page=index'
    })
  },
  adTap(e) {
    let linkid = e.currentTarget.dataset.linkid
    if (!linkid) return
    util.navigateTo({
      url: './productDetails/productDetails?id=' + linkid,
    })
  },

  //首页扫一扫进商品详情
  wxscan: function () {

    wx.scanCode({
      success: (res) => {

        util.navigateTo({
          url: '/pages/home/productDetails/productDetails?id=' + res.result,
        })
      }
    })
  },
  //分享
  onShareAppMessage: function (res) {
    var that = this;
    if (res.from === 'button') {
      // 来自页面内转发按钮

    }
    return {
      title: that.data.tenantData.name,
      path: 'pages/home/home?&extension=' + app.globalData.memberInfo.username,
      success: function (res) {


        // 转发成功
        wx.showToast({
          title: '转发成功',
          icon: 'success'
        })
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
}))