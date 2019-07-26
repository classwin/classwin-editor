import { Quill } from 'react-quill'

function findAncestor(el, tag) {
  if (el.tagName === tag) return el
  return null
}

export default class ImagePicker {
  constructor(quill, options = {}) {
    const self = this
    this.quill = quill
    this.quill.root.addEventListener('click', this.handleClick.bind(this), false)
    this.quill.root.parentNode.style.position =
      this.quill.root.parentNode.style.position || 'relative'
    /* this.quill.theme.editTooltip = new EditTooltip(quill, options.bound) */
    this.handler = options.handler
    this.quill.theme.modules.toolbar.handlers.image = () => {
      self.prompt()
    }
  }

  prompt(curValue = '') {
    const self = this
    return this.handler(curValue)
      .then((value) => {
        const range = self.quill.getSelection(true)
        if (range != null) {
          const index = range.index + range.length
          self.quill.insertEmbed(index, 'image', value, 'user')
          self.quill.insertText(index + 1, ' ', 'user')
          self.quill.setSelection(index + 2, 'user')
          return Promise.resolve(value)
        }
        return false
      })
      .catch((e) => {
        // cancel
        console.log(e)
        return Promise.reject(e)
      })
  }

  handleClick(evt) {
    const self = this
    const imageObj = findAncestor(evt.target, 'IMG')
    const isImage = imageObj !== null
    if (evt.target && isImage && self.quill.isEnabled()) {
      if (this.imageObj) {
        // we were just focused on another formula
        this.hide()
      }
      // clicked on an formula inside the editor
      this.show(imageObj)
    } else if (this.imageObj) {
      // clicked on a non formula
      this.hide()
    }
  }

  show(target) {
    const self = this
    this.imageObj = target
    /* this.prompt(target.getAttribute('data-value')).then(() => {
    }) */
    const index = self.quill.getIndex(Quill.find(self.imageObj)) + 1
    self.quill.setSelection(index, 0)
    this.prompt(target.getAttribute('data-value'))
      .then(() => {
        self.quill.deleteText(index - 1, 1) // delete equation
        self.quill.deleteText(index + 1, 1) // delete extra spacebar
      })
      .catch((e) => {
        console.log(e)
      })

    // show ui
  }

  hide() {
    // hide ui
    delete this.imageObj
  }
}
if (window.Quill) {
  window.Quill.register('modules/ImagePicker', ImagePicker)
}
