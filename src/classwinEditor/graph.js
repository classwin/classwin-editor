import { Quill } from 'react-quill'
// eslint-disable-next-line
import functionPlot from 'imports-loader?window.math=mathjs,window.d3=d3!function-plot'
const Embed = Quill.import('blots/embed')
const Module = Quill.import('core/module')
const icons = Quill.import('ui/icons')
// icons.graph = '<i class="line graph icon" aria-hidden="true"></i>'
icons.graph = `
<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM464 96H345.94c-21.38 0-32.09 25.85-16.97 40.97l32.4 32.4L288 242.75l-73.37-73.37c-12.5-12.5-32.76-12.5-45.25 0l-68.69 68.69c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 6.25 16.38 6.25 22.63 0L192 237.25l73.37 73.37c12.5 12.5 32.76 12.5 45.25 0l96-96 32.4 32.4c15.12 15.12 40.97 4.41 40.97-16.97V112c.01-8.84-7.15-16-15.99-16z"></path></svg>
`

function findAncestor(el, cls) {
  // eslint-disable-next-line
  while ((el = el.parentElement) && !el.classList.contains(cls)) {}
  return el
}
class GraphBlot extends Embed {
  static create(value) {
    const node = super.create(value)
    node.style.display = 'inline-block'
    if (typeof value === 'string') {
      try {
        functionPlot({
          target: node,
          width: 300,
          height: 300,
          data: [
            {
              fn: value,
              sampler: 'builtIn', // this will make function-plot use the evaluator of math.js
              graphType: 'polyline',
            },
          ],
        })
      } catch (err) {
        console.log(err)
      }
      node.setAttribute('data-value', value)
    }
    node.setAttribute('contenteditable', false)
    return node
  }

  static value(domNode) {
    return domNode.getAttribute('data-value')
  }

  // eslint-disable-next-line class-methods-use-this
  index() {
    return 1
  }

  resize(width = 500, height = 300) {
    const node = this.domNode
    const value = this.domNode.getAttribute('data-value')
    console.log(node)
    console.log(value)
    try {
      functionPlot({
        target: node,
        data: [
          {
            fn: value,
            sampler: 'builtIn', // this will make function-plot use the evaluator of math.js
            graphType: 'polyline',
            width,
            height,
          },
        ],
      })
    } catch (err) {
      console.log(err)
    }
  }
}

GraphBlot.blotName = 'graph'
GraphBlot.className = 'ql-graph'
GraphBlot.tagName = 'SPAN'

export default class Graph extends Module {
  constructor(quill, options) {
    const opt = options || {}
    super(quill, opt)
    const self = this
    this.quill = quill
    this.options = opt
    this.quill.root.addEventListener('click', this.handleClick.bind(this), false)
    this.handler = opt.handler
    this.quill.theme.modules.toolbar.handlers.graph = () => {
      self.prompt()
    }
  }

  static register() {
    console.log('Registering blot')
    Quill.register(GraphBlot, true)
  }

  show(target) {
    const self = this
    this.graphObj = target
    /* this.prompt(target.getAttribute('data-value')).then(() => {
    }) */
    const index = self.quill.getIndex(Quill.find(self.graphObj)) + 1
    self.quill.setSelection(index, 0)
    this.prompt(target.getAttribute('data-value'))
      .then(() => {
        self.quill.deleteText(index - 1, 1) // remove graph
        self.quill.deleteText(index + 1, 1) // remove extra spacebar
      })
      .catch((e) => {
        console.log(e)
      })
    // show ui
  }

  // hide(target) {
  //   // hide ui
  // }

  prompt(curValue) {
    const v = curValue || ''
    const self = this
    return this.handler(v)
      .then((value) => {
        const range = self.quill.getSelection(true)
        if (range != null) {
          const index = range.index + range.length
          self.quill.insertEmbed(index, 'graph', value, 'user')
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
    const graphObj = findAncestor(evt.target, 'ql-graph')
    const isGraph = graphObj !== null
    if (evt.target && isGraph && self.quill.isEnabled()) {
      if (this.graphObj === isGraph) {
        // we are already focused on this formula
        return
      }
      if (this.graphObj) {
        // we were just focused on another formula
        this.hide()
      }
      // clicked on an formula inside the editor
      this.show(graphObj)
    } else if (this.graphObj) {
      // clicked on a non formula
      this.hide()
    }
  }
}

if (window.Quill) {
  window.Quill.register('modules/Graph', Graph)
}
