let Member = require('/service/member.js')
let util = require('/utils/util.js')
let config = require('/utils/config.js')

App({
  globalData: {
    LOGIN_STATUS: false,
    sys: wx.getSystemInfoSync()
  },
  onShow(opData) {

  },
  loginOkCallbackList: [],
  onLaunch(opData) {
    let that = this
    wx.login({
      success(data) {
        //用户登陆成功
        // tryLogin(data.code, (res) => {
        //   that.globalData.LOGIN_STATUS = true
        //   that.globalData.tenantId = res.data.tenantId
        //   wx.setStorageSync('tenantId', res.data.tenantId)
        //   new Member(res => {
        //     that.globalData.memberInfo = res.data
        //     wx.setStorageSync('memberInfo', res.data)
        //     if (that.loginOkCallback) {
        //       that.loginOkCallback()
        //     }
        //     if (that.loginOkCallbackList.length > 0) {
        //       for (let i = 0; i < that.loginOkCallbackList.length; i++) {
        //         if (typeof that.loginOkCallbackList[i] === 'function') {
        //           that.loginOkCallbackList[i]()
        //         }
        //         continue
        //       }
        //     }
        //   }).view({
        //     appid: config.APPID
        //   })
        // })
      }
    })
  }
})

//登陆，获取sessionid
var tryLogin = (function () {
  let count = 0
  return function (code, fn) {
    if (count >= config.LOGIN_ERROR_TRY_COUNT) {
      util.errShow('登陆超时')
      return
    }
    new Member(function (res) {
      if (res.data.login || res.data.sessionId !== null) {
        //设置请求session到本地
        wx.setStorageSync('JSESSIONID', res.data.sessionId)

        fn ? fn(res) : ''
      } else {
        setTimeout(function () {
          tryLogin(code)
          count++
        }, config.LOGIN_ERROR_TRY_TIMEOUT)
      }
    }, function (err) {
      util.errShow('登陆失败', 50000)
    }).login({
      js_code: code,
      cid: 1,
      appid:config.APPID
    })
  }
})()