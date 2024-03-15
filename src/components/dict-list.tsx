import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance } from './storage'
import DictEditor from './dict-editor'
import type { DictEditorInstance } from './dict-editor'
import DictRemover from './dict-remover'
import type { DictRemoverInstance } from './dict-remover'
import { dispatchEvent } from '../utils'

export default defineComponent({
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  methods: {
    openDictList() {
      const dialogElement = this.$refs.dictListDialog as HTMLDialogElement
      dialogElement.showModal()
    },
    closeDictList() {
      const dialogElement = this.$refs.dictListDialog as HTMLDialogElement
      dialogElement.close()
    },
    openDictEditor(dictKey: string | null = null) {
      const dictEditor = this.$refs.dictEditor as DictEditorInstance
      dictEditor.open(dictKey)
    },
    openDictRemover(dictKey: string) {
      const dictRemover = this.$refs.dictRemover as DictRemoverInstance
      dictRemover.open(dictKey)
    }
  },
  mounted() {
    window.addEventListener('dict:list', () => {
      if ((this.storage === null) || (this.storage.project === null)) return
      this.openDictList()
    })

    window.addEventListener('shortcut:dict', () => {
      dispatchEvent('dict:list')
    })
  },
  render() {
    return (
      <dialog
        ref="dictListDialog"
        id="dict-list"
        class="w-[700px] h-[500px] p-2 bg-accent rounded-[1.25rem] drop-shadow-xl transform-gpu"
        // @ts-ignore
        onCancel={(event: Event) => event.preventDefault()}
      >
        <div class="h-full px-2 py-4 bg-main rounded-[0.75rem] flex flex-col gap-4">
          <p class="text-xl text-center">辞書一覧</p>
          <div class="px-4 grow overflow-y-scroll scrollbar-dark">
            <div class="h-fit min-h-full flex flex-col gap-8">
              {
                (
                  (this.storage?.settings.userDict === undefined) ||
                  (Object.keys(this.storage?.settings.userDict).length <= 0)
                ) ? (
                  <div class="flex flex-col justify-center items-center gap-4 grow">
                    <p>まだ辞書がありません</p>
                    <p>"辞書を追加" から追加できます</p>
                  </div>
                ) : (
                  Object.keys(this.storage.settings.userDict).map((dictKey) => (
                    <div
                      key={ `dict-${dictKey}` }
                      class="w-full h-fit flex gap-2"
                    >
                      <div class="w-[calc(100%-5.5rem)] px-4 py-2 bg-accent-light rounded-xl flex flex-col justify-center gap-2">
                        <p class="truncate">{ dictKey }</p>
                        <p class="text-sm truncate">
                          {
                            this.storage?.settings.userDict[dictKey].map(({kana}, index) => (
                              <span key={ `dict-${dictKey}-kana-${index}` }>
                                { kana }
                              </span>
                            ))
                          }
                        </p>
                      </div>
                      <div class="flex flex-col gap-2 shrink-0">
                        <button
                          class="w-20 h-fit py-1 bg-accent rounded-lg"
                          onClick={() => this.openDictEditor(dictKey)}
                        >
                          <p class="text-light">編集</p>
                        </button>
                        <button
                          class="w-20 h-fit py-1 bg-accent rounded-lg"
                          onClick={() => this.openDictRemover(dictKey)}
                        >
                          <p class="text-light">削除</p>
                        </button>
                      </div>
                    </div>
                  ))
                )
              }
            </div>
          </div>
          <div class="flex justify-center items-center gap-4">
            <button
              class="w-32 py-2 bg-accent rounded-lg"
              onClick={() => this.openDictEditor()}
            >
              <p class="text-light">辞書を追加</p>
            </button>
            <button
              class="w-32 py-2 bg-accent-light rounded-lg"
              onClick={() => this.closeDictList()}
              autofocus
            >
              <p>閉じる</p>
            </button>
          </div>
        </div>
        <DictEditor
          ref="dictEditor"
          storage={ this.storage }
        ></DictEditor>
        <DictRemover
          ref="dictRemover"
          storage={ this.storage }
        ></DictRemover>
      </dialog>
    )
  }
})
