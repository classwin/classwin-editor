import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'

import ReactQuill, { Quill } from 'react-quill'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import 'react-quill/dist/quill.snow.css'

import { FileAPI } from '../../api' // TODO:
import EquationEditor from './equationEditor'
import Graph from './graph'
import ImagePicker from './imagePicker'

import ErrorBoundary from '../errorBoundary'

window.katex = katex

Quill.register('modules/EquationEditor', EquationEditor)
Quill.register('modules/Graph', Graph)
Quill.register('modules/ImagePicker', ImagePicker)

const EditingArea = styled.div`
  min-height: 150px;
  p {
    word-break: normal;
    color: black;
  }
`

const Label = styled.label`
  display: inline-block;
  color: ${(props) => props.theme.grey};
  margin-bottom: 10px;
`

const Button = styled.div`
  color: ${(props) => props.theme.primaryButton};
  margin-top: 10px;
  font-size: 14px;
`

class ClasswinEditor extends Component {
  state = {
    show: true,
    numLine: 0,
  }

  componentDidMount() {
    if (this.props.readOnly) {
      this.setState({
        numLine: this.getNumLine(),
      })
    }
  }

  getValue = () => {
    let value
    if (!this.props.value || _.isEmpty(this.props.value.trim())) {
      value = { content: '', delta: { ops: [] } }
    } else {
      value = JSON.parse(this.props.value)
    }
    if (this.props.readOnly) {
      return value.delta
    }
    return value.content
  }

  getNumLine = () => {
    if (this.divRef) {
      return this.divRef.clientHeight / 16
    }
    return 0
  }

  handleChange = (content, delta, source, editor) => {
    // console.log('handle change')
    const data = {
      content,
      delta: editor.getContents(),
    }
    if (this.props.onChange) {
      this.props.onChange(JSON.stringify(data))
    }
  }

  viewAllContent = () => {
    this.setState({
      show: false,
    })
  }

  viewContent = () => {
    this.setState({
      show: true,
    })
  }

  renderButton() {
    if (this.state.show) {
      return <Button onClick={() => this.viewAllContent()}>+ See more</Button>
    }
    return <Button onClick={() => this.viewContent()}>- Show less</Button>
  }

  render() {
    const { numLine } = this.state
    const minLine = 30
    const getClassname = () => {
      if (numLine > minLine) {
        if (this.state.show) {
          return 'last-line'
        }
        return 'show-all'
      }
      return 'show-all'
    }

    return (
      <ErrorBoundary>
        <div
          ref={(element) => (this.divRef = element)} // eslint-disable-line
        >
          {this.props.label && <Label>{this.props.label && this.props.label}</Label>}
          <ReactQuill
            className={!this.props.readOnly ? 'focused-editor' : 'blurred-editor'}
            theme="snow"
            onChange={this.handleChange}
            value={this.getValue()}
            modules={ClasswinEditor.modules}
            formats={ClasswinEditor.formats}
            placeholder={this.props.placeholder}
            readOnly={this.props.readOnly}>
            <EditingArea
              style={
                this.props.readOnly
                  ? { minHeight: 0, minWidth: 200, marginTop: 2 }
                  : { minWidth: 200, marginTop: 2, height: 300, cursor: 'text' }
              }
              className={`editing-area ${this.props.isShowAll ? 'show-all' : getClassname()}`}
            />
          </ReactQuill>
          {this.props.readOnly &&
            !this.props.isShowAll &&
            (numLine > minLine && this.renderButton())}
          <style>{`
            div.blurred-editor div.ql-toolbar {
              display: none;
            }
            div.blurred-editor div.editing-area {
              border: 0;
              word-break: break-all;
            }
            div.blurred-editor div.editing-area div.ql-editor {
              padding: 0;
              overflow: hidden;
            }
            .show-all {
              height: 100%;
            }
            .last-line {
              height: 36em; /* exactly ten lines */
              text-overflow: -o-ellipsis-lastline;
            }
            @media (max-width: 768px) {
              .ql-editor .ql-video {
                display: block;
                max-width: 100%;
                width: 100%;
                height: 250px;
              }
            }
            @media (min-width: 769px) {
              .ql-editor .ql-video {
                display: block;
                max-width: 100%;
                width: 100%;
                height: 350px;
              }
            }
          `}</style>
        </div>
      </ErrorBoundary>
    )
  }
}

ClasswinEditor.modules = {
  EquationEditor: {
    handler(value = '') {
      // eslint-disable-next-line
      const formula = prompt('Enter latex formula', value)
      if (formula) {
        return Promise.resolve(formula)
      }
      return Promise.reject(new Error('Cancel'))
    },
  },
  Graph: {
    handler(value = '') {
      // eslint-disable-next-line
      const formula = prompt('Enter function', value)
      if (formula) {
        return Promise.resolve(formula)
      }
      return Promise.reject(new Error('Cancel'))
    },
  },
  ImagePicker: {
    handler() {
      const fileInput = document.createElement('input')
      fileInput.setAttribute('type', 'file')
      fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon')
      fileInput.click()
      return new Promise((resolve, reject) => {
        fileInput.addEventListener('change', async () => {
          if (fileInput.files != null && fileInput.files[0] != null) {
            const file = fileInput.files[0]
            const formData = new FormData()
            formData.append('file', file)
            const res = await FileAPI.upload(formData) // TODO:
            const imageName = res.result.files.file[0].name
            const imageUrl = FileAPI.getUrl(imageName)
            return resolve(imageUrl)
          }
          return reject(new Error('Cancel'))
        })
      })
    },
  },
  formula: true,
  toolbar: [
    [{ header: 1 }, { header: 2 }],

    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],

    [{ color: [] }, { background: [] }],
    [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
    [{ indent: '-1' }, { indent: '+1' }],

    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],

    ['link', 'image', 'video'],

    ['formula', 'graph'],

    ['clean'],
  ],
}

ClasswinEditor.formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'code-block',
  'color',
  'background',
  'align',
  'indent',
  'list',
  'bullet',
  'script',
  'link',
  'image',
  'video',
  'formula',
  'graph',
]

ClasswinEditor.defaultProps = {
  readOnly: false,
  isShowAll: false,
}
ClasswinEditor.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string,
  isShowAll: PropTypes.bool,
}

export default ClasswinEditor
