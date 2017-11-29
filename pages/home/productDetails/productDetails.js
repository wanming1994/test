let swiperAutoHeight = require("../../../template/swiperProduct/swiper.js"),
  Cart = require("../../../service/cart.js"),
  Product = require("../../../service/product.js"),
  WxParse = require('../../wxParse/wxParse.js'),
  app = getApp(),
  util = require("../../../utils/util.js")


function getRandomColor() {
  let rgb = []
  for (let i = 0; i < 3; ++i) {
    let color = Math.floor(Math.random() * 256).toString(16)
    color = color.length == 1 ? '0' + color : color
    rgb.push(color)
  }
  return '#' + rgb.join('')
}

Page(Object.assign({}, swiperAutoHeight, {

  onReady: function (res) {
    this.videoContext = wx.createVideoContext('myVideo')
  },
  inputValue: '',
  bindInputBlur: function (e) {
    this.inputValue = e.detail.value
  },
  /**
   * 页面的初始数据
   */
  data: {
    sys: app.globalData.sys,//系统信息
    productData: {},//数据
    showAction: false,//显示弹窗
    buyType: 'buy',//buy or cart
    specification: {},//商品规格
    canClick: [],
    selectArr: [],
    pageLoad: false,//页面加载完成
    videoShow:false,
    showShortcut:false
  },
  catchActionMask(e){
    return false;
  },
  onLoad: function (options) {
    // let id = 20891
    let that = this;
    let id = options.id;
    this.data.id = id;
    var extension = options.extension;
    if (extension) {
      wx.setStorageSync('extension', extension)
    }
    new Product((res) => {
      wx.setNavigationBarTitle({
        title: res.data.name
      })
      let select = res.data.specification,
        all = res.data.specifications,
        selectList = res.data.productSpecifications,
        selectArr = []
      if (select.length == 1) {
        selectArr = [select[0].specificationValueId]
      } else if (select.length == 2) {
        selectArr = [select[0].specificationValueId, select[1].specificationValueId]
      }

      // var attributes = res.data.attributes;
      var introduction = res.data.introduction;
      var attributesList = res.data.attributes;
      this.setData({
        title: res.data.name,
        productData: res.data,
        selectArr: selectArr,
        specification: {
          select: res.data.specification,
          all: res.data.specifications,
          selectList: res.data.productSpecifications,
          // attributes: res.data.attributes,
        },
        introduction: res.data.introduction,
        videoCover: res.data.videoCover,
        videoUrl: res.data.videoUrl,
        attributesList: res.data.attributes
      })

      if (res.data.review && res.data.review.anonym){
        this.setData({
          reviewName: res.data.review.nickName.replace(/^(.).*/, "$1***")
        })
      }else{
        this.setData({
          reviewName: res.data.review ? res.data.review.nickName:''
        })
      }
      if (res.data.attributes.length < 1) {
        that.setData({
          showAttribute: false
        })
      } else {
        that.setData({
          showAttribute: true
        })
      }

      this.getSpecifications();
      // if (attributes.length != 0) {
        // WxParse.wxParse('attributes', 'html', attributes, that, 5);
      // }
      if (introduction != null) {
        WxParse.wxParse('introduction', 'html', introduction, that, 5);
      }
      setTimeout(res => {
        this.setData({
          pageLoad: true
        })
      }, 200)
    }).view({
      id: id
    })




    //小店推荐商品
    new Product((data) => {
      this.setData({
        tenantRecomList: data.data,
        pageModel: data.pageModel
      })
    }).recommend({
      id: this.data.id,
      pageNumber: 1,
      pageSize: 6
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    if (app.globalData.LOGIN_STATUS) {
      //更新购物车数量
      new Cart(function (data) {
        that.setData({
          cartCount: data.data
        })
      }).count({
        tenantId: app.globalData.tenantId
      })
    } else {
      app.loginOkCallback = res => {
        //更新购物车数量
        new Cart(function (data) {
          that.setData({
            cartCount: data.data
          })
        }).count({
          tenantId: app.globalData.tenantId
        })
      }
    }
  },
  //选择规格
  checkout(e) {
    let id = e.currentTarget.dataset.id,
      idx = e.currentTarget.dataset.idx,
      can = e.currentTarget.dataset.can
    if (!can) return
    this.data.selectArr[idx] = id
    this.setData({
      selectArr: this.data.selectArr
    })
    this.getSpecifications()
  },
  revisenum(e) {
    let stype = e.currentTarget.dataset.type,
      min = this.data.selectData.minReserve,
      max = this.data.selectData.availableStock,
      quantity = this.data.selectData.quantity

    switch (stype) {
      case 'input':
        quantity = (!isNaN(e.detail.value) && e.detail.value >= min && e.detail.value <= max) ? e.detail.value : this.data.selectData.quantity
        break;
      case 'add':
        quantity = quantity + 1 <= max ? (quantity < min ? min : ++quantity) : max
        break;
      case 'reduce':
        quantity = quantity - 1 < min ? 0 : --quantity
        break;
    }
    this.data.selectData.quantity = quantity
    this.setData({
      selectData: this.data.selectData
    })
  },
  //可选组合判断并修改值
  getSpecifications() {
    let selectArr = this.data.selectArr,
      selectList = this.data.specification.selectList,
      canClick = {},
      selectData = {},
      len = selectArr.length
    if (len === 0) {
      selectData = this.data.specification.selectList[0]
      selectData.quantity = selectData.cartItemQuantity == 0 ? selectData.minReserve : selectData.cartItemQuantity
      this.setData({
        selectData: selectData
      })
    } else if (len === 1) {

      for (let i = 0, j = selectList.length; i < j; i++) {
        if (selectList[i].specifications[0].specificationValueId == selectArr[0]) {
          selectData = selectList[i]
          break
        }
      }
      selectData.quantity = selectData.cartItemQuantity == 0 ? selectData.minReserve : selectData.cartItemQuantity
      this.setData({
        selectData: selectData
      })
    } else if (len === 2) {
      selectArr.forEach((val, idx) => {
        selectList.forEach((vals, idxs) => {
          if (
            val == vals.specifications[idx].specificationValueId
          ) {
            if (
              selectArr[1 - idx]
              ==
              vals.specifications[1 - idx].specificationValueId
            ) {
              selectData = vals
            }
            if (!canClick[val]) canClick[val] = []
            canClick[val].push(vals.specifications[1 - idx].specificationValueId)
          }
        })
      })
      this.data.canClick = canClick
      selectData.quantity = selectData.cartItemQuantity == 0 ? selectData.minReserve : selectData.cartItemQuantity
      this.data.selectData = selectData
      this.setData({
        canClick: this.data.canClick,
        selectData: this.data.selectData
      })
    }
  },
  //进入购物车
  toCart() {
    this.setData({
      showAction: false
    })
    util.navigateTo({
      url: '/pages/cart/index'
    })
  },
  //收藏
  favorite() {
    if (this.data.productData.hasFavorite) {
      new Product((res) => {
        this.data.productData.hasFavorite = false;
        wx.showToast({
          title: '取消成功',
          duration: 1000
        })
        this.setData({
          productData: this.data.productData
        })
      }).delFavorite({
        id: this.data.id
      })
    } else {
      new Product((res) => {
        this.data.productData.hasFavorite = true;
        wx.showToast({
          title: '收藏成功',
          duration: 1000
        })
        this.setData({
          productData: this.data.productData
        })
      }).favorite({
        id: this.data.id
      })
    }
  },
  //弹出框toggle

  toggleMask(e) {

    // this.data._swiper.top.videoShow = !this.data.showAction;
    this.data._swiper.top.videoShow = true;

    this.setData({
      showAction: !this.data.showAction,
      buyType: e.currentTarget.dataset.type,
      _swiper: this.data._swiper
    })
  },
  // 评价
  ecaluate: function (e) {
    util.navigateTo({
      url: 'evaluate/evaluate?id=' + this.data.id
    })
  },


  /**
  * 页面上拉触底事件的处理函数
  */
  onReachBottom: function () {
    var that = this;
    var pageModel = this.data.pageModel;
    var tenantRecomList = this.data.tenantRecomList;
    new Product(function (data) {
      wx.hideNavigationBarLoading() //完成停止加载
      if (data.pageModel.totalPages < data.pageModel.pageNumber) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      } else {
        tenantRecomList = tenantRecomList.concat(data.data)
        that.setData({
          tenantRecomList: tenantRecomList,
          loading: false,
          tips: '努力加载中',
          showtips: false
        })
      }
    }).recommend({
      id: that.data.id,
      pageSize: 6,
      pageNumber: ++pageModel.pageNumber
    });
  },


  //加入购物车和立即购买确认按钮
  paySubmit: function () {
    let that = this;
    //立即购买
    if (that.data.buyType == 'buy') {
      new Cart(function () {
        that.setData({
          showAction: false
        })
        util.navigateTo({
          url: '/pages/pay/pay'
        })
      }).add({
        id: that.data.selectData.id,
        quantity: that.data.selectData.quantity,
        type: 'buy'
      })
      //加入购物车
    } else if (that.data.buyType == 'cart') {
      new Cart(function () {
        that.setData({
          showAction: false
        })
        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1000
        })
        //更新购物车数量
        new Cart(function (data) {
          that.setData({
            cartCount: data.data
          })
        }).count({
          tenantId: app.globalData.tenantId
        })
      }).add({
        id: that.data.selectData.id,
        quantity: that.data.selectData.quantity
      })
    }

  },


  onShareAppMessage: function (res) {
    var that = this;
    if (res.from === 'button') {
      // 来自页面内转发按钮

    }
    return {
      title: that.data.title,
      path: 'pages/home/productDetails/productDetails?id=' + that.data.id + '&extension=' + app.globalData.memberInfo.username,
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
  },

  //快捷导航点击事件
  openShortcut:function(){
    this.setData({
      showShortcut: !this.data.showShortcut
    })
  },
  toggleshowShortcut:function(){
    this.setData({
      showShortcut: false
    })
  },

  //店铺首页
  goHome:function(){
    util.navigateTo({
      url: '/pages/home/index',
    })
  },
  //收藏
  goFavorite: function () {
    util.navigateTo({
      url: '/pages/member/favorite/favorite',
    })
  },
  //搜索
  goSearch: function () {
    util.navigateTo({
      url: '/pages/home/productList/productList',
    })
  },
  //购物车
  goCart: function () {
    util.navigateTo({
      url: '/pages/cart/index',
    })
  }


}))