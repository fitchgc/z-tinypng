const Cfg = Editor.require('packages://z-tinypng/src/cfg.js')

const v = Editor.remote.Profile.load('global://features.json')
let k = v.get('xiaomi-runtime') || !1,
  T = v.get('alipay-minigame') || !1,
  y = v.get('qtt-runtime') || !1,
  B = v.get('huawei-agc') || !1,
  D = v.get('link-sure') || !1,
  S = v.get('bytedance-minigame') || !1

const j = ['web-mobile', 'web-desktop', 'fb-instant-games', 'android', B ? 'huawei-agc' : 'HIDDEN', 'android-instant', 'ios', T ? 'alipay' : 'HIDDEN', y ? 'qtt-game' : 'HIDDEN', S ? 'bytedance' : 'HIDDEN', S ? 'bytedance-subcontext' : 'HIDDEN', 'jkw-game', 'huawei', 'quickgame', 'qgame', k ? 'xiaomi' : 'HIDDEN', D ? 'link-sure' : 'HIDDEN', 'baidugame', 'baidugame-subcontext', 'wechatgame', 'wechatgame-subcontext', 'cocos-runtime', 'qqplay', 'mac', 'win32']
Editor.Panel.extend({
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    input[type="checkbox"]{display:none}
    input[type="checkbox"]+label {
      display: inline-block;
      width: 48%;
      margin-top: 10px;
      margin-left: 5px;
      text-align: left;
      -webkit-box-sizing: border-box;
    }
    label::before {
      content: "";
      display: inline-block;
      width: 15px;
      height: 15px;
      background: #EEE;
      vertical-align: middle;
      margin-right: 5px;
      -webkit-box-sizing:border-box;
      -webkit-transition:background ease-in .5s
    }
    input[type="checkbox"]:checked+label::before{
      background-color: #fd942b;
      border: 2px #EEEEEE solid;
    }
  `,

  template: `
    <h3 class="blue">只处理以下范围大小的图片, 单位kb</h3>
    <ui-prop name="最小值"  type="number" v-value="min" >
    </ui-prop>
    <ui-prop name="最大值(0为不限制)"  type="number" v-value="max">
    </ui-prop>
    <hr />
    <div class="section" >
      <h3>平台</h3>
      <template v-for="item in platforms">
        <input type="checkbox" id="{{item.value}}" value="{{item.value}}" v-model="checkedNames">
        <label for="{{item.value}}">{{item.text}}</label>
      </template>
      <br>
    </div>
    <hr />
    <ui-prop name="需要排除的文件夹" tooltip="* 相对于 assets/ 目录的路径&#10;* 多个值之间必须用 ',' 隔开" auto-height>
        <ui-text-area class="flex-1" type="string" size="big" v-value="excludeFolders"
            placeholder="textures/path0/,&#10;textures/path1/">
        </ui-text-area>
    </ui-prop>
    <ui-prop name="需要排除的文件" tooltip="* 相对于 assets/ 目录的路径&#10;* 多个值之间必须用 ',' 隔开" auto-height>
        <ui-text-area class="flex-1" type="string" size="big" v-value="excludeFiles"
            placeholder="textures/file0.png,&#10;textures/file1.png">
        </ui-text-area>
    </ui-prop>
    <hr />
    <ui-button @click="onCancel" >取消</ui-button>
    <ui-button @click="onSave" class="green">保存</ui-button>
  `,

  $: {
    btn: '#btn',
    label: '#label'
  },

  ready() {
    let cfg = new Cfg().load()
    let cfgData = cfg.data
    Editor.log(JSON.stringify(cfgData))
    let vm = new window.Vue({
      el: this.shadowRoot,
      data: {
        min: cfgData.min,
        max: cfgData.max,
        checkedNames: cfgData.platforms || [],
        excludeFolders: cfgData.excludeFolders || '',
        excludeFiles: cfgData.excludeFiles || '',
        platforms: function (e) {
          let t = []
          t.push({
            value: 'web-mobile',
            text: Editor.T('BUILDER.platforms.web-mobile')
          }), t.push({
            value: 'web-desktop',
            text: Editor.T('BUILDER.platforms.web-desktop')
          }), t.push({
            value: 'fb-instant-games',
            text: Editor.T('BUILDER.platforms.fb-instant-games')
          }), t.push({
            value: 'android',
            text: Editor.T('BUILDER.platforms.android')
          }), t.push({
            value: 'android-instant',
            text: Editor.T('BUILDER.platforms.android-instant')
          }), 'darwin' === process.platform && (t.push({
            value: 'ios',
            text: Editor.T('BUILDER.platforms.ios')
          }), t.push({
            value: 'mac',
            text: Editor.T('BUILDER.platforms.mac')
          })), 'win32' === process.platform && t.push({
            value: 'win32',
            text: Editor.T('BUILDER.platforms.win32')
          })
          let r = Editor.remote.Builder.simpleBuildTargets, i = []
          for (let e in r) {
            let t = r[e]
            t.settings && i.push({value: t.platform, text: t.name})
          }
          return t = t.concat(i), j.map(e => {
            if ('string' == typeof e) return t.find(t => t.value === e)
            {
              let r = e[Editor.lang]
              return t.find(e => e.text.replace(/\s/g, '').toLowerCase() === r.replace(/\s/g, '').toLowerCase())
            }
          }).filter(Boolean)
        }()

      },
      methods: {
        onSave(event) {
          Editor.log('On Save!')
          Editor.log(JSON.stringify(cfg))
          Editor.log(this.checkedNames)
          cfgData.min = this.min
          cfgData.max = this.max
          cfgData.platforms = this.checkedNames
          cfgData.excludeFolders = this.excludeFolders
          cfgData.excludeFiles = this.excludeFiles
          cfg.update(cfgData)
        },
        onCancel() {
          Editor.Panel.close('z-tinypng')
        }
      }
    })
  }

})
