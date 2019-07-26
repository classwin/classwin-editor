import { Quill } from 'react-quill'

function findAncestor(el, cls) {
  // eslint-disable-next-line
  while ((el = el.parentElement) && !el.classList.contains(cls)) {}
  return el
}

export default class EquationEditor {
  constructor(quill, options) {
    const opt = options || {}
    const self = this
    this.quill = quill
    this.quill.root.addEventListener('click', this.handleClick.bind(this), false)
    this.quill.root.parentNode.style.position =
      this.quill.root.parentNode.style.position || 'relative'
    this.handler = opt.handler
    this.quill.theme.modules.toolbar.handlers.formula = () => {
      self.prompt()
    }
  }

  prompt(curValue) {
    const v = curValue || ''
    const self = this
    return this.handler(v)
      .then((value) => {
        const range = self.quill.getSelection(true)
        if (range != null) {
          const index = range.index + range.length
          self.quill.insertEmbed(index, 'formula', value, 'user')
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
    const formularObj = findAncestor(evt.target, 'ql-formula')
    const isFormula = formularObj !== null
    if (evt.target && isFormula && self.quill.isEnabled()) {
      if (this.formularObj) {
        // we were just focused on another formula
        this.hide()
      }
      // clicked on an formula inside the editor
      this.show(formularObj)
    } else if (this.formularObj) {
      // clicked on a non formula
      this.hide()
    }
  }

  show(target) {
    const self = this
    this.formularObj = target
    /* this.prompt(target.getAttribute('data-value')).then(() => {
    }) */
    const index = self.quill.getIndex(Quill.find(self.formularObj)) + 1
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
    delete this.formularObj
  }
}
if (window.Quill) {
  window.Quill.register('modules/EquationEditor', EquationEditor)
}
