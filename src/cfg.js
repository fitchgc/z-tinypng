const fse = require("fs-extra");

class Cfg {
  constructor() {
    if (!Cfg.ins) {
      let path = `packages://z-tinypng/cfgs/${Editor.projectInfo.name}.json`
      this.filePath = Editor.url(path, 'utf8')
      this.data = {
        min: 0,
        max: 0,
        platforms: [],
        excludeFolders: '',
        excludeFiles: ''
      }
      Cfg.ins = this
    }
    return Cfg.ins

  }
  load() {
    Editor.log(this.filePath)
    if(!fse.existsSync(this.filePath)){
      fse.writeJsonSync(this.filePath, this.data)
    } else {
      let data = fse.readJsonSync(this.filePath, { throws: false })
      Object.assign(this.data, data)
    }
    return this
  }
  update(data){
    Object.assign(this.data, data)
    return this.save()
  }
  save() {
    fse.writeJsonSync(this.filePath, this.data)
    return this
  }
  get excludeFolders() {
    if (!this.data.excludeFolders) {
      return []
    }
    return this.data.excludeFolders.split(',')
  }
  get excludeFiles() {
    if (!this.data.excludeFiles) {
      return []
    }
    return this.data.excludeFiles.split(',')
  }
}
module.exports = Cfg
