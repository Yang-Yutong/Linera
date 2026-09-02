import dayjs from 'dayjs'
import React from 'react'
// react-codemirror2是CM5的react封装库，Controlled代表受控组件模式，表示编辑器内容完全由react的state控制
// 父组件负责维护代码字符串，编辑器只负责显示和触发修改回调
import { Controlled as CodeMirror } from 'react-codemirror2'
import { useDispatch, useSelector } from 'react-redux'
// 从codemirror核心包中导入Editor实例对象
import { Editor } from 'codemirror'

import { getActiveNote } from '@/utils/helpers'
import { updateNote } from '@/slices/note'
import { NoteItem } from '@/types'
import { NoteMenuBar } from '@/containers/NoteMenuBar'
import { EmptyEditor } from '@/components/Editor/EmptyEditor'
//自定义预览组件
import { PreviewEditor } from '@/components/Editor/PreviewEditor'
import { getNotes, getSettings, getSync } from '@/selectors'
import { setPendingSync } from '@/slices/sync'

// 导入CM核心样式
import 'codemirror/lib/codemirror.css'
// 导入CM主题样式
import 'codemirror/theme/base16-light.css'
// 导入语法解析模式 gfm=Github Flavored Markdown
// 加载支持 Markdown 且兼容 GitHub 语法（如表格、任务列表、删除线）的高亮规则。如果没有这行，编辑器只会显示纯文本
import 'codemirror/mode/gfm/gfm'
// 导入两个功能插件addon,也叫附加插件，分别支持选中行的光亮和滚到到末尾后依旧留白不触底
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/scroll/scrollpastend'

export const NoteEditor: React.FC = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { pendingSync } = useSelector(getSync)
  const { activeNoteId, loading, notes } = useSelector(getNotes)
  const { codeMirrorOptions, previewMarkdown } = useSelector(getSettings)

  const activeNote = getActiveNote(notes, activeNoteId)

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _updateNote = (note: NoteItem) => {
    // 当前没在等同步，则让待同步标志为true
    !pendingSync && dispatch(setPendingSync())
    dispatch(updateNote(note)) // 更新笔记
  }
  //设置编辑器的遮罩，高亮显示{{...}}的文本块
  const setEditorOverlay = (editor: Editor) => {
    const query = /\{\{[^}]*}}/g //定义正则表达式，用于匹配{{...}}格式的文本
    //
    editor.addOverlay({
      //接收一个stream文本流
      token: function (stream: any) {
        //stream.pos表示当前流的位置，每次从流开始位置开始搜索匹配项
        query.lastIndex = stream.pos
        //如果找到匹配项，则设置流的位置前进到匹配项位置
        var match = query.exec(stream.string)
        //找到匹配且匹配项位置等于当前流位置
        if (match && match.index == stream.pos) {
          //设置流的位置前进到匹配结尾
          stream.pos += match[0].length || 1
          //返回'notelink'标记
          return 'notelink'
        } else if (match) {
          stream.pos = match.index //如果找到匹配项但是位置不等于当前流位置，调整流到当前匹配项位置开始处
        } else {
          stream.skipToEnd() //如果没找到匹配项，跳到流末尾
        }
      },
    })
  }
  // 渲染编辑器
  const renderEditor = () => {
    //读取加载状态
    if (loading) {
      // 展示Loading文字
      return <div className="empty-editor v-center">Loading...</div>
      //如果不存在激活/选中的笔记
    } else if (!activeNote) {
      // 展示EmptyEditor组件
      return <EmptyEditor />
      //如果预览Markdown模式打开
    } else if (previewMarkdown) {
      return (
        // 渲染预览编辑器组件
        <PreviewEditor
          directionText={codeMirrorOptions.direction}
          noteText={activeNote.text}
          notes={notes}
        />
      )
    }

    // 否则返回codemirror编辑器组件
    return (
      <CodeMirror
        data-testid="codemirror-editor"
        className="editor mousetrap"
        // 绑定激活笔记的文本
        value={activeNote.text}
        // options：CodeMirror 的配置对象，包含语法高亮、主题、行号等设置
        options={codeMirrorOptions}
        // editorDidMount：编辑器挂载后触发的回调函数
        editorDidMount={(editor) => {
          //将 focus 推迟到下一个事件循环，确保 DOM 完全渲染后再聚焦
          setTimeout(() => {
            editor.focus() // 使编辑器获得键盘焦点，用户可直接输入
          }, 0)
          //将光标放在编辑器的第一行
          editor.setCursor(0)
          //调用函数给编辑器添加一个自定义的语法高亮规则
          setEditorOverlay(editor)
        }}
        // 在内容变化前更新笔记[自动保存]
        onBeforeChange={(editor, data, value) => {
          _updateNote({
            id: activeNote.id,
            text: value,
            created: activeNote.created,
            lastUpdated: dayjs().format(),
          })
        }}
        //内容变化后的回调，内容为空,聚焦编辑器
        onChange={(editor, data, value) => {
          if (!value) {
            editor.focus()
          }
        }}
        // 处理粘贴事件
        onPaste={(editor, event: any) => {
          // Get around pasting issue
          // https://github.com/scniro/react-codemirror2/issues/77
          // 如果剪切板没有数据，则返回
          if (!event.clipboardData || !event.clipboardData.items || !event.clipboardData.items[0])
            return
          //读取粘贴的第一项数据(文本)并在回调函数中处理
          event.clipboardData.items[0].getAsString((pasted: any) => {
            // 如果粘贴的内容与编辑器当前选中的内容,不处理
            if (editor.getSelection() !== pasted) return
            //获取当前选取的开始和结束位置
            const { anchor, head } = editor.listSelections()[0]
            //将光标移动到选取的结束位置,当粘贴后,光标位于粘贴内容末尾
            //使用 Math.max 确保光标在更靠后的行和列，从而避免粘贴后光标移到行首
            // line为行 ch为行内列索引
            editor.setCursor({
              line: Math.max(anchor.line, head.line),
              ch: Math.max(anchor.ch, head.ch),
            })
          })
        }}
      />
    )
  }

  return (
    <main className="note-editor">
      {/* 笔记菜单栏 */}
      <NoteMenuBar />
      {/* 渲染编辑器 */}
      {renderEditor()}
    </main>
  )
}
